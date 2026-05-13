import { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useTaskStore } from '../store/useTaskStore'
import { useAIStudioStore } from '../store/useAIStudioStore'
import { logger } from '../lib/logger'
import ChatBubble from './ChatBubble'
import { SUGGESTION_CHIPS } from '../lib/aiStudioConstants'
import ChatBar from './ChatBar'
import PlanCard from './PlanCard'
import TaskPanel from './TaskPanel'

const log = logger.child({ module: 'HomeView' })

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function StaticSuggestions({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="flex justify-center gap-3 mt-8 pb-2">
      {SUGGESTION_CHIPS.slice(0, 3).map((chip, i) => (
        <button
          key={i}
          onClick={() => onSelect(chip.prompt)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-gray-500 dark:text-[#98989D] bg-white dark:bg-[#2C2C2E] hover:bg-gray-50 dark:hover:bg-[#38383A] hover:text-gray-800 dark:hover:text-[#F5F5F5] rounded-full transition-all border border-gray-200 dark:border-[#38383A] shadow-sm active:scale-95 shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 opacity-60">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>{chip.label}</span>
        </button>
      ))}
    </div>
  )
}

export default function HomeView() {
  const user = useAuthStore(s => s.user)
  const projects = useTaskStore(s => s.projects)
  const activeView = useTaskStore(s => s.activeView)
  const activeProjectId = useTaskStore(s => s.activeProjectId)
  const rightPanelOpen = useTaskStore(s => s.rightPanelOpen)
  const toggleRightPanel = useTaskStore(s => s.toggleRightPanel)

  const activeConversationId = useAIStudioStore(s => s.activeConversationId)
  const conversations = useAIStudioStore(s => s.conversations)
  const messagesByConv = useAIStudioStore(s => s.messagesByConversation)
  const planDrafts = useAIStudioStore(s => s.planDrafts)
  const sending = useAIStudioStore(s => s.sending)
  const error = useAIStudioStore(s => s.error)
  const createConversation = useAIStudioStore(s => s.createConversation)
  const sendChatMessage = useAIStudioStore(s => s.sendChatMessage)
  const approvePlan = useAIStudioStore(s => s.approvePlan)
  const setActiveConversation = useAIStudioStore(s => s.setActiveConversation)
  const loadMessages = useAIStudioStore(s => s.loadMessages)

  const [excludedMap, setExcludedMap] = useState<Record<string, number[]>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const hasScrolledRef = useRef(false)

  const firstName = user?.user_metadata?.name?.split(' ')[0] ?? 'there'

  // Determine which mode we're in
  const isExecution = !!(activeView === 'project' && activeProjectId)
  const isPlanning = !!activeConversationId

  // Log mode transitions for debugging
  useEffect(() => {
    log.info('render_mode', {
      mode: isExecution ? 'execution' : isPlanning ? 'planning' : 'greeting',
      activeView,
      activeProjectId,
      isExecution,
      isPlanning,
    })
  }, [isExecution, isPlanning, activeView, activeProjectId])

  // Load messages when entering execution mode — always refresh
  useEffect(() => {
    if (isExecution && activeProjectId) {
      const project = projects.find(p => p.id === activeProjectId)
      const convId = project?.aiGenerationMetadata?.conversationId
      if (convId) {
        loadMessages(convId)
      }
    }
  }, [isExecution, activeProjectId, projects, loadMessages])

  // Figure out the conversation for execution mode
  const executionConv = useMemo(() => {
    if (!isExecution || !activeProjectId) return null
    const project = projects.find(p => p.id === activeProjectId)
    const convId = project?.aiGenerationMetadata?.conversationId
    if (!convId) return null
    return {
      conversationId: convId,
      messages: messagesByConv[convId] ?? [],
      project,
    }
  }, [isExecution, activeProjectId, projects, messagesByConv])

  // Planning mode state
  const activeConv = conversations.find(c => c.id === activeConversationId)
  const activeMessages = activeConversationId ? (messagesByConv[activeConversationId] ?? []) : []
  const activeDraft = activeConversationId ? planDrafts[activeConversationId] : undefined
  const activeExcluded = activeConversationId ? (excludedMap[activeConversationId] ?? []) : []

  const isApproved = activeConv?.status === 'active'
  const showDraft = activeDraft && (activeConv?.status === 'review' || isApproved)
  const isLatestDraft = activeConv?.status === 'review'

  // Plan draft for execution mode
  const executionConvId = executionConv?.conversationId
  const executionPlanDraft = executionConvId ? planDrafts[executionConvId] : undefined

  // Auto-scroll: always scroll to bottom on first render with messages,
  // then politely scroll on new messages only if user is near bottom
  useLayoutEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const hasMessages = activeMessages.length > 0 || (executionConv?.messages.length ?? 0) > 0
    if (!hasMessages) return

    if (!hasScrolledRef.current) {
      // First render with messages — scroll immediately (instant, no animation)
      requestAnimationFrame(() => {
        container.scrollTo({ top: container.scrollHeight, behavior: 'instant' })
      })
      hasScrolledRef.current = true
      return
    }

    // Subsequent updates — only scroll if user is near the bottom
    const threshold = 100
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    if (isNearBottom) {
      requestAnimationFrame(() => {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
      })
    }
  }, [activeMessages, activeConversationId, executionConv?.messages, sending, executionConv?.messages?.length])

  // Reset scroll tracking when switching conversations
  useEffect(() => {
    hasScrolledRef.current = false
  }, [activeConversationId, activeProjectId])

  const handleSend = useCallback(async (text: string) => {
    const convId = await createConversation(text)
    if (convId) {
      await sendChatMessage(convId, text)
    }
  }, [createConversation, sendChatMessage])

  const handleExcludeTask = (index: number) => {
    if (!activeConversationId) return
    setExcludedMap(prev => {
      const current = prev[activeConversationId] ?? []
      const exists = current.includes(index)
      return {
        ...prev,
        [activeConversationId]: exists ? current.filter(i => i !== index) : [...current, index],
      }
    })
  }

  const handleApprove = async () => {
    if (!activeConversationId) return
    await approvePlan(activeConversationId)
    const project = useTaskStore.getState().projects.find(p =>
      p.aiGenerationMetadata?.conversationId === activeConversationId
    )
    if (project) {
      setActiveConversation(null)
      useTaskStore.getState().setActiveView('project', project.id)
      useTaskStore.getState().setRightPanelOpen(true)
    }
  }

  const handleBack = () => {
    setActiveConversation(null)
  }

  // ---- RENDER ----

  // GREETING MODE
  if (!activeConversationId && !isExecution) {
    return (
      <div className="flex-1 flex items-center justify-center overflow-hidden bg-dot-grid">
        <div className="w-full max-w-2xl px-8 py-16 animate-fade-in">
          <div className="text-center mb-10">
            <h1 className="text-[42px] font-serif font-medium text-gray-900 dark:text-[#F5F5F5] tracking-tight mb-3">
              {getGreeting()}, {firstName}
            </h1>
          </div>

          <ChatBar
            onSend={handleSend}
            disabled={sending}
            autoFocus
          />

          <StaticSuggestions onSelect={(prompt) => handleSend(prompt)} />
        </div>
      </div>
    )
  }

  // Shared: messages + optional PlanCard inline
  function renderMessages() {
    const msgs = isPlanning ? activeMessages : (executionConv?.messages ?? [])
    const planDraft = isPlanning ? activeDraft : executionPlanDraft
    const showPlan = isPlanning ? showDraft : !!executionPlanDraft

    return (
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-[680px] mx-auto space-y-4">
          {/* Chat bubbles */}
          {msgs.length > 0 ? (
            msgs.map((msg, i) => (
              <ChatBubble key={msg.id || i} role={msg.role} content={msg.content} />
            ))
          ) : (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-gray-400 dark:text-[#636366]">
                {isPlanning ? 'Start the conversation...' : 'No conversation history for this project'}
              </p>
            </div>
          )}

          {/* Plan card inline — shown as last item in the message flow */}
          {showPlan && planDraft && (
            <PlanCard
              draft={planDraft}
              isLatest={isPlanning ? isLatestDraft : false}
              onApprove={isPlanning ? handleApprove : undefined}
              onExcludeTask={isPlanning ? handleExcludeTask : undefined}
              excludedIndices={isPlanning ? activeExcluded : undefined}
              sending={isPlanning ? sending : undefined}
              readOnly={!isPlanning}
            />
          )}

          {/* Sending indicator */}
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
    )
  }

  // Shared: ChatBar at the bottom
  function renderChatBar() {
    return (
      <div className="border-t border-gray-100 dark:border-[#38383A] shrink-0 bg-white/50 dark:bg-[#1D1D1F]/50 backdrop-blur-md">
        <div className="max-w-[680px] mx-auto px-8 py-3">
          <ChatBar
            onSend={(text) => {
              if (isPlanning && activeConversationId) {
                sendChatMessage(activeConversationId, text)
              } else if (executionConv) {
                sendChatMessage(executionConv.conversationId, text)
              }
            }}
            disabled={sending}
            placeholder={isPlanning ? 'Ask a question or refine the plan...' : 'What should we work on next?'}
            variant="compact"
          />
        </div>
      </div>
    )
  }

  // PLANNING MODE
  if (isPlanning && activeConv) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden animate-slide-up bg-dot-grid">
        <div className="flex items-center justify-between px-8 py-3 border-b border-gray-100 dark:border-[#38383A] shrink-0 bg-white dark:bg-[#1D1D1F]">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-[#636366] hover:text-gray-600 dark:hover:text-[#98989D] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 3L5 7l4 4" />
            </svg>
            Back
          </button>
          <span className="text-[11px] text-gray-300 dark:text-[#48484A] font-medium italic">
            {activeConv.goalText.slice(0, 60)}
          </span>
          <div className="w-10" />
        </div>

        {renderMessages()}

        {error && (
          <div className="px-8 pb-3 shrink-0">
            <div className="max-w-[680px] mx-auto">
              <p className="text-xs text-red-400 dark:text-[#F48FB1] text-center">{error}</p>
            </div>
          </div>
        )}

        {renderChatBar()}
      </div>
    )
  }

  if (activeConv === null && isPlanning) return null

  // EXECUTION MODE
  const execProject = executionConv?.project ?? projects.find(p => p.id === activeProjectId)

  return (
    <div className="flex-1 flex flex-row overflow-hidden animate-slide-up bg-dot-grid">
      {/* Left: Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {execProject && (
          <div className="flex items-center justify-between px-8 py-3 border-b border-gray-100 dark:border-[#38383A] shrink-0 bg-white dark:bg-[#1D1D1F]">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-medium text-gray-900 dark:text-[#F5F5F5]">{execProject.title}</span>
              {executionConv && (
                <span className="text-[10px] text-green-500 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </div>
          </div>
        )}

        {renderMessages()}

        {error && (
          <div className="px-8 pb-3 shrink-0">
            <div className="max-w-[680px] mx-auto">
              <p className="text-xs text-red-400 dark:text-[#F48FB1] text-center">{error}</p>
            </div>
          </div>
        )}

        {renderChatBar()}
      </div>

      {/* Right: Task panel */}
      {activeProjectId && (
        <TaskPanel
          projectId={activeProjectId}
          collapsed={!rightPanelOpen}
          onToggle={toggleRightPanel}
        />
      )}
    </div>
  )
}
