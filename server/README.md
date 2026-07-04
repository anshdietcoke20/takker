# taskker-push-server

A tiny standalone Node.js CLI for sending Expo push notifications to the Taskker
habit-tracker app. Sending push is a server responsibility, so this lives
outside the mobile app.

## Setup

```bash
npm install
```

## Sending a notification

With environment variables:

```bash
EXPO_PUSH_TOKEN=ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx] HABIT_ID=abc123 npm run send
```

With positional CLI args:

```bash
node send-push.js ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx] abc123
```

`HABIT_ID` / the second arg is optional. When provided, the notification carries
a `data` payload of `{ screen: '/habit', habitId }`, which deep-links the app to
the matching habit detail screen. Without it, a generic announcement is sent.

If your Expo project enforces push security, also set `EXPO_ACCESS_TOKEN`.

## Push tickets vs. push receipts

Delivery happens in two stages, and success at one stage does not mean success
at the next:

- **Ticket** — returned immediately by `sendPushNotificationsAsync`. It confirms
  Expo *accepted the request*. A ticket can already be an error (e.g. a
  malformed message), or it can be `ok` with a receipt id for later.
- **Receipt** — fetched a few seconds later with
  `getPushNotificationReceiptsAsync` using the ticket's receipt id. It confirms
  whether the push provider (Apple's APNs / Google's FCM) actually *accepted the
  notification for delivery*. This is the authoritative result.

## DeviceNotRegistered

The most important receipt error. It means the device uninstalled the app,
disabled notifications, or the token otherwise expired. The token is dead and
every future send will keep failing. When you see `DeviceNotRegistered`, **delete
that token from your database** so you stop sending to a device that no longer
exists. This script logs exactly which token to drop.
