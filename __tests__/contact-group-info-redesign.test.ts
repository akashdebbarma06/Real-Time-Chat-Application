import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("Contact Info, Group Info, Shared Vault, and Group Permissions Specifications", () => {
  const inPanelProfilePath = path.resolve(__dirname, "../components/chat/in-panel-user-profile.tsx");
  const profileSheetPath = path.resolve(__dirname, "../components/chat/user-profile-sheet.tsx");
  const inPanelGroupPath = path.resolve(__dirname, "../components/chat/in-panel-group-info.tsx");
  const groupSheetPath = path.resolve(__dirname, "../components/chat/group-info-sheet.tsx");
  const sharedVaultPath = path.resolve(__dirname, "../components/chat/shared-vault-view.tsx");
  const groupPermissionsPath = path.resolve(__dirname, "../components/chat/group-permissions-view.tsx");

  const inPanelProfile = fs.readFileSync(inPanelProfilePath, "utf-8");
  const profileSheet = fs.readFileSync(profileSheetPath, "utf-8");
  const inPanelGroup = fs.readFileSync(inPanelGroupPath, "utf-8");
  const groupSheet = fs.readFileSync(groupSheetPath, "utf-8");
  const sharedVault = fs.readFileSync(sharedVaultPath, "utf-8");
  const groupPermissions = fs.readFileSync(groupPermissionsPath, "utf-8");

  describe("Contact Info Specifications", () => {
    it("inherits semantic theme tokens across in-panel and sheet components", () => {
      for (const content of [inPanelProfile, profileSheet]) {
        expect(content).toContain("bg-background");
        expect(content).toContain("text-foreground");
        expect(content).toContain("border-border");
        expect(content).toContain("bg-card");
      }
    });

    it("features a compact horizontal hero card with avatar, name, handle tag, and status dot", () => {
      for (const content of [inPanelProfile, profileSheet]) {
        expect(content).toContain("peerProfile.avatar_url");
        expect(content).toContain("peerProfile.display_name");
        expect(content).toContain("peerProfile.username");
        expect(content).toContain("bg-emerald-500");
      }
    });

    it("includes a 2-column action row button pair for Audio Call and Video Call", () => {
      for (const content of [inPanelProfile, profileSheet]) {
        expect(content).toContain("grid grid-cols-2");
        expect(content).toContain("Audio Call");
        expect(content).toContain("Video Call");
      }
    });

    it("provides a clean rounded bio section box", () => {
      for (const content of [inPanelProfile, profileSheet]) {
        expect(content).toContain("Bio");
        expect(content).toContain("peerProfile.bio");
      }
    });

    it("shows only 3 recent photos & videos on info panel and a View all button", () => {
      for (const content of [inPanelProfile, profileSheet]) {
        expect(content).toContain("Shared Vault");
        expect(content).toContain("View all");
        expect(content).toContain("slice(0, 3)");
        expect(content).toContain("recentMedia");
        expect(content).toContain("SharedVaultView");
      }
    });

    it("includes subtle Clear conversation and muted red Block contact actions with confirm dialog", () => {
      for (const content of [inPanelProfile, profileSheet]) {
        expect(content).toContain("Clear conversation");
        expect(content).toContain("handleToggleBlock");
        expect(content).toContain("ConfirmActionDialog");
        expect(content).toContain("text-destructive");
      }
    });
  });

  describe("Group Info Specifications", () => {
    it("inherits semantic theme tokens across in-panel and sheet components", () => {
      for (const content of [inPanelGroup, groupSheet]) {
        expect(content).toContain("bg-background");
        expect(content).toContain("text-foreground");
        expect(content).toContain("border-border");
        expect(content).toContain("bg-card");
      }
    });

    it("features a compact horizontal hero card with avatar placeholder, title, and participant count", () => {
      for (const content of [inPanelGroup, groupSheet]) {
        expect(content).toContain("avatarUrl");
        expect(content).toContain("groupName");
        expect(content).toContain("conversation.members.length");
      }
    });

    it("supports inline editing for group avatar via file input", () => {
      for (const content of [inPanelGroup, groupSheet]) {
        expect(content).toContain('type="file"');
        expect(content).toContain("handleAvatarChange");
        expect(content).toContain("avatarInputRef");
      }
    });

    it("supports inline editing for group name with pencil icon and save/cancel", () => {
      for (const content of [inPanelGroup, groupSheet]) {
        expect(content).toContain("isEditingName");
        expect(content).toContain("handleSaveGroupName");
        expect(content).toContain("Pencil");
      }
    });

    it("supports inline editing for group description with Edit button, textarea, Save and Cancel", () => {
      for (const content of [inPanelGroup, groupSheet]) {
        expect(content).toContain("isEditingDesc");
        expect(content).toContain("handleSaveDescription");
        expect(content).toContain("Textarea");
      }
    });

    it("includes a Participants Box with Add Member action link and grouped participant list with Admin badge", () => {
      for (const content of [inPanelGroup, groupSheet]) {
        expect(content).toContain("Participants");
        expect(content).toContain("Add Member");
        expect(content).toContain("member.profile.display_name");
        expect(content).toContain("member.profile.username");
        expect(content).toContain("Shield");
      }
    });

    it("shows only 3 recent photos & videos on group info panel and a View all button", () => {
      for (const content of [inPanelGroup, groupSheet]) {
        expect(content).toContain("Shared Vault");
        expect(content).toContain("View all");
        expect(content).toContain("slice(0, 3)");
        expect(content).toContain("recentMedia");
        expect(content).toContain("SharedVaultView");
      }
    });

    it("includes Group permissions row that navigates to the permissions sub-panel", () => {
      for (const content of [inPanelGroup, groupSheet]) {
        expect(content).toContain("Group permissions");
        expect(content).toContain("Manage member and admin controls");
        expect(content).toContain("viewingPermissions");
        expect(content).toContain("GroupPermissionsView");
      }
    });

    it("includes a danger row for Clear group messages and Leave group with confirmation", () => {
      for (const content of [inPanelGroup, groupSheet]) {
        expect(content).toContain("Clear group messages");
        expect(content).toContain("Leave group");
        expect(content).toContain("handleClearGroupMessages");
        expect(content).toContain("handleLeaveGroup");
        expect(content).toContain("ConfirmActionDialog");
      }
    });
  });

  describe("Group Permissions Sub-Panel", () => {
    it("renders header with back button and title Group permissions", () => {
      expect(groupPermissions).toContain("Group permissions");
      expect(groupPermissions).toContain("ArrowLeft");
    });

    it("renders section 'Members can:' with toggle switches for all required permissions", () => {
      expect(groupPermissions).toContain("Members can:");
      expect(groupPermissions).toContain("Edit group settings");
      expect(groupPermissions).toContain("Send new messages");
      expect(groupPermissions).toContain("Add other members");
      expect(groupPermissions).toContain("Invite via link");
      expect(groupPermissions).toContain("Send message history");
      expect(groupPermissions).toContain("Switch");
    });

    it("renders section 'Admins can:' with Approve new members toggle", () => {
      expect(groupPermissions).toContain("Admins can:");
      expect(groupPermissions).toContain("Approve new members");
    });

    it("renders section 'Group admins' with Edit group admins navigation row and dialog", () => {
      expect(groupPermissions).toContain("Group admins");
      expect(groupPermissions).toContain("Edit group admins");
      expect(groupPermissions).toContain("editAdminsOpen");
      expect(groupPermissions).toContain("handleToggleAdminRole");
    });
  });

  describe("Dedicated Shared Vault Sub-Panel View", () => {
    it("has three distinct sections: Media, Docs, and Links", () => {
      expect(sharedVault).toContain("Shared Vault");
      expect(sharedVault).toContain("Media");
      expect(sharedVault).toContain("Docs");
      expect(sharedVault).toContain("Links");
      expect(sharedVault).toContain('activeTab === "media"');
      expect(sharedVault).toContain('activeTab === "docs"');
      expect(sharedVault).toContain('activeTab === "links"');
    });

    it("supports search filtering across media, documents, and shared links", () => {
      expect(sharedVault).toContain("searchQuery");
      expect(sharedVault).toContain("filteredMedia");
      expect(sharedVault).toContain("filteredDocs");
      expect(sharedVault).toContain("filteredLinks");
    });

    it("extracts and displays links shared in conversation messages", () => {
      expect(sharedVault).toContain("fetchLinks");
      expect(sharedVault).toContain("urlRegex");
      expect(sharedVault).toContain("foundLinks");
      expect(sharedVault).toContain("link.domain");
    });
  });
});
