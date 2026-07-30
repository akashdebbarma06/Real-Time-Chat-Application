"use client";

import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Download } from "lucide-react";

export function DownloadCapsuleButton() {
  const [isNative] = useState<boolean>(() => Capacitor.isNativePlatform());

  // Hide button inside native Android/iOS APK
  if (isNative === true) {
    return null;
  }

  return (
    <a
      href="/downloads/ChatSphere.apk"
      download="ChatSphere.apk"
      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:bg-primary/90 hover:scale-105"
    >
      <span>Download</span>
      <Download className="size-3.5" />
    </a>
  );
}
