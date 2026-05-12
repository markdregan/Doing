import { useEffect, useState, useMemo } from 'react'
import { Routes, Route } from 'react-router-dom'
import { DndContext, DragOverlay, closestCenter, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { format } from 'date-fns'
import { useAuthStore } from './store/useAuthStore'
import { useTaskStore } from './store/useTaskStore'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import MobileDrawer from './components/MobileDrawer'
import TaskList from './components/TaskList'
import QuickEntry from './components/QuickEntry'
import SearchDialog from './components/SearchDialog'
import SettingsDialog from './components/SettingsDialog'
import Toast from './components/Toast'
import AuthPage from './components/AuthPage'
import InvitePage from './components/InvitePage'
import ProtectedRoute from './components/ProtectedRoute'

function DragOverlayContent({ id }: { id: string }) {
  const tasks = useTaskStore(s => s.tasks)
  const projects = useTaskStore(s => s.projects)

  const task = tasks.find(t => `task-${t.id}` === id)
  const project = projects.find(p => `project-${p.id}` === id)

  if (task) {
    return (
      <div className="bg-white dark:bg-[#2C2C2E] rounded-lg shadow-xl border border-gray-200 dark:border-[#38383A] px-4 py-2 max-w-[400px]">
        <p className="text-sm text-gray-800 dark:text-[#F5F5F5]">{task.title}</p>
      </div>
    )
  }

  if (project) {
    return (
      <div className="bg-white dark:bg-[#2C2C2E] rounded-lg shadow-xl border border-gray-200 dark:border-[#38383A] px-3 py-1.5">
        <p className="text-sm text-gray-800 dark:text-[#F5F5F5]">{project.title}</p>
      </div>
    )
  }

  return null
}

function getVisibleTaskIds() {
  const state = useTaskStore.getState()
  const todayStr = new Date().toISOString().slice(0, 10)
  const { tasks, activeView, activeProjectId, userId } = state

  let filtered = [...tasks]

  if (activeView === 'trash') {
    filtered = filtered.filter(t => t.deletedAt !== null)
    filtered.sort((a, b) => {
      const aTime = a.deletedAt ? new Date(a.deletedAt).getTime() : 0
      const bTime = b.deletedAt ? new Date(b.deletedAt).getTime() : 0
      return bTime - aTime
    })
    return filtered.map(t => t.id)
  }

  filtered = filtered.filter(t => !t.deletedAt)

  if (activeView === 'logbook') {
    filtered = filtered.filter(t => t.completed && t.completedAt !== null)
    filtered.sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0
      return bTime - aTime
    })
  } else if (activeView === 'inbox') {
    filtered = filtered.filter(t => !t.completed && !t.isSomeday && t.projectId === null).sort((a, b) => a.sortOrder - b.sortOrder)
  } else if (activeView === 'today') {
    filtered = filtered.filter(t => !t.completed && !t.isSomeday && (t.isToday || t.dueDate === todayStr))
    filtered.sort((a, b) => {
      const aOverdue = a.dueDate && a.dueDate < todayStr ? 1 : 0
      const bOverdue = b.dueDate && b.dueDate < todayStr ? 1 : 0
      if (aOverdue !== bOverdue) return bOverdue - aOverdue
      if (a.isToday !== b.isToday) return a.isToday ? -1 : 1
      return a.sortOrder - b.sortOrder
    })
  } else if (activeView === 'someday') {
    filtered = filtered.filter(t => !t.completed && t.isSomeday).sort((a, b) => a.sortOrder - b.sortOrder)
  } else if (activeView === 'all') {
    filtered = filtered.filter(t => !t.completed && !t.isSomeday).sort((a, b) => a.sortOrder - b.sortOrder)
  } else if (activeView === 'project' && activeProjectId) {
    filtered = filtered.filter(t => !t.completed && !t.isSomeday && t.projectId === activeProjectId).sort((a, b) => a.sortOrder - b.sortOrder)
  } else if (activeView === 'assigned') {
    filtered = filtered.filter(t => !t.completed && !t.isSomeday && t.assignedTo === userId).sort((a, b) => a.sortOrder - b.sortOrder)
  } else {
    filtered = []
  }

  return filtered.map(t => t.id)
}

function getViewTitle(activeView: string, activeProjectId: string | null, projects: import('./types').Project[], tasks: import('./types').Task[]) {
  if (activeView === 'inbox') return { title: 'Inbox' }
  if (activeView === 'today') return { title: 'Today', subtitle: format(new Date(), 'EEEE, MMMM d') }
  if (activeView === 'someday') return { title: 'Someday' }
  if (activeView === 'assigned') return { title: 'Assigned to Me' }
  if (activeView === 'trash') return { title: 'Trash' }
  if (activeView === 'logbook') return { title: 'Logbook' }
  if (activeView === 'all') return { title: 'All' }
  if (activeView === 'project' && activeProjectId) {
    const project = projects.find(p => p.id === activeProjectId)
    const projectTasksAll = tasks.filter(t => !t.deletedAt && t.projectId === activeProjectId && !t.isSomeday)
    const pCompleted = projectTasksAll.filter(t => t.completed).length
    const pTotal = projectTasksAll.length
    return {
      title: project?.title ?? 'Project',
      subtitle: pTotal > 0 ? `${pCompleted} of ${pTotal} completed` : '',
    }
  }
  return { title: 'Things' }
}

function AppShell() {
  const [quickEntryOpen, setQuickEntryOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const reorderTasks = useTaskStore(s => s.reorderTasks)
  const reorderProjects = useTaskStore(s => s.reorderProjects)
  const moveTaskToProject = useTaskStore(s => s.moveTaskToProject)
  const projects = useTaskStore(s => s.projects)
  const activeView = useTaskStore(s => s.activeView)
  const activeProjectId = useTaskStore(s => s.activeProjectId)
  const tasks = useTaskStore(s => s.tasks)
  const trashUndo = useTaskStore(s => s.trashUndo)
  const restoreTask = useTaskStore(s => s.restoreTask)
  const clearTrashUndo = useTaskStore(s => s.clearTrashUndo)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 500, tolerance: 10 } }),
    useSensor(KeyboardSensor, {}),
  )

  const viewTitle = useMemo(() => getViewTitle(activeView, activeProjectId, projects, tasks), [activeView, activeProjectId, projects, tasks])

  useEffect(() => {
    if (drawerOpen) setDrawerOpen(false)
  }, [activeView, activeProjectId])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setQuickEntryOpen(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        setSettingsOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null)
    const { active, over } = event
    if (!over) return

    const activeType = active.data.current?.type as string | undefined
    const overType = over.data.current?.type as string | undefined

    if (activeType === 'task' && overType === 'project') {
      const projectId = over.data.current?.projectId as string
      moveTaskToProject(active.data.current?.taskId as string, projectId)
      return
    }

    if (activeType === 'task' && overType === 'task') {
      const activeTaskId = active.data.current?.taskId as string
      const overTaskId = over.data.current?.taskId as string

      if (activeTaskId !== overTaskId) {
        const taskIds = getVisibleTaskIds()
        const oldIdx = taskIds.indexOf(activeTaskId)
        const newIdx = taskIds.indexOf(overTaskId)
        if (oldIdx !== -1 && newIdx !== -1) {
          const reordered = arrayMove(taskIds, oldIdx, newIdx)
          reorderTasks(reordered)
        }
      }
      return
    }

    if (activeType === 'project' && overType === 'project') {
      const activeProjectId = active.data.current?.projectId as string
      const overProjectId = over.data.current?.projectId as string

      if (activeProjectId !== overProjectId) {
        const projectIds = projects.map(p => p.id)
        const oldIdx = projectIds.indexOf(activeProjectId)
        const newIdx = projectIds.indexOf(overProjectId)
        if (oldIdx !== -1 && newIdx !== -1) {
          const reordered = arrayMove(projectIds, oldIdx, newIdx)
          reorderProjects(reordered)
        }
      }
      return
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col md:flex-row h-screen overflow-hidden">
        <TopBar
          title={viewTitle.title}
          subtitle={viewTitle.subtitle}
          onMenuClick={() => setDrawerOpen(true)}
          onSearchClick={() => setSearchOpen(true)}
        />
        <Sidebar onSearchOpen={() => setSearchOpen(true)} onSettingsOpen={() => setSettingsOpen(true)} />
        <TaskList />
      </div>

      <button
        onClick={() => setQuickEntryOpen(true)}
        className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all active:scale-95"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <DragOverlay>
        {activeDragId ? <DragOverlayContent id={activeDragId} /> : null}
      </DragOverlay>
      <QuickEntry open={quickEntryOpen} onOpenChange={setQuickEntryOpen} />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <Toast
        visible={trashUndo !== null}
        title={trashUndo?.title ?? ''}
        onUndo={() => { if (trashUndo) restoreTask(trashUndo.taskId) }}
        onDismiss={clearTrashUndo}
      />
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSearchOpen={() => { setSearchOpen(true) }}
        onSettingsOpen={() => { setSettingsOpen(true) }}
      />
    </DndContext>
  )
}

export default function App() {
  const initialize = useAuthStore(s => s.initialize)
  const initialized = useAuthStore(s => s.initialized)
  const clearTasks = useTaskStore(s => s.clearAll)
  useEffect(() => {
    if (!initialized) initialize()
  }, [initialized, initialize])

  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((state, prev) => {
      if (prev.user && !state.user) {
        clearTasks()
      }
    })
    return unsubscribe
  }, [clearTasks])

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/invite" element={<InvitePage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
