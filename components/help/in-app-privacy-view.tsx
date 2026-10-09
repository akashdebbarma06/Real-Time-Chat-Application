"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Database,
  Download,
  Key,
  Lock,
  MessageSquare,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/chat";

interface InAppPrivacyViewProps {
  profile: Profile;
  userEmail?: string;
}

export function InAppPrivacyView({ profile, userEmail }: InAppPrivacyViewProps) {
  const [exporting, setExporting] = useState(false);

  function exportUserData() {
    setExporting(true);
    try {
      const exportPayload = {
        exportDate: new Date().toISOString(),
        application: "Aether Chat",
        version: "1.0.0",
        profile: {
          id: profile.id,
          username: profile.username,
          displayName: profile.display_name,
          bio: profile.bio,
          avatarUrl: profile.avatar_url,
          lastSeenAt: profile.last_seen_at,
          registeredEmail: userEmail || `${profile.username}@aetherchat.app`,
        },
        securityProtocols: {
          databaseProtection: "PostgreSQL Row Level Security (RLS)",
          realtimePresenceIsolation: "presence:room:{roomId}",
          fileValidationPolicy: "image-only (max 6 MB)",
          sessionManagement: "HttpOnly 30-min cookie rotation",
        },
      };

      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute(
        "download",
        `aether-privacy-export-${profile.username}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast.success("Data export downloaded successfully!", {
        description: `Exported profile and configuration for @${profile.username}.`,
      });
    } catch {
      toast.error("Failed to generate data export");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-3xl border bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 shadow-xl overflow-hidden">
        <div className="relative space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="size-3.5" />
            <span>In-App Privacy & Data Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Your Privacy & Data Protection
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            At Aether Chat, your privacy is fundamental to our architecture. Below is a transparent overview of how your data is safeguarded, who can access it, and your tools for control.
          </p>
        </div>
      </div>

      {/* Security Status Card Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs">
            <Database className="size-4" />
            <span>Row-Level Security</span>
          </div>
          <p className="text-sm font-bold text-foreground">Strictly Enforced</p>
          <p className="text-xs text-muted-foreground">
            PostgreSQL policies ensure only conversation members can query messages or presence.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-4 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs">
            <Lock className="size-4" />
            <span>Encryption & Cookies</span>
          </div>
          <p className="text-sm font-bold text-foreground">30-Min Rotation</p>
          <p className="text-xs text-muted-foreground">
            Session tokens use HttpOnly secure cookies with automatic periodic renewal.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-4 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs">
            <UserCheck className="size-4" />
            <span>Data Ownership</span>
          </div>
          <p className="text-sm font-bold text-foreground">100% User Owned</p>
          <p className="text-xs text-muted-foreground">
            We never sell, rent, or monetize your chats, contact info, or presence data.
          </p>
        </div>
      </div>

      {/* Data Export & Management Controls */}
      <div className="rounded-3xl border bg-card p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Download className="size-5 text-primary" />
              <span>Export Your Account Data</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Download a complete JSON export of your profile information, registered identity, and security parameters.
            </p>
          </div>

          <Button
            onClick={exportUserData}
            disabled={exporting}
            className="rounded-xl font-semibold text-xs gap-2 shrink-0 shadow-md"
          >
            <Download className="size-4" />
            <span>{exporting ? "Generating Export..." : "Download Data (JSON)"}</span>
          </Button>
        </div>
      </div>

      {/* Detailed Policy Sections */}
      <div className="rounded-3xl border bg-card p-6 sm:p-8 shadow-xl space-y-6 text-sm">
        <div className="space-y-2">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-lg bg-primary/10 text-primary text-xs font-bold">1</span>
            Data Collection & Scope
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            We collect only the bare essentials needed to deliver real-time messaging: your username (@{profile.username}), display name ({profile.display_name}), avatar URL, profile bio, and hashed authentication credentials. We do not track external browsing or collect third-party advertising identifiers.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-lg bg-primary/10 text-primary text-xs font-bold">2</span>
            Attachment & Media Safety
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            All file uploads undergo strict client and storage-level validation. Only approved image formats (PNG, JPG, WebP, GIF) under 6 MB are permitted. Dangerous files, scripts, and executable binaries are categorically blocked to prevent malicious payload delivery.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-lg bg-primary/10 text-primary text-xs font-bold">3</span>
            Presence & Activity Isolation
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Presence broadcasts are scoped to authenticated channels using <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">presence:room:&#123;roomId&#125;</code>. Users you have blocked cannot track your online presence or see when you were last active.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-lg bg-primary/10 text-primary text-xs font-bold">4</span>
            Account Deletion & Data Removal
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Under GDPR and international privacy regulations, you have the right to be forgotten. To completely purge your profile, message history, and uploaded assets, you can submit an account deletion request through our{" "}
            <Link href="/help/contact" className="text-primary underline font-medium">
              In-App Support Desk
            </Link>{" "}
            or email us at <strong>support@aetherchat.app</strong>.
          </p>
        </div>
      </div>

      {/* Return to settings / chat */}
      <div className="flex justify-between items-center pt-2">
        <Button asChild variant="outline" className="rounded-xl text-xs font-semibold">
          <Link href="/chat">← Return to Messages</Link>
        </Button>
        <Button asChild className="rounded-xl text-xs font-semibold">
          <Link href="/help">Browse Knowledgebase</Link>
        </Button>
      </div>
    </div>
  );
}
