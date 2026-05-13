import { useMemo } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import TaskItem from './TaskItem'
import EmptyState from './EmptyState'
import type { Task } from '../types'

function getDateGroupKey(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  const dayOfWeek = todayStart.getDay()
  const monday = new Date(todayStart)
  monday.setDate(monday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))

  const lastMonday = new Date(monday)
  lastMonday.setDate(lastMonday.getDate() - 7)

  if (date >= todayStart) return 'Today'
  if (date >= yesterdayStart) return 'Yesterday'
  if (date >= monday) return 'This Week'
  if (date >= lastMonday) return 'Last Week'
  return 'Earlier'
}

export default function TaskList() {
  const tasks = useTaskStore(s => s.tasks)
  const activeView = useTaskStore(s => s.activeView)
  const emptyTrash = useTaskStore(s => s.emptyTrash)

  const filteredTasks = useMemo(() => {
    if (activeView === 'trash') {
      return tasks
        .filter(t => t.deletedAt !== null)
        .sort((a, b) => {
          const aTime = a.deletedAt ? new Date(a.deletedAt).getTime() : 0
          const bTime = b.deletedAt ? new Date(b.deletedAt).getTime() : 0
          return bTime - aTime
        })
    }
    if (activeView === 'logbook') {
      return tasks
        .filter(t => t.completed && t.completedAt !== null && !t.deletedAt)
        .sort((a, b) => {
          const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0
          const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0
          return bTime - aTime
        })
    }
    return []
  }, [tasks, activeView])

  const logbookGroups = useMemo(() => {
    if (activeView !== 'logbook') return null
    const groups = new Map<string, Task[]>()
    for (const task of filteredTasks) {
      const key = task.completedAt ? getDateGroupKey(task.completedAt) : 'Unknown'
      const existing = groups.get(key)
      if (existing) existing.push(task)
      else groups.set(key, [task])
    }
    const order = ['Today', 'Yesterday', 'This Week', 'Last Week', 'Earlier', 'Unknown']
    return order.filter(k => groups.has(k)).map(label => ({ label, tasks: groups.get(label)! }))
  }, [filteredTasks, activeView])

  const isTrash = activeView === 'trash'
  const isLogbook = activeView === 'logbook'

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[680px] mx-auto max-md:pt-8 max-md:pb-12 max-md:px-5 py-16 px-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-[28px] font-bold text-gray-900 dark:text-[#F5F5F5]">
            {isTrash ? 'Trash' : 'Logbook'}
          </h1>
          {isTrash && filteredTasks.length > 0 && (
            <button
              onClick={emptyTrash}
              className="text-sm text-gray-400 dark:text-[#636366] hover:text-red-500 dark:hover:text-[#F48FB1] transition-colors"
            >
              Empty Trash
            </button>
          )}
        </div>

        {filteredTasks.length > 0 ? (
          isTrash ? (
            <div className="space-y-0">
              {filteredTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          ) : isLogbook && logbookGroups ? (
            <div className="space-y-0">
              {logbookGroups.map(group => (
                <div key={group.label}>
                  <div className="mt-6 mb-2 flex items-center gap-3 first:mt-0">
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.08em]">
                      {group.label === 'Today' ? 'Completed Today' :
                       group.label === 'Yesterday' ? 'Completed Yesterday' :
                       group.label === 'This Week' ? 'Completed This Week' :
                       group.label === 'Last Week' ? 'Completed Last Week' :
                       'Completed Earlier'}
                    </span>
                    <div className="flex-1 h-px bg-gray-100 dark:bg-[#38383A]" />
                  </div>
                  {group.tasks.map(task => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              ))}
            </div>
          ) : null
        ) : (
          <EmptyState view={activeView} />
        )}
      </div>
    </div>
  )
}
