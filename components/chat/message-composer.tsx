"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Camera,
  CornerUpLeft,
  FileIcon,
  Loader2,
  Mic,
  Paperclip,
  Plus,
  SendHorizontal,
  X,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { cn, formatFileSize, validateUploadFile } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

import { AttachmentGridMenu } from "./composer/attachment-grid-menu";
import { CameraMenu } from "./composer/camera-menu";
import {
  AddQuickMenu,
  FullMediaDrawer,
  type MediaTab,
} from "./composer/add-menu-drawer";
import { PollCreatorDialog } from "./composer/poll-creator-dialog";
import { EventCreatorDialog } from "./composer/event-creator-dialog";
import { ContactPickerDialog } from "./composer/contact-picker-dialog";
import {
  CameraCaptureDialog,
  type CameraMode,
} from "./composer/camera-capture-dialog";
import { PhotosVideosPreviewDialog } from "./composer/photos-videos-preview-dialog";
import { DocumentPreviewDialog } from "./composer/document-preview-dialog";
import { VoiceRecorder } from "./composer/voice-recorder";

type OverlayMenu = "none" | "add" | "attachment" | "camera" | "media-drawer";

interface MessageComposerProps {
  disabled?: boolean;
  sending: boolean;
  replyToMessage?: ChatMessage | null;
  onCancelReply?: () => void;
  onSendText: (content: string) => Promise<void>;
  onSendFile: (file: File, caption: string, messageType?: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  onSelectPhotosVideos?: (files: File[]) => void;
  onSelectDocument?: (file: File) => void;
}

export function MessageComposer({
  disabled,
  sending,
  replyToMessage,
  onCancelReply,
  onSendText,
  onSendFile,
  onTyping,
  onSelectPhotosVideos,
  onSelectDocument,
}: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // WhatsApp Web Preview / MediaEditorModal States (Unified selectedMedia state)
  const [photosVideosModalOpen, setPhotosVideosModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const photosVideosFiles = selectedMedia;
  const setPhotosVideosFiles = setSelectedMedia;
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  // Overlay state: mutually exclusive ('none' | 'add' | 'attachment' | 'camera' | 'media-drawer')
  const [activeMenu, setActiveMenu] = useState<OverlayMenu>("none");
  const [mediaDrawerTab, setMediaDrawerTab] = useState<MediaTab>("emoji");

  // Dialog states for interactive modals
  const [pollDialogOpen, setPollDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>("photo");

  // Voice recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  // Refs for inputs and outside clicks
  const composerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Close overlays on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (
        composerRef.current &&
        !composerRef.current.contains(e.target as Node)
      ) {
        setActiveMenu("none");
      }
    }

    if (activeMenu !== "none") {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [activeMenu]);

  // Adjust textarea height dynamically (1 to 5 lines max)
  function handleTextChange(val: string) {
    setContent(val);
    onTyping(Boolean(val.trim()));

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const nextHeight = Math.min(textareaRef.current.scrollHeight, 128);
      textareaRef.current.style.height = `${nextHeight}px`;
    }
  }

  function resetTextareaHeight() {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  // 1. Submit message
  async function submit() {
    if (sending || disabled) return;

    if (selectedFile) {
      const caption = content.trim().slice(0, 2000);
      setSelectedFile(null);
      setPreviewUrl(null);
      setContent("");
      resetTextareaHeight();
      onTyping(false);
      const isImage = selectedFile.type.startsWith("image/") || Boolean(selectedFile.name.match(/\.(jpg|jpeg|png|gif|webp|svg|heic)$/i));
      const isVideo = !isImage && (selectedFile.type.startsWith("video/") || selectedFile.name.includes("camera-capture") || Boolean(selectedFile.name.match(/\.(mp4|mov|mkv|webm)$/i)));
      await onSendFile(selectedFile, caption, isImage ? "image" : isVideo ? "video" : undefined);
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) return;
    if (trimmed.length > 2000) {
      toast.error("Message content exceeds 2,000 characters limit");
      return;
    }

    setContent("");
    resetTextareaHeight();
    onTyping(false);
    await onSendText(trimmed);
  }

  // 2. File Selection Handler
  function handleFileSelect(file?: File) {
    if (!file) return;
    const validation = validateUploadFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid file selection");
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
    setActiveMenu("none");
  }

  function clearSelectedFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (documentInputRef.current) documentInputRef.current.value = "";
  }

  function handlePhotosVideosSelect(files: File[]) {
    const validFiles = files.filter((f) => {
      const v = validateUploadFile(f);
      if (!v.valid) {
        toast.error(v.error || "Invalid file selection");
        return false;
      }
      return true;
    });
    if (validFiles.length > 0) {
      if (onSelectPhotosVideos) {
        onSelectPhotosVideos(validFiles);
      } else {
        setPhotosVideosFiles(validFiles);
        setPhotosVideosModalOpen(true);
      }
      setActiveMenu("none");
    }
  }

  function handleDocumentSelect(file?: File) {
    if (!file) return;
    const v = validateUploadFile(file);
    if (!v.valid) {
      toast.error(v.error || "Invalid document selection");
      return;
    }
    if (onSelectDocument) {
      onSelectDocument(file);
    } else {
      setDocumentFile(file);
      setDocumentModalOpen(true);
    }
    setActiveMenu("none");
  }

  // 3. Location sharing with GPS permission request
  function handleRequestLocation() {
    setActiveMenu("none");
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    toast.info("Requesting GPS coordinates...", { duration: 1500 });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const locationMessage = `📍 **Location Shared**\nLatitude: ${latitude.toFixed(5)}, Longitude: ${longitude.toFixed(5)}\nhttps://www.google.com/maps?q=${latitude},${longitude}`;
        void onSendText(locationMessage);
        toast.success("Location sent successfully!");
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Please enable location access in browser settings."
            : "Could not retrieve location. Please check your GPS signal.";
        toast.error("Location Error", { description: msg });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // 4. Menu Toggle Handlers (Mutually Exclusive)
  function toggleAddMenu() {
    setActiveMenu((prev) => (prev === "add" ? "none" : "add"));
  }

  function toggleAttachmentMenu() {
    setActiveMenu((prev) => (prev === "attachment" ? "none" : "attachment"));
  }

  function toggleCameraMenu() {
    setActiveMenu((prev) => (prev === "camera" ? "none" : "camera"));
  }

  // 5. Add Menu Sub-actions
  function openMediaDrawer(tab: MediaTab) {
    setMediaDrawerTab(tab);
    setActiveMenu("media-drawer");
  }

  function handleInsertEmoji(emoji: string) {
    handleTextChange(content + emoji);
    textareaRef.current?.focus();
  }

  function handleSendGif(gifUrl: string) {
    setActiveMenu("none");
    void onSendText(`![GIF](${gifUrl})`);
  }

  function handleSendSticker(stickerEmoji: string, label: string) {
    setActiveMenu("none");
    void onSendText(`${stickerEmoji} *(${label})*`);
  }

  // 6. Camera Actions
  function openCamera(mode: CameraMode) {
    setActiveMenu("none");
    setCameraMode(mode);
    setCameraDialogOpen(true);
  }

  // Determine dynamic Action Button state
  const hasTextOrFile = Boolean(content.trim() || selectedFile);

  return (
    <div
      ref={composerRef}
      className="relative bg-transparent px-3 sm:px-6 pt-1 pb-3 sm:pb-4 space-y-2 select-none z-20"
    >
      {/* ── 1. Reply Banner Preview (Floating Glass) ── */}
      {replyToMessage && (
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-2xl border border-white/20 dark:border-white/10 bg-background/80 dark:bg-card/80 backdrop-blur-2xl p-2.5 text-xs shadow-lg shadow-black/5 dark:shadow-black/25 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 min-w-0">
            <CornerUpLeft className="size-4 text-primary shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-primary">
                Replying to {replyToMessage.sender.display_name}
              </span>
              <p className="truncate text-muted-foreground">
                {replyToMessage.content || "Attachment"}
              </p>
            </div>
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onCancelReply}
            className="size-6 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* ── 2. File Attachment Preview Card (Floating Glass) ── */}
      {selectedFile && (
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-2xl border border-white/20 dark:border-white/10 bg-background/80 dark:bg-card/80 backdrop-blur-2xl p-2.5 shadow-lg shadow-black/5 dark:shadow-black/25 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 min-w-0">
            {previewUrl && selectedFile.type.startsWith("video/") ? (
              <div
                className={cn(
                  "relative size-12 overflow-hidden border shrink-0 bg-black",
                  selectedFile.name.includes("video-note")
                    ? "rounded-full aspect-square border-primary/50"
                    : "rounded-xl"
                )}
              >
                <video
                  src={previewUrl}
                  muted
                  playsInline
                  className={cn(
                    "size-full object-cover",
                    selectedFile.name.includes("video-note") && "-scale-x-100"
                  )}
                />
              </div>
            ) : previewUrl ? (
              <div className="relative size-12 overflow-hidden rounded-xl border shrink-0">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <FileIcon className="size-6" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">
                {selectedFile.name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={clearSelectedFile}
            className="text-muted-foreground hover:text-destructive rounded-xl"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* ── 3. Composer Controls & Overlays Floating Anchor ── */}
      <div className="relative mx-auto max-w-4xl">
        {/* Overlays (Mutually Exclusive) */}
        {activeMenu === "add" && <AddQuickMenu onSelectTab={openMediaDrawer} />}

        {activeMenu === "media-drawer" && (
          <FullMediaDrawer
            initialTab={mediaDrawerTab}
            onSelectEmoji={handleInsertEmoji}
            onSelectGif={handleSendGif}
            onSelectSticker={handleSendSticker}
            onClose={() => setActiveMenu("none")}
          />
        )}

        {activeMenu === "attachment" && (
          <AttachmentGridMenu
            onSelectPhotosAndVideos={() => {
              setActiveMenu("none");
              galleryInputRef.current?.click();
            }}
            onSelectGallery={() => {
              setActiveMenu("none");
              galleryInputRef.current?.click();
            }}
            onSelectLocation={handleRequestLocation}
            onSelectContact={() => {
              setActiveMenu("none");
              setContactDialogOpen(true);
            }}
            onSelectDocument={() => {
              setActiveMenu("none");
              documentInputRef.current?.click();
            }}
            onSelectPoll={() => {
              setActiveMenu("none");
              setPollDialogOpen(true);
            }}
            onSelectEvent={() => {
              setActiveMenu("none");
              setEventDialogOpen(true);
            }}
          />
        )}

        {activeMenu === "camera" && (
          <CameraMenu
            onSelectVideo={() => openCamera("video")}
            onSelectPhoto={() => openCamera("photo")}
            onSelectVideoNote={() => openCamera("video-note")}
          />
        )}

        {/* Floating Input Row */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Active Voice Recorder Mode */}
          {isRecordingVoice ? (
            <VoiceRecorder
              onCancel={() => setIsRecordingVoice(false)}
              onSendVoice={async (file) => {
                setIsRecordingVoice(false);
                await onSendFile(file, "Voice Note");
              }}
            />
          ) : (
            <>
              {/* 3a. Add Button (+) on the left */}
              <button
                type="button"
                disabled={disabled || sending}
                onClick={toggleAddMenu}
                aria-label="Add media, emojis, gifs or stickers"
                title="Add emojis, GIFs, or stickers"
                className={cn(
                  "grid size-10 sm:size-11 place-items-center rounded-full shrink-0 cursor-pointer transition-all duration-200",
                  "backdrop-blur-2xl shadow-lg",
                  activeMenu === "add" || activeMenu === "media-drawer"
                    ? "bg-primary text-primary-foreground border border-primary shadow-primary/25 scale-105"
                    : "bg-background/80 dark:bg-card/80 text-muted-foreground hover:text-foreground hover:bg-background dark:hover:bg-card border border-white/20 dark:border-white/10 hover:border-primary/40 shadow-black/5 dark:shadow-black/25"
                )}
              >
                <Plus
                  className={cn(
                    "size-5 transition-transform duration-200",
                    activeMenu === "add" ? "rotate-45" : ""
                  )}
                />
              </button>

              {/* 3b. Text Input Field Capsule */}
              <div className="flex-1 min-w-0 flex items-center rounded-full bg-background/80 dark:bg-card/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/25 px-3 py-1 sm:py-1.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <textarea
                  ref={textareaRef}
                  value={content}
                  disabled={disabled || sending}
                  rows={1}
                  placeholder={selectedFile ? "Add a caption…" : "Message..."}
                  onChange={(e) => handleTextChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void submit();
                    }
                  }}
                  className="max-h-32 min-h-6 flex-1 resize-none border-0 bg-transparent px-2 py-1 text-sm leading-relaxed shadow-none focus:outline-none placeholder:text-muted-foreground text-foreground"
                />

                {/* Grouped In-Capsule Icons: Attachment (📎) & Camera (📷) */}
                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 self-center pr-0.5">
                  <button
                    type="button"
                    disabled={disabled || sending}
                    onClick={toggleAttachmentMenu}
                    aria-label="Attachment options"
                    title="Attach files, media, poll, event..."
                    className={cn(
                      "grid size-8 place-items-center rounded-full transition-all shrink-0 cursor-pointer",
                      activeMenu === "attachment"
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <Paperclip className="size-4.5" />
                  </button>

                  <button
                    type="button"
                    disabled={disabled || sending}
                    onClick={toggleCameraMenu}
                    aria-label="Camera options"
                    title="Camera & video notes"
                    className={cn(
                      "grid size-8 place-items-center rounded-full transition-all shrink-0 cursor-pointer",
                      activeMenu === "camera"
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <Camera className="size-4.5" />
                  </button>
                </div>
              </div>

              {/* 3c. Action Button (Dynamic Toggle: Mic <-> Send) */}
              {hasTextOrFile ? (
                <Button
                  type="button"
                  size="icon"
                  disabled={disabled || sending}
                  onClick={() => void submit()}
                  aria-label="Send message"
                  title="Send message"
                  className="size-10 sm:size-11 shrink-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/30 transition-all animate-in zoom-in-75 duration-150 cursor-pointer"
                >
                  {sending ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <SendHorizontal className="size-5" />
                  )}
                </Button>
              ) : (
                <button
                  type="button"
                  disabled={disabled || sending}
                  onClick={() => setIsRecordingVoice(true)}
                  aria-label="Record voice note"
                  title="Click to record voice note"
                  className="grid size-10 sm:size-11 place-items-center rounded-full bg-background/80 dark:bg-card/80 backdrop-blur-2xl text-muted-foreground hover:text-primary hover:bg-background dark:hover:bg-card border border-white/20 dark:border-white/10 hover:border-primary/40 shadow-lg shadow-black/5 dark:shadow-black/25 transition-all shrink-0 cursor-pointer active:scale-95 animate-in zoom-in-75 duration-150"
                >
                  <Mic className="size-5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={galleryInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handlePhotosVideosSelect(Array.from(e.target.files));
          }
          e.target.value = "";
        }}
      />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt,.zip,.rar,.xls,.xlsx,.ppt,.pptx,application/*,*/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleDocumentSelect(e.target.files[0]);
          }
          e.target.value = "";
        }}
      />

      {/* WhatsApp Web Preview Modals (Fallback when not handled by chat pane) */}
      {!onSelectPhotosVideos && (
        <PhotosVideosPreviewDialog
          open={photosVideosModalOpen}
          files={photosVideosFiles}
          onClose={() => {
            setPhotosVideosModalOpen(false);
            setPhotosVideosFiles([]);
          }}
          onSend={async (items) => {
            for (const item of items) {
              const isVid =
                item.file.type.startsWith("video/") ||
                Boolean(item.file.name.match(/\.(mp4|mov|mkv|webm)$/i));
              await onSendFile(
                item.file,
                item.caption,
                isVid ? "video" : "image"
              );
            }
          }}
          onAddMoreFiles={(newFiles) => {
            setPhotosVideosFiles((prev) => [...prev, ...newFiles]);
          }}
        />
      )}

      {!onSelectDocument && (
        <DocumentPreviewDialog
          open={documentModalOpen}
          file={documentFile}
          onClose={() => {
            setDocumentModalOpen(false);
            setDocumentFile(null);
          }}
          onSend={async (file, caption) => {
            await onSendFile(file, caption, "file");
          }}
        />
      )}

      {/* Interactive Modals */}
      <PollCreatorDialog
        open={pollDialogOpen}
        onOpenChange={setPollDialogOpen}
        onSubmitPoll={(pollText) => void onSendText(pollText)}
      />

      <EventCreatorDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        onSubmitEvent={(eventText) => void onSendText(eventText)}
      />

      <ContactPickerDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        onSubmitContact={(contactText) => void onSendText(contactText)}
      />

      <CameraCaptureDialog
        open={cameraDialogOpen}
        mode={cameraMode}
        onOpenChange={setCameraDialogOpen}
        onCaptureMedia={(file) => {
          // Unified Capture Pipeline:
          // Do NOT upload immediately. Route to gallery media preview & edit modal!
          handlePhotosVideosSelect([file]);
        }}
      />
    </div>
  );
}
