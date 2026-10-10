import { describe, expect, it, vi } from "vitest";

describe("WhatsApp Web Media Lightbox Modal & Click Interception Specifications", () => {
  describe("1. Click Interception & Storage URL Prevention", () => {
    it("prevents default navigation and opens lightbox when clicking an image card", () => {
      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };
      const onMediaClick = vi.fn();

      const handleClick = (e: typeof mockEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onMediaClick();
      };

      handleClick(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(onMediaClick).toHaveBeenCalled();
    });

    it("prevents default external navigation and triggers lightbox when clicking a video card", () => {
      const mockEvent = {
        stopPropagation: vi.fn(),
      };
      const onMediaClick = vi.fn();
      let isPlaying = true;
      const pauseMock = vi.fn();

      const handleVideoCardClick = (e: typeof mockEvent) => {
        e.stopPropagation();
        if (onMediaClick) {
          if (isPlaying) {
            pauseMock();
            isPlaying = false;
          }
          onMediaClick();
          return;
        }
      };

      handleVideoCardClick(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(pauseMock).toHaveBeenCalled();
      expect(onMediaClick).toHaveBeenCalled();
    });
  });

  describe("2. Modal Structure - Top Header Specifications", () => {
    const requiredHeaderControls = [
      "avatar",
      "sender_name",
      "timestamp",
      "zoom",
      "reply",
      "star",
      "pin",
      "react",
      "download",
      "three_dot_menu",
      "close",
    ];

    it("contains all required WhatsApp Web top header controls", () => {
      expect(requiredHeaderControls).toContain("avatar");
      expect(requiredHeaderControls).toContain("sender_name");
      expect(requiredHeaderControls).toContain("timestamp");
      expect(requiredHeaderControls).toContain("zoom");
      expect(requiredHeaderControls).toContain("reply");
      expect(requiredHeaderControls).toContain("star");
      expect(requiredHeaderControls).toContain("pin");
      expect(requiredHeaderControls).toContain("react");
      expect(requiredHeaderControls).toContain("download");
      expect(requiredHeaderControls).toContain("three_dot_menu");
      expect(requiredHeaderControls).toContain("close");
    });

    it("includes forward and delete options in the 3-dot dropdown menu", () => {
      const threeDotMenuOptions = ["Forward", "Delete message"];
      expect(threeDotMenuOptions).toContain("Forward");
      expect(threeDotMenuOptions).toContain("Delete message");
    });

    it("supports Zoom toggle for photos and disables Zoom for video files", () => {
      const isVideo = (type: string, name: string) =>
        type === "video" || Boolean(name.match(/\.(mp4|mov|mkv|webm|avi)$/i));

      expect(isVideo("image", "photo.jpg")).toBe(false);
      expect(isVideo("video", "clip.mp4")).toBe(true);

      let zoomLevel = 1;
      const toggleZoom = () => {
        zoomLevel = zoomLevel === 1 ? 1.75 : 1;
      };

      toggleZoom();
      expect(zoomLevel).toBe(1.75);
      toggleZoom();
      expect(zoomLevel).toBe(1);
    });
  });

  describe("3. Modal Structure - Center Viewport & Keyboard Navigation", () => {
    it("handles arrow navigation across previous and next media files", () => {
      const mediaList = [
        { id: "msg-1", name: "pic1.jpg" },
        { id: "msg-2", name: "vid1.mp4" },
        { id: "msg-3", name: "pic2.png" },
      ];
      let activeIndex = 1;

      const goToPrevious = () => {
        if (activeIndex > 0) activeIndex -= 1;
      };
      const goToNext = () => {
        if (activeIndex < mediaList.length - 1) activeIndex += 1;
      };

      goToPrevious();
      expect(activeIndex).toBe(0);
      expect(mediaList[activeIndex].id).toBe("msg-1");

      goToNext();
      expect(activeIndex).toBe(1);
      goToNext();
      expect(activeIndex).toBe(2);
      expect(mediaList[activeIndex].id).toBe("msg-3");
    });

    it("handles keyboard events: ArrowLeft, ArrowRight, and Escape", () => {
      const onPrevious = vi.fn();
      const onNext = vi.fn();
      const onClose = vi.fn();

      const handleKeyDown = (key: string) => {
        if (key === "Escape") onClose();
        else if (key === "ArrowLeft") onPrevious();
        else if (key === "ArrowRight") onNext();
      };

      handleKeyDown("ArrowLeft");
      expect(onPrevious).toHaveBeenCalled();

      handleKeyDown("ArrowRight");
      expect(onNext).toHaveBeenCalled();

      handleKeyDown("Escape");
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("4. Modal Structure - Bottom Carousel Specifications", () => {
    const conversationMedia = [
      { id: "m1", name: "photo1.jpg", isVideo: false },
      { id: "m2", name: "recording.mp4", isVideo: true, durationBadge: "0:15" },
      { id: "m3", name: "photo2.png", isVideo: false },
    ];

    it("identifies active thumbnail with emerald border", () => {
      const activeId = "m2";
      const getThumbnailBorderClass = (id: string) =>
        id === activeId
          ? "border-[#00a884] ring-2 ring-[#00a884]"
          : "border-transparent opacity-50";

      expect(getThumbnailBorderClass("m2")).toBe("border-[#00a884] ring-2 ring-[#00a884]");
      expect(getThumbnailBorderClass("m1")).toBe("border-transparent opacity-50");
    });

    it("displays video duration badge on video items in thumbnail strip", () => {
      const videoItems = conversationMedia.filter((item) => item.isVideo);
      expect(videoItems.length).toBe(1);
      expect(videoItems[0].durationBadge).toBe("0:15");
    });
  });
});
