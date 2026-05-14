import { useState, useCallback, useMemo } from 'react'
import PlanCard from './PlanCard'
import ChatBar from './ChatBar'
import InlineQuestionCard from './InlineQuestionCard'
import PlanApprovalAnimation from './PlanApprovalAnimation'
import type { AgentConversation, AgentMessage, PlanDraft, ChatAttachment } from '../types'

interface PlanningViewProps {
  conv: AgentConversation
  messages: AgentMessage[]
  planDraft?: PlanDraft
  sending: boolean
  error: string | null
  excludedIndices: number[]
  onSend: (text: string, attachments?: ChatAttachment[]) => void
  onBack: () => void
  onExcludeTask: (index: number) => void
  onApprove: () => void
  isLatestDraft: boolean
  showDraft: boolean
}

const THINKING_STEPS = [
  'Understanding your goal...',
  'Identifying key milestones...',
  'Structuring the project...',
  'Organizing tasks...',
]

export default function PlanningView({
  conv,
  messages,
  planDraft,
  sending,
  error,
  excludedIndices,
  onSend,
  onBack,
  onExcludeTask,
  onApprove,
  isLatestDraft,
  showDraft,
}: PlanningViewProps) {
  const [approvalState, setApprovalState] = useState<'idle' | 'approving'>('idle')
  const [stepIndex] = useState(0)

  // If we have messages, derive a rough progress step for the thinking animation
  const activeStep = useMemo(() => {
    if (!planDraft && messages.length > 0) {
      return Math.min(Math.floor(messages.length / 3), THINKING_STEPS.length - 1)
    }
    return stepIndex
  }, [planDraft, messages.length, stepIndex])

  const hasPlan = showDraft && !!planDraft

  // Detect agent question messages (messages that need user response)
  const agentQuestionMessages = useMemo(() => {
    return messages.filter(
      m => m.role === 'agent' && m.metadata?.needsResponse && (m.metadata?.options ?? []).length > 0
    )
  }, [messages])

  // Check if the last message is an unanswered question from the agent
  const lastMessage = messages[messages.length - 1]
  const isPendingQuestion = lastMessage?.role === 'agent' && lastMessage?.metadata?.needsResponse

  // Show thinking only when actively generating, not when awaiting user response
  const isThinking = sending && !isPendingQuestion

  // Agent messages excluding questions, initial user goal, and empty messages
  const agentMessages = useMemo(() => {
    return messages.filter(
      m => m.role === 'agent'
        && m.content.trim().length > 0
        && !m.metadata?.needsResponse
    )
  }, [messages])

  // All user messages
  const userMessages = useMemo(() => {
    return messages.filter(m => m.role === 'user')
  }, [messages])

  const handleApprove = useCallback(() => {
    setApprovalState('approving')
    // Allow the animation to play before navigating
    setTimeout(() => {
      onApprove()
    }, 1200)
  }, [onApprove])

  // --- RENDER ---

  if (approvalState === 'approving') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden animate-slide-up bg-dot-grid">
        <div className="flex-1 flex items-center justify-center">
          <PlanApprovalAnimation
            projectTitle={conv.goalText.slice(0, 60)}
            taskCount={planDraft?.tasks.length ?? 0}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-slide-up bg-dot-grid">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-3 border-b border-gray-100 dark:border-[#38383A] shrink-0 bg-white dark:bg-[#1D1D1F]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-[#636366] hover:text-gray-600 dark:hover:text-[#98989D] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3L5 7l4 4" />
          </svg>
          Back
        </button>
        <span className="text-[11px] text-gray-300 dark:text-[#48484A] font-medium italic truncate max-w-[60%] text-center">
          {conv.goalText.slice(0, 60)}
        </span>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-[680px] mx-auto space-y-6">

          {/* Goal card */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-gray-100 dark:border-[#38383A] p-4 animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-indigo-500">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.06em] mb-1">
                  Your Goal
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-[#E5E5EA] leading-snug">
                  {conv.goalText}
                </p>
              </div>
            </div>
          </div>

          {/* Agent questions — shown when agent asks clarifying questions */}
          {agentQuestionMessages.length > 0 && (
            <div className="space-y-3">
              {agentQuestionMessages.map((msg, i) => (
                <InlineQuestionCard
                  key={msg.id || i}
                  message={msg}
                  onRespond={(response) => onSend(response)}
                  disabled={sending}
                />
              ))}
            </div>
          )}

          {/* User responses to questions — shown compactly after questions */}
          {userMessages.length > 1 && agentQuestionMessages.length > 0 && !hasPlan && (
            <div className="space-y-1.5">
              {userMessages.slice(1).map((msg, i) => (
                <div key={msg.id || i} className="flex justify-end">
                  <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl rounded-br-md px-3.5 py-2 max-w-[70%]">
                    <p className="text-[12px] text-indigo-600 dark:text-indigo-400 leading-snug">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Thinking state — shown while agent is working (not when awaiting user response) */}
          {isThinking && !hasPlan && (
            <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-gray-100 dark:border-[#38383A] p-5 animate-scale-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-[#D1D1D6]">
                  Agent is planning
                </span>
              </div>

              <div className="space-y-2.5">
                {THINKING_STEPS.map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                      i <= activeStep
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500'
                        : 'bg-gray-50 dark:bg-[#252526] text-gray-300 dark:text-[#48484A]'
                    }`}>
                      {i < activeStep ? (
                        <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      )}
                    </span>
                    <span className={`text-[13px] transition-colors duration-500 ${
                      i <= activeStep
                        ? 'text-gray-700 dark:text-[#D1D1D6]'
                        : 'text-gray-300 dark:text-[#48484A]'
                    }`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plan preview card */}
          {hasPlan && planDraft && (
            <div className="animate-scale-in">
              <PlanCard
                draft={planDraft}
                isLatest={isLatestDraft}
                onApprove={isLatestDraft ? handleApprove : undefined}
                onExcludeTask={isLatestDraft ? onExcludeTask : undefined}
                excludedIndices={isLatestDraft ? excludedIndices : undefined}
                sending={sending}
                readOnly={!isLatestDraft}
              />
            </div>
          )}

          {/* Compact agent message log */}
          {hasPlan && agentMessages.length > 0 && !isLatestDraft && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.06em]">
                Conversation
              </p>
              {agentMessages.slice(-3).map((msg, i) => (
                <div
                  key={msg.id || i}
                  className="bg-white dark:bg-[#1C1C1E] rounded-lg border border-gray-100 dark:border-[#38383A] px-3.5 py-2.5"
                >
                  <p className="text-[13px] text-gray-600 dark:text-[#98989D] leading-snug line-clamp-3">
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Sending indicator — shown when agent is thinking but plan already exists */}
          {sending && hasPlan && (
            <div className="flex items-center gap-2.5 py-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[12px] text-gray-400 dark:text-[#636366]">Refining plan...</span>
            </div>
          )}

          {/* Refinement messages from user (shown compactly) */}
          {hasPlan && messages.filter(m => m.role === 'user').length > 1 && (
            <div className="flex justify-end">
              <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl rounded-br-md px-3.5 py-2 max-w-[70%]">
                <p className="text-[12px] text-indigo-600 dark:text-indigo-400 leading-snug">
                  {messages.filter(m => m.role === 'user').slice(-1)[0]?.content}
                </p>
              </div>
            </div>
          )}

          {/* Empty thinking state */}
          {!sending && messages.length === 0 && !hasPlan && (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-gray-400 dark:text-[#636366]">Preparing your plan...</p>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-8 pb-3 shrink-0">
          <div className="max-w-[680px] mx-auto">
            <p className="text-xs text-red-400 dark:text-[#F48FB1] text-center">{error}</p>
          </div>
        </div>
      )}

      {/* ChatBar */}
      <div className="border-t border-gray-100 dark:border-[#38383A] shrink-0 bg-white/50 dark:bg-[#1D1D1F]/50 backdrop-blur-md">
        <div className="max-w-[680px] mx-auto px-8 py-3">
          <ChatBar
            onSend={onSend}
            disabled={sending}
            placeholder={hasPlan ? 'Refine the plan...' : isPendingQuestion ? 'Answer the question...' : 'Ask a question or add details...'}
            variant="compact"
          />
        </div>
      </div>
    </div>
  )
}
