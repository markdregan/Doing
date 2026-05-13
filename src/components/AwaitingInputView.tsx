import { useMemo } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import { PROJECT_COLOR_MAP } from '../lib/constants'
import ProgressRing from './ProgressRing'

export default function AwaitingInputView() {
  const agentQuestions = useTaskStore(s => s.agentQuestions)
  const projects = useTaskStore(s => s.projects)
  const setActiveView = useTaskStore(s => s.setActiveView)

  const pending = useMemo(
    () => agentQuestions.filter(q => q.status === 'pending'),
    [agentQuestions]
  )

  const resolved = useMemo(
    () => agentQuestions.filter(q => q.status === 'resolved').slice(0, 5),
    [agentQuestions]
  )

  const projectMap = useMemo(() => {
    const map = new Map(projects.map(p => [p.id, p]))
    return map
  }, [projects])

  if (pending.length === 0 && resolved.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
              <path d="M8 1.5a5 5 0 0 0-5 5v2c0 .7-.3 1.4-.8 1.9l-.4.4a1 1 0 0 0 .7 1.7h11a1 1 0 0 0 .7-1.7l-.4-.4a2.5 2.5 0 0 1-.8-1.9v-2a5 5 0 0 0-5-5z" />
              <path d="M6 12.5a2 2 0 0 0 4 0" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-[#F5F5F5] mb-2">Nothing needs your attention</h2>
          <p className="text-sm text-gray-400 dark:text-[#636366] leading-relaxed">
            Your agents are working. When they need a decision or more information, it will show up here.
          </p>
          <button
            onClick={() => useTaskStore.getState().setActiveView('home')}
            className="mt-6 text-sm font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
          >
            Back to Home &rarr;
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-dot-grid">
      <div className="max-w-2xl mx-auto py-12 px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
              <path d="M8 1.5a5 5 0 0 0-5 5v2c0 .7-.3 1.4-.8 1.9l-.4.4a1 1 0 0 0 .7 1.7h11a1 1 0 0 0 .7-1.7l-.4-.4a2.5 2.5 0 0 1-.8-1.9v-2a5 5 0 0 0-5-5z" />
              <path d="M6 12.5a2 2 0 0 0 4 0" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-serif font-medium text-gray-900 dark:text-[#F5F5F5]">Awaiting Input</h1>
            <p className="text-sm text-gray-400 dark:text-[#636366]">{pending.length} item{pending.length !== 1 ? 's' : ''} need your response</p>
          </div>
        </div>

        <div className="space-y-3">
          {pending.map(q => {
            const project = projectMap.get(q.projectId)
            return (
              <div
                key={q.id}
                className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 p-4 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {project ? (
                      <ProgressRing percentage={0} size={16} color={PROJECT_COLOR_MAP[project.color]} />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-[#48484A]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-medium text-gray-800 dark:text-[#E5E5EA]">
                        {project?.title ?? 'Unknown project'}
                      </span>
                      <button
                        onClick={() => setActiveView('project', q.projectId)}
                        className="text-[11px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
                      >
                        Jump to project &rarr;
                      </button>
                    </div>
                    <p className="text-[14px] text-gray-700 dark:text-[#D1D1D6] leading-snug line-clamp-2">
                      {q.question}
                    </p>
                    {q.context && (
                      <p className="text-[12px] text-gray-400 dark:text-[#636366] mt-1 leading-snug line-clamp-1">
                        {q.context}
                      </p>
                    )}
                    {q.agentRecommendation && (
                      <p className="text-[12px] text-indigo-600 dark:text-indigo-400 mt-1 flex items-start gap-1">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" className="mt-0.5 shrink-0">
                          <path d="M5 1v8M1 5h8" />
                        </svg>
                        {q.agentRecommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {resolved.length > 0 && (
          <>
            <div className="flex items-center gap-3 mt-10 mb-4">
              <span className="text-[11px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.08em]">Recently Resolved</span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-[#38383A]" />
            </div>
            <div className="space-y-2">
              {resolved.map(q => {
                const project = projectMap.get(q.projectId)
                return (
                  <div key={q.id} className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-gray-500 dark:text-[#98989D]">
                    <span className="text-green-500 font-bold text-xs">&#10003;</span>
                    <span className="text-[12px] font-medium truncate">{project?.title ?? 'Project'}</span>
                    <span className="text-[12px] truncate flex-1">{q.question}</span>
                    {q.resolvedAt && (
                      <span className="text-[10px] text-gray-400 dark:text-[#636366] shrink-0">
                        {timeAgo(q.resolvedAt)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
