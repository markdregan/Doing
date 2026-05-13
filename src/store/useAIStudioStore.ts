import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { logger as parentLogger } from '../lib/logger'
import { useTaskStore } from './useTaskStore'
import type { AgentConversation, AgentMessage, PlanDraft } from '../types'

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
  }
}

function conversationToRow(conv: AgentConversation, userId: string) {
  return {
    id: conv.id,
    user_id: userId,
    title: conv.title,
    emoji: conv.emoji,
    status: conv.status,
    goal_text: conv.goalText,
    created_at: conv.createdAt,
    updated_at: conv.updatedAt,
  }
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

  sendChatMessage: (conversationId: string, content: string) => Promise<void>
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

    set(state => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: messages,
      },
    }))

    const lastAgentMsg = [...messages].reverse().find(m => m.role === 'agent')
    const planDraft = lastAgentMsg?.metadata?.planDraft as PlanDraft | undefined
    if (planDraft) {
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

  sendChatMessage: async (conversationId, content) => {
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

      if (data.planDraft) {
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
            updatedAt: new Date().toISOString(),
          } : c
        )
      }

      return updates
    })

    if (data.planDraft) {
      await supabase.from('agent_conversations').update({
        status: 'review',
        title: data.planDraft.projectTitle ?? conv.title,
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

    await supabase.from('agent_conversations').update({
      status: 'active',
      title: draft.projectTitle,
      updated_at: new Date().toISOString(),
    }).eq('id', conversationId)
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
