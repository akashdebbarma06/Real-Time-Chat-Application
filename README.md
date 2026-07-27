# ChatSphere

ChatSphere is a production-oriented realtime chat application built with Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui-style components, and Supabase.

## Included features

- Email/password sign up, login, logout, and SSR session refresh
- Protected `/chat` and `/profile` routes using Next.js `proxy.ts`
- Public user profiles with avatar, username, display name, and bio
- One-to-one conversations with duplicate prevention
- Group conversation creation
- Durable messages stored in PostgreSQL
- Private Supabase Realtime Broadcast channels for message updates
- Supabase Presence for online/offline state
- Ephemeral typing indicators through Broadcast
- Read receipts and unread counts
- Private file/image sharing through Supabase Storage signed URLs
- User and conversation search
- Responsive desktop/mobile chat layouts
- System-aware light/dark mode
- Loading, empty, error, and toast states
- Row Level Security for database, Storage, and Realtime channels

## Stack

- Next.js 16 App Router and React 19
- TypeScript (strict mode)
- Tailwind CSS 4
- shadcn/ui conventions with Radix UI primitives
- Supabase Auth, PostgreSQL, Realtime, and Storage
- Sonner notifications
- next-themes

## Project structure

```text
app/
  (auth)/                 Authentication screens
  (app)/                  Protected application routes
  auth/callback/          Supabase email/OAuth callback
components/
  auth/                   Authentication UI
  chat/                   Conversations, messages, composer, realtime UI
  layout/                 Theme and account controls
  profile/                Profile editor
  providers/              Root providers
  ui/                     Reusable shadcn-style primitives
hooks/                    Realtime presence hooks
lib/
  supabase/               Browser, server, and proxy clients
  current-user.ts         Cached protected profile loader
  utils.ts                Shared formatting and UI helpers
supabase/migrations/      Database, RLS, Realtime, and Storage setup
types/                    Database and application domain types
proxy.ts                  Next.js 16 route/session proxy
```

## 1. Create a Supabase project

Create a project in the Supabase dashboard. Copy the Project URL and Publishable key from the project's **Connect** dialog.

```bash
cp .env.example .env.local
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Do not expose a Supabase secret/service-role key in this application.

## 2. Apply the database migration

With the Supabase CLI:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Alternatively, paste `supabase/migrations/001_chatsphere.sql` into the Supabase SQL editor and run it once.

The migration creates:

- `profiles`
- `conversations`
- `conversation_members`
- `messages`
- `message_reads`
- Auth profile trigger
- Direct/group conversation RPCs
- Conversation summary/read receipt RPCs
- Database-to-Broadcast triggers
- Database, Storage, and Realtime RLS policies
- `avatars` and `chat-files` Storage buckets

## 3. Configure Auth and Realtime

In **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000`
- Redirect URL: `http://localhost:3000/auth/callback`

Add your production URL and its `/auth/callback` route before deploying.

In **Realtime Settings**, disable public channel access so `private: true` channels are enforced. The SQL migration authorizes:

- `conversation:<conversation-id>` only for conversation members
- `user-conversations:<user-id>` only for that user
- `online-users` only for authenticated users

## 4. Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Realtime design

ChatSphere separates persistent and ephemeral state:

- **Messages and receipts:** stored in PostgreSQL, then emitted through private database Broadcast triggers.
- **Typing:** transient client Broadcast events; nothing is written to the database.
- **Online state:** Supabase Presence on the authenticated `online-users` channel.
- **Conversation list refreshes:** small user-specific Broadcast notifications.

This avoids using high-volume, unfiltered Postgres Changes subscriptions for the primary chat path.

## File security

- Avatars are public and restricted to each user's own folder.
- Chat attachments are private.
- Attachment paths start with the conversation ID and uploader ID.
- Storage RLS verifies conversation membership.
- The UI requests short-lived signed URLs before rendering or downloading attachments.
- Standard uploads are limited to 6 MB. For larger files, add Supabase resumable uploads (TUS).

## Production checklist

- Enable email confirmations and configure a custom SMTP provider.
- Add CAPTCHA and rate limiting to authentication flows.
- Add monitoring/error reporting and structured logs.
- Review file MIME allowlists for your product requirements.
- Add content moderation/abuse reporting where needed.
- Generate exact database types with `supabase gen types typescript` after schema changes.
- Add automated RLS tests and end-to-end tests before launch.
- Configure database backups and point-in-time recovery for your Supabase plan.
- Use a custom domain and verify all Auth redirect URLs.

## Extending ChatSphere

Natural additions include message editing/deletion UI, reactions, pinned messages, group administration, push notifications, infinite message pagination, voice notes, and resumable large-file uploads.
