


# 🌌 Orbit

Orbit is a social connection-based mobile app designed to help users spontaneously hang out with their 1st and 2nd-degree connections. Built with React Native and Firebase, Orbit lets users create micro-gatherings by sending subtle hangout prompts — only visible to friends-of-friends if a mutual approves. It visualizes social proximity and helps reduce social hesitation by making reach-outs frictionless.

---

## 🧠 Concept

Orbit is built on the idea that most people hesitate to ask others to hang out — even when they’re just a degree away. Instead of broadcasting or sliding into DMs, Orbit lets you:

- 👥 Select your core friends (1st-degree)
- 🌐 Discover 2nd-degree friends connected via them
- 📤 Send hangout ideas subtly to a small group
- ✅ Require mutual approval before reaching someone once removed

This keeps interactions casual, safe, and socially natural.

---

## 📱 Features

- 🔐 Onboarding with OTP mock auth
- 🧑‍🤝‍🧑 Select top 8 first-degree friends
- 🌐 Visualize social graph (1st and 2nd-degree)
- ✍️ Compose and send hangout requests
- ✅ Approval system from common mutuals
- 🤖 GPT-powered activity suggestions
- 📬 Real-time notifications via Firebase
- 🔄 GitIngest-powered changelogs

---

## 🛠️ Tech Stack

| Layer        | Tools / Libraries                        |
|--------------|------------------------------------------|
| Frontend     | React Native (Expo), TypeScript          |
| Backend      | Firebase (Firestore, Auth)               |
| AI Integration | OpenAI GPT-4 API                        |
| Graph Visualization | react-native-graph / d3.js         |
| DevOps       | GitHub Actions, GitIngest                |

---

## 🔧 Installation & Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/your-username/orbit.git
   cd orbit
