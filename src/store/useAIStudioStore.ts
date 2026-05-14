import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { logger as parentLogger } from '../lib/logger'
import { useTaskStore } from './useTaskStore'
import type { AgentConversation, AgentMessage, PlanDraft, ChatAttachment } from '../types'

const log = parentLogger.child({ module: 'useAIStudioStore' })

function conversationFromRow(row: Record<string, unknown>): AgentConversation {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: (row.title as string) ?? '',
    emoji: (row.emoji as string) ?? '\u2728',
    status: row.status as AgentConversation['status'],
    goalText: row.goal_text as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    planDraft: (row.plan_draft as PlanDraft | null) ?? null,
  }
}

function conversationToRow(conv: AgentConversation, userId: string) {
  const row: Record<string, unknown> = {
    id: conv.id,
    user_id: userId,
    title: conv.title,
    emoji: conv.emoji,
    status: conv.status,
    goal_text: conv.goalText,
    created_at: conv.createdAt,
    updated_at: conv.updatedAt,
  }
  if (conv.planDraft !== undefined) {
    row.plan_draft = conv.planDraft
  }
  return row
}

function messageFromRow(row: Record<string, unknown>): AgentMessage {
  return {
    id: row.id as string,
    conversationId: row.conversation_id as string,
    role: row.role as AgentMessage['role'],
    content: row.content as string,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  }
}

interface AIStudioStore {
  conversations: AgentConversation[]
  messagesByConversation: Record<string, AgentMessage[]>
  activeConversationId: string | null
  loading: boolean
  sending: boolean
  error: string | null
  planDrafts: Record<string, PlanDraft>

  loadConversations: () => Promise<void>
  loadMessages: (conversationId: string) => Promise<void>
  createConversation: (goalText: string) => Promise<string>
  deleteConversation: (id: string) => Promise<void>
  archiveConversation: (id: string) => Promise<void>
  updateConversation: (id: string, updates: Partial<AgentConversation>) => void

  sendChatMessage: (conversationId: string, content: string, attachments?: ChatAttachment[]) => Promise<void>
  approvePlan: (conversationId: string) => Promise<void>

  setActiveConversation: (id: string | null) => Promise<void>
  clearAll: () => void
}

export const useAIStudioStore = create<AIStudioStore>((set, get) => ({
  conversations: [],
  messagesByConversation: {},
  activeConversationId: null,
  loading: false,
  sending: false,
  error: null,
  planDrafts: {},

  loadConversations: async () => {
    log.info('load_conversations_start')
    set({ loading: true })

    const { data, error } = await supabase
      .from('agent_conversations')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      log.error('load_conversations_failed', error)
      set({ loading: false })
      return
    }

    const conversations = (data ?? []).map(conversationFromRow)
    log.info('load_conversations_complete', { count: conversations.length })
    set({ conversations, loading: false })
  },

  createConversation: async (goalText) => {
    const userId = useTaskStore.getState().userId
    if (!userId) return ''

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const conv: AgentConversation = {
      id,
      userId,
      title: goalText.slice(0, 60),
      emoji: '\u2728',
      status: 'draft',
      goalText,
      createdAt: now,
      updatedAt: now,
    }

    set(state => ({ conversations: [conv, ...state.conversations], activeConversationId: id }))

    const { error } = await supabase.from('agent_conversations').insert(conversationToRow(conv, userId))
    if (error) {
      log.error('create_conversation_failed', error, { conversationId: id, goalText: goalText.slice(0, 100) })
      set(state => ({ conversations: state.conversations.filter(c => c.id !== id), activeConversationId: null, error: error.message }))
      return ''
    }

    log.info('create_conversation_complete', { conversationId: id })
    return id
  },

  loadMessages: async (conversationId) => {
    const cached = get().messagesByConversation[conversationId]

    const { data, error } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      log.error('load_messages_failed', error, { conversationId })
      return
    }

    const messages = (data ?? []).map(messageFromRow)

    // Only replace cached messages if we got data back.
    // If Supabase returns empty (e.g. during the approval transition
    // where the edge function hasn't finished writing yet), keep
    // whatever we already have in memory.
    if (messages.length > 0 || !cached || cached.length === 0) {
      set(state => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: messages,
        },
      }))
    }

    const conv = get().conversations.find(c => c.id === conversationId)

    // Primary source: conversation.planDraft (loaded via conversationFromRow).
    // Fallback: extract from last agent message metadata (backward compat).
    let planDraft: PlanDraft | undefined | null
    if (conv?.planDraft) {
      planDraft = conv.planDraft as PlanDraft
    } else {
      const lastAgentMsg = [...messages].reverse().find(m => m.role === 'agent')
      planDraft = lastAgentMsg?.metadata?.planDraft as PlanDraft | undefined
    }

    // Don't revert an already-active conversation back to 'review'
    // (same guard as sendChatMessage — prevents sidebar duplicates)
    if (planDraft && conv?.status !== 'active') {
      set(state => ({
        planDrafts: {
          ...state.planDrafts,
          [conversationId]: planDraft,
        },
        conversations: state.conversations.map(c =>
          c.id === conversationId ? { ...c, status: 'review' as const, updatedAt: new Date().toISOString() } : c
        ),
      }))
    }
  },

  deleteConversation: async (id) => {
    const prev = get().conversations
    set(state => ({
      conversations: state.conversations.filter(c => c.id !== id),
      activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
    }))

    const { error } = await supabase.from('agent_conversations').delete().eq('id', id)
    if (error) {
      log.error('delete_conversation_failed', error, { conversationId: id })
      set({ conversations: prev })
    }
  },

  archiveConversation: async (id) => {
    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === id ? { ...c, status: 'archived' as const, updatedAt: new Date().toISOString() } : c
      ),
    }))

    await supabase.from('agent_conversations').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', id)
  },

  updateConversation: (id, updates) => {
    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      ),
    }))
  },

  sendChatMessage: async (conversationId, content, attachments) => {
    set({ sending: true, error: null })

    const conv = get().conversations.find(c => c.id === conversationId)
    if (!conv) { set({ sending: false, error: 'Conversation not found' }); return }

    const prevMessages = get().messagesByConversation[conversationId] ?? []

    const userMsg: AgentMessage = {
      id: crypto.randomUUID(),
      conversationId,
      role: 'user',
      content,
      metadata: {},
      createdAt: new Date().toISOString(),
    }

    set(state => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [...prevMessages, userMsg],
      },
    }))

    const { data, error } = await supabase.functions.invoke('agent-chat', {
      body: {
        action: 'chat',
        conversationId,
        goalText: conv.goalText,
        messages: [...get().messagesByConversation[conversationId] ?? []].map(m => ({ role: m.role, content: m.content })),
        attachments,
      },
    })

    if (error || !data) {
      log.error('send_message_failed', error, { conversationId })
      set({ sending: false, error: error?.message ?? 'Failed to get response' })
      return
    }

    const agentMsgs: AgentMessage[] = (data.messages ?? []).map((m: Record<string, unknown>) => ({
      ...messageFromRow(m),
      conversationId,
    }))

    set(state => {
      const existing = state.messagesByConversation[conversationId] ?? []
      const updates: Partial<AIStudioStore> = {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: [...existing, ...agentMsgs],
        },
        sending: false,
      }

      // Only apply planDraft if this conversation hasn't been approved yet.
      // An already-active conversation that re-generates a plan should not
      // revert to 'review' — that would cause a duplicate in the sidebar
      // (both the conversation entry and the existing project).
      if (data.planDraft && conv.status !== 'active') {
        const draft = data.planDraft as PlanDraft
        updates.planDrafts = {
          ...state.planDrafts,
          [conversationId]: draft,
        }
        updates.conversations = state.conversations.map(c =>
          c.id === conversationId ? {
            ...c,
            status: 'review' as const,
            title: draft.projectTitle ?? c.title,
            planDraft: draft,
            updatedAt: new Date().toISOString(),
          } : c
        )
      }

      return updates
    })

    if (data.planDraft && conv.status !== 'active') {
      const draft = data.planDraft as PlanDraft
      await supabase.from('agent_conversations').update({
        status: 'review',
        title: draft.projectTitle ?? conv.title,
        plan_draft: draft,
        updated_at: new Date().toISOString(),
      }).eq('id', conversationId)
    }
  },

  approvePlan: async (conversationId) => {
    set({ error: null })

    const conv = get().conversations.find(c => c.id === conversationId)
    const draft = get().planDrafts[conversationId]
    if (!conv || !draft) {
      set({ error: 'No plan to approve' })
      return
    }

    // Guard against double-approval
    if (conv.status === 'active') {
      set({ error: 'Plan already approved' })
      return
    }

    // Optimistically mark as active to prevent re-clicks
    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === conversationId ? { ...c, status: 'active' as const } : c
      ),
    }))

    const projectId = await useTaskStore.getState().materializePlan(draft, {
      conversationId,
      goal: conv.goalText,
      qaSummary: '',
    })

    if (!projectId) {
      set(state => ({
        error: 'Failed to create project',
        conversations: state.conversations.map(c =>
          c.id === conversationId ? { ...c, status: 'review' as const } : c
        ),
      }))
      return
    }

    // Find the first task for this project to link the conversation
    // (enables shared users to access conversation history via RLS).
    const projectTasks = useTaskStore.getState().tasks.filter(t => t.projectId === projectId)
    const firstTaskId = projectTasks[0]?.id ?? null

    const dbUpdates: Record<string, unknown> = {
      status: 'active',
      title: draft.projectTitle,
      updated_at: new Date().toISOString(),
    }
    if (firstTaskId) dbUpdates.task_id = firstTaskId

    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === conversationId ? {
          ...c,
          status: 'active' as const,
          title: draft.projectTitle,
          emoji: conv.emoji,
          updatedAt: new Date().toISOString(),
        } : c
      ),
    }))

    await supabase.from('agent_conversations').update(dbUpdates).eq('id', conversationId)
  },

  setActiveConversation: async (id) => {
    set({ activeConversationId: id })
    if (id) {
      await get().loadMessages(id)
    }
  },

  clearAll: () => {
    set({
      conversations: [],
      messagesByConversation: {},
      activeConversationId: null,
      loading: false,
      sending: false,
      error: null,
      planDrafts: {},
    })
  },
}))
