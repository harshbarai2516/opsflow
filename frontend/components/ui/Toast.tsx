"use client";

export type ToastType =
  | "success"
  | "error"
  | "warning"
  | "info";

export interface ToastData {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastProps {
  toast: ToastData;
  onClose: () => void;
}

export default function Toast({
  toast,
  onClose,
}: ToastProps) {
  const config = {
    success: {
      icon: "✓",
      iconClass: "bg-emerald-100 text-emerald-700",
      titleClass: "text-emerald-950",
      barClass: "bg-emerald-500",
    },

    error: {
      icon: "!",
      iconClass: "bg-red-100 text-red-700",
      titleClass: "text-red-950",
      barClass: "bg-red-500",
    },

    warning: {
      icon: "!",
      iconClass: "bg-amber-100 text-amber-700",
      titleClass: "text-amber-950",
      barClass: "bg-amber-500",
    },

    info: {
      icon: "i",
      iconClass: "bg-blue-100 text-blue-700",
      titleClass: "text-blue-950",
      barClass: "bg-blue-500",
    },
  }[toast.type];

  return (
    <div
      role="alert"
      className="pointer-events-auto w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
    >
      <div className="flex gap-3 p-4">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${config.iconClass}`}
        >
          {config.icon}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-semibold ${config.titleClass}`}
          >
            {toast.title}
          </p>

          {toast.message && (
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {toast.message}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
        >
          ×
        </button>
      </div>

      <div className={`h-0.5 ${config.barClass}`} />
    </div>
  );
}