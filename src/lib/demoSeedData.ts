import type { Task, Project, Tag, ChecklistItem, AgentActivityEvent, AgentCurrentAction, DemoSeedData } from '../types'

export function generateDemoSeedData(userId: string): DemoSeedData {
  const now = new Date().toISOString()
  const hoursAgo = (n: number) => new Date(Date.now() - n * 3600000).toISOString()
  const uid = () => crypto.randomUUID()

  const projId = uid()

  const project: Project = {
    id: projId,
    title: 'Demo: Launch MVP Website',
    color: 'blue',
    sortOrder: 0,
    createdAt: hoursAgo(2),
    userId,
    aiGenerationMetadata: null,
  }

  const taskDesign = uid()
  const taskDomain = uid()
  const taskContent = uid()
  const taskAnalytics = uid()
  const taskLaunch = uid()

  const tagDesign = uid()
  const tagDev = uid()

  const tasks: Task[] = [
    {
      id: taskDesign, title: 'Design landing page',
      notes: 'Homepage with hero, features section, pricing, and contact form. Mobile-responsive.',
      projectId: projId, dueDate: null, isToday: true, isSomeday: false,
      completed: false, completedAt: null, deletedAt: null,
      createdAt: hoursAgo(2), sortOrder: 0, tagIds: [tagDesign],
      repeat: null, status: 'in_progress', assignedTo: null, assignedBy: null,
      source: 'user',
    },
    {
      id: taskDomain, title: 'Set up custom domain',
      notes: 'Register domain and configure DNS. Agent can research providers.',
      projectId: projId, dueDate: null, isToday: false, isSomeday: false,
      completed: false, completedAt: null, deletedAt: null,
      createdAt: hoursAgo(2), sortOrder: 1, tagIds: [tagDev],
      repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      source: 'agent',
    },
    {
      id: taskContent, title: 'Write launch announcement post',
      notes: 'Blog post announcing the launch. Share on social media.',
      projectId: projId, dueDate: null, isToday: false, isSomeday: false,
      completed: false, completedAt: null, deletedAt: null,
      createdAt: hoursAgo(2), sortOrder: 2, tagIds: [],
      repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      source: 'agent',
    },
    {
      id: taskAnalytics, title: 'Set up analytics & monitoring',
      notes: 'Install analytics, set up error tracking, configure uptime monitoring.',
      projectId: projId, dueDate: null, isToday: false, isSomeday: false,
      completed: false, completedAt: null, deletedAt: null,
      createdAt: hoursAgo(1.5), sortOrder: 3, tagIds: [tagDev],
      repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      source: 'agent',
    },
    {
      id: taskLaunch, title: 'Coordinate launch day checklist',
      notes: 'Final checks: SSL, redirects, social previews, performance test.',
      projectId: projId, dueDate: null, isToday: false, isSomeday: false,
      completed: false, completedAt: null, deletedAt: null,
      createdAt: hoursAgo(1), sortOrder: 4, tagIds: [tagDesign, tagDev],
      repeat: null, status: 'not_started', assignedTo: null, assignedBy: null,
      source: 'agent',
    },
  ]

  const tags: Tag[] = [
    { id: tagDesign, title: 'design', color: 'purple', createdAt: now },
    { id: tagDev, title: 'development', color: 'blue', createdAt: now },
  ]

  const checklistItems: ChecklistItem[] = [
    { id: uid(), taskId: taskDesign, title: 'Sketch hero section layout', completed: true, sortOrder: 0, createdAt: hoursAgo(1.5) },
    { id: uid(), taskId: taskDesign, title: 'Design features grid', completed: true, sortOrder: 1, createdAt: hoursAgo(1.5) },
    { id: uid(), taskId: taskDesign, title: 'Create pricing table', completed: false, sortOrder: 2, createdAt: hoursAgo(1.5) },
    { id: uid(), taskId: taskDesign, title: 'Mobile responsive review', completed: false, sortOrder: 3, createdAt: hoursAgo(1.5) },
    { id: uid(), taskId: taskDomain, title: 'Research domain registrars', completed: true, sortOrder: 0, createdAt: hoursAgo(1) },
    { id: uid(), taskId: taskDomain, title: 'Check domain availability', completed: true, sortOrder: 1, createdAt: hoursAgo(1) },
    { id: uid(), taskId: taskDomain, title: 'Compare DNS providers', completed: false, sortOrder: 2, createdAt: hoursAgo(1) },
    { id: uid(), taskId: taskDomain, title: 'Configure DNS settings', completed: false, sortOrder: 3, createdAt: hoursAgo(1) },
    { id: uid(), taskId: taskContent, title: 'Outline key points', completed: false, sortOrder: 0, createdAt: hoursAgo(0.5) },
    { id: uid(), taskId: taskContent, title: 'Draft first paragraph', completed: false, sortOrder: 1, createdAt: hoursAgo(0.5) },
    { id: uid(), taskId: taskContent, title: 'Add screenshots', completed: false, sortOrder: 2, createdAt: hoursAgo(0.5) },
    { id: uid(), taskId: taskLaunch, title: 'Verify SSL certificate', completed: false, sortOrder: 0, createdAt: hoursAgo(0.5) },
    { id: uid(), taskId: taskLaunch, title: 'Test all redirects', completed: false, sortOrder: 1, createdAt: hoursAgo(0.5) },
    { id: uid(), taskId: taskLaunch, title: 'Social preview cards', completed: false, sortOrder: 2, createdAt: hoursAgo(0.5) },
    { id: uid(), taskId: taskLaunch, title: 'Run Lighthouse audit', completed: false, sortOrder: 3, createdAt: hoursAgo(0.5) },
  ]

  const activityEvents: AgentActivityEvent[] = [
    {
      id: uid(), projectId: projId,
      type: 'agent_action',
      summary: 'Generated task breakdown for "Launch MVP Website"',
      details: 'Agent analyzed goal and created 5 core tasks with detailed checklists',
      timestamp: hoursAgo(1.8),
    },
    {
      id: uid(), projectId: projId,
      type: 'research_complete',
      summary: 'Researched domain pricing across 4 registrars',
      details: 'Found: Namecheap ($12/yr), Cloudflare ($9/yr), GoDaddy ($15/yr), Route53 ($13/yr). Cloudflare recommended for lowest cost + built-in DNS.',
      timestamp: hoursAgo(1.2),
    },
    {
      id: uid(), projectId: projId,
      type: 'agent_action',
      summary: 'Generated checklist items for all 5 tasks',
      details: 'Created 15 checklist items across tasks to provide concrete next steps',
      timestamp: hoursAgo(1),
    },
    {
      id: uid(), projectId: projId,
      type: 'task_completed',
      summary: 'Agent completed: "Research domain registrars"',
      timestamp: hoursAgo(0.8),
    },
    {
      id: uid(), projectId: projId,
      type: 'research_complete',
      summary: 'Researched landing page design inspiration',
      details: 'Analyzed top 10 SaaS landing pages. Key patterns: clear hero value prop, social proof near fold, 3-column feature grid. Compiled reference links.',
      timestamp: hoursAgo(0.5),
    },
    {
      id: uid(), projectId: projId,
      type: 'agent_question',
      summary: 'Agent asked: "Which analytics platform do you prefer?"',
      details: 'You answered: Plausible',
      timestamp: hoursAgo(0.3),
    },
  ]

  const currentAction: AgentCurrentAction | null = {
    projectId: projId,
    taskId: taskDomain,
    description: 'Researching domain availability and DNS providers',
    state: 'working',
    progress: 65,
    startedAt: hoursAgo(0.2),
  }

  const answeredQuestion = {
    taskId: taskAnalytics,
    question: 'Which analytics platform do you prefer?',
    answer: 'Plausible',
  }

  return {
    project,
    tasks,
    tags,
    checklistItems,
    activityEvents,
    currentAction,
    answeredQuestion,
  }
}
