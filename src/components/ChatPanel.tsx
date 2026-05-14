import { useRef, useLayoutEffect } from 'react'
import ChatBubble from './ChatBubble'
import ChatBar from './ChatBar'
import ExternalActionCard from './ExternalActionCard'
import AgentStateIndicator from './AgentStateIndicator'
import type { AgentMessage, AgentActivityEvent, ChatAttachment } from '../types'
import type { AgentState } from '../types'

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
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

const EXTERNAL_TYPES = new Set(['email_sent', 'call_made', 'text_sent', 'research_complete'])

const EVENT_SYMBOLS: Record<string, string> = {
  agent_action: '\u26A1',
  agent_question: '?',
  user_response: '\u27F3',
  task_completed: '\u2713',
  task_added: '+',
  plan_approved: '\u2713',
  email_sent: '\u2197',
  call_made: '\u260E',
  text_sent: '\u2709',
  research_complete: '\u25CB',
}

const EVENT_COLORS: Record<string, string> = {
  agent_action: 'text-blue-500 dark:text-blue-400',
  agent_question: 'text-amber-500 dark:text-amber-400',
  user_response: 'text-gray-400 dark:text-gray-500',
  task_completed: 'text-green-500 dark:text-green-400',
  task_added: 'text-blue-500 dark:text-blue-400',
  plan_approved: 'text-blue-500 dark:text-blue-400',
  email_sent: 'text-purple-500 dark:text-purple-400',
  call_made: 'text-purple-500 dark:text-purple-400',
  text_sent: 'text-purple-500 dark:text-purple-400',
  research_complete: 'text-green-500 dark:text-green-400',
}

const EVENT_BG: Record<string, string> = {
  agent_action: 'bg-blue-50 dark:bg-blue-900/20',
  agent_question: 'bg-amber-50 dark:bg-amber-900/20',
  user_response: 'bg-gray-50 dark:bg-gray-800',
  task_completed: 'bg-green-50 dark:bg-green-900/20',
  task_added: 'bg-blue-50 dark:bg-blue-900/20',
  plan_approved: 'bg-blue-50 dark:bg-blue-900/20',
  email_sent: 'bg-purple-50 dark:bg-purple-900/20',
  call_made: 'bg-purple-50 dark:bg-purple-900/20',
  text_sent: 'bg-purple-50 dark:bg-purple-900/20',
  research_complete: 'bg-green-50 dark:bg-green-900/20',
}

interface ChatPanelProps {
  messages: AgentMessage[]
  sending: boolean
  error: string | null
  collapsed: boolean
  onToggle: () => void
  onSend: ((text: string, attachments?: ChatAttachment[]) => void) | null
  activityEvents?: AgentActivityEvent[]
  agentState?: {
    state: AgentState
    description?: string | null
    progress?: number | null
  }
  placeholder?: string
  /** When true, fills parent flex container instead of fixed w-96 */
  fill?: boolean
}

function EventIcon({ type }: { type: string }) {
  const symbol = EVENT_SYMBOLS[type] ?? '\u26A1'
  const colorClass = EVENT_COLORS[type] ?? 'text-gray-400'
  const bgClass = EVENT_BG[type] ?? 'bg-gray-50 dark:bg-gray-800'
  return (
    <span className={`w-5 h-5 rounded-full ${bgClass} flex items-center justify-center text-[10px] ${colorClass} shrink-0`}>
      {symbol}
    </span>
  )
}

export default function ChatPanel({
  messages,
  sending,
  error,
  collapsed,
  onToggle,
  onSend,
  activityEvents,
  agentState,
  placeholder = 'Ask the agent...',
  fill = false,
}: ChatPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasScrolledRef = useRef(false)

  useLayoutEffect(() => {
    const container = scrollContainerRef.current
    if (!container || collapsed) return

    const hasVisibleContent = messages.length > 0 || sending || (activityEvents && activityEvents.length > 0)
    if (!hasVisibleContent) return

    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 40
    if (!isAtBottom && hasScrolledRef.current) return

    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: hasScrolledRef.current ? 'smooth' : 'instant',
      })
    })

    hasScrolledRef.current = true
  }, [messages.length, sending, collapsed, activityEvents?.length])

  // Build an interleaved timeline: messages + activity events sorted by time
  const timeline = (() => {
    const items: Array<{
      kind: 'message' | 'event'
      timestamp: string
      data: AgentMessage | AgentActivityEvent
    }> = []

    for (const msg of messages) {
      items.push({ kind: 'message', timestamp: msg.createdAt, data: msg })
    }

    if (activityEvents) {
      for (const evt of activityEvents) {
        items.push({ kind: 'event', timestamp: evt.timestamp, data: evt })
      }
    }

    items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    return items
  })()

  const showEmptyState = timeline.length === 0 && !sending

  // Collapsed state — narrow bar
  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-1 px-1.5 py-8 text-gray-300 dark:text-[#48484A] hover:text-gray-500 dark:hover:text-[#98989D] transition-colors border-l border-gray-100 dark:border-[#38383A] bg-white dark:bg-[#151516] shrink-0"
        title="Show chat"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 7h8" />
        </svg>
        <span className="writing-mode-vertical text-[11px] font-medium tracking-wider">Chat</span>
        <span className="text-[10px] text-gray-400">{messages.length}</span>
      </button>
    )
  }

  return (
    <div className={`flex border-l border-gray-100 dark:border-[#38383A] bg-white dark:bg-[#1D1D1F] overflow-hidden flex-shrink-0 ${fill ? 'flex-1' : 'w-96'}`}>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-[11px] border-b border-gray-100 dark:border-[#38383A] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[13px] font-semibold text-gray-800 dark:text-[#F5F5F5] shrink-0">Chat</span>
            {agentState && (
              <AgentStateIndicator
                state={agentState.state}
                description={agentState.description}
                progress={agentState.progress}
                compact
              />
            )}
            <span className="text-[11px] text-gray-400 dark:text-[#636366] font-medium">{messages.length}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onToggle}
              className="p-1 text-gray-300 dark:text-[#48484A] hover:text-gray-500 dark:hover:text-[#98989D] transition-colors rounded hover:bg-gray-50 dark:hover:bg-[#252526]"
              title="Hide chat"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M9 3l-4 4 4 4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {showEmptyState ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-gray-400 dark:text-[#636366] text-center px-4 leading-relaxed">
                  No conversation yet.<br />Ask the agent to help with tasks.
                </p>
              </div>
            ) : (
              timeline.map((item, i) => {
                if (item.kind === 'message') {
                  const msg = item.data as AgentMessage
                  return <ChatBubble key={msg.id || `msg-${i}`} role={msg.role} content={msg.content} />
                }

                const evt = item.data as AgentActivityEvent
                if (EXTERNAL_TYPES.has(evt.type)) {
                  return (
                    <div key={evt.id || `evt-${i}`} className="py-1">
                      <ExternalActionCard event={evt} />
                    </div>
                  )
                }

                return (
                  <div key={evt.id || `evt-${i}`} className="flex items-start gap-2.5 group">
                    <EventIcon type={evt.type} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] text-gray-600 dark:text-[#98989D] leading-snug">
                        {evt.summary}
                      </p>
                      {evt.details && (
                        <p className="text-[11px] text-gray-400 dark:text-[#636366] mt-0.5 line-clamp-2">
                          {evt.details}
                        </p>
                      )}
                      <p className="text-[9px] text-gray-300 dark:text-[#48484A] mt-0.5">
                        {timeAgo(evt.timestamp)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-[#252526] rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-[#636366] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 dark:bg-[#636366] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 dark:bg-[#636366] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 pb-2 shrink-0">
            <p className="text-[11px] text-red-400 dark:text-[#F48FB1]">{error}</p>
          </div>
        )}

        {/* Input */}
        {onSend && (
          <div className="border-t border-gray-100 dark:border-[#38383A] shrink-0 px-3 py-3">
            <ChatBar
              onSend={onSend}
              disabled={sending}
              placeholder={placeholder}
              variant="compact"
            />
          </div>
        )}
      </div>
    </div>
  )
}
