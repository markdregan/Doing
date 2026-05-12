import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useTaskStore } from '../store/useTaskStore';
import type { Project } from '../types';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export default function ShareDialog({ open, onOpenChange, project }: ShareDialogProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const projectShares = useTaskStore(s => s.projectShares);
  const profiles = useTaskStore(s => s.profiles);
  const shareProjectByEmail = useTaskStore(s => s.shareProjectByEmail);
  const removeShare = useTaskStore(s => s.removeShare);

  const currentShares = projectShares.filter(s => s.projectId === project.id);

  const handleShare = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) return;

    setStatus('loading');
    setMessage('');

    const existing = currentShares.find(
      s => s.sharedWith && profiles.find(p => p.id === s.sharedWith)?.email === trimmed.toLowerCase()
        || s.invitedEmail === trimmed.toLowerCase()
    );
    if (existing) {
      setStatus('done');
      setMessage('Already shared with this email');
      setTimeout(() => { setStatus('idle'); setMessage(''); }, 2000);
      return;
    }

    await shareProjectByEmail(project.id, trimmed);
    setEmail('');
    setStatus('done');
    setMessage(profiles.find(p => p.email === trimmed.toLowerCase())
      ? 'Shared! They now have access.'
      : 'Invitation sent! They\'ll get an email to join.'
    );
    setTimeout(() => { setStatus('idle'); setMessage(''); }, 3000);
  };

  const activeShares = currentShares.filter(s => s.status === 'active');
  const invitedShares = currentShares.filter(s => s.status === 'invited');

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/15 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[360px] bg-white dark:bg-[#2C2C2E] rounded-xl shadow-2xl border border-gray-100 dark:border-[#38383A] focus:outline-none animate-slide-up max-md:bottom-0 max-md:top-auto max-md:left-0 max-md:right-0 max-md:w-full max-md:max-h-[85vh] max-md:rounded-b-none max-md:rounded-t-xl max-md:translate-x-0">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-sm font-bold text-gray-900 dark:text-[#F5F5F5]">
                Share &ldquo;{project.title}&rdquo;
              </Dialog.Title>
              <Dialog.Close className="text-gray-400 hover:text-gray-600 dark:hover:text-[#98989D] transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </Dialog.Close>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                autoFocus
                type="email"
                placeholder="Enter email address..."
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleShare(); }}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-[#38383A] rounded-lg outline-none focus:border-gray-300 dark:focus:border-[#48484A] bg-transparent text-gray-900 dark:text-[#F5F5F5] placeholder:text-gray-400 dark:placeholder:text-[#636366]"
              />
              <button
                onClick={handleShare}
                disabled={status === 'loading' || !email.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-[#48484A] rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Share'}
              </button>
            </div>

            {message && (
              <p className={`text-xs mb-3 ${message.includes('error') ? 'text-red-400' : 'text-green-500'}`}>
                {message}
              </p>
            )}

            {currentShares.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-[#636366] py-4 text-center">
                No one has access yet. Share with an email above.
              </p>
            ) : (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {activeShares.map(share => {
                  const profile = profiles.find(p => p.id === share.sharedWith);
                  return (
                    <div
                      key={share.id}
                      className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#252526] group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-[#1C3A5C] flex items-center justify-center text-xs font-medium text-blue-600 dark:text-[#64B5F6]">
                          {profile?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-[#E5E5E5]">
                          {profile?.displayName ?? 'Unknown'}
                        </span>
                        <span className="text-[10px] text-green-500 font-medium ml-1">Active</span>
                      </div>
                      <button
                        onClick={() => removeShare(share.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 dark:text-[#48484A] hover:text-red-400 transition-all"
                        title="Remove"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M3 3l6 6M9 3l-6 6" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
                {invitedShares.length > 0 && (
                  <>
                    <div className="pt-2 pb-1">
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.05em]">Invited</span>
                    </div>
                    {invitedShares.map(share => (
                      <div
                        key={share.id}
                        className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#252526] group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-[#3C2E1C] flex items-center justify-center text-xs font-medium text-amber-600 dark:text-amber-400">
                            {share.invitedEmail?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                          <span className="text-sm text-gray-700 dark:text-[#E5E5E5]">
                            {share.invitedEmail}
                          </span>
                          <span className="text-[10px] text-amber-500 font-medium ml-1">Invited</span>
                        </div>
                        <button
                          onClick={() => removeShare(share.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 dark:text-[#48484A] hover:text-red-400 transition-all"
                          title="Remove"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M3 3l6 6M9 3l-6 6" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
