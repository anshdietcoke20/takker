# Testing Push Notifications

A practical guide for testing push notifications in this Expo **SDK 55** habit-tracker app.

The app's deep-link data contract for every notification (local **and** push) is exactly:

```json
{ "screen": "/habit", "habitId": "<the-habit-id>" }
```

Tapping a notification with this payload opens the habit detail screen at `/habit/[id]`. The same tap handler serves both local and push notifications.

---

## 1. Prerequisites

> ⚠️ **Push notifications do NOT work in Expo Go on SDK 53+.** Remote push was removed from Expo Go, so you **must** use an [EAS development build](https://docs.expo.dev/develop/development-builds/introduction/). Local (scheduled) notifications still work in Expo Go, but the token-based flow in this guide requires a dev build.

### One-time setup

```bash
# Install the EAS CLI globally
npm install -g eas-cli

# Log in to your Expo account
eas login

# Initialize EAS for this project.
# This creates/links the projectId that getExpoPushTokenAsync() reads
# from expo.extra.eas.projectId in app config.
eas init
```

### Build a development build

```bash
# Android
eas build --profile development --platform android

# iOS (requires an Apple Developer account)
eas build --profile development --platform ios
```

Install the resulting build on a **physical device**.

> ⚠️ **Push tokens do not work on simulators/emulators.** Use a real Android phone or a real iPhone. (Android emulators can receive local notifications but will not return a valid Expo push token; iOS Simulator has no push support.)

### Run the dev server against the dev build

```bash
npx expo start --dev-client
```

Open the installed development build on the device and let it connect to the dev server.

---

## 2. Get the push token

1. Open the app on your physical device.
2. Go to the **Push** tab.
3. The screen displays the device's Expo push token and provides a button to copy it.

The token looks like:

```
ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
```

Copy it — you'll paste it into every send method below.

> If the token is blank, confirm you are running a **dev build on a physical device**, that notification permissions were granted, and that `eas init` set a valid `projectId`.

---

## 3. Send via expo.dev (easiest)

1. Open the [Expo push notifications tool](https://expo.dev/notifications).
2. Paste your **Expo push token** into the recipient field.
3. Set a **Title** and **Body** (e.g. `Time to build a habit!` / `Tap to open your habit`).
4. In the **Data (JSON)** field, enter the deep-link payload with a **real** habit id:

   ```json
   { "screen": "/habit", "habitId": "PASTE_A_REAL_HABIT_ID" }
   ```

5. Click **Send a notification**.

### How to find a real habit id

The `habitId` must correspond to a habit that actually exists on the device, otherwise `/habit/[id]` will render an empty/not-found detail screen.

- **From the app:** open any habit's detail screen (`/habit/[id]`) — the id is shown there (and it's the value in the route).
- **From storage:** habits are persisted in **AsyncStorage**. Inspect the stored habits list (via the app's debug view or React Native DevTools) and copy the `id` field of any habit.

---

## 4. Send via cURL

Send directly to Expo's push service. Replace the token and habit id.

```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "title": "Time to build a habit!",
    "body": "Tap to open your habit",
    "data": { "screen": "/habit", "habitId": "PASTE_A_REAL_HABIT_ID" }
  }'
```

A successful response looks like `{"data":{"status":"ok","id":"..."}}`. Delivery receipts can be checked via the `id` if needed.

> On Windows PowerShell, `curl` is aliased to `Invoke-WebRequest`. Use `curl.exe` explicitly, or run the command from Git Bash / WSL, to get the real cURL behavior shown above.

---

## 5. Send via Node script

A small [`expo-server-sdk`](https://github.com/expo/expo-server-sdk-node) script lives in [`../server`](../server).

```bash
cd server
npm install
node send-push.js <token> <habitId>
```

Example:

```bash
node send-push.js "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" "abc123-real-habit-id"
```

The script wraps the same payload (`title`, `body`, and `data: { screen: "/habit", habitId }`) and sends it through the Expo push API.

---

## 6. Foreground vs. background behavior

Understanding where a notification surfaces depends on the app's state when it arrives.

### App is FOREGROUNDED (open and active)

- The notification is intercepted by the **foreground notification handler** registered with `setNotificationHandler` (`shouldShowBanner: true` / `shouldShowList: true` in SDK 55).
- It is shown as an in-app **banner** while the app stays open — the OS does **not** take over.
- The **received** listener (`addNotificationReceivedListener`) fires. No navigation happens until the banner is tapped.

### App is BACKGROUNDED or KILLED

- The OS displays the notification in the **system tray / notification center**.
- **Tapping** it launches (cold start) or resumes (warm start) the app.
- The **response** listener (`addNotificationResponseReceivedListener`) fires and reads the `data` payload.
- On a **cold start**, the response that launched the app is retrieved via `getLastNotificationResponseAsync()` so the deep link is not missed.
- The tap handler reads `data.screen` and `data.habitId` and deep-links to `/habit/[habitId]`.

> The received listener (foreground) and the response listener (tap) are separate. A notification that arrives while the app is open fires the **received** listener immediately, and only fires the **response** listener if the user taps the banner.

---

## 7. Verifying the deep link

Send a push with a **real** `habitId` and confirm navigation in all three app states.

| # | App state | Action | Expected result |
|---|-----------|--------|-----------------|
| a | **Open** (foregrounded) | Tap the in-app banner | Lands on that habit's detail screen `/habit/[id]` |
| b | **Backgrounded** | Tap the system-tray notification | App resumes on that habit's detail screen |
| c | **Killed** (swiped away) | Tap the system-tray notification | App cold-starts and lands on that habit's detail screen |

### Checklist

- [ ] Same `habitId` used for all three sends, and it matches a real habit.
- [ ] In all three cases you land on the **correct** habit (verify the title/details on screen).
- [ ] For (c), confirm the deep link survives a **cold start** (fully kill the app first — swipe it out of the recents list).

If (a) works but (b)/(c) don't, check the **response** listener and `getLastNotificationResponseAsync()` wiring. If (b)/(c) work but (a) doesn't, check `setNotificationHandler` and the **received**/banner-tap path.
