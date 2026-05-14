import { useEffect, useMemo, useCallback } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import { useActivityStore } from '../store/useActivityStore'
import { useAgentState } from '../lib/agentStateMachine'
import AgentStateIndicator from './AgentStateIndicator'
import InlineTaskQuestion from './InlineTaskQuestion'
import TaskPanel from './TaskPanel'
import ChatPanel from './ChatPanel'
import type { Project, AgentMessage, PlanDraft, ChatAttachment } from '../types'

interface ExecutionViewProps {
  project: Project
  messages: AgentMessage[]
  planDraft?: PlanDraft
  sending: boolean
  error: string | null
  conversationId: string | null
  onSend: ((text: string, attachments?: ChatAttachment[]) => void) | null
}

export default function ExecutionView({
  project,
  messages,
  planDraft: _planDraft,
  sending,
  error,
  conversationId: _conversationId,
  onSend,
}: ExecutionViewProps) {
  const activeProjectId = useTaskStore(s => s.activeProjectId)
  const rightPanelOpen = useTaskStore(s => s.rightPanelOpen)
  const toggleRightPanel = useTaskStore(s => s.toggleRightPanel)
  const respondToQuestion = useTaskStore(s => s.respondToQuestion)
  const agentQuestions = useTaskStore(s => s.agentQuestions)

  const events = useActivityStore(s => s.events)
  const loadEvents = useActivityStore(s => s.loadEvents)
  const loading = useActivityStore(s => s.loading)
  const eventsForProject = useActivityStore(s => s.eventsForProject)

  const agentState = useAgentState(project.id)

  // Load activity events for this project
  useEffect(() => {
    if (events.filter(e => e.projectId === project.id).length === 0 && !loading) {
      loadEvents(project.id)
    }
  }, [project.id, events, loading, loadEvents])

  // Activity events for this project (newest first for the timeline)
  const projectEvents = useMemo(() => {
    return eventsForProject(project.id)
  }, [eventsForProject, project.id])

  // Agent questions for this project
  const projectQuestions = useMemo(() => {
    return agentQuestions.filter(q => q.projectId === project.id && q.status === 'pending')
  }, [agentQuestions, project.id])

  const handleRespondToQuestion = useCallback((questionId: string, response: string) => {
    respondToQuestion(questionId, response)
  }, [respondToQuestion])

  // TaskPanel collapsed state
  const taskPanelCollapsed = !rightPanelOpen
  const handleTaskPanelToggle = toggleRightPanel

  return (
    <div className="flex-1 flex flex-row overflow-hidden animate-slide-up bg-dot-grid">
      {/* Main: Chat panel (flex-1, full height) */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-3 border-b border-gray-100 dark:border-[#38383A] shrink-0 bg-white dark:bg-[#1D1D1F]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm font-medium text-gray-900 dark:text-[#F5F5F5]">{project.title}</span>
            <AgentStateIndicator
              state={agentState.state}
              description={agentState.description}
              progress={agentState.progress}
              compact
            />
          </div>
          <button
            onClick={handleTaskPanelToggle}
            className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-[#636366] hover:text-gray-600 dark:hover:text-[#98989D] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 3h10M2 7h10M2 11h7" />
            </svg>
            <span className="text-[11px]">Tasks</span>
          </button>
        </div>

        {/* Pending questions banner */}
        {projectQuestions.length > 0 && (
          <div className="px-8 py-4 border-b border-gray-100 dark:border-[#38383A] shrink-0 bg-amber-50/50 dark:bg-amber-900/5">
            <div className="max-w-[680px] mx-auto space-y-3">
              {projectQuestions.map(q => (
                <InlineTaskQuestion
                  key={q.id}
                  question={q}
                  onRespond={handleRespondToQuestion}
                />
              ))}
            </div>
          </div>
        )}

        {/* Chat panel as main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatPanel
            messages={messages}
            sending={sending}
            error={error}
            collapsed={false}
            onToggle={() => {}}
            onSend={onSend}
            activityEvents={projectEvents}
            agentState={{
              state: agentState.state,
              description: agentState.description,
              progress: agentState.progress,
            }}
            placeholder="Ask the agent..."
            fill
          />
        </div>
      </div>

      {/* Sidebar: Task panel (collapsible) */}
      {activeProjectId && (
        <TaskPanel
          projectId={activeProjectId}
          collapsed={taskPanelCollapsed}
          onToggle={handleTaskPanelToggle}
          showProvenance
        />
      )}
    </div>
  )
}
