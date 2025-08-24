# FlashBack Labs – Secure OTP Login + Selfie Upload (Hackathon Submission)

**Tech:** React Native (Expo) + TypeScript

---

## 📽️ Demo & APK

* **Demo video (60–90s):** [https://drive.google.com/file/d/1uPOGWS0KHF8WKkJbIBP8YtsYHvsJmWSC/view?usp=sharing](https://drive.google.com/file/d/1uPOGWS0KHF8WKkJbIBP8YtsYHvsJmWSC/view?usp=sharing)
* **APK (tested on Android 15):** [https://drive.google.com/file/d/1QhB-OphZUEETD6E1hkDKENPTP52gK\_RS/view?usp=sharing](https://drive.google.com/file/d/1QhB-OphZUEETD6E1hkDKENPTP52gK_RS/view?usp=sharing)

> The APK was tested on a physical device running **Android 15**. If you face install/network issues, see **Troubleshooting** below.

---

## ✅ What’s Implemented

### 1) Phone & OTP Flow

* E.164 phone input validation (`+91XXXXXXXXXX`)
* **Send OTP** → calls backend with proper headers & cookie
* **OTP Verify** (6 digits) → handles success / invalid / expired OTP
* Button/loader states and retry logic; error toasts/messages

### 2) Selfie Capture & Upload

* Front camera only; no gallery import
* Preview before upload
* Uploads **multipart/form-data** (`image` file + `username`) to backend
* Shows progress and clear errors

### 3) Post‑Login Home

* Welcome message
* Shows verified phone number
* Renders the uploaded selfie
* Logout/Reset flow

### 4) Non‑Functional

* No paid/proprietary SDKs
* Clean separation of UI ↔ logic ↔ API clients
* Proper validation & error handling
* Smooth transitions; responsive across common screen sizes
* No secrets committed; environment variables via `.env`

---

## 🧭 App Flow

1. **Enter Phone** → tap **Send OTP**
2. **Enter OTP (6‑digit)** → tap **Verify**
3. **Capture Selfie** → confirm → **Upload**
4. **Home** → displays welcome text, number, and uploaded selfie

---

## 🧪 Backend API (as provided)

> **Base URL:** `https://flashback.inc:9000`

### Send OTP

```
POST /api/mobile/sendOTP
Headers:
  Content-Type: application/json
  Cookie: refreshToken=<provided>
Body:
{
  "phoneNumber": "+91XXXXXXXXXX"
}
```

### Verify OTP

```
POST /api/mobile/verifyOTP
Headers:
  Content-Type: application/json
  Cookie: refreshToken=<provided>
Body:
{
  "phoneNumber": "+91XXXXXXXXXX",
  "otp": "<6 digits>",
  "login_platform": "MobileApp"
}
```

**Response:** contains **JWT** used as `Authorization: Bearer <JWT>` for the next call.

### Upload Selfie

```
POST /api/mobile/uploadUserPortrait
Headers:
  Authorization: Bearer <JWT from verify>
  Cookie: refreshToken=<provided>
Content-Type: multipart/form-data
Form fields:
  image = <captured selfie file>
  username = "<E.164 format phone>"
```

---

## 🛠️ Local Setup & Run (Expo)

> Requires: Node.js ≥ 18, npm ≥ 9, Git, Android Studio (for emulator) **or** an Android device with the **Expo Go** app.

1. **Clone & Install**

   ```bash
   git clone https://github.com/5mokshith/FlashBack-hackathon
   cd flashback-hackathon
   npm install
   ```

2. **Environment Variables**
   Create a **`.env`** file in the project root (no values committed). Expo recommends the `EXPO_PUBLIC_` prefix for app‑readable envs.

   ```ini
   # .env (placeholders — founders will provide the cookie value)
   EXPO_PUBLIC_API_BASE_URL=https://flashback.inc:9000
   EXPO_PUBLIC_REFRESH_TOKEN=<provided-after-verification-of-OTP-by-server>
   EXPO_PUBLIC_LOGIN_PLATFORM=MobileApp
   ```

   * `EXPO_PUBLIC_API_BASE_URL` → base URL for all API calls
   * `EXPO_PUBLIC_REFRESH_TOKEN` → used to send `Cookie: refreshToken=<value>`
   * `EXPO_PUBLIC_LOGIN_PLATFORM` → fixed value `MobileApp` per API spec

3. **Run in development**

   ```bash
   npm start
   ```

   * **On device:** install **Expo Go** on Android → scan the QR from the terminal/browser.
   * **On emulator:** ensure an Android Virtual Device is running → press `a` in the Expo CLI.

4. **Build an APK (optional, local)**

   ```bash
   # Prebuild native projects, then make a release build
   npx expo prebuild --clean
   eas build --platform android --profile preview
   eas build --platform android --profile production
   npx expo run:android --variant=release
   cd android
   ./gradlew assembleRelease
   # APK will be at app/build/outputs/apk/release/app-release.apk
   ```

   > If your project uses EAS, you can also run `eas build -p android --profile preview`.

---

## 🧱 Project Structure (high level)

```
flashback-hackathon/
├─ app/                     # Expo Router screens (or screens/ if using react-navigation)
│  ├─ index.tsx             # Phone input + Send OTP
│  ├─ verify.tsx            # OTP screen
│  ├─ selfie.tsx            # Camera + upload
│  └─ home.tsx              # Post-login
├─ src/
│  ├─ api/                  # API clients (sendOTP, verifyOTP, uploadSelfie)
│  ├─ components/           # Reusable UI (inputs, buttons, toasts)
│  ├─ hooks/                # useAuth, useCamera, useUpload
│  ├─ lib/                  # validators, helpers
│  └─ store/                # auth state (JWT, phone), persisted when needed
├─ assets/                  # icons, images
├─ app.json / app.config.ts # Expo config (reads EXPO_PUBLIC_* envs)
├─ package.json
└─ README.md
```

---

## 🔐 Security & Data Handling

* **No secrets committed**; cookie value is injected from `.env` at runtime
* JWT is stored in app state/memory (not committed); cleared on logout
* Only front camera capture allowed (no gallery import)
* Minimal PII: phone (E.164) and selfie image sent only to provided endpoints

---

## 🚦 UX Details

* Disabled buttons while requests are in flight
* Helpful toasts/messages for validation and API errors
* Clear instructions on the selfie screen
* Consistent spacing/typography; works on common Android resolutions

---

## 🧰 Scripts

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "build:android": "expo prebuild --platform android && cd android && ./gradlew assembleRelease"
  }
}
```

---


---

## 🧭 Architecture Overview
![IMG20250824225310](https://github.com/user-attachments/assets/9ddedf61-51d7-4d83-8463-2a6c355a0ee8)

**Layers**

* **UI (Screens)** → minimal logic; calls hooks/actions
* **State (Store)** → holds `phone`, `jwt`, and ephemeral UI state
* **API Client** → thin wrappers around `fetch` with base URL and headers
* **Utilities** → validators (E.164, OTP), error mapping, form helpers

**Data flow**

1. `sendOTP(phone)` → backend sends OTP
2. `verifyOTP(phone, otp, platform)` → returns JWT
3. `uploadSelfie(jwt, file, username)` → stores portrait
4. Navigate to **Home** with user context

---

## 📌 Notes & Limitations

* iOS not tested during the hackathon window
* If backend rate‑limits OTP requests, UI surfaces a friendly message

---

## 🧭 Manual Test Scenarios (executed)

* ✅ Valid phone → OTP sent → correct OTP → selfie → upload → home
* ✅ Invalid phone format → validation error
* ✅ Wrong/expired OTP → API error surfaced; user can retry
* ✅ Camera denied → prompt to enable permissions
* ✅ Network down during upload → user sees retry option

---

# Thank you 
