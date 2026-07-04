// send-push.js
//
// Send a single Expo push notification to one device token.
//
// Usage:
//   node send-push.js <expoPushToken> [habitId]
//   EXPO_PUSH_TOKEN=ExponentPushToken[xxx] HABIT_ID=abc123 node send-push.js
//
// If a habitId is provided, the notification deep-links into the habit detail
// screen via the data payload { screen: '/habit', habitId }. The mobile app
// already knows how to route on this contract. Without a habitId, a generic
// announcement is sent (no deep link).

import { Expo } from 'expo-server-sdk';

// Read from CLI args first, then fall back to environment variables.
const [, , tokenArg, habitIdArg] = process.argv;
const expoPushToken = tokenArg ?? process.env.EXPO_PUSH_TOKEN;
const habitId = habitIdArg ?? process.env.HABIT_ID ?? null;

if (!expoPushToken) {
  console.error(
    'No push token provided.\n' +
      'Usage: node send-push.js <expoPushToken> [habitId]\n' +
      '   or: EXPO_PUSH_TOKEN=... HABIT_ID=... node send-push.js'
  );
  process.exit(1);
}

// Expo tokens have a strict shape (ExponentPushToken[...]). Sending to a
// malformed token wastes a request and can never be delivered, so reject early.
if (!Expo.isExpoPushToken(expoPushToken)) {
  console.error(
    `"${expoPushToken}" is not a valid Expo push token. ` +
      'It should look like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx].'
  );
  process.exit(1);
}

// A small pause so Expo has time to hand the notifications to APNs/FCM before
// we poll for receipts. Receipts are not available instantly.
const RECEIPT_DELAY_MS = 3000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  // `new Expo()` with no access token works for tokens from projects that do
  // not enforce push security. Set EXPO_ACCESS_TOKEN if your project requires it.
  const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

  const pushMessage = habitId
    ? {
        to: expoPushToken,
        sound: 'default',
        title: 'Time for your habit',
        body: "Don't break the streak — tap to log it now.",
        // Deep-link contract understood by the mobile app.
        data: { screen: '/habit', habitId },
      }
    : {
        to: expoPushToken,
        sound: 'default',
        title: 'Taskker',
        body: 'A quick reminder to check in on your habits today.',
        data: { screen: '/habit', habitId: null },
      };

  // chunkPushNotifications batches messages within Expo's per-request limits.
  // We only have one message here, but chunking keeps the code correct if the
  // input ever grows to many tokens.
  const messageChunks = expo.chunkPushNotifications([pushMessage]);
  const tickets = [];

  for (const chunk of messageChunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      // A whole chunk failed to send (network error, Expo outage, etc.).
      // Nothing in this chunk was delivered; surface it and keep going so
      // other chunks still get a chance.
      console.error('Failed to send a push chunk:', error.message);
    }
  }

  // A ticket with status "error" means Expo rejected the message outright
  // (before any receipt exists). Collect the receipt ids from the "ok" tickets.
  const receiptIds = [];
  for (const ticket of tickets) {
    if (ticket.status === 'ok') {
      receiptIds.push(ticket.id);
    } else if (ticket.status === 'error') {
      console.error(
        `Push was rejected on send: ${ticket.message}`,
        ticket.details ? `(code: ${ticket.details.error})` : ''
      );
    }
  }

  if (receiptIds.length === 0) {
    console.log('No accepted notifications to fetch receipts for. Done.');
    return;
  }

  console.log(
    `Sent ${receiptIds.length} notification(s). Waiting ${RECEIPT_DELAY_MS}ms before fetching receipts...`
  );
  await wait(RECEIPT_DELAY_MS);

  // Receipts tell us whether the push provider (APNs/FCM) actually accepted the
  // notification. A successful send ticket does NOT guarantee delivery.
  const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);

  for (const receiptIdChunk of receiptIdChunks) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(receiptIdChunk);

      for (const [receiptId, receipt] of Object.entries(receipts)) {
        if (receipt.status === 'ok') {
          console.log(`Receipt ${receiptId}: delivered successfully.`);
          continue;
        }

        // status === 'error'
        console.error(
          `Receipt ${receiptId}: delivery failed — ${receipt.message}`
        );

        const errorCode = receipt.details?.error;
        if (errorCode === 'DeviceNotRegistered') {
          // The device uninstalled the app, disabled notifications, or the
          // token otherwise expired. This token is dead and will keep failing.
          // Drop it from the database so we stop sending to a ghost device.
          console.error(
            `  -> Token ${expoPushToken} is DeviceNotRegistered. ` +
              'Remove it from the database; the device is gone and this token will never deliver again.'
          );
        } else if (errorCode) {
          console.error(`  -> Provider error code: ${errorCode}`);
        }
      }
    } catch (error) {
      // Failed to retrieve this batch of receipts. The notifications may still
      // have been delivered; we just could not confirm. Worth a retry later.
      console.error('Failed to fetch a receipt chunk:', error.message);
    }
  }
}

main().catch((error) => {
  console.error('Unexpected error while sending push:', error);
  process.exit(1);
});
