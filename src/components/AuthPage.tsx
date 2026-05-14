import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

export default function AuthPage() {
  const navigate = useNavigate()
  const { user, loading, initialized, signInWithGithub } = useAuthStore()

  useEffect(() => {
    if (initialized && user) {
      navigate('/', { replace: true })
    }
  }, [user, initialized, navigate])

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1C1C1E]">
        <div className="w-5 h-5 border-2 border-gray-300 dark:border-[#48484A] border-t-gray-500 dark:border-t-[#98989D] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-[#1C1C1E] dark:via-[#151516] dark:to-[#1C1C1E]">
      <div className="w-[380px]">
        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-sm border border-gray-100 dark:border-[#38383A] p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F5F5F5]">Doing</h1>
            <p className="text-sm text-gray-400 dark:text-[#98989D] mt-2">An AI agent that executes your projects — not a chatbot</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={signInWithGithub}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 border border-gray-900 rounded-full hover:bg-gray-800 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-300 dark:text-[#636366] text-center mt-6">
          Your data is securely stored and private to you
        </p>
      </div>
    </div>
  )
}
