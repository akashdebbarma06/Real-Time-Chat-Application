import type { ConversationSummary, Profile } from "@/types/chat";

export function getMockConversations(currentUserId: string): ConversationSummary[] {
  const now = new Date();
  const timeMinus = (minutes: number) => new Date(now.getTime() - minutes * 60000).toISOString();

  const userMe: Profile = {
    id: currentUserId,
    username: "me",
    display_name: "You",
    avatar_url: null,
    bio: "Available",
    last_seen_at: now.toISOString(),
  };

  const pAlex: Profile = {
    id: "mock-user-alex",
    username: "alex_morgan",
    display_name: "Alex Morgan",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    bio: "Design lead @ Aether",
    last_seen_at: timeMinus(2),
  };

  const pSarah: Profile = {
    id: "mock-user-sarah",
    username: "sarah_c",
    display_name: "Sarah Connor",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    bio: "Building the future 🤖",
    last_seen_at: timeMinus(15),
  };

  const pMarcus: Profile = {
    id: "mock-user-marcus",
    username: "marcus_b",
    display_name: "Marcus Brody",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    bio: "Software Engineer",
    last_seen_at: timeMinus(120),
  };

  const pElena: Profile = {
    id: "mock-user-elena",
    username: "elena_r",
    display_name: "Elena Rostova",
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    bio: "Photography & Travel ✈️",
    last_seen_at: timeMinus(5),
  };

  return [
    // ─── 1. GROUPS ───
    {
      id: "mock-group-eng",
      type: "group",
      name: "Engineering Team 🚀",
      avatar_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80",
      updated_at: timeMinus(3),
      unread_count: 3,
      members: [
        { user_id: currentUserId, role: "owner", profile: userMe },
        { user_id: pAlex.id, role: "member", profile: pAlex },
        { user_id: pMarcus.id, role: "member", profile: pMarcus },
      ],
      last_message: {
        id: "msg-g1",
        content: "The v2 release build is deployed to production!",
        message_type: "text",
        sender_id: pAlex.id,
        created_at: timeMinus(3),
      },
    },
    {
      id: "mock-group-design",
      type: "group",
      name: "Design System 🎨",
      avatar_url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=150&auto=format&fit=crop&q=80",
      updated_at: timeMinus(45),
      unread_count: 0,
      members: [
        { user_id: currentUserId, role: "admin", profile: userMe },
        { user_id: pAlex.id, role: "owner", profile: pAlex },
        { user_id: pElena.id, role: "member", profile: pElena },
      ],
      last_message: {
        id: "msg-g2",
        content: "Updated WhatsApp Web dark mode tokens in Figma.",
        message_type: "text",
        sender_id: pAlex.id,
        created_at: timeMinus(45),
      },
    },
    {
      id: "mock-group-weekend",
      type: "group",
      name: "Weekend Hikers 🥾",
      avatar_url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=150&auto=format&fit=crop&q=80",
      updated_at: timeMinus(180),
      unread_count: 5,
      members: [
        { user_id: currentUserId, role: "member", profile: userMe },
        { user_id: pSarah.id, role: "owner", profile: pSarah },
        { user_id: pMarcus.id, role: "member", profile: pMarcus },
      ],
      last_message: {
        id: "msg-g3",
        content: "Meeting at the mountain trailhead at 7:00 AM sharp!",
        message_type: "text",
        sender_id: pSarah.id,
        created_at: timeMinus(180),
      },
    },

    // ─── 2. 1-ON-1 DIRECT CHATS ───
    {
      id: "mock-direct-alex",
      type: "direct",
      name: null,
      avatar_url: null,
      updated_at: timeMinus(8),
      unread_count: 2,
      members: [
        { user_id: currentUserId, role: "member", profile: userMe },
        { user_id: pAlex.id, role: "member", profile: pAlex },
      ],
      last_message: {
        id: "msg-d1",
        content: "Can you review the pull request when you get a chance?",
        message_type: "text",
        sender_id: pAlex.id,
        created_at: timeMinus(8),
      },
    },
    {
      id: "mock-direct-sarah",
      type: "direct",
      name: null,
      avatar_url: null,
      updated_at: timeMinus(60),
      unread_count: 0,
      members: [
        { user_id: currentUserId, role: "member", profile: userMe },
        { user_id: pSarah.id, role: "member", profile: pSarah },
      ],
      last_message: {
        id: "msg-d2",
        content: "Sounds great, see you at the coffee shop tomorrow!",
        message_type: "text",
        sender_id: currentUserId,
        created_at: timeMinus(60),
      },
    },
    {
      id: "mock-direct-elena",
      type: "direct",
      name: null,
      avatar_url: null,
      updated_at: timeMinus(240),
      unread_count: 1,
      members: [
        { user_id: currentUserId, role: "member", profile: userMe },
        { user_id: pElena.id, role: "member", profile: pElena },
      ],
      last_message: {
        id: "msg-d3",
        content: "📷 Photo",
        message_type: "image",
        sender_id: pElena.id,
        created_at: timeMinus(240),
      },
    },
    {
      id: "mock-direct-marcus",
      type: "direct",
      name: null,
      avatar_url: null,
      updated_at: timeMinus(720),
      unread_count: 0,
      members: [
        { user_id: currentUserId, role: "member", profile: userMe },
        { user_id: pMarcus.id, role: "member", profile: pMarcus },
      ],
      last_message: {
        id: "msg-d4",
        content: "Thanks for the feedback, closing the ticket now.",
        message_type: "text",
        sender_id: pMarcus.id,
        created_at: timeMinus(720),
      },
    },
  ];
}
