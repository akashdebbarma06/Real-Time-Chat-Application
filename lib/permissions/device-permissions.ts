/**
 * Device & Browser Permissions System
 * Provides unified queries, requests, state persistence, and native/PWA fallbacks.
 */

export type PermissionId =
  | "notifications"
  | "camera"
  | "microphone"
  | "location"
  | "nearby"
  | "contacts"
  | "storage"
  | "phone";

export type PermissionStatusValue = "granted" | "denied" | "prompt" | "unsupported";

export interface PermissionItemConfig {
  id: PermissionId;
  name: string;
  category: "essential" | "media" | "hardware" | "communication";
  description: string;
  rationale: string;
  supportCheck: () => boolean;
}

export const PERMISSION_CONFIGS: PermissionItemConfig[] = [
  {
    id: "notifications",
    name: "Notifications",
    category: "essential",
    description: "Receive push alerts for incoming messages and call rings.",
    rationale: "Ensures you never miss critical messages or calls even when Aether Chat is in the background.",
    supportCheck: () => typeof window !== "undefined" && "Notification" in window,
  },
  {
    id: "microphone",
    name: "Microphone",
    category: "essential",
    description: "Record voice notes and make crystal-clear audio calls.",
    rationale: "Required for sending voice messages and participating in voice/video calls.",
    supportCheck: () =>
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function",
  },
  {
    id: "camera",
    name: "Camera",
    category: "media",
    description: "Capture instant photos, record video notes, and video call.",
    rationale: "Used for live photo capture, profile pictures, and two-way video calls.",
    supportCheck: () =>
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function",
  },
  {
    id: "location",
    name: "Location",
    category: "hardware",
    description: "Share live locations, meeting spots, and venues in chat.",
    rationale: "Enables precise geolocation sharing only when you choose to send your pin.",
    supportCheck: () => typeof navigator !== "undefined" && "geolocation" in navigator,
  },
  {
    id: "nearby",
    name: "Nearby Devices",
    category: "hardware",
    description: "Connect Bluetooth accessories, headsets, and proximity sharing.",
    rationale: "Allows low-latency headset audio routing and local offline device sync.",
    supportCheck: () =>
      typeof navigator !== "undefined" &&
      ("bluetooth" in navigator || "hid" in navigator || "NDEFReader" in (window as unknown as Record<string, unknown>)),
  },
  {
    id: "contacts",
    name: "Contacts",
    category: "communication",
    description: "Quickly discover friends and pick contacts from your address book.",
    rationale: "Uses the native Contacts Picker API to invite friends without uploading your entire address book.",
    supportCheck: () =>
      typeof navigator !== "undefined" &&
      "contacts" in navigator &&
      "ContactsManager" in (window as unknown as Record<string, unknown>),
  },
  {
    id: "storage",
    name: "Internal Media & Files",
    category: "media",
    description: "Select and store images, documents, and attachments directly.",
    rationale: "Grants device filesystem access for selecting attachments and caching offline media.",
    supportCheck: () => typeof window !== "undefined",
  },
  {
    id: "phone",
    name: "Phone & Dialer",
    category: "communication",
    description: "Launch direct cellular calls and telephony dialer intents.",
    rationale: "Triggers native phone dialer intents (tel:) for contacts with registered phone numbers.",
    supportCheck: () => typeof window !== "undefined",
  },
];

const STORAGE_KEY = "aether_device_permissions_v1";
const PROMPTED_KEY = "aether_permissions_modal_dismissed";
const BANNER_SNOOZE_KEY = "aether_permissions_banner_snoozed";

/**
 * Retrieve cached permission states from localStorage
 */
export function getStoredPermissionStates(): Record<PermissionId, PermissionStatusValue> {
  if (typeof window === "undefined") {
    return {
      notifications: "prompt",
      camera: "prompt",
      microphone: "prompt",
      location: "prompt",
      nearby: "prompt",
      contacts: "prompt",
      storage: "prompt",
      phone: "prompt",
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  return {
    notifications: "prompt",
    camera: "prompt",
    microphone: "prompt",
    location: "prompt",
    nearby: "prompt",
    contacts: "prompt",
    storage: "prompt",
    phone: "prompt",
  };
}

/**
 * Save permission states to localStorage
 */
export function savePermissionState(id: PermissionId, status: PermissionStatusValue): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredPermissionStates();
    current[id] = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent("aether-permission-change", { detail: { id, status } }));
  } catch {}
}

/**
 * Query current live permission status from browser API where supported
 */
export async function queryPermissionStatus(id: PermissionId): Promise<PermissionStatusValue> {
  if (typeof window === "undefined") return "prompt";

  const config = PERMISSION_CONFIGS.find((c) => c.id === id);
  if (config && !config.supportCheck()) {
    return "unsupported";
  }

  try {
    // 1. Notifications
    if (id === "notifications" && "Notification" in window) {
      const perm = Notification.permission;
      if (perm === "granted") return "granted";
      if (perm === "denied") return "denied";
      return "prompt";
    }

    // 2. Permissions API query if supported
    if ("permissions" in navigator && typeof navigator.permissions?.query === "function") {
      let queryName: PermissionName | null = null;
      if (id === "location") queryName = "geolocation" as PermissionName;
      if (id === "notifications") queryName = "notifications" as PermissionName;
      if (id === "camera") queryName = "camera" as PermissionName;
      if (id === "microphone") queryName = "microphone" as PermissionName;

      if (queryName) {
        try {
          const res = await navigator.permissions.query({ name: queryName });
          if (res.state === "granted" || res.state === "denied" || res.state === "prompt") {
            return res.state;
          }
        } catch {}
      }
    }
  } catch {}

  // Fallback to cached state
  const cached = getStoredPermissionStates();
  return cached[id] || "prompt";
}

/**
 * Request an individual permission using standard browser APIs
 */
export async function requestDevicePermission(id: PermissionId): Promise<{
  status: PermissionStatusValue;
  error?: string;
  data?: unknown;
}> {
  if (typeof window === "undefined") {
    return { status: "unsupported", error: "Not in browser environment" };
  }

  try {
    switch (id) {
      case "notifications": {
        if (!("Notification" in window)) {
          savePermissionState(id, "unsupported");
          return { status: "unsupported", error: "Notifications not supported by this browser" };
        }
        const result = await Notification.requestPermission();
        const status = result === "granted" ? "granted" : result === "denied" ? "denied" : "prompt";
        savePermissionState(id, status);
        return { status };
      }

      case "camera": {
        if (!navigator.mediaDevices?.getUserMedia) {
          savePermissionState(id, "unsupported");
          return { status: "unsupported", error: "Camera API not supported" };
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach((track) => track.stop());
          savePermissionState(id, "granted");
          return { status: "granted" };
        } catch (err: unknown) {
          const isDenied = err instanceof Error && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
          const status = isDenied ? "denied" : "prompt";
          savePermissionState(id, status);
          return { status, error: err instanceof Error ? err.message : "Camera access denied" };
        }
      }

      case "microphone": {
        if (!navigator.mediaDevices?.getUserMedia) {
          savePermissionState(id, "unsupported");
          return { status: "unsupported", error: "Microphone API not supported" };
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
          savePermissionState(id, "granted");
          return { status: "granted" };
        } catch (err: unknown) {
          const isDenied = err instanceof Error && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
          const status = isDenied ? "denied" : "prompt";
          savePermissionState(id, status);
          return { status, error: err instanceof Error ? err.message : "Microphone access denied" };
        }
      }

      case "location": {
        if (!("geolocation" in navigator)) {
          savePermissionState(id, "unsupported");
          return { status: "unsupported", error: "Geolocation not supported" };
        }
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              savePermissionState(id, "granted");
              resolve({ status: "granted" });
            },
            (err) => {
              const status = err.code === err.PERMISSION_DENIED ? "denied" : "prompt";
              savePermissionState(id, status);
              resolve({ status, error: err.message });
            },
            { timeout: 8000 }
          );
        });
      }

      case "nearby": {
        // Web Bluetooth or WebHID / WebNFC
        const nav = navigator as unknown as {
          bluetooth?: { requestDevice: (options: unknown) => Promise<unknown> };
          hid?: { requestDevice: (options: unknown) => Promise<unknown> };
        };

        if (nav.bluetooth && typeof nav.bluetooth.requestDevice === "function") {
          try {
            const device = await nav.bluetooth.requestDevice({ acceptAllDevices: true });
            savePermissionState(id, "granted");
            return { status: "granted", data: device };
          } catch (err: unknown) {
            const isDenied = err instanceof Error && err.name === "NotAllowedError";
            const status = isDenied ? "denied" : "prompt";
            savePermissionState(id, status);
            return { status, error: err instanceof Error ? err.message : "Bluetooth request cancelled" };
          }
        } else if (nav.hid && typeof nav.hid.requestDevice === "function") {
          try {
            const devices = await nav.hid.requestDevice({ filters: [] });
            savePermissionState(id, "granted");
            return { status: "granted", data: devices };
          } catch {
            savePermissionState(id, "prompt");
            return { status: "prompt", error: "HID picker dismissed" };
          }
        }

        savePermissionState(id, "unsupported");
        return {
          status: "unsupported",
          error: "Nearby device APIs (Web Bluetooth / WebHID) are not enabled in this browser. Use Chrome/Edge or enable flags.",
        };
      }

      case "contacts": {
        // Contacts Picker API where supported (Chrome Android / PWA)
        const nav = navigator as unknown as {
          contacts?: {
            select: (properties: string[], options?: { multiple?: boolean }) => Promise<unknown[]>;
            getProperties: () => Promise<string[]>;
          };
        };

        if (nav.contacts && typeof nav.contacts.select === "function") {
          try {
            const contacts = await nav.contacts.select(["name", "tel", "email"], { multiple: true });
            savePermissionState(id, "granted");
            return { status: "granted", data: contacts };
          } catch (err: unknown) {
            savePermissionState(id, "prompt");
            return { status: "prompt", error: err instanceof Error ? err.message : "Contact picker cancelled" };
          }
        }

        // Informative fallback for browsers lacking Contacts Picker API
        savePermissionState(id, "unsupported");
        return {
          status: "unsupported",
          error: "Contacts Picker API is supported in Chrome Android & Chromium PWAs. Desktop browsers use manual search or vCard import.",
        };
      }

      case "storage": {
        // File System Access API or HTML5 File fallback
        const win = window as unknown as {
          showOpenFilePicker?: (options?: unknown) => Promise<unknown[]>;
        };

        if (typeof win.showOpenFilePicker === "function") {
          try {
            const handles = await win.showOpenFilePicker({
              multiple: false,
              types: [
                {
                  description: "Media and Documents",
                  accept: {
                    "image/*": [".png", ".jpg", ".jpeg", ".webp"],
                    "video/*": [".mp4", ".webm"],
                    "application/pdf": [".pdf"],
                  },
                },
              ],
            });
            savePermissionState(id, "granted");
            return { status: "granted", data: handles };
          } catch {
            savePermissionState(id, "prompt");
            return { status: "prompt", error: "File picker cancelled" };
          }
        }

        // HTML5 File input fallback
        savePermissionState(id, "granted");
        return { status: "granted", data: "HTML5 file input active" };
      }

      case "phone": {
        // Phone / Dialer Intent
        // Browser sandboxes do not expose direct call-log reading, but tel: triggers dialer
        const hasMobileBridge =
          typeof window !== "undefined" &&
          (Boolean((window as unknown as Record<string, unknown>).Capacitor) ||
            Boolean((window as unknown as Record<string, unknown>).AndroidBridge));

        savePermissionState(id, "granted");
        return {
          status: "granted",
          data: hasMobileBridge
            ? "Hybrid mobile container detected (Capacitor/Android bridge)"
            : "Browser tel: dialer intents enabled",
        };
      }

      default:
        return { status: "prompt" };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Permission request failed";
    savePermissionState(id, "denied");
    return { status: "denied", error: message };
  }
}

/**
 * Sequential batch runner for first visit / setup modal flow
 */
export async function runSequentialPermissionWizard(
  onProgress?: (step: PermissionId, status: PermissionStatusValue, index: number, total: number) => void
): Promise<Record<PermissionId, PermissionStatusValue>> {
  const sequence: PermissionId[] = [
    "notifications",
    "microphone",
    "camera",
    "location",
    "nearby",
  ];

  const results: Record<PermissionId, PermissionStatusValue> = getStoredPermissionStates();

  for (let i = 0; i < sequence.length; i++) {
    const id = sequence[i];
    onProgress?.(id, "prompt", i, sequence.length);

    try {
      const res = await requestDevicePermission(id);
      results[id] = res.status;
      onProgress?.(id, res.status, i, sequence.length);
    } catch {
      results[id] = "prompt";
      onProgress?.(id, "prompt", i, sequence.length);
    }

    // Brief pause between native modal prompts for smooth UX
    await new Promise((r) => setTimeout(r, 250));
  }

  markInitialPermissionsPrompted();
  return results;
}

/**
 * Helper to trigger tel: dialer intent
 */
export function launchPhoneDialer(phoneNumber: string): void {
  if (typeof window === "undefined") return;
  const clean = phoneNumber.replace(/[^0-9+*#]/g, "");
  window.location.href = `tel:${clean}`;
}

/**
 * Modal dismissed tracking
 */
export function hasPromptedInitialPermissions(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(PROMPTED_KEY) === "true";
}

export function markInitialPermissionsPrompted(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROMPTED_KEY, "true");
}

export function resetInitialPermissionsPrompt(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROMPTED_KEY);
}

/**
 * Banner snooze tracking
 */
export function isBannerSnoozed(): boolean {
  if (typeof window === "undefined") return false;
  const val = sessionStorage.getItem(BANNER_SNOOZE_KEY);
  return val === "true";
}

export function snoozeBanner(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(BANNER_SNOOZE_KEY, "true");
}
