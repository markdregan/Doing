import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAIStudioStore } from './useAIStudioStore'
import { useTaskStore } from './useTaskStore'

const { mockFrom, mockFunctions } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockFunctions: { invoke: vi.fn() },
}))

vi.mock('../lib/supabase', () => ({
  supabase: { from: mockFrom, functions: mockFunctions, removeChannel: vi.fn() },
}))

function createBuilder() {
  const builder = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
  }
  builder.select.mockReturnValue(builder)
  builder.insert.mockResolvedValue({ error: null })
  builder.update.mockReturnValue(builder)
  builder.delete.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.order.mockResolvedValue({ data: [], error: null })
  builder.single.mockResolvedValue({ data: null, error: null })
  return builder
}

beforeEach(() => {
  vi.clearAllMocks()
  useAIStudioStore.setState({
    conversations: [],
    messagesByConversation: {},
    activeConversationId: null,
    loading: false,
    sending: false,
    error: null,
    planDrafts: {},
  })
  useTaskStore.setState({ userId: 'user-1', tasks: [], projects: [] })
})

describe('useAIStudioStore', () => {
  describe('loadConversations', () => {
    it('loads conversations from supabase', async () => {
      const builder = createBuilder()
      builder.order.mockResolvedValue({
        data: [
          { id: 'c1', user_id: 'user-1', title: 'Plan Trip', emoji: '\uD83C\uDFD6\uFE0F', status: 'draft', goal_text: 'Plan a trip', created_at: '2024-01-01', updated_at: '2024-01-01' },
        ],
        error: null,
      })
      mockFrom.mockReturnValue(builder)

      await useAIStudioStore.getState().loadConversations()

      const state = useAIStudioStore.getState()
      expect(state.conversations).toHaveLength(1)
      expect(state.conversations[0].title).toBe('Plan Trip')
      expect(state.conversations[0].status).toBe('draft')
      expect(mockFrom).toHaveBeenCalledWith('agent_conversations')
    })

    it('handles empty response', async () => {
      const builder = createBuilder()
      mockFrom.mockReturnValue(builder)

      await useAIStudioStore.getState().loadConversations()

      expect(useAIStudioStore.getState().conversations).toEqual([])
    })
  })

  describe('createConversation', () => {
    it('creates a conversation and sets active', async () => {
      const builder = createBuilder()
      builder.insert.mockResolvedValue({ error: null })
      mockFrom.mockReturnValue(builder)

      const id = await useAIStudioStore.getState().createConversation('Plan a trip to Italy')

      expect(id).toBeTruthy()
      const state = useAIStudioStore.getState()
      expect(state.conversations).toHaveLength(1)
      expect(state.conversations[0].goalText).toBe('Plan a trip to Italy')
      expect(state.conversations[0].status).toBe('draft')
      expect(state.activeConversationId).toBe(id)
    })

    it('handles missing userId', async () => {
      useTaskStore.setState({ userId: null })
      const id = await useAIStudioStore.getState().createConversation('Test')
      expect(id).toBe('')
    })
  })

  describe('sendChatMessage', () => {
    it('sends a message, receives response, transitions to review when plan is returned', async () => {
      const builder = createBuilder()
      builder.insert.mockResolvedValue({ error: null })
      mockFrom.mockReturnValue(builder)

      const convId = await useAIStudioStore.getState().createConversation('Plan a trip')
      expect(convId).toBeTruthy()

      mockFunctions.invoke.mockResolvedValue({
        data: {
          messages: [{ role: 'agent', content: 'Great goal! Let me ask a few questions...', created_at: '2024-01-01' }],
          planDraft: {
            projectTitle: 'Italy Trip',
            projectColor: 'blue',
            tasks: [{ title: 'Book flights' }, { title: 'Find hotels' }],
            version: 1,
          },
        },
        error: null,
      })

      await useAIStudioStore.getState().sendChatMessage(convId, 'Plan a trip to Italy')

      const state = useAIStudioStore.getState()
      expect(state.messagesByConversation[convId]).toHaveLength(2)
      expect(state.messagesByConversation[convId][0].role).toBe('user')
      expect(state.messagesByConversation[convId][1].role).toBe('agent')
      expect(state.planDrafts[convId]).toBeDefined()
      expect(state.planDrafts[convId].projectTitle).toBe('Italy Trip')
      const conv = state.conversations.find(c => c.id === convId)
      expect(conv?.status).toBe('review')
    })

    it('sends a message and receives chat response without plan', async () => {
      const builder = createBuilder()
      builder.insert.mockResolvedValue({ error: null })
      mockFrom.mockReturnValue(builder)

      const convId = await useAIStudioStore.getState().createConversation('Plan a trip')
      expect(convId).toBeTruthy()

      mockFunctions.invoke.mockResolvedValue({
        data: {
          messages: [{ role: 'agent', content: 'Tell me more about your budget...', created_at: '2024-01-01' }],
          planDraft: null,
        },
        error: null,
      })

      await useAIStudioStore.getState().sendChatMessage(convId, 'I want to go to Italy')

      const state = useAIStudioStore.getState()
      expect(state.messagesByConversation[convId]).toHaveLength(2)
      expect(state.messagesByConversation[convId][1].content).toBe('Tell me more about your budget...')
      expect(state.planDrafts[convId]).toBeUndefined()
      const conv = state.conversations.find(c => c.id === convId)
      expect(conv?.status).toBe('draft')
    })

    it('handles conversation not found', async () => {
      await useAIStudioStore.getState().sendChatMessage('nonexistent', 'hello')
      expect(useAIStudioStore.getState().error).toBe('Conversation not found')
    })
  })

  describe('conversation lifecycle', () => {
    it('archives a conversation', async () => {
      const builder = createBuilder()
      builder.update.mockReturnValue(builder)
      builder.eq.mockReturnValue(builder)
      builder.eq.mockResolvedValue({ error: null })
      mockFrom.mockReturnValue(builder)

      useAIStudioStore.setState({
        conversations: [{
          id: 'c1', userId: 'user-1', title: 'Test', emoji: '\u2728', status: 'active' as const,
          goalText: 'Test goal', createdAt: '2024-01-01', updatedAt: '2024-01-01',
        }],
      })

      await useAIStudioStore.getState().archiveConversation('c1')

      const conv = useAIStudioStore.getState().conversations.find(c => c.id === 'c1')
      expect(conv?.status).toBe('archived')
    })

    it('deletes a conversation', async () => {
      const builder = createBuilder()
      builder.delete.mockReturnValue(builder)
      builder.eq.mockReturnValue(builder)
      builder.eq.mockResolvedValue({ error: null })
      mockFrom.mockReturnValue(builder)

      useAIStudioStore.setState({
        activeConversationId: 'c1',
        conversations: [{
          id: 'c1', userId: 'user-1', title: 'Test', emoji: '\u2728', status: 'draft' as const,
          goalText: 'Test goal', createdAt: '2024-01-01', updatedAt: '2024-01-01',
        }],
      })

      await useAIStudioStore.getState().deleteConversation('c1')

      expect(useAIStudioStore.getState().conversations).toHaveLength(0)
      expect(useAIStudioStore.getState().activeConversationId).toBeNull()
    })
  })

  describe('loadMessages', () => {
    it('loads messages from supabase and restores planDraft', async () => {
      const builder = createBuilder()
      builder.order.mockResolvedValue({
        data: [
          { id: 'm1', conversation_id: 'c1', role: 'user', content: 'Plan a trip', metadata: {}, created_at: '2024-01-01T00:00:00Z' },
          { id: 'm2', conversation_id: 'c1', role: 'agent', content: 'Here is a plan', metadata: { planDraft: { projectTitle: 'Italy Trip', projectColor: 'blue', tasks: [{ title: 'Book flights' }], version: 1 } }, created_at: '2024-01-01T00:01:00Z' },
        ],
        error: null,
      })
      mockFrom.mockReturnValue(builder)

      useAIStudioStore.setState({
        conversations: [{
          id: 'c1', userId: 'user-1', title: 'Test', emoji: '\u2728', status: 'draft' as const,
          goalText: 'Plan a trip', createdAt: '2024-01-01', updatedAt: '2024-01-01',
        }],
      })

      await useAIStudioStore.getState().loadMessages('c1')

      const state = useAIStudioStore.getState()
      expect(state.messagesByConversation['c1']).toHaveLength(2)
      expect(state.messagesByConversation['c1'][0].role).toBe('user')
      expect(state.messagesByConversation['c1'][1].role).toBe('agent')
      expect(state.planDrafts['c1']).toBeDefined()
      expect(state.planDrafts['c1'].projectTitle).toBe('Italy Trip')
      const conv = state.conversations.find(c => c.id === 'c1')
      expect(conv?.status).toBe('review')
      expect(mockFrom).toHaveBeenCalledWith('agent_messages')
    })

    it('handles empty messages', async () => {
      const builder = createBuilder()
      mockFrom.mockReturnValue(builder)

      await useAIStudioStore.getState().loadMessages('c1')

      expect(useAIStudioStore.getState().messagesByConversation['c1']).toEqual([])
    })
  })

  describe('setActiveConversation', () => {
    it('sets conversation and loads messages', async () => {
      const builder = createBuilder()
      builder.order.mockResolvedValue({ data: [], error: null })
      mockFrom.mockReturnValue(builder)

      useAIStudioStore.setState({
        conversations: [{
          id: 'c1', userId: 'user-1', title: 'Test', emoji: '\u2728', status: 'draft' as const,
          goalText: 'Test', createdAt: '2024-01-01', updatedAt: '2024-01-01',
        }],
      })

      await useAIStudioStore.getState().setActiveConversation('c1')

      expect(useAIStudioStore.getState().activeConversationId).toBe('c1')
      expect(mockFrom).toHaveBeenCalledWith('agent_messages')
    })

    it('sets to null without loading messages', async () => {
      await useAIStudioStore.getState().setActiveConversation(null)

      expect(useAIStudioStore.getState().activeConversationId).toBeNull()
    })
  })

  describe('clearAll', () => {
    it('resets state to defaults', () => {
      useAIStudioStore.setState({
        conversations: [{ id: 'c1', userId: 'u1', title: 'T', emoji: '\u2728', status: 'draft', goalText: 'G', createdAt: '', updatedAt: '' }],
        activeConversationId: 'c1',
        sending: true,
        error: 'something',
      })

      useAIStudioStore.getState().clearAll()

      const state = useAIStudioStore.getState()
      expect(state.conversations).toEqual([])
      expect(state.activeConversationId).toBeNull()
      expect(state.sending).toBe(false)
      expect(state.error).toBeNull()
    })
  })
})
