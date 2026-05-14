import type { AgentQuestion } from '../types'

interface InlineTaskQuestionProps {
  question: AgentQuestion
  onRespond: (questionId: string, response: string) => void
}

export default function InlineTaskQuestion({ question, onRespond }: InlineTaskQuestionProps) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/40 p-4 animate-expand-in">
      <div className="flex items-start gap-3">
        <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-[11px] text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
          ?
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-[0.06em] mb-1">
            Agent needs your input
          </p>
          <p className="text-[13px] text-gray-800 dark:text-[#E5E5EA] leading-snug mb-3">
            {question.question}
          </p>
          {question.context && (
            <p className="text-[11px] text-gray-400 dark:text-[#636366] mb-3 italic">
              {question.context}
            </p>
          )}
          {question.options.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => onRespond(question.id, opt.value)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white dark:bg-[#2C2C2E] border border-amber-200 dark:border-amber-800/40 text-gray-700 dark:text-[#D1D1D6] hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all active:scale-95"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
