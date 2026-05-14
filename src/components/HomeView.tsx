import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import { useAIStudioStore } from '../store/useAIStudioStore'
import { logger } from '../lib/logger'
import DashboardView from './DashboardView'
import PlanningView from './PlanningView'
import ExecutionView from './ExecutionView'
import type { ChatAttachment } from '../types'

const log = logger.child({ module: 'HomeView' })

export default function HomeView() {
  const projects = useTaskStore(s => s.projects)
  const activeView = useTaskStore(s => s.activeView)
  const activeProjectId = useTaskStore(s => s.activeProjectId)

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

  const isExecution = !!(activeView === 'project' && activeProjectId)
  const isPlanning = !!activeConversationId

  // Log mode transitions
  useEffect(() => {
    log.info('render_mode', {
      mode: isExecution ? 'execution' : isPlanning ? 'planning' : 'greeting',
      activeView,
      activeProjectId,
    })
  }, [isExecution, isPlanning, activeView, activeProjectId])

  // Load messages when entering execution mode
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
  const showDraft = !!(activeDraft && (activeConv?.status === 'review' || isApproved))
  const isLatestDraft = activeConv?.status === 'review'

  // Plan draft for execution mode
  const executionPlanDraft = executionConv ? planDrafts[executionConv.conversationId] : undefined

  // Handlers
  const handleSend = useCallback(async (text: string, attachments?: ChatAttachment[]) => {
    const convId = await createConversation(text)
    if (convId) {
      await sendChatMessage(convId, text, attachments)
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
    return <DashboardView onSend={handleSend} sending={sending} />
  }

  // PLANNING MODE
  if (isPlanning && activeConv) {
    return (
      <PlanningView
        conv={activeConv}
        messages={activeMessages}
        planDraft={activeDraft}
        sending={sending}
        error={error}
        excludedIndices={activeExcluded}
        onSend={(text, attachments) => {
          sendChatMessage(activeConversationId, text, attachments)
        }}
        onBack={handleBack}
        onExcludeTask={handleExcludeTask}
        onApprove={handleApprove}
        isLatestDraft={isLatestDraft}
        showDraft={showDraft}
      />
    )
  }

  if (activeConv === null && isPlanning) return null

  // EXECUTION MODE
  const execProject = executionConv?.project ?? projects.find(p => p.id === activeProjectId) ?? null
  
  if (!execProject) return null

  return (
    <ExecutionView
      project={execProject}
      messages={executionConv?.messages ?? []}
      planDraft={executionPlanDraft}
      sending={sending}
      error={error}
      conversationId={executionConv?.conversationId ?? null}
      onSend={executionConv ? (text: string, attachments?: ChatAttachment[]) => {
        sendChatMessage(executionConv.conversationId, text, attachments)
      } : null}
    />
  )
}
