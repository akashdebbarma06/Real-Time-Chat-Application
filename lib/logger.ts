export function logServerError(error: unknown, context?: string) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : JSON.stringify(error, null, 2);

  console.error(
    `[Server Error]${context ? ` ${context}` : ""}: ${message}`,
    error,
  );
}
