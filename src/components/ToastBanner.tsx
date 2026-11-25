import React, { useEffect, useState } from 'react';

interface ToastBannerProps {
  message: string;
  visible: boolean;
  onClose?: () => void;
  pulse?: boolean;
}

export const ToastBanner: React.FC<ToastBannerProps> = ({
  message,
  visible,
  onClose,
  pulse = false,
}) => {
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (timer) clearTimeout(timer);
    const id = setTimeout(() => {
      onClose?.();
    }, 2400);
    setTimer(id);
    return () => clearTimeout(id);
  }, [visible, timer, onClose]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div className={`flex items-center gap-3 rounded-lg border border-terracotta/30 bg-white/95 backdrop-blur px-5 py-3.5 shadow-xl shadow-terracotta/10 text-sm font-medium text-ink transition-opacity ${pulse ? 'animate-pulse' : ''}`}>
        <span className="h-5 w-5 rounded-full bg-terracotta text-white flex items-center justify-center text-[10px] font-bold">
          !
        </span>
        <span>{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-3 shrink-0 rounded-md p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-900 focus:outline-2 focus:outline-offset-1 focus:outline-terracotta"
          aria-label="Dismiss"
        >
          <span className="sr-only">Dismiss</span>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
