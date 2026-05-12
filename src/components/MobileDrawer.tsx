import { useEffect, useRef } from 'react';
import { SidebarContent } from './Sidebar';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  onSearchOpen: () => void;
}

export default function MobileDrawer({ open, onClose, onSearchOpen }: MobileDrawerProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 md:hidden ${
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div
        className={`absolute left-0 top-0 bottom-0 w-[260px] bg-white dark:bg-[#151516] border-r border-gray-100 dark:border-[#2C2C2E] flex flex-col transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onSearchOpen={() => { onSearchOpen(); onClose(); }} />
      </div>
    </div>
  );
}
