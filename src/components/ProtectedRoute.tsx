import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useTaskStore } from '../store/useTaskStore'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAuthStore()
  const { initialize, dataLoading } = useTaskStore()

  useEffect(() => {
    if (initialized && user) {
      initialize(user.id)
    }
  }, [user, initialized, initialize])

  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
