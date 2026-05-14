import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import { useActivityStore } from '../store/useActivityStore'
import { generateDemoSeedData } from '../lib/demoSeedData'
import { useAIStudioStore } from '../store/useAIStudioStore'
import DemoOverlay from './DemoOverlay'
import ChatBar from './ChatBar'
import { PROJECT_COLOR_MAP } from '../lib/constants'

type OnboardingStep = 'loading' | 'demo' | 'goal-input'

export default function DemoOnboardingFlow() {
  const [step, setStep] = useState<OnboardingStep>('loading')
  const [showOverlay, setShowOverlay] = useState(true)
  const [showGoalInput, setShowGoalInput] = useState(false)

  const userId = useTaskStore(s => s.userId)
  const seedDemoProject = useTaskStore(s => s.seedDemoProject)
  const getState = useTaskStore.getState
  const createConversation = useAIStudioStore(s => s.createConversation)

  const demoData = useMemo(() => {
    if (!userId) return null
    return generateDemoSeedData(userId)
  }, [userId])

  useEffect(() => {
    if (!demoData || !userId) return
    const timer = setTimeout(() => {
      seedDemoProject(demoData)
      const store = useActivityStore.getState()
      for (const event of demoData.activityEvents) {
        store.addEvent(event)
      }
      if (demoData.currentAction) {
        getState().setAgentCurrentAction(demoData.currentAction)
      }
      setStep('demo')
    }, 2500)
    return () => clearTimeout(timer)
  }, [demoData, userId, seedDemoProject, getState])

  const handleDismissOverlay = useCallback(() => {
    setShowOverlay(false)
    setShowGoalInput(true)
  }, [])

  const handleSendGoal = useCallback(async (text: string) => {
    if (!text.trim()) return
    const convId = await createConversation(text)
    if (convId) {
      // After creating the conversation, mark demo as seen and refresh
      localStorage.setItem('demo_seen', 'true')
      window.location.reload()
    }
  }, [createConversation])

  const handleSkip = useCallback(() => {
    localStorage.setItem('demo_seen', 'true')
    window.location.reload()
  }, [])

  if (!demoData) return null

  const project = demoData.project
  const activeTasks = demoData.tasks.filter(t => !t.completed)

  // Loading step
  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-[#1D1D1F]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F5F5F5] mb-2">Doing</h1>
          <p className="text-sm text-gray-400 dark:text-[#636366] mb-8">Setting up your agent...</p>
          <div className="flex items-center justify-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
          <p className="text-[11px] text-gray-300 dark:text-[#48484A] mt-6">
            One-time setup. Your agent will work like this on every project.
          </p>
        </div>
      </div>
    )
  }

  // Demo step — simplified execution view showing agent paradigm
  return (
    <div className="h-screen flex flex-col bg-white dark:bg-[#1D1D1F] overflow-hidden">
      {showOverlay && <DemoOverlay onDismiss={handleDismissOverlay} />}

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-[#38383A] shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PROJECT_COLOR_MAP[project.color] }} />
          <span className="text-sm font-semibold text-gray-900 dark:text-[#F5F5F5]">{project.title}</span>
          <span className="text-[10px] text-blue-500 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-full">
            ● Working
          </span>
        </div>
        <span className="text-xs text-gray-400 dark:text-[#636366]">Demo project</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Activity feed */}
        <div className="flex-1 overflow-y-auto px-6 py-4 border-r border-gray-100 dark:border-[#38383A]">
          <h3 className="text-[11px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.08em] mb-3">
            Activity
          </h3>
          <div className="space-y-3">
            {demoData.activityEvents.map(event => (
              <div key={event.id} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 shrink-0">
                  {event.type === 'agent_action' && (
                    <span className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[11px] text-blue-500">⚡</span>
                  )}
                  {event.type === 'research_complete' && (
                    <span className="w-5 h-5 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-[11px] text-green-500">🔍</span>
                  )}
                  {event.type === 'task_completed' && (
                    <span className="w-5 h-5 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-[11px] text-green-500">✓</span>
                  )}
                  {event.type === 'agent_question' && (
                    <span className="w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-[11px] text-amber-500">❓</span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] text-gray-700 dark:text-[#D1D1D6] leading-snug">{event.summary}</p>
                  {event.details && (
                    <p className="text-[11px] text-gray-400 dark:text-[#636366] mt-0.5 line-clamp-2">{event.details}</p>
                  )}
                  <p className="text-[10px] text-gray-300 dark:text-[#48484A] mt-0.5">
                    {timeAgo(event.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {/* Agent current action */}
            {demoData.currentAction && (
              <div className="flex items-start gap-3 text-sm bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
                <span className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[11px] text-white shrink-0 mt-0.5 animate-pulse">
                  ●
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-blue-700 dark:text-blue-300 leading-snug">
                    Agent is {demoData.currentAction.description.toLowerCase()}
                  </p>
                  <div className="mt-1.5 h-1.5 bg-gray-200 dark:bg-[#38383A] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${demoData.currentAction.progress ?? 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-1">{demoData.currentAction.progress}% complete</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Task panel */}
        <div className="w-80 overflow-y-auto px-4 py-4 bg-gray-50/50 dark:bg-[#151516]/50">
          <h3 className="text-[11px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.08em] mb-3">
            Tasks
          </h3>
          <div className="space-y-1">
            {activeTasks.map(task => (
              <div key={task.id} className="px-3 py-2 rounded-lg bg-white dark:bg-[#2C2C2E] border border-gray-100 dark:border-[#38383A]">
                <div className="flex items-start gap-2.5">
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                    task.source === 'agent'
                      ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-[#48484A]'
                  }`}>
                    {task.source === 'agent' && (
                      <svg className="w-2.5 h-2.5 text-blue-500" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 6l3 3 5-5" />
                      </svg>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] leading-snug ${task.source === 'agent' ? 'text-blue-800 dark:text-blue-200' : 'text-gray-800 dark:text-[#E5E5EA]'}`}>
                      {task.title}
                      {task.source === 'agent' && (
                        <span className="ml-1.5 text-[9px] text-blue-500 dark:text-blue-400 font-medium">agent</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {task.tagIds.map(tagId => {
                        const tag = demoData.tags.find(t => t.id === tagId)
                        if (!tag) return null
                        return (
                          <span key={tagId} className="text-[10px] text-gray-400 dark:text-[#636366]">
                            #{tag.title}
                          </span>
                        )
                      })}
                      {task.id === demoData.answeredQuestion.taskId && (
                        <span className="text-[10px] text-green-500 dark:text-green-400">✓ Answered</span>
                      )}
                    </div>
                    {/* Checklist preview for first task */}
                    {task.id === activeTasks[0]?.id && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-[#38383A] space-y-1">
                        {demoData.checklistItems
                          .filter(item => item.taskId === task.id)
                          .slice(0, 3)
                          .map(item => (
                            <div key={item.id} className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-sm flex items-center justify-center ${
                                item.completed ? 'bg-green-400' : 'border border-gray-300 dark:border-[#48484A]'
                              }`}>
                                {item.completed && (
                                  <svg className="w-2 h-2 text-white" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M1.5 4l2 2 3-3" />
                                  </svg>
                                )}
                              </span>
                              <span className={`text-[11px] ${item.completed ? 'text-gray-400 dark:text-[#636366] line-through' : 'text-gray-600 dark:text-[#98989D]'}`}>
                                {item.title}
                              </span>
                            </div>
                          ))}
                        {demoData.checklistItems.filter(item => item.taskId === task.id).length > 3 && (
                          <p className="text-[10px] text-gray-400 dark:text-[#636366] pl-4">
                            +{demoData.checklistItems.filter(item => item.taskId === task.id).length - 3} more
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goal input or chat bar */}
      {showGoalInput && (
        <div className="border-t border-gray-100 dark:border-[#38383A] px-6 py-4 shrink-0 bg-white dark:bg-[#1D1D1F]">
          <div className="max-w-2xl mx-auto text-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F5F5F5] mb-1">
              What's your goal?
            </h2>
            <p className="text-sm text-gray-400 dark:text-[#636366]">
              Your agent will break it down and start working on it — just like the demo.
            </p>
          </div>
          <div className="max-w-xl mx-auto">
            <ChatBar
              onSend={handleSendGoal}
              placeholder="e.g. Sell my house, Plan a vacation, Launch a blog..."
              autoFocus
            />
          </div>
          <div className="flex justify-center mt-3 gap-2">
            {['Sell my house', 'Plan a family reunion', 'Launch a blog'].map(prompt => (
              <button
                key={prompt}
                onClick={() => handleSendGoal(prompt)}
                className="text-xs text-gray-400 dark:text-[#636366] bg-gray-50 dark:bg-[#252526] hover:bg-gray-100 dark:hover:bg-[#2C2C2E] px-3 py-1.5 rounded-full transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <button
              onClick={handleSkip}
              className="text-xs text-gray-300 dark:text-[#48484A] hover:text-gray-500 dark:hover:text-[#98989D] transition-colors"
            >
              Skip demo — I'll explore on my own
            </button>
          </div>
        </div>
      )}
    </div>
  )
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
  return `${days}d ago`
}
