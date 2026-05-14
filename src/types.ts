export type ProjectColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'gray';

export type TagColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'gray' | 'teal' | 'brown';

export const TASK_STATUSES = ['not_started', 'in_progress', 'waiting', 'completed'] as const;

export type TaskStatus = typeof TASK_STATUSES[number];

export interface Task {
  id: string;
  title: string;
  notes: string;
  projectId: string | null;
  status: TaskStatus;
  dueDate: string | null;
  isToday: boolean;
  isSomeday: boolean;
  completed: boolean;
  completedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  sortOrder: number;
  tagIds: string[];
  repeat: RepeatInterval | null;
  assignedTo: string | null;
  assignedBy: string | null;
  source: TaskSource;
  sourceConversationId?: string;
}

export interface Project {
  id: string;
  title: string;
  color: ProjectColor;
  sortOrder: number;
  createdAt: string;
  userId: string;
  aiGenerationMetadata: AiGenerationMetadata | null;
}

export interface AiGenerationMetadata {
  conversationId: string;
  goal: string;
  qaSummary: string;
}

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface ProjectShare {
  id: string;
  projectId: string;
  sharedBy: string;
  sharedWith: string | null;
  invitedEmail: string | null;
  status: 'active' | 'invited';
  permission: 'read' | 'write';
  token: string | null;
  createdAt: string;
}

export interface Tag {
  id: string;
  title: string;
  color: TagColor;
  createdAt: string;
}

export const REPEAT_INTERVALS = [
  'daily', 'weekdays', 'weekly', 'biweekly', 'monthly', 'yearly'
] as const;

export type RepeatInterval = typeof REPEAT_INTERVALS[number];

export interface ChecklistItem {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface AgentConversation {
  id: string;
  userId: string;
  title: string;
  emoji: string;
  status: 'draft' | 'planning' | 'review' | 'active' | 'archived';
  goalText: string;
  createdAt: string;
  updatedAt: string;
  planDraft?: PlanDraft | null;
}

export interface AgentMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  metadata: {
    needsResponse?: boolean;
    responseType?: 'choice' | 'approval' | 'info';
    options?: { label: string; description?: string; value: string }[];
    agentRecommendation?: string;
    [key: string]: unknown;
  };
  createdAt: string;
}

export interface PlanDraftTask {
  title: string;
  notes?: string;
  dueDate?: string;
  tags?: string[];
}

export interface PlanDraft {
  projectTitle: string;
  projectColor: ProjectColor;
  tasks: PlanDraftTask[];
  version: number;
}

export interface GoalBriefQuestion {
  id: string;
  field: string;
  type: 'text' | 'select' | 'multiselect';
  label: string;
  placeholder?: string;
  options?: string[];
}

export type ViewType = 'home' | 'project' | 'logbook' | 'trash' | 'agent-dashboard';

export type TaskSource = 'agent' | 'user' | 'assignment' | 'recurring';

export interface AgentQuestion {
  id: string;
  projectId: string;
  conversationId: string;
  question: string;
  context: string;
  options: { label: string; description?: string; value: string }[];
  agentRecommendation?: string;
  status: 'pending' | 'resolved';
  response?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ChatAttachment {
  name: string;
  mimeType: string;
  dataUrl: string;
}

export type ActivityEventType = 'agent_action' | 'agent_question' | 'user_response' | 'task_completed' | 'task_added' | 'plan_approved' | 'email_sent' | 'call_made' | 'text_sent' | 'research_complete';

export type AgentState = 'idle' | 'thinking' | 'working' | 'needs_input' | 'blocked' | 'completed';

export interface AgentActivityEvent {
  id: string;
  projectId: string;
  type: ActivityEventType;
  summary: string;
  details?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AgentCurrentAction {
  projectId: string;
  taskId?: string;
  description: string;
  state: AgentState;
  progress?: number;
  startedAt: string;
}

export interface DemoSeedData {
  project: Project;
  tasks: Task[];
  tags: Tag[];
  checklistItems: ChecklistItem[];
  activityEvents: AgentActivityEvent[];
  currentAction: AgentCurrentAction | null;
  answeredQuestion: { taskId: string; question: string; answer: string };
}
