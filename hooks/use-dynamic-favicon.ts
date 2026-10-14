"use client";

import { useEffect } from "react";

export interface DynamicFaviconConfig {
  stops?: [string, string, string];
  fillColor?: string;
  dotColor?: string;
  badgeCount?: number;
}

let currentBadgeCount = 0;
let lastFaviconConfig: DynamicFaviconConfig | string = "#00A884";

export function generateFaviconSvgUrl(configOrHex: string | DynamicFaviconConfig): string {
  let fillAttr = "";
  let defs = "";
  let dotFill = "#00A884";
  let badgeCount = 0;

  if (typeof configOrHex === "string") {
    fillAttr = `fill="${configOrHex}"`;
    dotFill = configOrHex;
    badgeCount = currentBadgeCount;
  } else if (configOrHex.stops) {
    const [c1, c2, c3] = configOrHex.stops;
    defs = `
  <defs>
    <linearGradient id="favGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="50%" stop-color="${c2}" />
      <stop offset="100%" stop-color="${c3}" />
    </linearGradient>
  </defs>`;
    fillAttr = `fill="url(#favGrad)"`;
    dotFill = configOrHex.dotColor || c1;
    badgeCount = configOrHex.badgeCount !== undefined ? configOrHex.badgeCount : currentBadgeCount;
  } else if (configOrHex.fillColor) {
    fillAttr = `fill="${configOrHex.fillColor}"`;
    dotFill = configOrHex.dotColor || configOrHex.fillColor;
    badgeCount = configOrHex.badgeCount !== undefined ? configOrHex.badgeCount : currentBadgeCount;
  }

  // If badgeCount > 0, render a notification badge in the top-right corner
  let badgeSvg = "";
  if (badgeCount > 0) {
    badgeSvg = `\n  <circle cx="102" cy="26" r="18" fill="#EF4444" stroke="#FFFFFF" stroke-width="4"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">${defs}
  <rect width="128" height="128" rx="36" ${fillAttr}/>
  <path d="M34 38C34 29.1634 41.1634 22 50 22H78C86.8366 22 94 29.1634 94 38V64C94 72.8366 86.8366 80 78 80H54.5L38.8 91.8C37.2 92.9 34 91.8 34 89.5V80C34 80 34 80 34 80V38Z" fill="#FFFFFF"/>
  <circle cx="51" cy="51" r="5" fill="${dotFill}"/>
  <circle cx="64" cy="51" r="5" fill="${dotFill}"/>
  <circle cx="77" cy="51" r="5" fill="${dotFill}"/>${badgeSvg}
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function setFaviconBadgeCount(count: number) {
  currentBadgeCount = Math.max(0, count);
  updateFavicon(lastFaviconConfig);
}

export function getFaviconBadgeCount(): number {
  return currentBadgeCount;
}

export function updateFavicon(configOrHex: string | DynamicFaviconConfig) {
  if (typeof document === "undefined" || !configOrHex) return;

  lastFaviconConfig = configOrHex;
  const configWithBadge: DynamicFaviconConfig =
    typeof configOrHex === "string"
      ? { fillColor: configOrHex, badgeCount: currentBadgeCount }
      : { ...configOrHex, badgeCount: configOrHex.badgeCount !== undefined ? configOrHex.badgeCount : currentBadgeCount };

  const faviconUrl = generateFaviconSvgUrl(configWithBadge);

  const selectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
  ];
  let found = false;

  selectors.forEach((selector) => {
    const link = document.querySelector<HTMLLinkElement>(selector);
    if (link) {
      link.type = "image/svg+xml";
      link.href = faviconUrl;
      found = true;
    }
  });

  if (!found) {
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = faviconUrl;
    document.head.appendChild(link);
  }

  // Update theme-color meta tag if present
  const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (themeMeta) {
    if (typeof configOrHex === "string") {
      themeMeta.content = configOrHex;
    } else if (configOrHex.fillColor) {
      themeMeta.content = configOrHex.fillColor;
    } else if (configOrHex.stops?.[0]) {
      themeMeta.content = configOrHex.stops[0];
    }
  }
}

export function useDynamicFavicon(activeConfig?: string | DynamicFaviconConfig) {
  const serialized = typeof activeConfig === "string" ? activeConfig : JSON.stringify(activeConfig);
  useEffect(() => {
    if (!activeConfig) return;
    updateFavicon(activeConfig);
  }, [activeConfig, serialized]);
}
