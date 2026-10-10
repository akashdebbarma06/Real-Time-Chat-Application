"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Plus,
  RotateCw,
  SendHorizontal,
  Smile,
  Sliders,
  Trash2,
  Type,
  Undo2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBackHandler } from "@/hooks/use-back-handler";

export interface TextItem {
  id: string;
  text: string;
  x: number; // offset X in pixels from center
  y: number; // offset Y in pixels from center
  isEditing?: boolean;
}

export interface PreviewMediaItem {
  id: string;
  file: File;
  previewUrl: string;
  isVideo: boolean;
  rotation: number;
  filter: string;
  filterName: string;
  caption: string;
  textItems: TextItem[];
  sticker?: string;
}

const AVAILABLE_FILTERS = [
  { name: "Normal", value: "none" },
  { name: "Vivid", value: "contrast(125%) saturate(135%)" },
  { name: "B&W", value: "grayscale(100%)" },
  { name: "Sepia", value: "sepia(85%)" },
  { name: "Warm", value: "sepia(30%) saturate(140%)" },
  { name: "Cool", value: "hue-rotate(180deg) saturate(90%)" },
  { name: "Vintage", value: "contrast(115%) sepia(40%) saturate(120%)" },
];

const AVAILABLE_STICKERS = ["⭐", "❤️", "🔥", "😂", "👍", "🎉", "✨", "💯"];

// Color dots: #ffffff, emerald, blue, red, orange, yellow
export const DRAW_PRESET_COLORS = [
  { name: "white", hex: "#ffffff" },
  { name: "emerald", hex: "#00a884" },
  { name: "blue", hex: "#3b82f6" },
  { name: "red", hex: "#ef4444" },
  { name: "orange", hex: "#f97316" },
  { name: "yellow", hex: "#eab308" },
];

export interface PhotosVideosPreviewDialogProps {
  open: boolean;
  files: File[];
  onClose: () => void;
  onSend: (items: { file: File; caption: string; rotation: number; filter: string }[]) => Promise<void>;
  onAddMoreFiles: (newFiles: File[]) => void;
}

export type MediaEditorModalProps = PhotosVideosPreviewDialogProps;

export function PhotosVideosPreviewDialog({
  open,
  files,
  onClose,
  onSend,
  onAddMoreFiles,
}: PhotosVideosPreviewDialogProps) {
  const [items, setItems] = useState<PreviewMediaItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [caption, setCaption] = useState("");
  const [sending, setSending] = useState(false);

  // Overlay tool popups
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showDrawMode, setShowDrawMode] = useState(false);
  const [drawColor, setDrawColor] = useState("#00a884");

  // Priority 1a: Dismiss editing tool overlays
  useBackHandler({
    id: "media-editor-tool-popups",
    priority: 110,
    enabled: open && (showFilterPicker || showStickerPicker || showDrawMode),
    onBack: () => {
      setShowFilterPicker(false);
      setShowStickerPicker(false);
      setShowDrawMode(false);
    },
  });

  // Priority 1: Dismiss preview modal
  useBackHandler({
    id: "photos-videos-preview-dialog",
    priority: 100,
    enabled: open,
    onBack: onClose,
  });

  // Freehand Canvas Drawing State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Draggable Text & Delete Bin State
  const [draggedTextId, setDraggedTextId] = useState<string | null>(null);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    itemX: number;
    itemY: number;
  } | null>(null);

  const previewBoxRef = useRef<HTMLDivElement>(null);
  const trashBinRef = useRef<HTMLDivElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  // Initialize or update items when files prop changes
  useEffect(() => {
    if (!open || files.length === 0) {
      return;
    }

    const created: PreviewMediaItem[] = files.map((file, idx) => {
      const isVideo =
        file.type.startsWith("video/") ||
        Boolean(file.name.match(/\.(mp4|mov|mkv|webm)$/i));

      return {
        id: `${file.name}-${file.size}-${idx}-${Date.now()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        isVideo,
        rotation: 0,
        filter: "none",
        filterName: "Normal",
        caption: "",
        textItems: [],
      };
    });

    const timer = setTimeout(() => {
      setItems(created);
      setActiveIndex(0);
      setCaption("");
    }, 0);

    return () => {
      clearTimeout(timer);
      created.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [open, files]);

  // Synchronize canvas dimensions to preview box
  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const box = previewBoxRef.current;
    if (!canvas || !box) return;

    const rect = box.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    }
  }, []);

  useEffect(() => {
    if (open) {
      syncCanvasSize();
      window.addEventListener("resize", syncCanvasSize);
      return () => window.removeEventListener("resize", syncCanvasSize);
    }
  }, [open, activeIndex, syncCanvasSize]);

  if (!open || items.length === 0) return null;

  const currentItem = items[activeIndex] || items[0];

  // Rotate active image
  function handleRotate() {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === activeIndex
          ? { ...item, rotation: (item.rotation + 90) % 360 }
          : item
      )
    );
  }

  // Set filter for active image
  function handleSelectFilter(filterValue: string, filterName: string) {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === activeIndex ? { ...item, filter: filterValue, filterName } : item
      )
    );
    setShowFilterPicker(false);
  }

  // Set sticker
  function handleSelectSticker(sticker: string) {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === activeIndex
          ? { ...item, sticker: item.sticker === sticker ? undefined : sticker }
          : item
      )
    );
    setShowStickerPicker(false);
  }

  // ─── 1. Freehand Drawing Handlers ───
  function handleCanvasPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!showDrawMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    lastPointRef.current = { x, y };

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = drawColor;
      ctx.fill();
    }
  }

  function handleCanvasPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!showDrawMode || !isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas || !lastPointRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    lastPointRef.current = { x, y };
  }

  function handleCanvasPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!showDrawMode) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  }

  function handleClearDrawing() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  // ─── 2. Draggable Text & Delete Bin Handlers ───
  function handleAddTextItem() {
    setShowDrawMode(false);
    setShowFilterPicker(false);
    setShowStickerPicker(false);

    const newText: TextItem = {
      id: `text-${Date.now()}`,
      text: "Type text...",
      x: 0,
      y: 0,
      isEditing: true,
    };

    setItems((prev) =>
      prev.map((item, idx) =>
        idx === activeIndex
          ? { ...item, textItems: [...item.textItems, newText] }
          : item
      )
    );
  }

  function handleUpdateTextContent(textId: string, newContent: string) {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === activeIndex
          ? {
              ...item,
              textItems: item.textItems.map((t) =>
                t.id === textId ? { ...t, text: newContent } : t
              ),
            }
          : item
      )
    );
  }

  function handleFinishTextEditing(textId: string) {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === activeIndex
          ? {
              ...item,
              textItems: item.textItems
                .filter((t) => t.id !== textId || t.text.trim().length > 0)
                .map((t) => (t.id === textId ? { ...t, isEditing: false } : t)),
            }
          : item
      )
    );
  }

  function handleTextPointerDown(
    e: React.PointerEvent<HTMLDivElement>,
    item: TextItem
  ) {
    if (item.isEditing) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    setDraggedTextId(item.id);
    setIsOverTrash(false);

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      itemX: item.x,
      itemY: item.y,
    };
  }

  function handleTextPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggedTextId || !dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;

    const newX = dragStartRef.current.itemX + dx;
    const newY = dragStartRef.current.itemY + dy;

    // Check collision with bottom trash bin
    if (trashBinRef.current) {
      const trashRect = trashBinRef.current.getBoundingClientRect();
      const isOver =
        e.clientX >= trashRect.left - 15 &&
        e.clientX <= trashRect.right + 15 &&
        e.clientY >= trashRect.top - 15 &&
        e.clientY <= trashRect.bottom + 15;
      setIsOverTrash(isOver);
    }

    setItems((prev) =>
      prev.map((m, idx) =>
        idx === activeIndex
          ? {
              ...m,
              textItems: m.textItems.map((t) =>
                t.id === draggedTextId ? { ...t, x: newX, y: newY } : t
              ),
            }
          : m
      )
    );
  }

  function handleTextPointerUp(
    e: React.PointerEvent<HTMLDivElement>,
    textId: string
  ) {
    if (!draggedTextId) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (isOverTrash) {
      // Remove the item from active media item
      setItems((prev) =>
        prev.map((m, idx) =>
          idx === activeIndex
            ? { ...m, textItems: m.textItems.filter((t) => t.id !== textId) }
            : m
        )
      );
    }

    setDraggedTextId(null);
    setIsOverTrash(false);
    dragStartRef.current = null;
  }

  // Handle send
  async function handleSend() {
    if (sending) return;
    setSending(true);
    try {
      const payload = items.map((item, idx) => ({
        file: item.file,
        caption: idx === activeIndex ? caption : item.caption || caption,
        rotation: item.rotation,
        filter: item.filter,
      }));
      await onSend(payload);
      onClose();
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photos & Videos Preview"
      className="fixed inset-0 z-50 md:absolute md:inset-0 md:z-30 flex flex-col bg-background/95 text-foreground backdrop-blur-md animate-in fade-in duration-200 select-none overflow-hidden"
    >
      {/* ── 1. Top Toolbar ── */}
      <header className="relative z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/90 px-4">
        {/* Back Button (Close) */}
        <button
          type="button"
          onClick={onClose}
          title="Back"
          aria-label="Back"
          className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-5" />
        </button>

        {/* Action Tools (Rotate, Filter, Sticker, Text, Draw) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Rotate (Image only) */}
          {!currentItem.isVideo && (
            <button
              type="button"
              onClick={handleRotate}
              title="Rotate"
              aria-label="Rotate"
              className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <RotateCw className="size-5" />
            </button>
          )}

          {/* Filter */}
          {!currentItem.isVideo && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowFilterPicker(!showFilterPicker);
                  setShowStickerPicker(false);
                  setShowDrawMode(false);
                }}
                title="Filter"
                aria-label="Filter"
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer",
                  showFilterPicker && "bg-primary text-primary-foreground hover:bg-primary"
                )}
              >
                <Sliders className="size-5" />
              </button>

              {/* Filter Dropdown */}
              {showFilterPicker && (
                <div className="absolute right-0 top-12 z-50 flex w-48 flex-col rounded-xl border border-border bg-popover p-1.5 shadow-2xl animate-in zoom-in-95 duration-150">
                  <span className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Select Filter
                  </span>
                  {AVAILABLE_FILTERS.map((f) => (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => handleSelectFilter(f.value, f.name)}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2 text-sm text-popover-foreground hover:bg-muted hover:text-foreground transition-colors text-left cursor-pointer",
                        currentItem.filterName === f.name && "text-primary font-semibold"
                      )}
                    >
                      <span>{f.name}</span>
                      {currentItem.filterName === f.name && (
                        <span className="size-2 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sticker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowStickerPicker(!showStickerPicker);
                setShowFilterPicker(false);
                setShowDrawMode(false);
              }}
              title="Stickers & Emojis"
              aria-label="Stickers"
              className={cn(
                "flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer",
                showStickerPicker && "bg-primary text-primary-foreground hover:bg-primary"
              )}
            >
              <Smile className="size-5" />
            </button>

            {/* Sticker Picker */}
            {showStickerPicker && (
              <div className="absolute right-0 top-12 z-50 grid grid-cols-4 gap-2 rounded-xl border border-border bg-popover p-3 shadow-2xl animate-in zoom-in-95 duration-150 w-52">
                {AVAILABLE_STICKERS.map((stk) => (
                  <button
                    key={stk}
                    type="button"
                    onClick={() => handleSelectSticker(stk)}
                    className="flex size-10 items-center justify-center rounded-lg text-2xl hover:bg-muted transition-transform hover:scale-125 cursor-pointer"
                  >
                    {stk}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Draggable Text Tool Button */}
          <button
            type="button"
            onClick={handleAddTextItem}
            title="Add text"
            aria-label="Add text"
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <Type className="size-5" />
          </button>

          {/* Freehand Draw / Pen Tool Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowDrawMode((prev) => !prev);
                setShowFilterPicker(false);
                setShowStickerPicker(false);
              }}
              title="Draw"
              aria-label="Draw"
              className={cn(
                "flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer",
                showDrawMode && "bg-primary text-primary-foreground hover:bg-primary"
              )}
            >
              <Pencil className="size-5" />
            </button>

            {/* Draw Palette & Clear Options */}
            {showDrawMode && (
              <div className="absolute right-0 top-12 z-50 flex items-center gap-2 rounded-xl border border-border bg-popover p-2.5 shadow-2xl animate-in zoom-in-95 duration-150">
                {DRAW_PRESET_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => setDrawColor(c.hex)}
                    className={cn(
                      "size-6 rounded-full border-2 border-transparent transition-transform hover:scale-110 cursor-pointer",
                      drawColor === c.hex && "ring-2 ring-primary scale-110"
                    )}
                  />
                ))}
                <div className="h-4 w-px bg-border mx-0.5" />
                <button
                  type="button"
                  onClick={handleClearDrawing}
                  title="Clear drawing"
                  aria-label="Clear drawing"
                  className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Undo2 className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. Center Area: Large Media Preview, Canvas, & Draggable Text ── */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
        <div
          ref={previewBoxRef}
          className="relative flex max-h-[62vh] max-w-4xl items-center justify-center select-none"
        >
          {currentItem.isVideo ? (
            <video
              src={currentItem.previewUrl}
              controls
              playsInline
              className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-2xl bg-black"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentItem.previewUrl}
              alt="Media Preview"
              onLoad={syncCanvasSize}
              style={{
                transform: `rotate(${currentItem.rotation}deg)`,
                filter: currentItem.filter,
              }}
              className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-2xl transition-all duration-300"
            />
          )}

          {/* Sticker Overlay */}
          {currentItem.sticker && (
            <div className="absolute top-6 left-6 text-5xl drop-shadow-lg animate-bounce select-none pointer-events-none z-10">
              {currentItem.sticker}
            </div>
          )}

          {/* ── Freehand HTML5 Canvas Overlay ── */}
          <canvas
            ref={canvasRef}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerUp}
            className={cn(
              "absolute inset-0 size-full z-20 rounded-xl",
              showDrawMode
                ? "pointer-events-auto cursor-crosshair touch-none"
                : "pointer-events-none"
            )}
          />

          {/* ── Draggable Text Items ── */}
          {currentItem.textItems.map((textItem) => (
            <div
              key={textItem.id}
              style={{
                transform: `translate(${textItem.x}px, ${textItem.y}px)`,
              }}
              onPointerDown={(e) => handleTextPointerDown(e, textItem)}
              onPointerMove={handleTextPointerMove}
              onPointerUp={(e) => handleTextPointerUp(e, textItem.id)}
              className={cn(
                "absolute z-25 max-w-[85%] rounded-2xl px-4 py-2 text-base font-semibold text-white shadow-xl backdrop-blur-md transition-shadow select-none",
                textItem.isEditing
                  ? "bg-black/85 ring-2 ring-primary"
                  : "bg-black/60 cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-white/40",
                draggedTextId === textItem.id && "scale-105 shadow-2xl ring-2 ring-white"
              )}
            >
              {textItem.isEditing ? (
                <input
                  type="text"
                  autoFocus
                  defaultValue={textItem.text}
                  onChange={(e) => handleUpdateTextContent(textItem.id, e.target.value)}
                  onBlur={() => handleFinishTextEditing(textItem.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleFinishTextEditing(textItem.id);
                    }
                  }}
                  className="bg-transparent text-center text-white outline-none w-full min-w-[120px]"
                />
              ) : (
                <span
                  onDoubleClick={() => {
                    setItems((prev) =>
                      prev.map((m, idx) =>
                        idx === activeIndex
                          ? {
                              ...m,
                              textItems: m.textItems.map((t) =>
                                t.id === textItem.id ? { ...t, isEditing: true } : t
                              ),
                            }
                          : m
                      )
                    );
                  }}
                  className="block truncate"
                >
                  {textItem.text}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* ── Bottom Trash Bin Area (Triggered when dragging text) ── */}
        {draggedTextId && (
          <div
            ref={trashBinRef}
            className={cn(
              "absolute bottom-6 z-40 flex items-center gap-2.5 rounded-full px-6 py-3 font-semibold text-sm transition-all duration-150 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-3 select-none",
              isOverTrash
                ? "bg-destructive text-destructive-foreground border-2 border-destructive scale-110 shadow-destructive/50"
                : "bg-black/75 text-white/90 border border-white/20 scale-100"
            )}
          >
            <Trash2
              className={cn(
                "size-5 transition-transform",
                isOverTrash ? "animate-bounce text-destructive-foreground scale-125" : "text-white/70"
              )}
            />
            <span>{isOverTrash ? "Release to Delete" : "Drag here to delete"}</span>
          </div>
        )}
      </main>

      {/* ── 3. Bottom Area: Caption Input, Thumbnail Tray, & Circular Send Button ── */}
      <footer className="relative z-30 flex flex-col gap-3 border-t border-border bg-card/95 px-4 pt-3 pb-4">
        {/* Caption Input */}
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2 rounded-full bg-muted/50 px-4 py-2 border border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/40 transition-all">
          <input
            type="text"
            value={caption}
            placeholder="Type a message"
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        {/* Thumbnail Tray and Circular Send Button */}
        <div className="flex items-center justify-between gap-3 pt-1">
          {/* Thumbnails row */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {items.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "relative size-14 shrink-0 overflow-hidden rounded-lg border-2 bg-black transition-all cursor-pointer",
                  activeIndex === idx
                    ? "border-primary scale-105 shadow-md shadow-primary/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                {item.isVideo ? (
                  <video
                    src={item.previewUrl}
                    className="size-full object-cover"
                    muted
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.previewUrl}
                    alt="thumb"
                    className="size-full object-cover"
                  />
                )}
              </button>
            ))}

            {/* Add More (+) Button */}
            <button
              type="button"
              onClick={() => addInputRef.current?.click()}
              title="Add photos or videos"
              aria-label="Add photos or videos"
              className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-muted-foreground/50 text-muted-foreground hover:border-primary hover:text-primary hover:bg-muted/50 transition-all cursor-pointer"
            >
              <Plus className="size-6" />
            </button>

            <input
              ref={addInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onAddMoreFiles(Array.from(e.target.files));
                }
              }}
            />
          </div>

          {/* Circular Send Button */}
          <button
            type="button"
            disabled={sending}
            onClick={() => void handleSend()}
            title="Send"
            aria-label="Send"
            className="flex size-13 shrink-0 items-center justify-center rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {sending ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <SendHorizontal className="size-6" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}

export const MediaEditorModal = PhotosVideosPreviewDialog;
