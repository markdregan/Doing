import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTaskStore } from './useTaskStore'
import type { Task } from '../types'

const { mockFrom, mockChannel } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockChannel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
  })),
}))

vi.mock('../lib/supabase', () => ({
  supabase: { from: mockFrom, channel: mockChannel, removeChannel: vi.fn() },
}))

function createBuilder() {
  const builder = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    or: vi.fn(),
    single: vi.fn(),
    ilike: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    in: vi.fn(),
  }
  builder.select.mockReturnValue(builder)
  builder.insert.mockResolvedValue({ error: null })
  builder.update.mockReturnValue(builder)
  builder.delete.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.order.mockResolvedValue({ data: [], error: null })
  builder.or.mockReturnValue(builder)
  builder.single.mockResolvedValue({ data: null, error: new Error('Not found') })
  builder.ilike.mockReturnValue(builder)
  builder.limit.mockReturnValue(builder)
  builder.maybeSingle.mockResolvedValue({ data: null, error: null })
  builder.in = vi.fn().mockReturnValue(builder)
  return builder
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1', title: 'Task', notes: '', projectId: null, dueDate: null,
    isToday: false, isSomeday: false, completed: false, completedAt: null,
    deletedAt: null, createdAt: '2024-01-01', sortOrder: 0, tagIds: [],
    repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
    source: 'user',
    ...overrides,
  }
}

function makeProject(overrides = {}) {
  return {
    id: 'p1', title: 'P', color: 'blue' as const, sortOrder: 0,
    createdAt: '2024-01-01', userId: 'user-1', aiGenerationMetadata: null, ...overrides,
  }
}

beforeEach(() => {
  useTaskStore.setState({
    userId: null,
    tasks: [],
    projects: [],
    activeView: 'home',
    activeProjectId: null,
    dataLoading: true,
    tags: [],
    checklistItems: [],
    profiles: [],
    trashUndo: null,
    sharedProjectIds: [],
    projectShares: [],
    agentCurrentActions: [],
  })
  vi.clearAllMocks()
})

describe('initialize', () => {
  it('loads projects, tasks, tags, profiles, and agent questions', async () => {
    const projectBuilder = createBuilder()
    const taskBuilder = createBuilder()
    const tagBuilder = createBuilder()
    const taskTagBuilder = createBuilder()
    const checklistBuilder = createBuilder()
    const sharesBuilder = createBuilder()
    const profilesBuilder = createBuilder()
    const agentQuestionsBuilder = createBuilder()
    projectBuilder.order.mockResolvedValue({
      data: [{ id: 'p1', title: 'Work', color: 'blue', sort_order: 0, created_at: '2024-01-01', user_id: 'user-1' }],
      error: null,
    })
    taskBuilder.order.mockResolvedValue({
      data: [{ id: 't1', title: 'Do thing', completed: false, is_today: true, is_someday: false, sort_order: 0, project_id: null, notes: '', due_date: null, completed_at: null, created_at: '2024-01-01' }],
      error: null,
    })
    tagBuilder.order.mockResolvedValue({
      data: [{ id: 'tag1', title: 'Work', color: 'blue', created_at: '2024-01-01' }],
      error: null,
    })
    taskTagBuilder.select.mockResolvedValue({ data: [], error: null })
    checklistBuilder.select.mockResolvedValue({ data: [{ id: 'cl1', task_id: 't1', title: 'Subtask', completed: false, sort_order: 0, created_at: '2024-01-01' }], error: null })
    sharesBuilder.or.mockResolvedValue({ data: [], error: null })
    profilesBuilder.limit.mockResolvedValue({ data: [{ id: 'user-1', email: 'a@b.com', display_name: 'Alice', avatar_url: null, created_at: '2024-01-01' }], error: null })
    agentQuestionsBuilder.order.mockResolvedValue({ data: [], error: null })
    mockFrom
      .mockReturnValueOnce(projectBuilder)
      .mockReturnValueOnce(taskBuilder)
      .mockReturnValueOnce(tagBuilder)
      .mockReturnValueOnce(taskTagBuilder)
      .mockReturnValueOnce(checklistBuilder)
      .mockReturnValueOnce(sharesBuilder)
      .mockReturnValueOnce(profilesBuilder)
      .mockReturnValueOnce(agentQuestionsBuilder)

    await useTaskStore.getState().initialize('user-1')

    const state = useTaskStore.getState()
    expect(state.userId).toBe('user-1')
    expect(state.dataLoading).toBe(false)
    expect(state.projects).toHaveLength(1)
    expect(state.projects[0].title).toBe('Work')
    expect(state.tasks).toHaveLength(1)
    expect(state.tasks[0].title).toBe('Do thing')
    expect(state.tags).toHaveLength(1)
    expect(state.tags[0].title).toBe('Work')
    expect(state.checklistItems).toHaveLength(1)
    expect(state.checklistItems[0].title).toBe('Subtask')
    expect(state.profiles).toHaveLength(1)
    expect(state.profiles[0].displayName).toBe('Alice')
    expect(mockFrom).toHaveBeenCalledTimes(8)
    expect(mockFrom).toHaveBeenCalledWith('projects')
    expect(mockFrom).toHaveBeenCalledWith('tasks')
    expect(mockFrom).toHaveBeenCalledWith('tags')
    expect(mockFrom).toHaveBeenCalledWith('task_tags')
    expect(mockFrom).toHaveBeenCalledWith('task_checklist_items')
    expect(mockFrom).toHaveBeenCalledWith('project_shares')
    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(mockFrom).toHaveBeenCalledWith('agent_questions')
  })

  it('stays empty when no data (demo onboarding handles first-run)', async () => {
    const projectBuilder = createBuilder()
    const taskBuilder = createBuilder()
    const tagBuilder = createBuilder()
    const taskTagBuilder = createBuilder()
    const checklistBuilder = createBuilder()
    const sharesBuilder = createBuilder()
    const profilesBuilder = createBuilder()
    taskTagBuilder.select.mockResolvedValue({ data: [], error: null })
    checklistBuilder.select.mockResolvedValue({ data: [], error: null })
    sharesBuilder.or.mockResolvedValue({ data: [], error: null })
    profilesBuilder.limit.mockResolvedValue({ data: [], error: null })
    const questionsBuilder = createBuilder()
    questionsBuilder.order.mockResolvedValue({ data: [], error: null })
    mockFrom
      .mockReturnValueOnce(projectBuilder)
      .mockReturnValueOnce(taskBuilder)
      .mockReturnValueOnce(tagBuilder)
      .mockReturnValueOnce(taskTagBuilder)
      .mockReturnValueOnce(checklistBuilder)
      .mockReturnValueOnce(sharesBuilder)
      .mockReturnValueOnce(profilesBuilder)
      .mockReturnValue(questionsBuilder)

    await useTaskStore.getState().initialize('user-1')

    const state = useTaskStore.getState()
    expect(state.dataLoading).toBe(false)
    expect(state.projects).toHaveLength(0)
    expect(state.tasks).toHaveLength(0)
    expect(state.tags).toHaveLength(0)
    expect(state.checklistItems).toHaveLength(0)
  })
})

describe('addTask', () => {
  it('adds a task optimistically', async () => {
    useTaskStore.setState({ userId: 'user-1', tasks: [], projects: [] })
    mockFrom.mockReturnValue(createBuilder())

    await useTaskStore.getState().addTask({ title: 'New task' })

    const state = useTaskStore.getState()
    expect(state.tasks).toHaveLength(1)
    expect(state.tasks[0].title).toBe('New task')
    expect(state.tasks[0].completed).toBe(false)
  })

  it('inserts to supabase', async () => {
    useTaskStore.setState({ userId: 'user-1' })
    const builder = createBuilder()
    mockFrom.mockReturnValue(builder)

    await useTaskStore.getState().addTask({ title: 'Test' })

    expect(builder.insert).toHaveBeenCalledOnce()
    const insertedRow = builder.insert.mock.calls[0][0]
    expect(insertedRow.title).toBe('Test')
    expect(insertedRow.user_id).toBe('user-1')
  })

  it('does nothing without userId', async () => {
    useTaskStore.setState({ userId: null })

    await useTaskStore.getState().addTask({ title: 'Should not appear' })

    expect(useTaskStore.getState().tasks).toEqual([])
  })
})

describe('updateTask', () => {
  it('updates a task optimistically', async () => {
    useTaskStore.setState({ userId: 'user-1', tasks: [makeTask()] })
    mockFrom.mockReturnValue(createBuilder())

    await useTaskStore.getState().updateTask('t1', { title: 'Updated' })

    expect(useTaskStore.getState().tasks[0].title).toBe('Updated')
  })
})

describe('softDeleteTask', () => {
  it('sets deletedAt instead of removing', async () => {
    useTaskStore.setState({ userId: 'user-1', tasks: [makeTask()] })
    const builder = createBuilder()
    mockFrom.mockReturnValue(builder)

    await useTaskStore.getState().softDeleteTask('t1')

    const state = useTaskStore.getState()
    expect(state.tasks).toHaveLength(1)
    expect(state.tasks[0].deletedAt).not.toBeNull()
    expect(state.trashUndo).toEqual({ taskId: 't1', title: 'Task' })
    expect(builder.update).toHaveBeenCalled()
    expect(builder.update.mock.calls[0][0]).toHaveProperty('deleted_at')
  })

  it('reverts on supabase error', async () => {
    useTaskStore.setState({ userId: 'user-1', tasks: [makeTask()] })
    const builder = createBuilder()
    builder.eq.mockResolvedValue({ error: new Error('DB error') })
    mockFrom.mockReturnValue(builder)

    await useTaskStore.getState().softDeleteTask('t1')

    const state = useTaskStore.getState()
    expect(state.tasks[0].deletedAt).toBeNull()
    expect(state.trashUndo).toBeNull()
  })
})

describe('deleteTask (permanent)', () => {
  it('removes a task permanently', async () => {
    useTaskStore.setState({ userId: 'user-1', tasks: [makeTask()] })
    const builder = createBuilder()
    mockFrom.mockReturnValue(builder)

    await useTaskStore.getState().deleteTask('t1')

    expect(useTaskStore.getState().tasks).toEqual([])
    expect(builder.delete).toHaveBeenCalledOnce()
  })
})

describe('restoreTask', () => {
  it('clears deletedAt', async () => {
    useTaskStore.setState({ userId: 'user-1', tasks: [makeTask({ deletedAt: '2024-01-01T00:00:00.000Z' })] })
    const builder = createBuilder()
    mockFrom.mockReturnValue(builder)

    await useTaskStore.getState().restoreTask('t1')

    expect(useTaskStore.getState().tasks[0].deletedAt).toBeNull()
    expect(builder.update).toHaveBeenCalledWith({ deleted_at: null })
  })
})

describe('emptyTrash', () => {
  it('removes all trashed tasks', async () => {
    useTaskStore.setState({
      userId: 'user-1',
      tasks: [
        makeTask({ id: 't1', title: 'A', deletedAt: '2024-01-01T00:00:00.000Z' }),
        makeTask({ id: 't2', title: 'B' }),
      ],
    })
    const builder = createBuilder()
    mockFrom.mockReturnValue(builder)

    await useTaskStore.getState().emptyTrash()

    expect(useTaskStore.getState().tasks).toHaveLength(1)
    expect(useTaskStore.getState().tasks[0].id).toBe('t2')
    expect(builder.delete).toHaveBeenCalledTimes(1)
    expect(builder.eq).toHaveBeenCalledWith('id', 't1')
  })
})

describe('clearTrashUndo', () => {
  it('clears the undo state', () => {
    useTaskStore.setState({ trashUndo: { taskId: 't1', title: 'Test' } })

    useTaskStore.getState().clearTrashUndo()

    expect(useTaskStore.getState().trashUndo).toBeNull()
  })
})

describe('toggleTask', () => {
  it('toggles a task from incomplete to complete', async () => {
    useTaskStore.setState({ userId: 'user-1', tasks: [makeTask()] })
    mockFrom.mockReturnValue(createBuilder())

    await useTaskStore.getState().toggleTask('t1')

    const task = useTaskStore.getState().tasks[0]
    expect(task.completed).toBe(true)
    expect(task.completedAt).not.toBeNull()
  })

  it('reverts on supabase error', async () => {
    useTaskStore.setState({ userId: 'user-1', tasks: [makeTask()] })
    const builder = createBuilder()
    builder.eq.mockResolvedValue({ error: new Error('DB error') })
    mockFrom.mockReturnValue(builder)

    await useTaskStore.getState().toggleTask('t1')

    expect(useTaskStore.getState().tasks[0].completed).toBe(false)
  })
})

describe('setActiveView', () => {
  it('switches to home view', () => {
    useTaskStore.getState().setActiveView('home')
    expect(useTaskStore.getState().activeView).toBe('home')
    expect(useTaskStore.getState().activeProjectId).toBeNull()
  })

  it('switches to project view with id', () => {
    useTaskStore.getState().setActiveView('project', 'p1')
    expect(useTaskStore.getState().activeView).toBe('project')
    expect(useTaskStore.getState().activeProjectId).toBe('p1')
  })
})

describe('moveTaskToSomeday', () => {
  it('sets isSomeday to true', async () => {
    useTaskStore.setState({ userId: 'user-1', tasks: [makeTask()] })
    mockFrom.mockReturnValue(createBuilder())

    await useTaskStore.getState().moveTaskToSomeday('t1')

    expect(useTaskStore.getState().tasks[0].isSomeday).toBe(true)
  })

  it('updates supabase', async () => {
    useTaskStore.setState({ userId: 'user-1', tasks: [makeTask()] })
    const builder = createBuilder()
    mockFrom.mockReturnValue(builder)

    await useTaskStore.getState().moveTaskToSomeday('t1')

    expect(builder.update).toHaveBeenCalledWith({ is_someday: true })
  })
})

describe('removeTaskFromSomeday', () => {
  it('sets isSomeday to false', async () => {
    useTaskStore.setState({ userId: 'user-1', tasks: [makeTask({ isSomeday: true })] })
    mockFrom.mockReturnValue(createBuilder())

    await useTaskStore.getState().removeTaskFromSomeday('t1')

    expect(useTaskStore.getState().tasks[0].isSomeday).toBe(false)
  })

  it('updates supabase', async () => {
    useTaskStore.setState({ userId: 'user-1', tasks: [makeTask({ isSomeday: true })] })
    const builder = createBuilder()
    mockFrom.mockReturnValue(builder)

    await useTaskStore.getState().removeTaskFromSomeday('t1')

    expect(builder.update).toHaveBeenCalledWith({ is_someday: false })
  })
})

describe('addProject', () => {
  it('adds a project optimistically', async () => {
    useTaskStore.setState({ userId: 'user-1', projects: [] })
    mockFrom.mockReturnValue(createBuilder())

    await useTaskStore.getState().addProject('Work')

    const state = useTaskStore.getState()
    expect(state.projects).toHaveLength(1)
    expect(state.projects[0].title).toBe('Work')
  })
})

describe('reorderTasks', () => {
  it('updates sort orders', async () => {
    useTaskStore.setState({
      userId: 'user-1',
      tasks: [
        makeTask({ id: 't1', title: 'A', sortOrder: 0 }),
        makeTask({ id: 't2', title: 'B', sortOrder: 1 }),
      ],
    })
    mockFrom.mockReturnValue(createBuilder())

    await useTaskStore.getState().reorderTasks(['t2', 't1'])

    const tasks = useTaskStore.getState().tasks
    expect(tasks.find(t => t.id === 't2')!.sortOrder).toBe(0)
    expect(tasks.find(t => t.id === 't1')!.sortOrder).toBe(1)
  })
})

describe('clearAll', () => {
  it('resets state to defaults', () => {
    useTaskStore.setState({
      userId: 'user-1',
      tasks: [makeTask()],
      projects: [makeProject()],
      profiles: [{ id: 'p1', email: 'a@b.com', displayName: 'A', avatarUrl: null, createdAt: '2024-01-01' }],
    })

    useTaskStore.getState().clearAll()

    const state = useTaskStore.getState()
    expect(state.userId).toBeNull()
    expect(state.tasks).toEqual([])
    expect(state.projects).toEqual([])
    expect(state.tags).toEqual([])
    expect(state.checklistItems).toEqual([])
    expect(state.profiles).toEqual([])
    expect(state.activeView).toBe('home')
    expect(state.activeTagId).toBeNull()
    expect(state.dataLoading).toBe(true)
    expect(state.trashUndo).toBeNull()
  })
})

describe('addChecklistItem', () => {
  it('adds a checklist item optimistically', async () => {
    useTaskStore.setState({ userId: 'user-1', checklistItems: [], tasks: [makeTask()] })
    const builder = createBuilder()
    mockFrom.mockReturnValue(builder)

    await useTaskStore.getState().addChecklistItem('t1', 'Subtask')

    const state = useTaskStore.getState()
    expect(state.checklistItems).toHaveLength(1)
    expect(state.checklistItems[0].title).toBe('Subtask')
    expect(state.checklistItems[0].taskId).toBe('t1')
    expect(state.checklistItems[0].completed).toBe(false)
  })
})

describe('toggleChecklistItem', () => {
  it('toggles a checklist item', async () => {
    useTaskStore.setState({ userId: 'user-1', checklistItems: [{ id: 'cl1', taskId: 't1', title: 'Sub', completed: false, sortOrder: 0, createdAt: '2024-01-01' }] })
    const builder = createBuilder()
    mockFrom.mockReturnValue(builder)

    await useTaskStore.getState().toggleChecklistItem('cl1')

    expect(useTaskStore.getState().checklistItems[0].completed).toBe(true)
  })

  it('reverts on error', async () => {
    useTaskStore.setState({ userId: 'user-1', checklistItems: [{ id: 'cl1', taskId: 't1', title: 'Sub', completed: false, sortOrder: 0, createdAt: '2024-01-01' }] })
    const builder = createBuilder()
    builder.eq.mockResolvedValue({ error: new Error('DB error') })
    mockFrom.mockReturnValue(builder)

    await useTaskStore.getState().toggleChecklistItem('cl1')

    expect(useTaskStore.getState().checklistItems[0].completed).toBe(false)
  })
})

describe('deleteChecklistItem', () => {
  it('removes a checklist item', async () => {
    useTaskStore.setState({ userId: 'user-1', checklistItems: [{ id: 'cl1', taskId: 't1', title: 'Sub', completed: false, sortOrder: 0, createdAt: '2024-01-01' }] })
    const builder = createBuilder()
    mockFrom.mockReturnValue(builder)

    await useTaskStore.getState().deleteChecklistItem('cl1')

    expect(useTaskStore.getState().checklistItems).toEqual([])
  })
})

describe('addTag', () => {
  it('adds a tag optimistically', async () => {
    useTaskStore.setState({ userId: 'user-1', tags: [] })
    mockFrom.mockReturnValue(createBuilder())

    await useTaskStore.getState().addTag('Urgent')

    const state = useTaskStore.getState()
    expect(state.tags).toHaveLength(1)
    expect(state.tags[0].title).toBe('Urgent')
  })

  it('inserts tag into supabase', async () => {
    useTaskStore.setState({ userId: 'user-1' })
    const builder = createBuilder()
    mockFrom.mockReturnValue(builder)

    await useTaskStore.getState().addTag('Work')

    expect(builder.insert).toHaveBeenCalledOnce()
    const insertedRow = builder.insert.mock.calls[0][0]
    expect(insertedRow.title).toBe('Work')
    expect(insertedRow.user_id).toBe('user-1')
  })
})

describe('toggleTaskTag', () => {
  it('adds a tag to a task', async () => {
    useTaskStore.setState({ userId: 'user-1', tasks: [makeTask()] })
    const builder = createBuilder()
    mockFrom.mockReturnValue(builder)

    await useTaskStore.getState().toggleTaskTag('t1', 'tag1')

    const task = useTaskStore.getState().tasks[0]
    expect(task.tagIds).toEqual(['tag1'])
    expect(builder.insert).toHaveBeenCalledWith({ task_id: 't1', tag_id: 'tag1' })
  })

  it('removes a tag from a task', async () => {
    useTaskStore.setState({ userId: 'user-1', tasks: [makeTask({ tagIds: ['tag1'] })] })
    const builder = createBuilder()
    mockFrom.mockReturnValue(builder)

    await useTaskStore.getState().toggleTaskTag('t1', 'tag1')

    const task = useTaskStore.getState().tasks[0]
    expect(task.tagIds).toEqual([])
    expect(builder.delete).toHaveBeenCalled()
  })

  it('reverts on supabase error when adding', async () => {
    useTaskStore.setState({ userId: 'user-1', tasks: [makeTask()] })
    const builder = createBuilder()
    builder.insert.mockResolvedValue({ error: new Error('DB error') })
    mockFrom.mockReturnValue(builder)

    await useTaskStore.getState().toggleTaskTag('t1', 'tag1')

    expect(useTaskStore.getState().tasks[0].tagIds).toEqual([])
  })
})

describe('setActiveTagId', () => {
  it('sets the active tag filter', () => {
    useTaskStore.getState().setActiveTagId('tag1')
    expect(useTaskStore.getState().activeTagId).toBe('tag1')
  })

  it('clears the active tag filter with null', () => {
    useTaskStore.setState({ activeTagId: 'tag1' })
    useTaskStore.getState().setActiveTagId(null)
    expect(useTaskStore.getState().activeTagId).toBeNull()
  })
})

describe('assignTask', () => {
  it('assigns a task to a user', async () => {
    useTaskStore.setState({ userId: 'user-1', tasks: [makeTask()] })
    const builder = createBuilder()
    mockFrom.mockReturnValue(builder)

    await useTaskStore.getState().assignTask('t1', 'user-2')

    const task = useTaskStore.getState().tasks[0]
    expect(task.assignedTo).toBe('user-2')
    expect(task.assignedBy).toBe('user-1')
  })

  it('reverts on supabase error', async () => {
    useTaskStore.setState({ userId: 'user-1', tasks: [makeTask()] })
    const builder = createBuilder()
    builder.eq.mockResolvedValue({ error: new Error('DB error') })
    mockFrom.mockReturnValue(builder)

    await useTaskStore.getState().assignTask('t1', 'user-2')

    const task = useTaskStore.getState().tasks[0]
    expect(task.assignedTo).toBeNull()
    expect(task.assignedBy).toBeNull()
  })
})

describe('unassignTask', () => {
  it('removes assignment', async () => {
    useTaskStore.setState({ userId: 'user-1', tasks: [makeTask({ assignedTo: 'user-2', assignedBy: 'user-1' })] })
    const builder = createBuilder()
    mockFrom.mockReturnValue(builder)

    await useTaskStore.getState().unassignTask('t1')

    expect(useTaskStore.getState().tasks[0].assignedTo).toBeNull()
  })
})

describe('shareProjectByEmail', () => {
  it('shares with an existing user by email', async () => {
    useTaskStore.setState({ userId: 'user-1', profiles: [] })
    const builder = createBuilder()
    const profilesBuilder = createBuilder()
    profilesBuilder.maybeSingle.mockResolvedValue({
      data: { id: 'user-2', email: 'friend@test.com', display_name: 'Friend', avatar_url: null, created_at: '2024-01-01' },
      error: null,
    })
    mockFrom
      .mockReturnValueOnce(profilesBuilder)
      .mockReturnValueOnce(builder)

    await useTaskStore.getState().shareProjectByEmail('p1', 'friend@test.com')

    const state = useTaskStore.getState()
    expect(state.projectShares).toHaveLength(1)
    expect(state.projectShares[0].projectId).toBe('p1')
    expect(state.projectShares[0].sharedWith).toBe('user-2')
    expect(state.projectShares[0].status).toBe('active')
    expect(state.projectShares[0].invitedEmail).toBeNull()
    expect(state.profiles).toHaveLength(1)
    expect(state.profiles[0].displayName).toBe('Friend')
  })

  it('creates an invite for unknown email', async () => {
    useTaskStore.setState({ userId: 'user-1', projects: [makeProject()] })
    const builder = createBuilder()
    const profilesBuilder = createBuilder()
    profilesBuilder.maybeSingle.mockResolvedValue({ data: null, error: null })
    mockFrom
      .mockReturnValueOnce(profilesBuilder)
      .mockReturnValueOnce(builder)

    await useTaskStore.getState().shareProjectByEmail('p1', 'new@test.com')

    const state = useTaskStore.getState()
    expect(state.projectShares).toHaveLength(1)
    expect(state.projectShares[0].projectId).toBe('p1')
    expect(state.projectShares[0].sharedWith).toBeNull()
    expect(state.projectShares[0].status).toBe('invited')
    expect(state.projectShares[0].invitedEmail).toBe('new@test.com')
    expect(state.projectShares[0].token).toBeTruthy()
  })
})

describe('removeShare', () => {
  it('removes a project share by id', async () => {
    useTaskStore.setState({
      userId: 'user-1',
      projectShares: [{ id: 's1', projectId: 'p1', sharedBy: 'user-1', sharedWith: 'user-2', invitedEmail: null, status: 'active', permission: 'write', token: null, createdAt: '2024-01-01' }],
      sharedProjectIds: [],
    })
    const builder = createBuilder()
    mockFrom.mockReturnValue(builder)

    await useTaskStore.getState().removeShare('s1')

    expect(useTaskStore.getState().projectShares).toHaveLength(0)
  })
})

describe('getProfileByEmail', () => {
  it('returns cached profile if found', async () => {
    useTaskStore.setState({
      profiles: [{ id: 'u1', email: 'a@b.com', displayName: 'Alice', avatarUrl: null, createdAt: '2024-01-01' }],
    })

    const result = await useTaskStore.getState().getProfileByEmail('a@b.com')

    expect(result).not.toBeNull()
    expect(result!.id).toBe('u1')
  })

  it('fetches profile if not cached', async () => {
    useTaskStore.setState({ profiles: [] })
    const builder = createBuilder()
    builder.maybeSingle.mockResolvedValue({
      data: { id: 'u2', email: 'b@c.com', display_name: 'Bob', avatar_url: null, created_at: '2024-01-01' },
      error: null,
    })
    mockFrom.mockReturnValue(builder)

    const result = await useTaskStore.getState().getProfileByEmail('b@c.com')

    expect(result).not.toBeNull()
    expect(result!.displayName).toBe('Bob')
    expect(useTaskStore.getState().profiles).toHaveLength(1)
  })

  it('returns null for unknown email', async () => {
    useTaskStore.setState({ profiles: [] })
    const builder = createBuilder()
    mockFrom.mockReturnValue(builder)

    const result = await useTaskStore.getState().getProfileByEmail('unknown@test.com')

    expect(result).toBeNull()
  })
})
