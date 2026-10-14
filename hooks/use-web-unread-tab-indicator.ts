"use client";

export {
  useUnreadTabIndicator,
  useWebUnreadTabIndicator,
} from "@/features/notifications/UnreadTabIndicator.shared";
export type {
  UnreadTabIndicatorOptions,
  UseUnreadTabIndicator,
} from "@/features/notifications/UnreadTabIndicator.types";
export { isDesktopWeb } from "@/lib/platform/Platform.utils";
