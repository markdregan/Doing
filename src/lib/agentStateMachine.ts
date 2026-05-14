import { useMemo } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import { useActivityStore } from '../store/useActivityStore'
import type { AgentState } from '../types'

export interface AgentStateResult {
  state: AgentState
  description: string | null
  progress: number | null
  hasPendingQuestion: boolean
  isActive: boolean
}

const STATE_PRIORITY: AgentState[] = [
  'blocked',
  'needs_input',
  'working',
  'thinking',
  'completed',
  'idle',
]

function deriveAgentState(
  currentAction: { description: string; state: AgentState; progress?: number } | null,
  hasPendingQuestion: boolean,
  hasRecentActivity: boolean,
): AgentState {
  if (currentAction) {
    return currentAction.state
  }

  if (hasPendingQuestion) {
    return 'needs_input'
  }

  if (hasRecentActivity) {
    return 'completed'
  }

  return 'idle'
}

function isRecentlyActive(events: { timestamp: string }[]): boolean {
  if (events.length === 0) return false
  const latest = new Date(events[0].timestamp).getTime()
  const now = Date.now()
  // Consider "recently active" if last event was within the last hour
  return now - latest < 60 * 60 * 1000
}

export function useAgentState(projectId: string | null): AgentStateResult {
  const agentCurrentActions = useTaskStore(s => s.agentCurrentActions)
  const events = useActivityStore(s => s.events)
  const agentQuestions = useTaskStore(s => s.agentQuestions)

  return useMemo(() => {
    if (!projectId) {
      return { state: 'idle', description: null, progress: null, hasPendingQuestion: false, isActive: false }
    }

    const currentAction = agentCurrentActions.find(a => a.projectId === projectId) ?? null
    const projectEvents = events
      .filter(e => e.projectId === projectId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const pendingQuestions = agentQuestions.filter(
      q => q.projectId === projectId && q.status === 'pending'
    )

    const state = deriveAgentState(
      currentAction,
      pendingQuestions.length > 0,
      isRecentlyActive(projectEvents),
    )

    return {
      state,
      description: currentAction?.description ?? null,
      progress: currentAction?.progress ?? null,
      hasPendingQuestion: pendingQuestions.length > 0,
      isActive: state !== 'idle' && state !== 'completed',
    }
  }, [projectId, agentCurrentActions, events, agentQuestions])
}

export function useGlobalAgentState(): AgentStateResult {
  const agentCurrentActions = useTaskStore(s => s.agentCurrentActions)
  const events = useActivityStore(s => s.events)
  const agentQuestions = useTaskStore(s => s.agentQuestions)

  return useMemo(() => {
    const pendingQuestions = agentQuestions.filter(q => q.status === 'pending')

    const priorityStates = STATE_PRIORITY.map(s => {
      const actionInState = agentCurrentActions.find(a => a.state === s)
      if (actionInState) return actionInState
      return null
    }).filter(Boolean)

    const highestPriority = priorityStates[0] as typeof agentCurrentActions[0] | undefined

    if (highestPriority) {
      return {
        state: highestPriority.state,
        description: highestPriority.description,
        progress: highestPriority.progress ?? null,
        hasPendingQuestion: pendingQuestions.length > 0,
        isActive: true,
      }
    }

    if (pendingQuestions.length > 0) {
      return {
        state: 'needs_input',
        description: `${pendingQuestions.length} question${pendingQuestions.length > 1 ? 's' : ''} need your input`,
        progress: null,
        hasPendingQuestion: true,
        isActive: true,
      }
    }

    const hasAnyRecent = isRecentlyActive(events)
    if (hasAnyRecent) {
      return {
        state: 'completed',
        description: 'All tasks up to date',
        progress: null,
        hasPendingQuestion: false,
        isActive: false,
      }
    }

    return {
      state: 'idle',
      description: 'Agent is ready',
      progress: null,
      hasPendingQuestion: false,
      isActive: false,
    }
  }, [agentCurrentActions, events, agentQuestions])
}
