<p align="center">
  <img src="public/favicon.svg" alt="TennisMate Logo" width="80" height="80">
</p>

<h1 align="center">🎾 TennisMate</h1>

<p align="center">
  <strong>A modern web app for connecting tennis players and finding the perfect match.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#architecture">Architecture</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=flat-square&logo=vue.js" alt="Vue 3">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind">
  <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase" alt="Supabase">
  <img src="https://img.shields.io/badge/Vite-7.1-646CFF?style=flat-square&logo=vite" alt="Vite">
</p>

---

## ✨ Features

### 🔍 Discover Players
Swipe-based interface to find tennis partners nearby. Filter by distance, skill level, and availability.

### 💬 Real-time Chat
Instant messaging with your matches. Powered by Supabase Realtime for live updates.

### 📅 Match Proposals
Schedule tennis matches with built-in proposal system. Accept, decline, or reschedule with ease.

### 👥 Community Feed
Share posts, like and comment. Build connections with the tennis community.

### 🔔 Smart Notifications
Real-time notifications for likes, comments, replies, and new messages.

### 🌍 Location-Based
Find players within your preferred distance using geolocation with smart fallbacks.

### 🌙 Dark Mode
Beautiful dark theme support across the entire app.

### 🌐 Multi-language
Full internationalization support (English, German, Turkish).

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Vue 3, TypeScript, Vite |
| **Styling** | Tailwind CSS, Shadcn/Vue |
| **State** | Pinia |
| **Backend** | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| **Animations** | GSAP |
| **i18n** | Vue I18n |
| **Testing** | Vitest, Playwright, Cypress |

---

## 🏗 Architecture

```
src/
├── components/          # 58 reusable UI components
│   ├── ui/              # Base UI primitives (Button, Card, Input, etc.)
│   ├── community/       # Feed, posts, comments
│   └── notifications/   # Notification system
├── composables/         # Vue composables for shared logic
│   ├── useMatching.ts   # Swipe & match logic
│   ├── useChat.ts       # Real-time messaging
│   ├── useGeolocation.ts # Location services
│   └── useMatchProposal.ts # Scheduling
├── stores/              # Pinia state management
│   ├── auth.ts          # Authentication state
│   ├── community.ts     # Posts & comments
│   └── notifications.ts # Real-time notifications
├── views/               # 10 page components
├── locales/             # i18n translations
└── lib/                 # Supabase client & utilities
```

---

## 🎯 Key Highlights

- **60+ Vue Components** - Modular, reusable architecture
- **5 Pinia Stores** - Centralized state management
- **Real-time Features** - Live messaging & notifications via Supabase Realtime
- **Responsive Design** - Mobile-first, works on all devices
- **Type-Safe** - Full TypeScript implementation
- **Automated Testing** - Unit, E2E, and component tests

---

## 👤 Author

**Furkan Arabul**

- Portfolio: [furkanarabul.dev](https://furkanarabul.dev)
- GitHub: [@furkanarabul](https://github.com/furkanarabul)
- LinkedIn: [/in/furkanarabul](https://linkedin.com/in/furkanarabul)

---

<p align="center">
  <sub>Built with ❤️ and lots of 🎾</sub>
</p>
