import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useTaskStore } from '../store/useTaskStore';

export default function InvitePage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const initialized = useAuthStore(s => s.initialized);
  const redeemInviteToken = useTaskStore(s => s.redeemInviteToken);
  const [status, setStatus] = useState<'checking' | 'signing_in' | 'redeeming' | 'done' | 'error'>('checking');
  const [errorMsg, setErrorMsg] = useState('');

  const token = window.location.hash.replace('#token=', '');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No invite link found. Check the link and try again.');
      return;
    }

    if (!initialized) return;

    if (!user) {
      setStatus('signing_in');
      sessionStorage.setItem('pendingInviteToken', token);
    } else {
      setStatus('redeeming');
      redeemInviteToken(token).then(success => {
        if (success) {
          setStatus('done');
          setTimeout(() => navigate('/', { replace: true }), 2000);
        } else {
          setStatus('error');
          setErrorMsg('This invite link is invalid or has expired.');
        }
      });
    }
  }, [token, user, initialized, redeemInviteToken, navigate]);

  const handleSignIn = () => {
    const { signInWithGithub } = useAuthStore.getState();
    signInWithGithub();
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-[#151516]">
        <div className="text-center px-6 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-[#3C1C1E] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="8" cy="8" r="6" />
              <path d="M6 6l4 4M10 6l-4 4" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-[#F5F5F5] mb-2">Invalid Invite Link</h1>
          <p className="text-sm text-gray-500 dark:text-[#98989D] mb-6">{errorMsg}</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (status === 'checking' || status === 'redeeming') {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-[#151516]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 dark:border-[#48484A] border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-[#98989D]">
            {status === 'checking' ? 'Checking your session...' : 'Redeeming your invite...'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'signing_in') {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-[#151516]">
        <div className="text-center px-6 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-[#1C3A5C] flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-blue-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v5l2.5 1.5" />
              <path d="M2 8.5l2-2 2 2" />
              <circle cx="8" cy="8" r="5.5" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-[#F5F5F5] mb-2">You're Invited!</h1>
          <p className="text-sm text-gray-500 dark:text-[#98989D] mb-2">
            Someone wants to share a project with you.
          </p>
          <p className="text-xs text-gray-400 dark:text-[#636366] mb-6">
            Sign in to see what they've shared with you.
          </p>
          <button
            onClick={handleSignIn}
            className="w-full px-5 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-[#F5F5F5] dark:text-gray-900 dark:hover:bg-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Sign in with GitHub
          </button>
        </div>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-[#151516]">
        <div className="text-center px-6 max-w-sm">
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-[#1C3E1C] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8l2.5 2.5L12 5.5" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-[#F5F5F5] mb-2">Welcome!</h1>
          <p className="text-sm text-gray-500 dark:text-[#98989D]">
            The project has been added to your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-white dark:bg-[#151516]">
      <div className="text-center px-6 max-w-sm">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-[#3C1C1E] flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="8" r="6" />
            <path d="M6 6l4 4M10 6l-4 4" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-[#F5F5F5] mb-2">Invite Error</h1>
        <p className="text-sm text-gray-500 dark:text-[#98989D] mb-6">{errorMsg}</p>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="px-5 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
