import type { TaskSource } from '../types'

interface TaskProvenanceBadgeProps {
  source: TaskSource
}

const SOURCE_CONFIG: Record<TaskSource, { label: string; bgClass: string; textClass: string }> = {
  agent: { label: 'agent', bgClass: 'bg-blue-50 dark:bg-blue-900/20', textClass: 'text-blue-500 dark:text-blue-400' },
  user: { label: '', bgClass: '', textClass: '' },
  assignment: { label: 'assigned', bgClass: 'bg-purple-50 dark:bg-purple-900/20', textClass: 'text-purple-500 dark:text-purple-400' },
  recurring: { label: 'recurring', bgClass: 'bg-green-50 dark:bg-green-900/20', textClass: 'text-green-500 dark:text-green-400' },
}

export default function TaskProvenanceBadge({ source }: TaskProvenanceBadgeProps) {
  const config = SOURCE_CONFIG[source]
  if (!config.label) return null

  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-medium ${config.bgClass} ${config.textClass} px-1 py-0.5 rounded leading-none`}>
      {source === 'agent' && (
        <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M6 1v10M1 6h10" />
          <circle cx="6" cy="6" r="5" />
        </svg>
      )}
      {source === 'recurring' && (
        <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M1.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0" />
          <path d="M1.5 3v3h3" />
        </svg>
      )}
      {source === 'assignment' && (
        <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="6" cy="4" r="2" />
          <path d="M2 10c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5" />
        </svg>
      )}
      {config.label}
    </span>
  )
}
