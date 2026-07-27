# Aether Chat

Aether Chat is a modern, production-ready real-time messaging platform built with Next.js, TypeScript, Tailwind CSS, and Supabase. It delivers secure, fast, and scalable communication with real-time messaging, presence, authentication, file sharing, and a responsive user experience.

## Features

- Secure Email & Password Authentication
- Protected Routes & Session Management
- Real-Time One-to-One Messaging
- Group Conversations
- Online Presence & Typing Indicators
- Read Receipts & Unread Counts
- File & Image Sharing
- User Profiles with Avatars
- Conversation & User Search
- Responsive Desktop & Mobile UI
- Light & Dark Theme Support
- Loading, Empty & Error States
- Toast Notifications
- Supabase Row Level Security (RLS)
- Secure Storage & Real-Time Channels

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase (Auth, PostgreSQL, Realtime & Storage)
- Radix UI
- shadcn/ui Components
- Sonner
- next-themes

## Project Structure

```text
app/
components/
hooks/
lib/
supabase/
types/
public/
```

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd aether-chat
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> Never expose your Supabase Service Role Key in the client application.

### 4. Setup Database

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Or run the SQL migration manually inside the Supabase SQL Editor.

### 5. Start Development Server

```bash
npm run dev
```

Visit:

```
http://localhost:3000
```

## Useful Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```

## Security

- Row Level Security (RLS)
- Secure Authentication
- Protected Storage Buckets
- Signed File URLs
- Private Realtime Channels
- Session Protection

## Current Features

- Authentication
- Real-Time Messaging
- Group Chats
- User Profiles
- Presence Detection
- Typing Indicators
- Read Receipts
- File Sharing
- Search
- Theme Switching

## Planned Features

- Voice Calls
- Video Calls
- Voice Messages
- Message Reactions
- Pinned Messages
- Message Editing & Deletion
- Push Notifications
- AI Assistant
- Community Spaces
- Large File Uploads
- End-to-End Encryption
- Message Scheduling

## Production Checklist

- Configure Custom Domain
- Enable Email Verification
- Configure SMTP
- Enable Rate Limiting
- Add Monitoring & Logging
- Configure Backups
- Run Security Audit
- Perform Accessibility Testing
- Optimize Performance
- Deploy

## Contributing

Contributions, feature requests, and bug reports are welcome. Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.

---

**Aether Chat** — Fast. Secure. Modern Communication.
