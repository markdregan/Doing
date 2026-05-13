import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { logger as parentLogger } from '../lib/logger'
import type { Task, TaskStatus, Project, Tag, ChecklistItem, ViewType, ProjectColor, TagColor, RepeatInterval, ProjectShare, Profile, PlanDraft, AiGenerationMetadata, AgentQuestion } from '../types'
import { PROJECT_COLOR_MAP, TAG_COLOR_MAP } from '../lib/constants'

const log = parentLogger.child({ module: 'useTaskStore' })

function computeNextDate(interval: RepeatInterval, fromDate: string | null): string | null {
  const base = fromDate ? new Date(fromDate + 'T00:00:00') : new Date()
  if (interval === 'daily') {
    base.setDate(base.getDate() + 1)
    return base.toISOString().slice(0, 10)
  }
  if (interval === 'weekdays') {
    do { base.setDate(base.getDate() + 1) }
    while (base.getDay() === 0 || base.getDay() === 6)
    return base.toISOString().slice(0, 10)
  }
  if (interval === 'weekly') {
    base.setDate(base.getDate() + 7)
    return base.toISOString().slice(0, 10)
  }
  if (interval === 'biweekly') {
    base.setDate(base.getDate() + 14)
    return base.toISOString().slice(0, 10)
  }
  if (interval === 'monthly') {
    base.setMonth(base.getMonth() + 1)
    return base.toISOString().slice(0, 10)
  }
  if (interval === 'yearly') {
    base.setFullYear(base.getFullYear() + 1)
    return base.toISOString().slice(0, 10)
  }
  return null
}

function taskFromRow(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    notes: (row.notes as string) ?? '',
    projectId: (row.project_id as string) ?? null,
    status: (row.status as TaskStatus) ?? 'not_started',
    dueDate: (row.due_date as string) ?? null,
    isToday: row.is_today as boolean,
    isSomeday: (row.is_someday as boolean) ?? false,
    completed: row.completed as boolean,
    completedAt: (row.completed_at as string) ?? null,
    deletedAt: (row.deleted_at as string) ?? null,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
    tagIds: [],
    repeat: (row.repeat_interval as RepeatInterval) ?? null,
    assignedTo: (row.assigned_to as string) ?? null,
    assignedBy: (row.assigned_by as string) ?? null,
  }
}

function taskToRow(task: Task, userId: string) {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    notes: task.notes,
    project_id: task.projectId,
    status: task.status,
    due_date: task.dueDate,
    is_today: task.isToday,
    is_someday: task.isSomeday,
    completed: task.completed,
    completed_at: task.completedAt,
    deleted_at: task.deletedAt,
    sort_order: task.sortOrder,
    created_at: task.createdAt,
    repeat_interval: task.repeat,
    assigned_to: task.assignedTo,
    assigned_by: task.assignedBy,
  }
}

function projectFromRow(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    title: row.title as string,
    color: row.color as ProjectColor,
    sortOrder: (row.sort_order as number) ?? 0,
    createdAt: row.created_at as string,
    userId: (row.user_id as string) ?? '',
    aiGenerationMetadata: (row.ai_generation_metadata as AiGenerationMetadata | null) ?? null,
  }
}

function projectToRow(project: Project, userId: string) {
  return {
    id: project.id,
    user_id: userId,
    title: project.title,
    color: project.color,
    sort_order: project.sortOrder,
    created_at: project.createdAt,
    ai_generation_metadata: project.aiGenerationMetadata,
  }
}

function tagFromRow(row: Record<string, unknown>): Tag {
  return {
    id: row.id as string,
    title: row.title as string,
    color: row.color as TagColor,
    createdAt: row.created_at as string,
  }
}

function tagToRow(tag: Tag, userId: string) {
  return {
    id: tag.id,
    user_id: userId,
    title: tag.title,
    color: tag.color,
    created_at: tag.createdAt,
  }
}

function checklistItemFromRow(row: Record<string, unknown>): ChecklistItem {
  return {
    id: row.id as string,
    taskId: row.task_id as string,
    title: row.title as string,
    completed: row.completed as boolean,
    sortOrder: (row.sort_order as number) ?? 0,
    createdAt: row.created_at as string,
  }
}

function checklistItemToRow(item: ChecklistItem) {
  return {
    id: item.id,
    task_id: item.taskId,
    title: item.title,
    completed: item.completed,
    sort_order: item.sortOrder,
    created_at: item.createdAt,
  }
}

function profileFromRow(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    email: row.email as string,
    displayName: row.display_name as string,
    avatarUrl: (row.avatar_url as string) ?? null,
    createdAt: row.created_at as string,
  }
}

function projectShareFromRow(row: Record<string, unknown>): ProjectShare {
  return {
    id: row.id as string,
    projectId: (row.project_id as string) ?? '',
    sharedBy: (row.shared_by as string) ?? '',
    sharedWith: (row.shared_with as string) ?? null,
    invitedEmail: (row.invited_email as string) ?? null,
    status: (row.status as ProjectShare['status']) ?? 'active',
    permission: (row.permission as ProjectShare['permission']) ?? 'write',
    token: (row.token as string) ?? null,
    createdAt: (row.created_at as string) ?? '',
  }
}

interface TrashUndo {
  taskId: string
  title: string
}

interface TaskStore {
  userId: string | null
  _channels: ReturnType<typeof supabase.channel>[]
  tasks: Task[]
  projects: Project[]
  tags: Tag[]
  checklistItems: ChecklistItem[]
  profiles: Profile[]
  activeView: ViewType
  activeProjectId: string | null
  activeTagId: string | null
  dataLoading: boolean
  trashUndo: TrashUndo | null
  sharedProjectIds: string[]
  projectShares: ProjectShare[]
  agentQuestions: AgentQuestion[]
  rightPanelOpen: boolean

  initialize: (userId: string) => Promise<void>
  seedOnboardingData: () => Promise<void>
  clearAll: () => void

  addTask: (params: { title: string; notes?: string; projectId?: string; dueDate?: string; isToday?: boolean; isSomeday?: boolean; tagIds?: string[]; repeat?: RepeatInterval | null }) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  softDeleteTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  restoreTask: (id: string) => Promise<void>
  emptyTrash: () => Promise<void>
  clearTrashUndo: () => void
  toggleTask: (id: string) => Promise<void>
  setTaskStatus: (id: string, status: TaskStatus) => Promise<void>

  addProject: (title: string) => Promise<string>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  materializePlan: (planDraft: PlanDraft, aiMetadata: AiGenerationMetadata) => Promise<string | null>

  setActiveView: (view: ViewType, projectId?: string) => void
  moveTaskToToday: (id: string) => Promise<void>
  removeTaskFromToday: (id: string) => Promise<void>
  moveTaskToSomeday: (id: string) => Promise<void>
  removeTaskFromSomeday: (id: string) => Promise<void>

  reorderTasks: (orderedIds: string[]) => Promise<void>
  reorderProjects: (orderedIds: string[]) => Promise<void>
  moveTaskToProject: (taskId: string, projectId: string | null) => Promise<void>

  addTag: (title: string) => Promise<void>
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>
  deleteTag: (id: string) => Promise<void>
  toggleTaskTag: (taskId: string, tagId: string) => Promise<void>
  setActiveTagId: (tagId: string | null) => void

  addChecklistItem: (taskId: string, title: string) => Promise<void>
  toggleChecklistItem: (id: string) => Promise<void>
  updateChecklistItem: (id: string, title: string) => Promise<void>
  deleteChecklistItem: (id: string) => Promise<void>
  reorderChecklistItems: (taskId: string, orderedIds: string[]) => Promise<void>

  updateRepeat: (id: string, repeat: RepeatInterval | null) => Promise<void>

  assignTask: (taskId: string, friendUserId: string) => Promise<void>
  unassignTask: (taskId: string) => Promise<void>
  _lastInviteTime: Record<string, number>
  shareProjectByEmail: (projectId: string, email: string) => Promise<void>
  removeShare: (shareId: string) => Promise<void>
  redeemInviteToken: (token: string) => Promise<boolean>
  getProfileByEmail: (email: string) => Promise<Profile | null>
  refreshProfiles: () => Promise<void>

  loadAgentQuestions: () => Promise<void>
  respondToQuestion: (questionId: string, response: string) => Promise<void>
  addAgentQuestion: (question: AgentQuestion) => void
  toggleRightPanel: () => void
  setRightPanelOpen: (open: boolean) => void
}

export const useTaskStore = create<TaskStore>()((set, get) => ({
  userId: null,
  tasks: [],
  projects: [],
  tags: [],
  checklistItems: [],
  profiles: [],
  activeView: 'home' as ViewType,
  activeProjectId: null,
  activeTagId: null,
  dataLoading: true,
  trashUndo: null,
  sharedProjectIds: [],
  _lastInviteTime: {},
  projectShares: [],
  agentQuestions: [],
  rightPanelOpen: true,
  _channels: [],

  initialize: async (userId) => {
    log.info('initialize_start', { userId })

    set({ dataLoading: true, userId })

    get()._channels.forEach(c => supabase.removeChannel(c))
    set({ _channels: [] })

    log.debug('initialize_fetching_data', { userId })

    let projectsRes, tasksRes, tagsRes, taskTagsRes, checklistRes, sharesRes, profilesRes

    try {
      const results = await Promise.all([
        supabase.from('projects').select('*').order('sort_order'),
        supabase.from('tasks').select('*').order('sort_order'),
        supabase.from('tags').select('*').eq('user_id', userId).order('title'),
        supabase.from('task_tags').select('*'),
        supabase.from('task_checklist_items').select('*'),
        supabase.from('project_shares').select('*').or(`shared_by.eq.${userId},shared_with.eq.${userId}`),
        supabase.from('profiles').select('*').limit(200),
      ])
      ;[projectsRes, tasksRes, tagsRes, taskTagsRes, checklistRes, sharesRes, profilesRes] = results
    } catch (err) {
      log.error('initialize_promise_all_failed', err, { userId })
      set({ dataLoading: false })
      return
    }

    if (projectsRes?.error) log.error('initialize_fetch_failed', projectsRes.error, { entity: 'projects' })
    if (tasksRes?.error) log.error('initialize_fetch_failed', tasksRes.error, { entity: 'tasks' })
    if (tagsRes?.error) log.error('initialize_fetch_failed', tagsRes.error, { entity: 'tags' })
    if (taskTagsRes?.error) log.error('initialize_fetch_failed', taskTagsRes.error, { entity: 'task_tags' })
    if (checklistRes?.error) log.error('initialize_fetch_failed', checklistRes.error, { entity: 'checklist_items' })
    if (sharesRes?.error) log.error('initialize_fetch_failed', sharesRes.error, { entity: 'project_shares' })
    if (profilesRes?.error) log.error('initialize_fetch_failed', profilesRes.error, { entity: 'profiles' })

    const tasks = (tasksRes?.data ?? []).map(taskFromRow)
    const projectShares = (sharesRes?.data ?? []).map(projectShareFromRow)
    const profiles = (profilesRes?.data ?? []).map(profileFromRow)

    const sharedProjectIds = projectShares
      .filter(s => s.sharedWith === userId && s.status === 'active')
      .map(s => s.projectId)

    const taskTagMap = new Map<string, string[]>()
    for (const row of (taskTagsRes?.data ?? []) as Array<{ task_id: string; tag_id: string }>) {
      const existing = taskTagMap.get(row.task_id)
      if (existing) existing.push(row.tag_id)
      else taskTagMap.set(row.task_id, [row.tag_id])
    }

    for (const task of tasks) {
      const ids = taskTagMap.get(task.id)
      if (ids) task.tagIds = ids
    }

    const projects = (projectsRes?.data ?? []).map(projectFromRow)
    const tags = (tagsRes?.data ?? []).map(tagFromRow)
    const checklistItems = (checklistRes?.data ?? []).map(checklistItemFromRow)

    const isFirstTime = tasks.length === 0 && projects.length === 0 && tags.length === 0

    set({ projects, tasks, tags, checklistItems, projectShares, sharedProjectIds, profiles })

    log.info('initialize_data_loaded', {
      projects: projects.length,
      tasks: tasks.length,
      tags: tags.length,
      checklistItems: checklistItems.length,
      projectShares: projectShares.length,
      profiles: profiles.length,
      sharedProjectIds: sharedProjectIds.length,
      isFirstTime,
    })

    if (isFirstTime) {
      log.info('initialize_seeding_onboarding_data')
      await get().seedOnboardingData()
    }

    set({ dataLoading: false })
    log.info('initialize_complete')

    const tasksChannel = supabase.channel(`tasks-${userId}`)
      .on('postgres_changes' as never,
        { event: '*', schema: 'public', table: 'tasks', filter: `or(user_id.eq.${userId},assigned_to.eq.${userId})` },
        (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          const store = useTaskStore.getState()
          if (!store.userId) return
          if (payload.eventType === 'INSERT') {
            const task = taskFromRow(payload.new)
            if (!store.tasks.find(t => t.id === task.id)) {
              set(s => ({ tasks: [...s.tasks, task] }))
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = taskFromRow(payload.new)
            set(s => ({
              tasks: s.tasks.map(t => t.id === updated.id ? updated : t),
            }))
          } else if (payload.eventType === 'DELETE') {
            set(s => ({
              tasks: s.tasks.filter(t => t.id !== (payload.old.id as string)),
            }))
          }
        }
      )
      .subscribe()

    const sharesChannel = supabase.channel(`shares-${userId}`)
      .on('postgres_changes' as never,
        { event: '*', schema: 'public', table: 'project_shares', filter: `shared_with=eq.${userId}` },
        () => {
          const store = useTaskStore.getState()
          if (store.userId) store.initialize(store.userId)
        }
      )
      .subscribe()

    set(s => ({ _channels: [...s._channels, tasksChannel, sharesChannel] }))

    await get().loadAgentQuestions()
  },

  seedOnboardingData: async () => {
    const userId = get().userId
    if (!userId) return

    const now = new Date().toISOString()
    const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)
    const uid = () => crypto.randomUUID()

    const tagHighPriority = uid()
    const tagFun = uid()
    const tagHealth = uid()
    const tagFinance = uid()
    const tagLearning = uid()
    const tagIdeas = uid()

    const tags: Tag[] = [
      { id: tagHighPriority, title: 'high priority', color: 'red' as const, createdAt: now },
      { id: tagFun, title: 'fun', color: 'yellow' as const, createdAt: now },
      { id: tagHealth, title: 'health', color: 'teal' as const, createdAt: now },
      { id: tagFinance, title: 'finance', color: 'green' as const, createdAt: now },
      { id: tagLearning, title: 'learning', color: 'blue' as const, createdAt: now },
      { id: tagIdeas, title: 'ideas', color: 'purple' as const, createdAt: now },
    ]

    const projWelcome = uid()
    const projVacation = uid()
    const projHome = uid()
    const projSide = uid()

    const projects: Project[] = [
      { id: projWelcome, title: 'Welcome to Doing', color: 'blue' as const, sortOrder: 0, createdAt: now, userId, aiGenerationMetadata: null },
      { id: projVacation, title: 'Plan a Vacation', color: 'green' as const, sortOrder: 1, createdAt: now, userId, aiGenerationMetadata: null },
      { id: projHome, title: 'Home Projects', color: 'orange' as const, sortOrder: 2, createdAt: now, userId, aiGenerationMetadata: null },
      { id: projSide, title: 'Side Projects', color: 'purple' as const, sortOrder: 3, createdAt: now, userId, aiGenerationMetadata: null },
    ]

    let s = 0

    const tkWelcomeNavigate = uid()
    const tkWelcomeQuickEntry = uid()
    const tkWelcomeToday = uid()
    const tkWelcomeChecklist = uid()
    const tkWelcomeComplete = uid()

    const tkVacationFlights = uid()
    const tkVacationHotels = uid()
    const tkVacationInsurance = uid()
    const tkVacationPack = uid()
    const tkVacationBank = uid()
    const tkVacationTransfer = uid()

    const tkHomeFaucet = uid()
    const tkHomeHerbs = uid()
    const tkHomeKitchen = uid()
    const tkHomeStretch = uid()

    const tkSideRust = uid()
    const tkSideAtomic = uid()
    const tkSideStory = uid()
    const tkSidePortfolio = uid()

    const tkInboxGym = uid()
    const tkInboxDentist = uid()
    const tkInboxCard = uid()
    const tkInboxBirthday = uid()

    const tasks: Task[] = [
      {
        id: tkWelcomeNavigate, title: 'Navigate with the sidebar',
        notes: 'The sidebar shows your views: Inbox for quick capture, Today for what\'s on your plate, Someday for ideas, All for everything, and your Projects below.',
        projectId: projWelcome, dueDate: null, isToday: false, isSomeday: false,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },
      {
        id: tkWelcomeQuickEntry, title: 'Try Quick Entry (\u2318K)',
        notes: 'Press \u2318K (or Ctrl+K on Windows) to open the command palette. Add tasks from anywhere without leaving your current view.',
        projectId: projWelcome, dueDate: null, isToday: false, isSomeday: false,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },
      {
        id: tkWelcomeToday, title: 'Tag a task with Today',
        notes: 'This task appears in Today because it has the today flag. Click the sun icon on any task or set it in Quick Entry to use this view.',
        projectId: projWelcome, dueDate: null, isToday: true, isSomeday: false,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },
      {
        id: tkWelcomeChecklist, title: 'Try a checklist',
        notes: 'Break tasks into smaller steps with checklists. Click the checklist icon on this task to see the items below.',
        projectId: projWelcome, dueDate: null, isToday: false, isSomeday: false,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },
      {
        id: tkWelcomeComplete, title: 'Complete this task to see it in Logbook',
        notes: '',
        projectId: projWelcome, dueDate: null, isToday: false, isSomeday: false,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },

      {
        id: tkVacationFlights, title: 'Book flights',
        notes: 'Compare prices on Skyscanner and book early for the best deals.',
        projectId: projVacation, dueDate: inDays(30), isToday: false, isSomeday: false,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },
      {
        id: tkVacationHotels, title: 'Research hotels',
        notes: '',
        projectId: projVacation, dueDate: null, isToday: false, isSomeday: false,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },
      {
        id: tkVacationInsurance, title: 'Get travel insurance',
        notes: 'Check if your credit card offers travel insurance. World Nomads is a good alternative.',
        projectId: projVacation, dueDate: null, isToday: false, isSomeday: false,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },
      {
        id: tkVacationPack, title: 'Pack suitcase',
        notes: '',
        projectId: projVacation, dueDate: null, isToday: false, isSomeday: false,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },
      {
        id: tkVacationBank, title: 'Notify bank of travel',
        notes: '',
        projectId: projVacation, dueDate: null, isToday: false, isSomeday: false,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },
      {
        id: tkVacationTransfer, title: 'Book airport transfer',
        notes: '',
        projectId: projVacation, dueDate: inDays(30), isToday: false, isSomeday: false,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },

      {
        id: tkHomeFaucet, title: 'Fix leaky faucet',
        notes: 'Check the washer in the kitchen faucet. Might need a replacement from the hardware store.',
        projectId: projHome, dueDate: null, isToday: false, isSomeday: false,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },
      {
        id: tkHomeHerbs, title: 'Plant herbs on balcony',
        notes: 'Basil, mint, and rosemary would be great for cooking.',
        projectId: projHome, dueDate: null, isToday: true, isSomeday: false,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },
      {
        id: tkHomeKitchen, title: 'Deep clean kitchen',
        notes: '',
        projectId: projHome, dueDate: null, isToday: false, isSomeday: false,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },
      {
        id: tkHomeStretch, title: 'Morning stretch',
        notes: 'Ten minutes of stretching to start the day right.',
        projectId: projHome, dueDate: null, isToday: true, isSomeday: false,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: 'daily' as const, status: 'not_started', assignedTo: null, assignedBy: null,
      },

      {
        id: tkSideRust, title: 'Learn Rust',
        notes: '',
        projectId: projSide, dueDate: null, isToday: false, isSomeday: true,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },
      {
        id: tkSideAtomic, title: 'Read Atomic Habits',
        notes: 'Highly recommended by multiple friends.',
        projectId: projSide, dueDate: null, isToday: false, isSomeday: true,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },
      {
        id: tkSideStory, title: 'Write a short story',
        notes: '',
        projectId: projSide, dueDate: null, isToday: false, isSomeday: true,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },
      {
        id: tkSidePortfolio, title: 'Design personal portfolio',
        notes: '',
        projectId: projSide, dueDate: null, isToday: false, isSomeday: true,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },

      {
        id: tkInboxGym, title: 'Renew gym membership',
        notes: '',
        projectId: null, dueDate: inDays(14), isToday: false, isSomeday: false,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },
      {
        id: tkInboxDentist, title: 'Schedule dentist appointment',
        notes: 'Last visit was eight months ago. Time for a check-up.',
        projectId: null, dueDate: null, isToday: false, isSomeday: false,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },
      {
        id: tkInboxCard, title: 'Review credit card statement',
        notes: '',
        projectId: null, dueDate: null, isToday: false, isSomeday: false,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s++, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },
      {
        id: tkInboxBirthday, title: 'Plan birthday dinner',
        notes: 'Check which restaurants have availability.',
        projectId: null, dueDate: null, isToday: true, isSomeday: false,
        completed: false, completedAt: null, deletedAt: null, createdAt: now, sortOrder: s, tagIds: [], repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      },
    ]

    const taskTagMappings: { taskId: string; tagId: string }[] = [
      { taskId: tkVacationFlights, tagId: tagHighPriority },
      { taskId: tkVacationHotels, tagId: tagHighPriority },
      { taskId: tkHomeHerbs, tagId: tagFun },
      { taskId: tkHomeStretch, tagId: tagHealth },
      { taskId: tkSideRust, tagId: tagLearning },
      { taskId: tkSideAtomic, tagId: tagLearning },
      { taskId: tkSideStory, tagId: tagFun },
      { taskId: tkSidePortfolio, tagId: tagIdeas },
      { taskId: tkInboxGym, tagId: tagHealth },
      { taskId: tkInboxDentist, tagId: tagHealth },
      { taskId: tkInboxCard, tagId: tagFinance },
      { taskId: tkInboxBirthday, tagId: tagFun },
      { taskId: tkVacationBank, tagId: tagFinance },
    ]

    const taskTagRows = taskTagMappings.map(m => ({ task_id: m.taskId, tag_id: m.tagId }))

    const checklistItems: ChecklistItem[] = [
      { id: uid(), taskId: tkWelcomeChecklist, title: 'Write a task', completed: false, sortOrder: 0, createdAt: now },
      { id: uid(), taskId: tkWelcomeChecklist, title: 'Add checklist items', completed: false, sortOrder: 1, createdAt: now },
      { id: uid(), taskId: tkWelcomeChecklist, title: 'Check them off', completed: false, sortOrder: 2, createdAt: now },
      { id: uid(), taskId: tkVacationHotels, title: 'Search neighborhoods', completed: false, sortOrder: 0, createdAt: now },
      { id: uid(), taskId: tkVacationHotels, title: 'Read reviews', completed: false, sortOrder: 1, createdAt: now },
      { id: uid(), taskId: tkVacationHotels, title: 'Compare prices', completed: false, sortOrder: 2, createdAt: now },
      { id: uid(), taskId: tkVacationHotels, title: 'Book', completed: false, sortOrder: 3, createdAt: now },
      { id: uid(), taskId: tkVacationPack, title: 'Clothes', completed: false, sortOrder: 0, createdAt: now },
      { id: uid(), taskId: tkVacationPack, title: 'Toiletries', completed: false, sortOrder: 1, createdAt: now },
      { id: uid(), taskId: tkVacationPack, title: 'Chargers', completed: false, sortOrder: 2, createdAt: now },
      { id: uid(), taskId: tkVacationPack, title: 'Passport', completed: false, sortOrder: 3, createdAt: now },
      { id: uid(), taskId: tkHomeKitchen, title: 'Clean oven', completed: false, sortOrder: 0, createdAt: now },
      { id: uid(), taskId: tkHomeKitchen, title: 'Defrost freezer', completed: false, sortOrder: 1, createdAt: now },
      { id: uid(), taskId: tkHomeKitchen, title: 'Organize pantry', completed: false, sortOrder: 2, createdAt: now },
    ]

    const results = await Promise.all([
      supabase.from('tags').insert(tags.map(t => tagToRow(t, userId))),
      supabase.from('projects').insert(projects.map(p => projectToRow(p, userId))),
      supabase.from('tasks').insert(tasks.map(t => taskToRow(t, userId))),
      supabase.from('task_tags').insert(taskTagRows),
      supabase.from('task_checklist_items').insert(checklistItems.map(i => checklistItemToRow(i))),
    ])

    const errors = results.filter(r => r.error)
    if (errors.length) {
      log.error('seed_onboarding_data_failed', errors)
      return
    }

    for (const task of tasks) {
      task.tagIds = taskTagMappings.filter(m => m.taskId === task.id).map(m => m.tagId)
    }

    set(s => ({
      tags: [...s.tags, ...tags],
      projects: [...s.projects, ...projects],
      tasks: [...s.tasks, ...tasks],
      checklistItems: [...s.checklistItems, ...checklistItems],
    }))
  },

  clearAll: () => {
    get()._channels.forEach(c => supabase.removeChannel(c))
    set({
      userId: null,
      tasks: [],
      projects: [],
      tags: [],
      checklistItems: [],
      profiles: [],
      activeView: 'home',
      activeProjectId: null,
      activeTagId: null,
      dataLoading: true,
      trashUndo: null,
      sharedProjectIds: [],
      projectShares: [],
      _lastInviteTime: {},
      _channels: [],
    })
  },

  addTask: async ({ title, notes, projectId, dueDate, isToday, isSomeday, tagIds, repeat }) => {
    const userId = get().userId
    if (!userId) return

    const id = crypto.randomUUID()
    const sortOrder = get().tasks.reduce((max, t) => Math.max(max, t.sortOrder), 0) + 1
    const now = new Date().toISOString()

    const task: Task = {
      id, title, notes: notes ?? '', projectId: projectId ?? null,
      status: 'not_started',
      dueDate: dueDate ?? null, isToday: isToday ?? false,
      isSomeday: isSomeday ?? false,
      completed: false, completedAt: null, deletedAt: null,
      createdAt: now, sortOrder, tagIds: tagIds ?? [],
      repeat: repeat ?? null,
      assignedTo: null, assignedBy: null,
    }

    set(state => ({ tasks: [...state.tasks, task] }))

    const { error } = await supabase.from('tasks').insert(taskToRow(task, userId))
    if (error) {
      log.error('add_task_failed', error, { taskId: id, title: task.title })
      set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }))
      return
    }

    if (tagIds && tagIds.length > 0) {
      const tagRows = tagIds.map(tagId => ({ task_id: id, tag_id: tagId }))
      const { error: tagError } = await supabase.from('task_tags').insert(tagRows)
      if (tagError) log.error('add_task_tags_failed', tagError, { taskId: id })
    }
  },

  updateTask: async (id, updates) => {
    const userId = get().userId
    if (!userId) return

    set(state => ({
      tasks: state.tasks.map(t => (t.id === id ? { ...t, ...updates } : t)),
    }))

    const { error } = await supabase.from('tasks').update(taskToRow({ ...get().tasks.find(t => t.id === id), ...updates } as Task, userId)).eq('id', id)
    if (error) {
      log.error('update_task_failed', error, { taskId: id })
    }
  },

  softDeleteTask: async (id) => {
    const prev = get().tasks.find(t => t.id === id)
    if (!prev) return

    const now = new Date().toISOString()

    set(state => ({
      tasks: state.tasks.map(t => (t.id === id ? { ...t, deletedAt: now } : t)),
      trashUndo: { taskId: id, title: prev.title },
    }))

    const { error } = await supabase.from('tasks').update({ deleted_at: now }).eq('id', id)
    if (error) {
      log.error('soft_delete_task_failed', error, { taskId: id })
      set(state => ({
        tasks: state.tasks.map(t => (t.id === id ? prev : t)),
        trashUndo: null,
      }))
    }
  },

  restoreTask: async (id) => {
    set(state => ({
      tasks: state.tasks.map(t => (t.id === id ? { ...t, deletedAt: null } : t)),
      trashUndo: null,
    }))

    const { error } = await supabase.from('tasks').update({ deleted_at: null }).eq('id', id)
    if (error) {
      log.error('restore_task_failed', error, { taskId: id })
    }
  },

  emptyTrash: async () => {
    const trashed = get().tasks.filter(t => t.deletedAt !== null)
    if (trashed.length === 0) return

    set(state => ({ tasks: state.tasks.filter(t => t.deletedAt === null) }))

    const results = await Promise.all(
      trashed.map(t => supabase.from('tasks').delete().eq('id', t.id))
    )

    const errors = results.filter(r => r.error)
    if (errors.length) {
      log.error('empty_trash_failed', errors, { count: trashed.length })
      set(state => ({ tasks: [...state.tasks, ...trashed] }))
    }
  },

  clearTrashUndo: () => {
    set({ trashUndo: null })
  },

  deleteTask: async (id) => {
    const prev = get().tasks.find(t => t.id === id)
    if (!prev) return

    const prevItems = get().checklistItems.filter(i => i.taskId === id)

    set(state => ({
      tasks: state.tasks.filter(t => t.id !== id),
      checklistItems: state.checklistItems.filter(i => i.taskId !== id),
    }))

    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) {
      log.error('delete_task_failed', error, { taskId: id })
      set(state => ({
        tasks: [...state.tasks, prev],
        checklistItems: [...state.checklistItems, ...prevItems],
      }))
    }
  },

  toggleTask: async (id) => {
    const prev = get().tasks.find(t => t.id === id)
    if (!prev) return

    const now = new Date().toISOString()
    const completing = !prev.completed
    const updated = { ...prev, completed: completing, completedAt: completing ? now : null }

    let repeatTaskId: string | undefined

    set(state => ({
      tasks: state.tasks.map(t => (t.id === id ? updated : t)),
    }))

    if (completing && prev.repeat) {
      const nextDueDate = computeNextDate(prev.repeat, prev.dueDate)
      repeatTaskId = crypto.randomUUID()
      const sortOrder = get().tasks.reduce((max, t) => Math.max(max, t.sortOrder), 0) + 1
      const repeatTask: Task = {
        id: repeatTaskId,
        title: prev.title,
        notes: prev.notes,
        projectId: prev.projectId,
        status: 'not_started',
        dueDate: nextDueDate,
        isToday: prev.isToday,
        isSomeday: false,
        completed: false,
        completedAt: null,
        deletedAt: null,
        createdAt: now,
        sortOrder,
        tagIds: [...prev.tagIds],
        repeat: prev.repeat,
        assignedTo: null,
        assignedBy: null,
      }

      set(state => ({ tasks: [...state.tasks, repeatTask] }))
    }

    const results = await Promise.all([
      supabase.from('tasks').update({
        completed: updated.completed,
        completed_at: updated.completedAt,
      }).eq('id', id),
      ...(repeatTaskId ? [supabase.from('tasks').insert(taskToRow(get().tasks.find(t => t.id === repeatTaskId)!, get().userId!))] : []),
      ...(repeatTaskId && prev.tagIds.length > 0
        ? [supabase.from('task_tags').insert(prev.tagIds.map(tagId => ({ task_id: repeatTaskId, tag_id: tagId })))]
        : []),
    ])

    const errors = results.filter(r => r.error)
    if (errors.length) {
      log.error('toggle_task_failed', errors, { taskId: id, completing })
      set(state => ({
        tasks: state.tasks.filter(t => t.id !== repeatTaskId).map(t => (t.id === id ? prev : t)),
      }))
    }
  },

  setTaskStatus: async (id, status) => {
    set(state => ({
      tasks: state.tasks.map(t => (t.id === id ? { ...t, status } : t)),
    }))
    const { error } = await supabase.from('tasks').update({ status }).eq('id', id)
    if (error) {
      log.error('set_task_status_failed', error, { taskId: id, status })
    }
  },

  addProject: async (title) => {
    const userId = get().userId
    if (!userId) return ''

    const usedColors = new Set(get().projects.map(p => p.color))
    const color: ProjectColor = (Object.keys(PROJECT_COLOR_MAP) as ProjectColor[]).find(c => !usedColors.has(c)) ?? 'gray'
    const sortOrder = get().projects.length

    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const project: Project = { id, title, color, sortOrder, createdAt: now, userId, aiGenerationMetadata: null }

    set(state => ({ projects: [...state.projects, project] }))

    const { error } = await supabase.from('projects').insert(projectToRow(project, userId))
    if (error) {
      log.error('add_project_failed', error, { projectId: id, title })
      set(state => ({ projects: state.projects.filter(p => p.id !== id) }))
      return ''
    }
    return id
  },

  updateProject: async (id, updates) => {
    const userId = get().userId
    if (!userId) return

    const prev = get().projects.find(p => p.id === id)

    set(state => ({
      projects: state.projects.map(p => (p.id === id ? { ...p, ...updates } : p)),
    }))

    const { error } = await supabase.from('projects').update(projectToRow({ ...prev, ...updates } as Project, userId)).eq('id', id)
    if (error) {
      log.error('update_project_failed', error, { projectId: id })
    }
  },

  deleteProject: async (id) => {
    const prevState = get()

    const newActiveView = prevState.activeView === 'project' && prevState.activeProjectId === id
      ? 'today' as ViewType
      : prevState.activeView

    set({
      projects: prevState.projects.filter(p => p.id !== id),
      tasks: prevState.tasks.map(t => t.projectId === id ? { ...t, projectId: null } : t),
      activeView: newActiveView,
      activeProjectId: newActiveView === 'project' ? prevState.activeProjectId : null,
    })

    const [projectRes, tasksRes] = await Promise.all([
      supabase.from('projects').delete().eq('id', id),
      supabase.from('tasks').update({ project_id: null }).eq('project_id', id),
    ])

    if (projectRes.error || tasksRes.error) {
      log.error('delete_project_failed', projectRes.error ?? tasksRes.error, { projectId: id })
      set(prevState)
    }
  },

  materializePlan: async (planDraft, aiMetadata) => {
    const userId = get().userId
    if (!userId) return null

    const projectId = await get().addProject(planDraft.projectTitle)
    if (!projectId) {
      return null
    }

    get().updateProject(projectId, {
      color: planDraft.projectColor,
      aiGenerationMetadata: aiMetadata,
    })

    for (let i = 0; i < planDraft.tasks.length; i++) {
      const task = planDraft.tasks[i]
      const dueDate = task.dueDate && task.dueDate.trim() ? task.dueDate : undefined
      await get().addTask({
        title: task.title,
        notes: task.notes ?? '',
        projectId,
        dueDate,
        tagIds: [],
      })
    }

    return projectId
  },

  setActiveView: (view, projectId) => {
    log.info('set_active_view', { view, projectId })
    set({
      activeView: view,
      activeProjectId: view === 'project' ? projectId ?? null : null,
    })
  },

  moveTaskToToday: async (id) => {
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, isToday: true } : t),
    }))

    const { error } = await supabase.from('tasks').update({ is_today: true }).eq('id', id)
    if (error) {
      log.error('move_task_to_today_failed', error, { taskId: id })
    }
  },

  removeTaskFromToday: async (id) => {
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, isToday: false } : t),
    }))

    const { error } = await supabase.from('tasks').update({ is_today: false }).eq('id', id)
    if (error) {
      log.error('remove_task_from_today_failed', error, { taskId: id })
    }
  },

  moveTaskToSomeday: async (id) => {
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, isSomeday: true } : t),
    }))

    const { error } = await supabase.from('tasks').update({ is_someday: true }).eq('id', id)
    if (error) {
      log.error('move_task_to_someday_failed', error, { taskId: id })
    }
  },

  removeTaskFromSomeday: async (id) => {
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, isSomeday: false } : t),
    }))

    const { error } = await supabase.from('tasks').update({ is_someday: false }).eq('id', id)
    if (error) {
      log.error('remove_task_from_someday_failed', error, { taskId: id })
    }
  },

  reorderTasks: async (orderedIds) => {
    const userId = get().userId
    if (!userId) return

    const updatedTasks = get().tasks.map(t => {
      const idx = orderedIds.indexOf(t.id)
      return idx >= 0 ? { ...t, sortOrder: idx } : t
    })

    set({ tasks: updatedTasks })

    const results = await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from('tasks').update({ sort_order: index }).eq('id', id)
      )
    )

    const errors = results.filter(r => r.error)
    if (errors.length) log.error('reorder_tasks_failed', errors)
  },

  reorderProjects: async (orderedIds) => {
    const userId = get().userId
    if (!userId) return

    const updatedProjects = get().projects.map(p => {
      const idx = orderedIds.indexOf(p.id)
      return idx >= 0 ? { ...p, sortOrder: idx } : p
    })

    set({ projects: updatedProjects })

    const results = await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from('projects').update({ sort_order: index }).eq('id', id)
      )
    )

    const errors = results.filter(r => r.error)
    if (errors.length) log.error('reorder_projects_failed', errors)
  },

  moveTaskToProject: async (taskId, projectId) => {
    set(state => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, projectId } : t),
    }))

    const { error } = await supabase.from('tasks').update({ project_id: projectId }).eq('id', taskId)
    if (error) {
      log.error('move_task_failed', error, { taskId, projectId })
    }
  },

  addTag: async (title) => {
    const userId = get().userId
    if (!userId) return

    const tagId = crypto.randomUUID()
    const now = new Date().toISOString()
    const usedColors = new Set(get().tags.map(t => t.color))
    const color: TagColor = (Object.keys(TAG_COLOR_MAP) as TagColor[]).find(c => !usedColors.has(c)) ?? 'gray'
    const tag: Tag = { id: tagId, title, color, createdAt: now }

    set(state => ({ tags: [...state.tags, tag] }))

    const { error } = await supabase.from('tags').insert(tagToRow(tag, userId))
    if (error) {
      log.error('add_tag_failed', error, { tagId, title })
      set(state => ({ tags: state.tags.filter(t => t.id !== tagId) }))
    }
  },

  updateTag: async (id, updates) => {
    set(state => ({
      tags: state.tags.map(t => (t.id === id ? { ...t, ...updates } : t)),
    }))

    const { error } = await supabase.from('tags').update(updates).eq('id', id)
    if (error) {
      log.error('update_tag_failed', error, { tagId: id })
    }
  },

  deleteTag: async (id) => {
    const prev = get()

    set(state => ({
      tags: state.tags.filter(t => t.id !== id),
      tasks: state.tasks.map(t => ({
        ...t,
        tagIds: t.tagIds.filter(tagId => tagId !== id),
      })),
      activeTagId: state.activeTagId === id ? null : state.activeTagId,
    }))

    const [tagRes, taskTagsRes] = await Promise.all([
      supabase.from('tags').delete().eq('id', id),
      supabase.from('task_tags').delete().eq('tag_id', id),
    ])

    if (tagRes.error || taskTagsRes.error) {
      log.error('delete_tag_failed', tagRes.error ?? taskTagsRes.error, { tagId: id })
      set(prev)
    }
  },

  toggleTaskTag: async (taskId, tagId) => {
    const prev = get().tasks.find(t => t.id === taskId)
    if (!prev) return

    const hasTag = prev.tagIds.includes(tagId)
    const updatedTagIds = hasTag
      ? prev.tagIds.filter(id => id !== tagId)
      : [...prev.tagIds, tagId]

    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, tagIds: updatedTagIds } : t
      ),
    }))

    if (hasTag) {
      const { error } = await supabase.from('task_tags').delete().eq('task_id', taskId).eq('tag_id', tagId)
      if (error) {
        log.error('remove_task_tag_failed', error, { taskId, tagId })
        set(state => ({
          tasks: state.tasks.map(t => (t.id === taskId ? prev : t)),
        }))
      }
    } else {
      const { error } = await supabase.from('task_tags').insert({ task_id: taskId, tag_id: tagId })
      if (error) {
        log.error('add_task_tag_failed', error, { taskId, tagId })
        set(state => ({
          tasks: state.tasks.map(t => (t.id === taskId ? prev : t)),
        }))
      }
    }
  },

  setActiveTagId: (tagId) => {
    set({ activeTagId: tagId })
  },

  addChecklistItem: async (taskId, title) => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const existing = get().checklistItems.filter(i => i.taskId === taskId)
    const sortOrder = existing.length

    const item: ChecklistItem = { id, taskId, title, completed: false, sortOrder, createdAt: now }

    set(state => ({
      checklistItems: [...state.checklistItems, item],
    }))

    const { error } = await supabase.from('task_checklist_items').insert(checklistItemToRow(item))
    if (error) {
      log.error('add_checklist_item_failed', error, { itemId: id, taskId })
      set(state => ({
        checklistItems: state.checklistItems.filter(i => i.id !== id),
      }))
    }
  },

  toggleChecklistItem: async (id) => {
    const prev = get().checklistItems.find(i => i.id === id)
    if (!prev) return

    const updated = { ...prev, completed: !prev.completed }

    set(state => ({
      checklistItems: state.checklistItems.map(i => (i.id === id ? updated : i)),
    }))

    const { error } = await supabase.from('task_checklist_items').update({ completed: updated.completed }).eq('id', id)
    if (error) {
      log.error('toggle_checklist_item_failed', error, { itemId: id })
      set(state => ({
        checklistItems: state.checklistItems.map(i => (i.id === id ? prev : i)),
      }))
    }
  },

  updateChecklistItem: async (id, title) => {
    set(state => ({
      checklistItems: state.checklistItems.map(i => (i.id === id ? { ...i, title } : i)),
    }))

    const { error } = await supabase.from('task_checklist_items').update({ title }).eq('id', id)
    if (error) {
      log.error('update_checklist_item_failed', error, { itemId: id })
    }
  },

  deleteChecklistItem: async (id) => {
    const prev = get().checklistItems.find(i => i.id === id)
    if (!prev) return

    set(state => ({
      checklistItems: state.checklistItems.filter(i => i.id !== id),
    }))

    const { error } = await supabase.from('task_checklist_items').delete().eq('id', id)
    if (error) {
      log.error('delete_checklist_item_failed', error, { itemId: id })
      set(state => ({
        checklistItems: [...state.checklistItems, prev],
      }))
    }
  },

  reorderChecklistItems: async (_taskId, orderedIds) => {
    const updated = get().checklistItems.map(i => {
      const idx = orderedIds.indexOf(i.id)
      return idx >= 0 ? { ...i, sortOrder: idx } : i
    })

    set({ checklistItems: updated })

    const results = await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from('task_checklist_items').update({ sort_order: index }).eq('id', id)
      )
    )

    const errors = results.filter(r => r.error)
    if (errors.length) log.error('reorder_checklist_items_failed', errors)
  },

  updateRepeat: async (id, repeat) => {
    set(state => ({
      tasks: state.tasks.map(t => (t.id === id ? { ...t, repeat } : t)),
    }))

    const { error } = await supabase.from('tasks').update({ repeat_interval: repeat }).eq('id', id)
    if (error) {
      log.error('update_repeat_failed', error, { taskId: id, repeat })
    }
  },

  assignTask: async (taskId, friendUserId) => {
    const userId = get().userId
    if (!userId) return

    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, assignedTo: friendUserId, assignedBy: userId } : t
      ),
    }))

    const { error } = await supabase.from('tasks').update({
      assigned_to: friendUserId,
      assigned_by: userId,
    }).eq('id', taskId)

    if (error) {
      log.error('assign_task_failed', error, { taskId, friendUserId })
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === taskId ? { ...t, assignedTo: null, assignedBy: null } : t
        ),
      }))
    }
  },

  unassignTask: async (taskId) => {
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, assignedTo: null, assignedBy: null } : t
      ),
    }))

    const { error } = await supabase.from('tasks').update({
      assigned_to: null,
      assigned_by: null,
    }).eq('id', taskId)

    if (error) {
      log.error('unassign_task_failed', error, { taskId })
    }
  },

  shareProjectByEmail: async (projectId, email) => {
    const userId = get().userId
    if (!userId) return

    const normalizedEmail = email.toLowerCase().trim()
    const now = Date.now()
    const lastTime = get()._lastInviteTime[normalizedEmail]
    const cooldown = 10_000
    if (lastTime && now - lastTime < cooldown) return

    set(s => ({ _lastInviteTime: { ...s._lastInviteTime, [normalizedEmail]: now } }))

    const { data: profile } = await supabase.from('profiles')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (profile) {
      const existing = get().projectShares.find(
        s => s.projectId === projectId && s.sharedWith === profile.id
      )
      if (existing) return

      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      const share: ProjectShare = {
        id, projectId, sharedBy: userId, sharedWith: profile.id,
        invitedEmail: null, status: 'active', permission: 'write',
        token: null, createdAt: now,
      }

      set(s => ({
        projectShares: [...s.projectShares, share],
        profiles: s.profiles.some(p => p.id === profile.id)
          ? s.profiles
          : [...s.profiles, profileFromRow(profile)],
      }))

      const { error } = await supabase.from('project_shares').insert({
        id, project_id: projectId, shared_by: userId, shared_with: profile.id,
        invited_email: null, status: 'active', permission: 'write', token: null, created_at: now,
      })

      if (error) {
        log.error('share_project_failed', error, { projectId, email: normalizedEmail })
        set(s => ({ projectShares: s.projectShares.filter(s => s.id !== id) }))
      }
    } else {
      const existing = get().projectShares.find(
        s => s.projectId === projectId && s.invitedEmail === normalizedEmail
      )
      if (existing) return

      const id = crypto.randomUUID()
      const token = crypto.randomUUID()
      const now = new Date().toISOString()
      const share: ProjectShare = {
        id, projectId, sharedBy: userId, sharedWith: null,
        invitedEmail: normalizedEmail, status: 'invited',
        permission: 'write', token, createdAt: now,
      }

      set(s => ({ projectShares: [...s.projectShares, share] }))

      const { error } = await supabase.from('project_shares').insert({
        id, project_id: projectId, shared_by: userId, shared_with: null,
        invited_email: normalizedEmail, status: 'invited',
        permission: 'write', token, created_at: now,
      })

      if (error) {
        log.error('create_invite_failed', error, { projectId, email: normalizedEmail })
        set(s => ({ projectShares: s.projectShares.filter(s => s.id !== id) }))
        return
      }

      try {
        const project = get().projects.find(p => p.id === projectId)
        const inviter = get().profiles.find(p => p.id === userId)
        await supabase.functions.invoke('send-invite', {
          body: {
            email: normalizedEmail,
            token,
            projectTitle: project?.title ?? 'a project',
            inviterName: inviter?.displayName ?? 'Someone',
          },
        })
      } catch (e) {
        log.error('send_invite_email_failed', e, { projectId, email: normalizedEmail })
      }
    }
  },

  removeShare: async (shareId) => {
    const prev = get().projectShares.find(s => s.id === shareId)
    if (!prev) return

    set(s => ({
      projectShares: s.projectShares.filter(s => s.id !== shareId),
      sharedProjectIds: prev.status === 'active'
        ? s.sharedProjectIds.filter(id => id !== prev.projectId)
        : s.sharedProjectIds,
    }))

    const { error } = await supabase.from('project_shares').delete().eq('id', shareId)

    if (error) {
      log.error('remove_share_failed', error, { shareId })
      set(s => ({
        projectShares: [...s.projectShares, prev],
        sharedProjectIds: prev.status === 'active'
          ? [...s.sharedProjectIds, prev.projectId]
          : s.sharedProjectIds,
      }))
    }
  },

  redeemInviteToken: async (token) => {
    const userId = get().userId
    if (!userId) return false

    const { data: shareRow } = await supabase.from('project_shares')
      .select('*')
      .eq('token', token)
      .eq('status', 'invited')
      .single()

    if (!shareRow) return false

    const share = projectShareFromRow(shareRow)

    await supabase.from('project_shares').update({
      shared_with: userId,
      status: 'active',
      token: null,
      invited_email: null,
    }).eq('id', share.id)

    set(s => ({
      projectShares: s.projectShares.map(s =>
        s.id === share.id
          ? { ...s, sharedWith: userId, status: 'active' as const, token: null, invitedEmail: null }
          : s
      ),
      sharedProjectIds: [...s.sharedProjectIds, share.projectId],
    }))

    await get().initialize(userId)
    return true
  },

  getProfileByEmail: async (email) => {
    const cached = get().profiles.find(p => p.email === email.toLowerCase().trim())
    if (cached) return cached

    const { data } = await supabase.from('profiles')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (data) {
      const profile = profileFromRow(data)
      set(s => ({
        profiles: s.profiles.some(p => p.id === profile.id)
          ? s.profiles
          : [...s.profiles, profile],
      }))
      return profile
    }

    return null
  },

  refreshProfiles: async () => {
    const userId = get().userId
    if (!userId) return

    const referencedIds = new Set<string>()
    referencedIds.add(userId)
    for (const share of get().projectShares) {
      if (share.sharedWith) referencedIds.add(share.sharedWith)
      if (share.sharedBy) referencedIds.add(share.sharedBy)
    }
    for (const task of get().tasks) {
      if (task.assignedTo) referencedIds.add(task.assignedTo)
      if (task.assignedBy) referencedIds.add(task.assignedBy)
    }

    const ids = [...referencedIds]
    if (ids.length === 0) return

    const { data } = await supabase.from('profiles').select('*').in('id', ids)
    if (data) {
      set({ profiles: data.map(profileFromRow) })
    }
  },

  loadAgentQuestions: async () => {
    const userId = get().userId
    if (!userId) return
    const { data } = await supabase
      .from('agent_questions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (data) {
      const questions: AgentQuestion[] = data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        projectId: r.project_id as string,
        conversationId: r.conversation_id as string,
        question: r.question as string,
        context: (r.context as string) ?? '',
        options: (r.options as { label: string; description?: string; value: string }[]) ?? [],
        agentRecommendation: r.agent_recommendation as string | undefined,
        status: (r.status as AgentQuestion['status']) ?? 'pending',
        response: r.response as string | undefined,
        createdAt: r.created_at as string,
        resolvedAt: r.resolved_at as string | undefined,
      }))
      set({ agentQuestions: questions })
    }
  },

  respondToQuestion: async (questionId, response) => {
    const prev = get().agentQuestions.find(q => q.id === questionId)
    if (!prev) return

    set(s => ({
      agentQuestions: s.agentQuestions.map(q =>
        q.id === questionId ? { ...q, status: 'resolved', response, resolvedAt: new Date().toISOString() } : q
      ),
    }))

    const { error } = await supabase
      .from('agent_questions')
      .update({ status: 'resolved', response, resolved_at: new Date().toISOString() })
      .eq('id', questionId)
    if (error) {
      log.error('respond_to_question_failed', error, { questionId })
      set(s => ({
        agentQuestions: s.agentQuestions.map(q => (q.id === questionId ? prev : q)),
      }))
    }
  },

  addAgentQuestion: (question) => {
    set(s => ({ agentQuestions: [question, ...s.agentQuestions] }))
  },

  toggleRightPanel: () => {
    set(s => ({ rightPanelOpen: !s.rightPanelOpen }))
  },

  setRightPanelOpen: (open) => {
    set({ rightPanelOpen: open })
  },
}))
