import * as Dialog from '@radix-ui/react-dialog';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore, type Theme } from '../store/useThemeStore';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

function SectionLabel({ text }: { text: string }) {
  return (
    <p className="text-[10px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.05em] mb-2">
      {text}
    </p>
  );
}

function Divider() {
  return <div className="h-px bg-gray-100 dark:bg-[#38383A] my-4" />;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const user = useAuthStore(s => s.user);
  const signOut = useAuthStore(s => s.signOut);
  const { theme, setTheme } = useThemeStore();

  const userName = user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Unknown';
  const userEmail = user?.email ?? '';
  const avatarUrl = user?.user_metadata?.avatar_url ?? null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/15 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[360px] bg-white dark:bg-[#2C2C2E] rounded-xl shadow-2xl border border-gray-100 dark:border-[#38383A] focus:outline-none animate-slide-up max-md:bottom-0 max-md:top-auto max-md:left-0 max-md:right-0 max-md:w-full max-md:max-h-[85vh] max-md:rounded-b-none max-md:rounded-t-xl max-md:translate-x-0 overflow-y-auto max-h-[80vh]">
          <div className="p-5">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-sm font-bold text-gray-900 dark:text-[#F5F5F5]">
                Settings
              </Dialog.Title>
              <Dialog.Close className="text-gray-400 hover:text-gray-600 dark:hover:text-[#98989D] transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </Dialog.Close>
            </div>

            <div className="mb-5">
              <SectionLabel text="Account" />
              <div className="flex items-center gap-3 py-3">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-[#1C3A5C] flex items-center justify-center text-sm font-medium text-blue-600 dark:text-[#64B5F6]">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-[#F5F5F5] truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-[#636366] truncate">
                    {userEmail}
                  </p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-[#98989D] hover:text-gray-700 dark:hover:text-[#F5F5F5] hover:bg-gray-50 dark:hover:bg-[#252526] rounded-lg transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 3.5a4 4 0 1 0 4 0" />
                  <path d="M7 1v5" />
                </svg>
                Sign Out
              </button>
            </div>

            <Divider />

            <div className="mb-4">
              <SectionLabel text="Appearance" />
              <div className="flex gap-1.5 p-1 bg-gray-50 dark:bg-[#252526] rounded-lg">
                {THEME_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      theme === opt.value
                        ? 'bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-[#F5F5F5] shadow-sm'
                        : 'text-gray-500 dark:text-[#98989D] hover:text-gray-700 dark:hover:text-[#F5F5F5]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Divider />

            <div>
              <SectionLabel text="About" />
              <div className="space-y-1">
                <p className="text-sm text-gray-900 dark:text-[#F5F5F5]">
                  Doing Task App
                </p>
                <p className="text-xs text-gray-400 dark:text-[#636366]">
                  Version 0.0.0
                </p>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
