import { useEffect, useState } from 'react';

interface ToastProps {
  visible: boolean;
  title: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export default function Toast({ visible, title, onUndo, onDismiss }: ToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0 animate-slide-up' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-800 dark:bg-[#2C2C2E] text-white rounded-lg shadow-xl border border-gray-700 dark:border-[#38383A]">
        <span className="text-sm text-gray-200">Moved "{title}" to Trash</span>
        <button
          onClick={onUndo}
          className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          Undo
        </button>
        <button
          onClick={onDismiss}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
