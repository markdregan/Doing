import { PROJECT_COLOR_MAP } from '../lib/constants'
import type { PlanDraft } from '../types'

interface PlanCardProps {
  draft: PlanDraft
  isLatest: boolean
  onApprove?: () => void
  onExcludeTask?: (index: number) => void
  excludedIndices?: number[]
  sending?: boolean
  readOnly?: boolean
}

function getDueLabel(dateStr?: string): string | null {
  if (!dateStr) return null
  const today = new Date().toISOString().slice(0, 10)
  if (dateStr === today) return 'Today'
  return dateStr
}

export default function PlanCard({
  draft, isLatest, onApprove, onExcludeTask, excludedIndices, sending, readOnly,
}: PlanCardProps) {
  return (
    <div className={`border rounded-xl transition-all duration-200 ${
      readOnly
        ? 'border-gray-100 dark:border-[#38383A] bg-white dark:bg-[#1C1C1E]'
        : isLatest
          ? 'border-indigo-200 dark:border-indigo-800 bg-white dark:bg-[#1C1C1E] shadow-sm'
          : 'border-gray-100 dark:border-[#38383A] bg-gray-50/50 dark:bg-[#1C1C1E]/50'
    }`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isLatest && (
              <span className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded">
                Latest
              </span>
            )}
            {readOnly && (
              <span className="text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                Created
              </span>
            )}
          </div>
          <span className="text-[11px] text-gray-400 dark:text-[#636366]">
            {draft.tasks.length} tasks
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: PROJECT_COLOR_MAP[draft.projectColor] ?? '#8E8E93' }}
          />
          <span className="text-[13px] font-semibold text-gray-800 dark:text-[#E5E5EA]">
            {draft.projectTitle}
          </span>
        </div>

        <div className="space-y-0.5">
          {draft.tasks.map((task, i) => {
            const excluded = excludedIndices?.includes(i) ?? false
            return (
              <div
                key={i}
                className={`flex items-center gap-2 py-1.5 px-2 rounded-lg transition-all ${
                  readOnly
                    ? ''
                    : excluded
                      ? 'opacity-40'
                      : 'hover:bg-gray-50 dark:hover:bg-[#252526]'
                }`}
              >
                {readOnly ? (
                  <span
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 border-gray-200 dark:border-[#48484A] bg-gray-50 dark:bg-[#252526]`}
                  >
                    <svg className="w-2 h-2 text-gray-400 dark:text-[#636366]" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </span>
                ) : (
                  <button
                    onClick={() => onExcludeTask?.(i)}
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                      excluded
                        ? 'bg-gray-200 dark:bg-[#38383A] border-gray-300 dark:border-[#48484A]'
                        : 'border-gray-300 dark:border-[#48484A] hover:border-indigo-400'
                    }`}
                  >
                    {excluded && (
                      <svg className="w-2 h-2 text-gray-400" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M2 2l6 6M8 2l-6 6" />
                      </svg>
                    )}
                  </button>
                )}

                <span
                  className={`flex-1 text-[13px] leading-snug transition-colors ${
                    excluded
                      ? 'line-through text-gray-300 dark:text-[#48484A]'
                      : 'text-gray-800 dark:text-[#E5E5EA]'
                  }`}
                >
                  {task.title}
                </span>

                {getDueLabel(task.dueDate) && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md text-gray-400 dark:text-[#636366] bg-gray-50 dark:bg-[#252526]">
                    {getDueLabel(task.dueDate)}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {!readOnly && isLatest && (
          <div className="flex items-center justify-end mt-4 pt-3 border-t border-gray-100 dark:border-[#38383A]">
            <button
              onClick={onApprove}
              disabled={sending}
              className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${
                sending
                  ? 'bg-gray-100 dark:bg-[#252526] text-gray-300 dark:text-[#636366] cursor-not-allowed'
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
              }`}
            >
              {sending ? 'Creating...' : 'Approve & Create'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
