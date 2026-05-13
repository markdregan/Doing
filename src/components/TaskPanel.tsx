import { useMemo, useRef, useEffect } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTaskStore } from '../store/useTaskStore'
import { logger } from '../lib/logger'
import DraggableTaskItem from './DraggableTaskItem'
import AddTaskInput from './AddTaskInput'
import ResizeHandle from './ResizeHandle'
import type { TaskStatus } from '../types'

const log = logger.child({ module: 'TaskPanel' })

const STATUS_META: Record<TaskStatus, { label: string; color: string; dot: string }> = {
  not_started: { label: 'Not started', color: 'text-gray-300 dark:text-[#48484A]', dot: 'bg-gray-300 dark:bg-[#48484A]' },
  in_progress: { label: 'In progress', color: 'text-blue-500 dark:text-[#64B5F6]', dot: 'bg-blue-500' },
  waiting: { label: 'Needs input', color: 'text-amber-500 dark:text-amber-400', dot: 'bg-amber-500' },
  completed: { label: 'Completed', color: 'text-green-500', dot: 'bg-green-500' },
}

function StatusDot({ status }: { status: TaskStatus }) {
  if (status === 'not_started' || status === 'completed') return null
  return (
    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[status].dot} flex-shrink-0`} />
  )
}

interface TaskPanelProps {
  projectId: string
  collapsed: boolean
  onToggle: () => void
}

export default function TaskPanel({ projectId, collapsed, onToggle }: TaskPanelProps) {
  const tasks = useTaskStore(s => s.tasks)
  const panelRef = useRef<HTMLDivElement>(null)

  const activeTasks = useMemo(() =>
    tasks
      .filter(t => !t.deletedAt && !t.completed && !t.isSomeday && t.projectId === projectId)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    [tasks, projectId]
  )

  const completedTasks = useMemo(() =>
    tasks
      .filter(t => !t.deletedAt && t.completed && !t.isSomeday && t.projectId === projectId)
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
    [tasks, projectId]
  )

  const sortableIds = useMemo(() =>
    activeTasks.map(t => `task-${t.id}`),
    [activeTasks]
  )

  useEffect(() => {
    log.info('task_panel_mounted', { projectId, collapsed })
  }, [projectId, collapsed])

  useEffect(() => {
    log.info('task_panel_filtered', { projectId, activeCount: activeTasks.length, completedCount: completedTasks.length })
  }, [projectId, activeTasks.length, completedTasks.length])

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-1 px-1.5 py-8 text-gray-300 dark:text-[#48484A] hover:text-gray-500 dark:hover:text-[#98989D] transition-colors border-l border-gray-100 dark:border-[#38383A] bg-white dark:bg-[#151516]"
        title="Show tasks"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 7h8" />
        </svg>
        <span className="writing-mode-vertical text-[11px] font-medium tracking-wider">Tasks</span>
        <span className="text-[10px] text-gray-400">{activeTasks.length}</span>
      </button>
    )
  }

  return (
    <div ref={panelRef} className="flex border-l border-gray-100 dark:border-[#38383A] bg-white dark:bg-[#151516] overflow-hidden flex-shrink-0">
      <ResizeHandle containerRef={panelRef} position="left" minWidth={280} maxWidth={520} storageKey="taskPanelWidth" defaultWidth={384} />
      <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-[11px] border-b border-gray-100 dark:border-[#38383A]">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-gray-800 dark:text-[#F5F5F5]">Tasks</span>
          <span className="text-[11px] text-gray-400 dark:text-[#636366] font-medium">{activeTasks.length + completedTasks.length}</span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 text-gray-300 dark:text-[#48484A] hover:text-gray-500 dark:hover:text-[#98989D] transition-colors rounded hover:bg-gray-50 dark:hover:bg-[#252526]"
          title="Hide tasks"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M9 3l-4 4 4 4" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-0">
            {activeTasks.map(task => (
              <DraggableTaskItem key={task.id} task={task} rightSlot={
                <div className="flex items-center gap-1.5">
                  <StatusDot status={task.status} />
                  {task.status === 'waiting' && (
                    <span className="text-[10px] text-amber-500 dark:text-amber-400 font-medium">?</span>
                  )}
                </div>
              } />
            ))}
          </div>
        </SortableContext>

        <AddTaskInput projectId={projectId} />

        {completedTasks.length > 0 && (
          <>
            <div className="mt-6 mb-2 flex items-center gap-2 px-2">
              <span className="text-[10px] font-semibold text-gray-300 dark:text-[#636366] uppercase tracking-[0.08em]">Completed</span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-[#38383A]" />
            </div>
            <div className="space-y-0 opacity-60">
              {completedTasks.map(task => (
                <DraggableTaskItem key={task.id} task={task} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
    </div>
  )
}

