import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Task, Project, Tag, ChecklistItem, ViewType, ProjectColor, TagColor, RepeatInterval } from '../types'
import { PROJECT_COLORS, TAG_COLORS } from '../types'

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
  }
}

function taskToRow(task: Task, userId: string) {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    notes: task.notes,
    project_id: task.projectId,
    due_date: task.dueDate,
    is_today: task.isToday,
    is_someday: task.isSomeday,
    completed: task.completed,
    completed_at: task.completedAt,
    deleted_at: task.deletedAt,
    sort_order: task.sortOrder,
    created_at: task.createdAt,
    repeat_interval: task.repeat,
  }
}

function projectFromRow(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    title: row.title as string,
    color: row.color as ProjectColor,
    sortOrder: (row.sort_order as number) ?? 0,
    createdAt: row.created_at as string,
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

interface TrashUndo {
  taskId: string
  title: string
}

interface TaskStore {
  userId: string | null
  tasks: Task[]
  projects: Project[]
  tags: Tag[]
  checklistItems: ChecklistItem[]
  activeView: ViewType
  activeProjectId: string | null
  activeTagId: string | null
  dataLoading: boolean
  trashUndo: TrashUndo | null

  initialize: (userId: string) => Promise<void>
  clearAll: () => void

  addTask: (params: { title: string; notes?: string; projectId?: string; dueDate?: string; isToday?: boolean; isSomeday?: boolean; tagIds?: string[]; repeat?: RepeatInterval | null }) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  softDeleteTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  restoreTask: (id: string) => Promise<void>
  emptyTrash: () => Promise<void>
  clearTrashUndo: () => void
  toggleTask: (id: string) => Promise<void>

  addProject: (title: string) => Promise<void>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>

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
}

export const useTaskStore = create<TaskStore>()((set, get) => ({
  userId: null,
  tasks: [],
  projects: [],
  tags: [],
  checklistItems: [],
  activeView: 'inbox' as ViewType,
  activeProjectId: null,
  activeTagId: null,
  dataLoading: true,
  trashUndo: null,

  initialize: async (userId) => {
    set({ dataLoading: true, userId })

    const [projectsRes, tasksRes, tagsRes, taskTagsRes, checklistRes] = await Promise.all([
      supabase.from('projects').select('*').eq('user_id', userId).order('sort_order'),
      supabase.from('tasks').select('*').eq('user_id', userId).order('sort_order'),
      supabase.from('tags').select('*').eq('user_id', userId).order('title'),
      supabase.from('task_tags').select('*'),
      supabase.from('task_checklist_items').select('*'),
    ])

    const tasks = (tasksRes.data ?? []).map(taskFromRow)

    const taskTagMap = new Map<string, string[]>()
    for (const row of (taskTagsRes.data ?? []) as Array<{ task_id: string; tag_id: string }>) {
      const existing = taskTagMap.get(row.task_id)
      if (existing) existing.push(row.tag_id)
      else taskTagMap.set(row.task_id, [row.tag_id])
    }

    for (const task of tasks) {
      const ids = taskTagMap.get(task.id)
      if (ids) task.tagIds = ids
    }

    set({
      projects: (projectsRes.data ?? []).map(projectFromRow),
      tasks,
      tags: (tagsRes.data ?? []).map(tagFromRow),
      checklistItems: (checklistRes.data ?? []).map(checklistItemFromRow),
      dataLoading: false,
    })
  },

  clearAll: () => {
    set({
      userId: null,
      tasks: [],
      projects: [],
      tags: [],
      checklistItems: [],
      activeView: 'inbox',
      activeProjectId: null,
      activeTagId: null,
      dataLoading: true,
      trashUndo: null,
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
      dueDate: dueDate ?? null, isToday: isToday ?? false,
      isSomeday: isSomeday ?? false,
      completed: false, completedAt: null, deletedAt: null,
      createdAt: now, sortOrder, tagIds: tagIds ?? [],
      repeat: repeat ?? null,
    }

    set(state => ({ tasks: [...state.tasks, task] }))

    const { error } = await supabase.from('tasks').insert(taskToRow(task, userId))
    if (error) {
      console.error('Failed to add task:', error)
      set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }))
      return
    }

    if (tagIds && tagIds.length > 0) {
      const tagRows = tagIds.map(tagId => ({ task_id: id, tag_id: tagId }))
      const { error: tagError } = await supabase.from('task_tags').insert(tagRows)
      if (tagError) console.error('Failed to add task tags:', tagError)
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
      console.error('Failed to update task:', error)
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
      console.error('Failed to soft-delete task:', error)
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
      console.error('Failed to restore task:', error)
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
      console.error('Failed to empty trash:', errors)
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
      console.error('Failed to delete task:', error)
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
      console.error('Failed to toggle task:', errors)
      set(state => ({
        tasks: state.tasks.filter(t => t.id !== repeatTaskId).map(t => (t.id === id ? prev : t)),
      }))
    }
  },

  addProject: async (title) => {
    const userId = get().userId
    if (!userId) return

    const usedColors = get().projects.map(p => p.color)
    const color: ProjectColor = PROJECT_COLORS.find(c => !usedColors.includes(c)) ?? 'gray'
    const sortOrder = get().projects.length

    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const project: Project = { id, title, color, sortOrder, createdAt: now }

    set(state => ({ projects: [...state.projects, project] }))

    const { error } = await supabase.from('projects').insert(projectToRow(project, userId))
    if (error) {
      console.error('Failed to add project:', error)
      set(state => ({ projects: state.projects.filter(p => p.id !== id) }))
    }
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
      console.error('Failed to update project:', error)
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
      console.error('Failed to delete project:', projectRes.error ?? tasksRes.error)
      set(prevState)
    }
  },

  setActiveView: (view, projectId) => {
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
      console.error('Failed to move task to today:', error)
    }
  },

  removeTaskFromToday: async (id) => {
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, isToday: false } : t),
    }))

    const { error } = await supabase.from('tasks').update({ is_today: false }).eq('id', id)
    if (error) {
      console.error('Failed to remove task from today:', error)
    }
  },

  moveTaskToSomeday: async (id) => {
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, isSomeday: true } : t),
    }))

    const { error } = await supabase.from('tasks').update({ is_someday: true }).eq('id', id)
    if (error) {
      console.error('Failed to move task to someday:', error)
    }
  },

  removeTaskFromSomeday: async (id) => {
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, isSomeday: false } : t),
    }))

    const { error } = await supabase.from('tasks').update({ is_someday: false }).eq('id', id)
    if (error) {
      console.error('Failed to remove task from someday:', error)
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
    if (errors.length) console.error('Failed to reorder tasks:', errors)
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
    if (errors.length) console.error('Failed to reorder projects:', errors)
  },

  moveTaskToProject: async (taskId, projectId) => {
    set(state => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, projectId } : t),
    }))

    const { error } = await supabase.from('tasks').update({ project_id: projectId }).eq('id', taskId)
    if (error) {
      console.error('Failed to move task:', error)
    }
  },

  addTag: async (title) => {
    const userId = get().userId
    if (!userId) return

    const tagId = crypto.randomUUID()
    const now = new Date().toISOString()
    const usedColors = get().tags.map(t => t.color)
    const color: TagColor = TAG_COLORS.find(c => !usedColors.includes(c)) ?? 'gray'
    const tag: Tag = { id: tagId, title, color, createdAt: now }

    set(state => ({ tags: [...state.tags, tag] }))

    const { error } = await supabase.from('tags').insert(tagToRow(tag, userId))
    if (error) {
      console.error('Failed to add tag:', error)
      set(state => ({ tags: state.tags.filter(t => t.id !== tagId) }))
    }
  },

  updateTag: async (id, updates) => {
    set(state => ({
      tags: state.tags.map(t => (t.id === id ? { ...t, ...updates } : t)),
    }))

    const { error } = await supabase.from('tags').update(updates).eq('id', id)
    if (error) {
      console.error('Failed to update tag:', error)
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
      console.error('Failed to delete tag:', tagRes.error ?? taskTagsRes.error)
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
        console.error('Failed to remove task tag:', error)
        set(state => ({
          tasks: state.tasks.map(t => (t.id === taskId ? prev : t)),
        }))
      }
    } else {
      const { error } = await supabase.from('task_tags').insert({ task_id: taskId, tag_id: tagId })
      if (error) {
        console.error('Failed to add task tag:', error)
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
      console.error('Failed to add checklist item:', error)
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
      console.error('Failed to toggle checklist item:', error)
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
      console.error('Failed to update checklist item:', error)
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
      console.error('Failed to delete checklist item:', error)
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
    if (errors.length) console.error('Failed to reorder checklist items:', errors)
  },

  updateRepeat: async (id, repeat) => {
    set(state => ({
      tasks: state.tasks.map(t => (t.id === id ? { ...t, repeat } : t)),
    }))

    const { error } = await supabase.from('tasks').update({ repeat_interval: repeat }).eq('id', id)
    if (error) {
      console.error('Failed to update repeat:', error)
    }
  },
}))
