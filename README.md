# Eternal Memories 💖

A progressive web app (PWA) designed to share a daily memory and song with your loved one.

## Features ✨
- **Daily Surprise**: Every day at midnight (local time), a new photo and song are automatically selected.
- **The Vault**: Browse all your memories and songs.
- **Magic Writer** ✍️: Flip any photo card to write a personal note on the back with a handwriting style.
- **Manual Override**: Want a specific memory for a special date? Select it manually in the Vault (Heart icon).
- **Mobile Friendly**: Install as a native app on iOS and Android.
- **NFC Ready**: Designed to be opened via an NFC tag, but works perfectly as a standalone app.

## How It Works 🛠️
### Automatic Mode (Default) 📅
If no specific photo/song is selected in the Vault (no Heart icon active), the app uses the **current date** to randomly pick a memory.
- Updates automatically at midnight.
- Both partners see the same surprise if they open the app on the same day.

### Manual Mode ❤️
If you select a photo or song in the Vault (click the Heart):
- This specific choice will be shown to your partner.
- It stays active until you unselect it or switch back to "Random" mode in the Vault.

## Tech Stack 💻
- **Frontend**: Next.js 14, React, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Storage, Auth)
- **Hosting**: Vercel / Netlify

## Setup 🚀
1.  Clone the repo.
2.  Install dependencies: `npm install`.
3.  Configure `.env.local` with your Supabase credentials.
4.  Run locally: `npm run dev`.

## Deployment 🌍
Push to GitHub and connect your repository to Vercel/Netlify.
Ensure you add the Environment Variables in your hosting dashboard!
