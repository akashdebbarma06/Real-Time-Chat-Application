/**
 * Silent toast replacement.
 * All in-app toast pop up messages (success, error, warning/info, actionable, custom, promises)
 * are completely disabled across the application.
 */

type ToastId = string | number;

type ToastHandler = (message?: unknown, data?: unknown) => ToastId;

const noopToast: ToastHandler = () => "";

export const toast = Object.assign(noopToast, {
  success: noopToast,
  error: noopToast,
  info: noopToast,
  warning: noopToast,
  message: noopToast,
  custom: noopToast,
  loading: noopToast,
  action: noopToast,
  promise: <T>(promise: Promise<T> | (() => Promise<T>), _data?: unknown): Promise<T> => {
    return typeof promise === "function" ? promise() : promise;
  },
  dismiss: (_id?: ToastId) => {},
});

export default toast;
