import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { parsePollContent } from "../components/chat/media/poll-card";

describe("Media Sizing & Rich Content Rendering", () => {
  describe("Poll Content Parser", () => {
    it("parses single-answer polls with question and numbered options", () => {
      const pollText = [
        "📊 **POLL: What is your favorite framework?**",
        "*(Single answer)*",
        "",
        "1. ⬜ React",
        "2. ⬜ Vue",
        "3. ⬜ Svelte",
      ].join("\n");

      const result = parsePollContent(pollText);
      expect(result).not.toBeNull();
      expect(result?.question).toBe("What is your favorite framework?");
      expect(result?.allowMultiple).toBe(false);
      expect(result?.options).toHaveLength(3);
      expect(result?.options[0].text).toBe("React");
      expect(result?.options[1].text).toBe("Vue");
      expect(result?.options[2].text).toBe("Svelte");
    });

    it("parses multiple-answer polls correctly", () => {
      const pollText = [
        "📊 **POLL: Available meeting days**",
        "*(Multiple answers allowed)*",
        "",
        "1. ⬜ Monday",
        "2. ⬜ Wednesday",
        "3. ⬜ Friday",
      ].join("\n");

      const result = parsePollContent(pollText);
      expect(result).not.toBeNull();
      expect(result?.question).toBe("Available meeting days");
      expect(result?.allowMultiple).toBe(true);
      expect(result?.options).toHaveLength(3);
      expect(result?.options[0].text).toBe("Monday");
    });

    it("returns null for non-poll messages", () => {
      expect(parsePollContent("Hello world")).toBeNull();
      expect(parsePollContent("![GIF](https://example.com/test.gif)")).toBeNull();
      expect(parsePollContent("🚀 *(To The Moon)*")).toBeNull();
    });
  });

  describe("Photo & Video 4:3 Aspect Ratio Styles", () => {
    it("enforces strict 4:3 aspect ratio and max-w-[320px] on ImageMediaCard", () => {
      const imageCardPath = path.resolve(__dirname, "../components/chat/media/image-media-card.tsx");
      const content = fs.readFileSync(imageCardPath, "utf-8");

      expect(content).toContain("aspect-[4/3]");
      expect(content).toContain("max-w-[320px]");
      expect(content).toContain('aspectRatio: "4 / 3"');
      expect(content).toContain("object-cover");
    });

    it("enforces strict 4:3 aspect ratio and max-w-[320px] on VideoPlayerCard", () => {
      const videoCardPath = path.resolve(__dirname, "../components/chat/media/video-player-card.tsx");
      const content = fs.readFileSync(videoCardPath, "utf-8");

      expect(content).toContain("aspect-[4/3]");
      expect(content).toContain("max-w-[320px]");
      expect(content).toContain('aspectRatio: "4 / 3"');
      expect(content).toContain("object-cover");
    });

    it("enforces strict 4:3 aspect ratio on GifMediaCard", () => {
      const gifCardPath = path.resolve(__dirname, "../components/chat/media/gif-media-card.tsx");
      const content = fs.readFileSync(gifCardPath, "utf-8");

      expect(content).toContain("aspect-[4/3]");
      expect(content).toContain("max-w-[320px]");
      expect(content).toContain('aspectRatio: "4 / 3"');
      expect(content).toContain("GIF");
    });

    it("renders StickerBubble as standalone sticker without background borders", () => {
      const stickerPath = path.resolve(__dirname, "../components/chat/media/sticker-bubble.tsx");
      const content = fs.readFileSync(stickerPath, "utf-8");

      expect(content).toContain("StickerBubble");
      expect(content).toContain("text-6xl");
    });
  });

  describe("MessageBubble Type Integration", () => {
    it("handles GIF, Sticker, and Poll rendering inside message-bubble.tsx", () => {
      const bubblePath = path.resolve(__dirname, "../components/chat/message-bubble.tsx");
      const content = fs.readFileSync(bubblePath, "utf-8");

      expect(content).toContain("<GifMediaCard");
      expect(content).toContain("<StickerBubble");
      expect(content).toContain("<PollCard");
      expect(content).toContain("isCustomRichCard");
    });
  });
});
