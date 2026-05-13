import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useTaskStore } from '../store/useTaskStore'
import { useAIStudioStore } from '../store/useAIStudioStore'
import { logger } from '../lib/logger'

const log = logger.child({ module: 'ProtectedRoute' })

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAuthStore()
  const { initialize, dataLoading, redeemInviteToken } = useTaskStore()
  const loadConversations = useAIStudioStore(s => s.loadConversations)

  useEffect(() => {
    log.info('auth_guard_state', { initialized, loading, hasUser: !!user })

    if (initialized && user) {
      const pendingToken = sessionStorage.getItem('pendingInviteToken')
      if (pendingToken) {
        sessionStorage.removeItem('pendingInviteToken')
        log.info('redeeming_invite_token')
        redeemInviteToken(pendingToken)
      }
      log.info('initializing_task_store', { userId: user.id })
      initialize(user.id)
      loadConversations()
    }
  }, [user, initialized, initialize, redeemInviteToken, loadConversations])

  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-[#1D1D1F]">
        <div className="w-5 h-5 border-2 border-gray-300 dark:border-[#48484A] border-t-gray-500 dark:border-t-[#98989D] rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-[#1D1D1F]">
        <div className="w-5 h-5 border-2 border-gray-300 dark:border-[#48484A] border-t-gray-500 dark:border-t-[#98989D] rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
