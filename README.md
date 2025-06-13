# 🌌 Orbit — Spontaneous Hangouts through Social Proximity

Orbit is a mobile app that lets you hang out with people who are already within reach — your close friends and their close friends. Built with React Native and Firebase, Orbit helps reduce hesitation by offering a safe and subtle way to reach out socially.

> “It’s like meeting a friend-of-a-friend, but without the awkward cold DM.”

---

## 🧠 Core Concept

Orbit is built on one insight: people are more likely to hang out if they know they’re just a degree apart.

Instead of broadcasting plans, Orbit introduces a trust-based system:

- 👥 Choose your core circle (your 8 closest friends)
- 🌐 Discover your extended circle (friends of those friends)
- 📤 Send subtle, low-pressure hangout prompts
- ✅ Messages reach 2nd-degree connections only if mutuals approve

The goal: remove friction, make small spontaneous plans easier, and preserve comfort & boundaries.

---

## 📱 Features

- 🔐 OTP-based onboarding (mock backend)
- 🧑‍🤝‍🧑 Select top 8 friends during setup
- 🌐 See your social orbit (1st & 2nd-degree connections)
- 💬 Compose low-pressure hangout prompts
- ✅ Approvals from mutuals before cross-connection requests
- 🤖 GPT-4 generated activity suggestions
- 🔔 Real-time notifications via Firebase
- 📝 GitIngest-powered dev changelogs

---

## 🛠️ Tech Stack

| Layer             | Tools / Libraries                          |
|------------------|---------------------------------------------|
| Frontend         | React Native (Expo), JavaScript             |
| Backend          | Firebase (Auth, Firestore)                  |
| Auth             | Email/password + phone/OTP (mocked)         |
| AI Integration   | OpenAI GPT-4 API                            |
| Graph UI         | react-native-svg / d3.js                    |
| DevOps & Logging | GitHub Actions, GitIngest                   |

---

## 🧪 Setup & Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/YOUR-USERNAME/orbit.git
   cd orbit
   ```

2. Install dependencies:

   Using npm:

   ```bash
   npm install
   ```

   Or with yarn (recommended if npm gives trouble):

   ```bash
   yarn install
   ```

3. Start the Expo app:

   ```bash
   npx expo start
   ```

   You’ll see a QR code in terminal output. Use any of the following:

   - 📱 Expo Go (scan QR on Android/iOS)
   - 🧪 Development builds (link)
   - 💻 Android emulator
   - 🍏 iOS simulator
   

   More info:  
   https://docs.expo.dev/develop/development-builds/introduction/

4. (Optional) Clear the Metro cache if screens aren’t loading properly:

   ```bash
   npx expo start --clear
   ```

---

## 🧼 Reset the Starter Code

Want to start from a clean slate?

```bash
npm run reset-project
```

This moves all demo code into the app-example/ folder and gives you a blank app/ directory to begin fresh development.

More on file-based routing in Expo:  
https://docs.expo.dev/router/introduction/

---

## 🔌 Mock OTP API (Local)

If you're testing the OTP screen, make sure the mock Express API is running:

```bash
cd otp-mock-api
node index.js
```

Server should log: ✅ Server running at http://localhost:5050
Use your local IP (not localhost) in OtpScreen.js if you're on a phone.

