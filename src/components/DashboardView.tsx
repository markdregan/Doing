import { useEffect, useMemo, useState, useCallback } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useTaskStore } from '../store/useTaskStore'
import { useActivityStore } from '../store/useActivityStore'
import { PROJECT_COLOR_MAP } from '../lib/constants'
import ChatBar from './ChatBar'
import type { ChatAttachment, ActivityEventType } from '../types'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

const EVENT_ICONS: Record<ActivityEventType, { symbol: string; bgClass: string; colorClass: string }> = {
  agent_action: { symbol: '\u26A1', bgClass: 'bg-blue-50 dark:bg-blue-900/20', colorClass: 'text-blue-500' },
  agent_question: { symbol: '?', bgClass: 'bg-amber-50 dark:bg-amber-900/20', colorClass: 'text-amber-500' },
  user_response: { symbol: '~', bgClass: 'bg-gray-50 dark:bg-gray-800', colorClass: 'text-gray-500' },
  task_completed: { symbol: '\u2713', bgClass: 'bg-green-50 dark:bg-green-900/20', colorClass: 'text-green-500' },
  task_added: { symbol: '+', bgClass: 'bg-blue-50 dark:bg-blue-900/20', colorClass: 'text-blue-500' },
  plan_approved: { symbol: '\u2713', bgClass: 'bg-blue-50 dark:bg-blue-900/20', colorClass: 'text-blue-500' },
  email_sent: { symbol: '\u2197', bgClass: 'bg-purple-50 dark:bg-purple-900/20', colorClass: 'text-purple-500' },
  call_made: { symbol: '\u260E', bgClass: 'bg-purple-50 dark:bg-purple-900/20', colorClass: 'text-purple-500' },
  text_sent: { symbol: '\u2709', bgClass: 'bg-purple-50 dark:bg-purple-900/20', colorClass: 'text-purple-500' },
  research_complete: { symbol: '\u25CB', bgClass: 'bg-green-50 dark:bg-green-900/20', colorClass: 'text-green-500' },
}

function EventIcon({ type }: { type: ActivityEventType }) {
  const config = EVENT_ICONS[type] ?? EVENT_ICONS.agent_action
  return (
    <span className={`w-6 h-6 rounded-full ${config.bgClass} flex items-center justify-center text-[11px] ${config.colorClass} shrink-0 mt-0.5`}>
      {config.symbol}
    </span>
  )
}

const SUGGESTION_POOL = [
  { label: 'Draft a project plan', prompt: 'Draft a project plan for my new initiative' },
  { label: 'Research competitors', prompt: 'Research competitors in my space' },
  { label: 'Write a team update', prompt: 'Write a weekly update for the team' },
  { label: 'Create a meeting agenda', prompt: 'Create an agenda for our next team meeting' },
  { label: 'Outline a blog post', prompt: 'Outline a blog post about what we\'re building' },
  { label: 'Plan a launch checklist', prompt: 'Build a product launch checklist' },
  { label: 'Summarize last week', prompt: 'Summarize what I accomplished last week' },
  { label: 'Build a budget', prompt: 'Help me build a budget for Q3' },
  { label: 'Organize my tasks', prompt: 'Help me organize and prioritize my tasks' },
]

const CHIPS_PER_PAGE = 3

interface DashboardViewProps {
  onSend: (text: string, attachments?: ChatAttachment[]) => void
  sending: boolean
}

export default function DashboardView({ onSend, sending }: DashboardViewProps) {
  const user = useAuthStore(s => s.user)
  const firstName = user?.user_metadata?.name?.split(' ')[0] ?? 'there'

  const tasks = useTaskStore(s => s.tasks)
  const projects = useTaskStore(s => s.projects)
  const setActiveView = useTaskStore(s => s.setActiveView)

  const events = useActivityStore(s => s.events)
  const loading = useActivityStore(s => s.loading)
  const loadGlobalEvents = useActivityStore(s => s.loadGlobalEvents)

  const [chipPage, setChipPage] = useState(0)

  useEffect(() => {
    if (events.length === 0 && !loading) {
      loadGlobalEvents()
    }
  }, [events.length, loading, loadGlobalEvents])

  const stats = useMemo(() => {
    const active = tasks.filter(t => !t.completed && !t.deletedAt && !t.isSomeday)
    const todayTasks = active.filter(t => t.isToday)
    return { todayTasks: todayTasks.length, totalIncomplete: active.length }
  }, [tasks])

  // Today's tasks with project context
  const todayTasks = useMemo(() => {
    return tasks
      .filter(t => t.isToday && !t.completed && !t.deletedAt && !t.isSomeday)
      .map(t => ({
        ...t,
        project: t.projectId ? projects.find(p => p.id === t.projectId) ?? null : null,
      }))
      .sort((a, b) => {
        // Sort by project first, then by sortOrder
        const aName = a.project?.title ?? ''
        const bName = b.project?.title ?? ''
        if (aName !== bName) return aName.localeCompare(bName)
        return a.sortOrder - b.sortOrder
      })
  }, [tasks, projects])

  const dashboardEvents = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    return sorted.slice(0, 8)
  }, [events])

  const handleTaskClick = (_taskId: string, projectId: string | null) => {
    if (projectId) {
      setActiveView('project', projectId)
    } else {
      // For inbox tasks (no project), stay on home
      // In future: could highlight the task or open quick entry
    }
  }

  // Rotating suggestion chips
  const visibleChips = useMemo(() => {
    const start = (chipPage % Math.ceil(SUGGESTION_POOL.length / CHIPS_PER_PAGE)) * CHIPS_PER_PAGE
    return SUGGESTION_POOL.slice(start, start + CHIPS_PER_PAGE)
  }, [chipPage])

  const handleRefreshChips = useCallback(() => {
    setChipPage(p => p + 1)
  }, [])

  const brief = useMemo(() => {
    if (stats.todayTasks > 0) {
      const s = stats.todayTasks === 1 ? '' : 's'
      return `${stats.todayTasks} task${s} need${stats.todayTasks === 1 ? 's' : ''} your attention today.`
    }
    if (stats.totalIncomplete > 0) {
      const s = stats.totalIncomplete === 1 ? '' : 's'
      return `You have ${stats.totalIncomplete} task${s} to work on.`
    }
    return 'Start a new project or add a task to get going.'
  }, [stats])

  return (
    <div className="flex-1 overflow-y-auto bg-dot-grid">
      <div className="max-w-3xl mx-auto px-8 py-12 pb-8 animate-fade-in">
        {/* Greeting + brief */}
        <div className="mb-8">
          <h1 className="text-[42px] font-serif font-medium text-gray-900 dark:text-[#F5F5F5] tracking-tight mb-2">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm text-gray-400 dark:text-[#636366] leading-relaxed">
            {brief}
          </p>
        </div>

        {/* Today's Tasks */}
        {todayTasks.length > 0 && (
          <div className="mb-10">
            <h2 className="text-[11px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.08em] mb-3">
              Today
            </h2>
            <div className="space-y-0.5">
              {todayTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => handleTaskClick(task.id, task.projectId)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#252526] transition-colors text-left group/task active:scale-[0.99]"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: task.project ? PROJECT_COLOR_MAP[task.project.color] : '#8E8E93' }}
                  />
                  <span className="text-sm text-gray-800 dark:text-[#E5E5EA] leading-snug flex-1 min-w-0 truncate">
                    {task.title}
                  </span>
                  {task.project && (
                    <span className="text-[11px] text-gray-400 dark:text-[#636366] shrink-0 group-hover/task:text-gray-500 dark:group-hover/task:text-[#98989D] transition-colors">
                      {task.project.title}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {dashboardEvents.length > 0 && (
          <div className="mb-10">
            <h2 className="text-[11px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.08em] mb-3">
              Recent Activity
            </h2>
            <div className="space-y-1">
              {dashboardEvents.map(event => (
                <div key={event.id} className="flex items-start gap-3 py-1.5 group">
                  <EventIcon type={event.type} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-gray-700 dark:text-[#D1D1D6] leading-snug">
                      {event.summary}
                    </p>
                    {event.details && (
                      <p className="text-[11px] text-gray-400 dark:text-[#636366] mt-0.5 line-clamp-2">
                        {event.details}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-300 dark:text-[#48484A] mt-0.5">
                      {timeAgo(event.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat + suggestions */}
        <div>
          <ChatBar
            onSend={onSend}
            disabled={sending}
            autoFocus
            placeholder="What task should I help you with?"
          />

          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.08em]">
                Pick a task, any task
              </span>
              <button
                onClick={handleRefreshChips}
                className="p-1 text-gray-300 dark:text-[#48484A] hover:text-gray-500 dark:hover:text-[#98989D] transition-colors rounded hover:bg-gray-50 dark:hover:bg-[#252526]"
                title="Show more suggestions"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 8a6 6 0 0 1 11.4-3" />
                  <path d="M14 8a6 6 0 0 1-11.4 3" />
                  <path d="M13.5 1.5V5h-3.5" />
                  <path d="M2.5 14.5V11h3.5" />
                </svg>
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {visibleChips.map((chip, i) => (
                <button
                  key={`${chipPage}-${i}`}
                  onClick={() => onSend(chip.prompt)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-gray-500 dark:text-[#98989D] bg-white dark:bg-[#2C2C2E] hover:bg-gray-50 dark:hover:bg-[#38383A] hover:text-gray-800 dark:hover:text-[#F5F5F5] rounded-full transition-all border border-gray-200 dark:border-[#38383A] shadow-sm active:scale-95"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 opacity-60">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
