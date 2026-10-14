export interface UnreadTabIndicatorOptions {
  totalUnread: number;
  onReconcile?: () => void;
}

export type UseUnreadTabIndicator = (
  totalUnread: number,
  onReconcile?: () => void
) => void;
