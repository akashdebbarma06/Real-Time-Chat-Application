"use client";

import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

export type BackPriority =
  | 100 // Priority 1: Modals, Overlays, Action Sheets, Lightbox, Pickers
  | 60  // Priority 2a: Sub-views inside drawers (e.g. Group Permissions)
  | 50  // Priority 2: Drawers, In-Panel Info, Settings Sub-Panels
  | 40  // Priority 2b: Non-chat sidebar tabs on mobile
  | 25  // Priority 3: Active Conversation on mobile
  | 0;  // Priority 4: Root View

export interface BackHandler {
  id: string;
  priority: number;
  handleBack: () => boolean | void;
  pushHistory?: boolean;
}

class BackButtonManager {
  private handlers: BackHandler[] = [];
  private historyPushedStack: string[] = [];
  private isInternalPopping = false;
  private initialized = false;

  public init() {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;

    // 1. Capacitor Hardware Back Button Listener
    if (Capacitor.isNativePlatform() || (window as unknown as { Capacitor?: unknown }).Capacitor) {
      try {
        App.addListener("backButton", ({ canGoBack }) => {
          const handled = this.triggerBack();
          if (!handled) {
            if (canGoBack) {
              window.history.back();
            } else {
              App.exitApp();
            }
          }
        });
      } catch (err) {
        console.warn("[BackButtonManager] Capacitor App listener failed:", err);
      }
    }

    // 2. Browser Popstate Listener
    window.addEventListener("popstate", () => {
      if (this.isInternalPopping) {
        this.isInternalPopping = false;
        return;
      }

      const poppedId = this.historyPushedStack.pop();
      const handled = this.triggerBack();

      // If nothing handled it, allow default browser navigation
      if (!handled && poppedId) {
        // Already popped by browser
      }
    });
  }

  /**
   * Register a handler in the hierarchical stack
   */
  public register(handler: BackHandler): () => void {
    if (typeof window === "undefined") return () => {};

    // Remove existing handler with same ID
    this.unregister(handler.id, false);

    this.handlers.push(handler);
    // Sort highest priority first, then LIFO
    this.handlers.sort((a, b) => b.priority - a.priority);

    if (handler.pushHistory) {
      try {
        window.history.pushState({ aether_back_handler: handler.id }, "");
        this.historyPushedStack.push(handler.id);
      } catch {}
    }

    return () => {
      this.unregister(handler.id, true);
    };
  }

  /**
   * Unregister a handler
   */
  public unregister(id: string, syncHistory = false) {
    const idx = this.handlers.findIndex((h) => h.id === id);
    if (idx !== -1) {
      const [removed] = this.handlers.splice(idx, 1);
      if (syncHistory && removed.pushHistory) {
        const historyIdx = this.historyPushedStack.lastIndexOf(id);
        if (historyIdx !== -1) {
          this.historyPushedStack.splice(historyIdx, 1);
          if (typeof window !== "undefined") {
            this.isInternalPopping = true;
            window.history.back();
          }
        }
      }
    }
  }

  /**
   * Execute the top-most handler in the stack
   */
  public triggerBack(): boolean {
    // 1. Check explicit registered handlers
    for (let i = 0; i < this.handlers.length; i++) {
      const handler = this.handlers[i];
      try {
        const result = handler.handleBack();
        // If handleBack explicitly returns false, continue down stack; otherwise consumed
        if (result !== false) {
          return true;
        }
      } catch (err) {
        console.error(`[BackButtonManager] Error in handler ${handler.id}:`, err);
      }
    }

    // 2. Priority 1 DOM Fallback: Check if any Radix modal / dialog is open in DOM
    if (typeof document !== "undefined") {
      const openDialog = document.querySelector(
        '[role="dialog"][data-state="open"], [data-radix-portal] [role="dialog"]'
      );
      if (openDialog) {
        // Dispatch Escape key to dismiss the open modal
        const escEvent = new KeyboardEvent("keydown", {
          key: "Escape",
          code: "Escape",
          keyCode: 27,
          which: 27,
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(escEvent);
        return true;
      }
    }

    return false;
  }

  /**
   * Get current stack count for debugging/testing
   */
  public getStack(): BackHandler[] {
    return [...this.handlers];
  }

  public clear() {
    this.handlers = [];
    this.historyPushedStack = [];
    this.isInternalPopping = false;
  }
}

export const backButtonManager = new BackButtonManager();
