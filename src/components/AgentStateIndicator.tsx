import type { AgentState } from '../types'

interface AgentStateIndicatorProps {
  state: AgentState
  description?: string | null
  progress?: number | null
  compact?: boolean
}

const STATE_CONFIG: Record<AgentState, { label: string; dotColor: string; bgClass: string; pulse: boolean }> = {
  idle: { label: 'Idle', dotColor: 'bg-gray-400', bgClass: 'bg-gray-50 dark:bg-gray-900/20', pulse: false },
  thinking: { label: 'Thinking', dotColor: 'bg-indigo-400', bgClass: 'bg-indigo-50 dark:bg-indigo-900/20', pulse: true },
  working: { label: 'Working', dotColor: 'bg-blue-500', bgClass: 'bg-blue-50 dark:bg-blue-900/20', pulse: true },
  needs_input: { label: 'Needs input', dotColor: 'bg-amber-500', bgClass: 'bg-amber-50 dark:bg-amber-900/20', pulse: false },
  blocked: { label: 'Blocked', dotColor: 'bg-red-500', bgClass: 'bg-red-50 dark:bg-red-900/20', pulse: false },
  completed: { label: 'Completed', dotColor: 'bg-green-500', bgClass: 'bg-green-50 dark:bg-green-900/20', pulse: false },
}

export default function AgentStateIndicator({ state, description, progress, compact }: AgentStateIndicatorProps) {
  const config = STATE_CONFIG[state] ?? STATE_CONFIG.idle

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium ${config.bgClass} px-1.5 py-0.5 rounded-full`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} ${config.pulse ? 'animate-pulse' : ''}`} />
        {config.label}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${config.dotColor} ${config.pulse ? 'animate-pulse' : ''}`} />
        <span className="text-[11px] font-medium text-gray-500 dark:text-[#98989D]">{config.label}</span>
      </div>
      {description && (
        <span className="text-[11px] text-gray-400 dark:text-[#636366] truncate max-w-[200px]">
          — {description}
        </span>
      )}
      {progress !== null && progress !== undefined && (
        <div className="flex items-center gap-1.5 ml-1">
          <div className="w-12 h-1 bg-gray-200 dark:bg-[#38383A] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 dark:text-[#636366] tabular-nums">{progress}%</span>
        </div>
      )}
    </div>
  )
}
