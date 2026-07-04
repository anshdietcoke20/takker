# Taskker — Habit Tracker with Local & Push Notifications

An Expo **SDK 55** habit tracker. Create habits (Drink Water, Code 1 Hour, Read, Workout…),
schedule **local reminders** on the device, and receive **push notifications** from a server for
streak nudges and announcements. Tapping either kind of notification deep-links straight to the
habit it belongs to.

---

## What it does

- **Habit CRUD** — create, edit, and delete habits; everything persists across app restarts (AsyncStorage).
- **Local reminders** — each habit schedules device-local reminders (daily, or weekly on chosen weekdays).
- **Scheduled notification IDs** are stored on the habit so they can be cancelled and rescheduled precisely.
- **Streaks** — mark a habit done for the day; completing on consecutive days grows the streak, a missed day resets it.
- **Deep linking** — one tap handler routes both local and push notification taps to `/habit/[id]`.
- **Push notifications** — register for an Expo push token, copy it, and receive server-sent pushes.
- **Permission-reactive** — a denied permission never crashes the app; the Settings tab shows the state and can open system settings.
- **Android channel** — a dedicated high-importance reminder channel, created before permission is requested.

---

## Project structure

```
src/
  app/
    _layout.tsx            root Stack; mounts the notification tap router + Android channel
    (tabs)/
      _layout.tsx          Today / Push / Settings tabs
      index.tsx            today's habits, streaks, "mark done"
      push.tsx             Expo push token display + copy
      settings.tsx         permission status + open-settings escape hatch
    habit/[id].tsx         habit detail — the deep-link target
    new.tsx                create & edit form (modal)

  lib/
    habits/
      types.ts             Habit & Frequency types
      storage.ts           AsyncStorage CRUD (persistence only — no notification code)
      streak.ts            streak math (local-date based)
      format.ts            frequency/time display helpers
    notifications/
      setup.ts             foreground handler, Android channel, permission helpers
      schedule.ts          schedule / cancel / reschedule reminders + the deep-link payload contract
      push.ts              push registration & Expo push token

  hooks/
    use-habits.ts               shared habit store; orchestrates storage + scheduling
    use-push-notifications.ts   push registration state for the Push tab
    use-notification-permission.ts  permission state for the Settings tab
    use-notification-router.ts  turns a notification tap into navigation (local + push)

server/                    tiny Node push server (expo-server-sdk) — sending is a server job
docs/TESTING_PUSH.md       how to send test pushes (expo.dev, cURL, Node) and verify deep links
```

All notification side effects live in `src/lib/notifications/` and are exposed through hooks — UI
components never call the notification APIs directly.

---

## Data model

```ts
type Frequency =
  | { kind: 'daily'; hour: number; minute: number }
  | { kind: 'weekly'; weekdays: Weekday[]; hour: number; minute: number }; // 1=Sun … 7=Sat

type Habit = {
  id: string;
  name: string;
  emoji: string;
  frequency: Frequency;
  notificationIds: string[];       // ids from scheduleNotificationAsync, kept for precise cancel
  streak: number;
  lastCompletedISO: string | null; // local YYYY-MM-DD of last completion
};
```

Weekdays are stored in the **expo-notifications** convention (1 = Sunday … 7 = Saturday) so they
can be passed straight into a `WEEKLY` trigger.

### The deep-link contract

Every reminder (local and push) carries the same payload:

```ts
data: { screen: '/habit', habitId: habit.id }
```

`use-notification-router` reads this from the notification response and navigates to
`/habit/[id]`. Because the shape is identical, **the same handler serves both** local and push taps.

---

## Running the app

```bash
npm install
npx expo start        # Expo Go is fine for local notifications & the whole UI
```

> **Push notifications need a development build** (see below). Local reminders, CRUD, streaks, and
> deep linking all work in Expo Go.

### Development build (required for push)

```bash
npm install -g eas-cli
eas login
eas init                                    # sets the projectId getExpoPushTokenAsync needs
eas build --profile development --platform android   # and/or ios
# install the build on a PHYSICAL device, then:
npx expo start --dev-client
```

Full push-testing instructions (expo.dev, cURL, Node script, foreground vs background) are in
[`docs/TESTING_PUSH.md`](docs/TESTING_PUSH.md). The Node sender lives in [`server/`](server).

---

## Notification lifecycle, briefly

- **Scheduling** (`schedule.ts`): a *daily* habit → one `DAILY` trigger; a *weekly* habit → one
  `WEEKLY` trigger per selected weekday. All returned ids are stored on the habit.
- **Editing**: the old ids are cancelled, new reminders scheduled, and the new ids stored.
- **Deleting**: only that habit's ids are cancelled — never `cancelAllScheduledNotificationsAsync`.
- **Foreground**: `setNotificationHandler` opts into `shouldShowBanner` / `shouldShowList` so a
  reminder is visible even while the app is open.

---

## Writeup — conceptual understanding

### Local vs push notifications
A **local notification** is scheduled and delivered entirely on the device by the OS — no network,
no server. It's the right tool for habit reminders: the phone already knows *when* to fire, and it
works offline. A **push notification** originates on a **server**, is sent to Expo's push service
using the device's Expo push token, and is delivered by FCM (Android) / APNs (iOS). Push is the
right tool for things the device can't decide on its own: streak nudges based on server data,
announcements, or reminders driven by backend logic. In this app, reminders are local; streak
nudges/announcements are push. Both end at the same place — a habit detail screen — via the same
`data` payload.

### Push ticket vs push receipt
When you send to Expo's push API you immediately get back a **ticket** per message. A ticket with
status `ok` only means *Expo accepted the message for delivery* — it has **not** reached the device
yet. Each `ok` ticket contains a receipt id. A few moments later you query
`getPushNotificationReceiptsAsync` with those ids to get the **receipt**, which reports the *actual*
outcome from FCM/APNs (delivered, or an error like `DeviceNotRegistered`). So: ticket = "accepted",
receipt = "actually delivered (or why not)". You must check receipts to know delivery truly
succeeded. The Node server in `server/` does both.

### DeviceNotRegistered
A receipt (or ticket) can come back with the error code **`DeviceNotRegistered`**. It means the
Expo push token is no longer valid — the user uninstalled the app, disabled notifications, or the
OS rotated the token. The correct response is to **stop sending to that token and delete it from
your database**; continuing to send to a dead token wastes requests and can get your sending
throttled. `server/send-push.js` detects this code and logs that the token should be dropped.

### Expo Go limitation
Since **SDK 53**, `expo-notifications` **remote push does not work in Expo Go**. Expo Go can no
longer mint a project-scoped Expo push token, so push testing requires an **EAS development build**
on a **physical device** (simulators/emulators can't receive push either). Local notifications still
work in Expo Go, which is why the rest of the app is fully testable there.

### Android notification channel — and why it must exist before requesting permission
On Android 8+ every notification must belong to a **channel**, and the channel's **importance** is
what actually controls behavior — whether a notification makes sound, vibrates, or shows as a
heads-up banner. Crucially, **a channel's importance is locked in at creation time**: changing it
in code afterward is ignored (only the user can change it in system settings). So the channel has to
exist **before** the first notification — and creating it **before requesting permission** is the
safe ordering, so that the moment permission is granted, reminders already have their correct
**high-importance** channel to post to. If you requested permission and scheduled a notification
before the channel existed, it would fall back to a default/low-importance channel and reminders
could arrive silently instead of as heads-up alerts. In this app, `ensureReminderChannel()` runs at
app launch (root layout) and again inside `requestPermission()`, guaranteeing the `habit-reminders`
HIGH channel exists first.

---

## Edge cases handled
- Permission denied → habits still save; Settings tab offers "Open system settings".
- Notification tap with a deleted/invalid `habitId` → graceful "Habit not found" screen, no crash.
- Corrupt storage blob → reset to empty instead of crash-looping on launch.
- Scheduling failure (e.g. permission revoked mid-edit) → the edit still saves; reminders are simply dropped.
- Push token unavailable (Expo Go / simulator / no `eas init`) → clear message + retry, no crash.
video-link : https://drive.google.com/file/d/1dAV21YCTfPN6ND6XHcBwkNf6BvvOhUI-/view?usp=drivesdk
