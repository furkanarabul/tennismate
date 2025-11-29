# TennisMate

🎾 A modern web application for connecting tennis players and finding the perfect match.

## Tech Stack

- **Vue 3** + **Vite** - Fast, modern frontend
- **Tailwind CSS** - Utility-first styling
- **Shadcn Vue** Style Components - Beautiful, accessible UI
- **Supabase** - Backend-as-a-Service (authentication, database, real-time)
- **TypeScript** - Type safety

## Features

- 🏠 **Landing Page** - Showcase features and attract users
- 🔍 **Discover** - Swipe-style interface to find tennis partners
- 📊 **Dashboard** - Manage matches and upcoming games
- 👤 **Profile** - Create and edit your tennis profile
- 🎨 **Modern UI** - Clean, responsive design with tennis-themed colors
- 🌙 **Dark Mode** - Full dark mode support (toggle coming soon)

## Prerequisites

> **Important**: This project requires Node.js **20.19+** or **22.12+**

Check your Node.js version:
```bash
node -v
```

To upgrade Node.js:
```bash
# Using Homebrew (macOS)
brew install node@20

# Using nvm
nvm install 20
nvm use 20
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment** (optional):
   ```bash
   cp .env.example .env.local
   # Add your Supabase credentials to .env.local
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   ```
   http://localhost:5173
   ```

## Project Structure

```
src/
├── components/ui/     # Reusable UI components
├── views/             # Page components
├── router/            # Vue Router configuration
├── lib/               # Utilities and Supabase client
└── assets/            # CSS and static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Supabase Setup

This project is configured to work with Supabase. To enable backend features:

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Add them to `.env.local`:
   ```env
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

See the implementation plan for database schema details.

## Contributing

This is a personal project but suggestions are welcome!

## License

MIT
