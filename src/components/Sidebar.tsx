import { useState, useMemo, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTaskStore } from '../store/useTaskStore';
import { useAIStudioStore } from '../store/useAIStudioStore';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { PROJECT_COLOR_MAP } from '../lib/constants';
import { logger } from '../lib/logger';

const log = logger.child({ module: 'Sidebar' });
import type { Project, AgentConversation } from '../types';
import {
  LogbookIcon,
  TrashIcon,
  SearchIcon
} from '../lib/icons';
import ProgressRing from './ProgressRing';
import ResizeHandle from './ResizeHandle';

function HomeIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2.5 6.5L8 2l5.5 4.5V13a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V6.5z" />
      <path d="M6 14V8h4v6" />
    </svg>
  );
}

type MergedItem =
  | { type: 'conversation'; item: AgentConversation }
  | { type: 'project'; item: Project }

const CONV_PROGRESS: Record<string, number> = {
  draft: 0,
  planning: 33,
  review: 66,
}

function ConversationItem({ conv, isActive }: { conv: AgentConversation; isActive: boolean }) {
  const setActiveConversation = useAIStudioStore(s => s.setActiveConversation);
  const setActiveView = useTaskStore(s => s.setActiveView);

  return (
    <button
      onClick={() => {
        setActiveConversation(conv.id);
        setActiveView('home');
      }}
      className={`w-full flex items-center gap-2.5 px-3 py-1 text-sm rounded-lg transition-colors ${
        isActive
          ? 'bg-gray-100 dark:bg-[#2C2C2E] text-gray-900 dark:text-[#F5F5F5] font-medium'
          : 'text-gray-500 dark:text-[#98989D] hover:text-gray-800 dark:hover:text-[#F5F5F5] hover:bg-gray-50 dark:hover:bg-[#252526]'
      }`}
    >
      <ProgressRing
        percentage={CONV_PROGRESS[conv.status] ?? 0}
        size={14}
        color="#818CF8"
      />
      <span className="truncate">{conv.title || conv.goalText.slice(0, 40)}</span>
    </button>
  );
}

function ProjectItem({ project, isActive }: { project: Project; isActive: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `project-${project.id}`,
    data: { type: 'project', projectId: project.id },
  });

  const setActiveView = useTaskStore(s => s.setActiveView);
  const tasks = useTaskStore(s => s.tasks);
  const profiles = useTaskStore(s => s.profiles);
  const projectShares = useTaskStore(s => s.projectShares);

  const projectTasks = tasks.filter(t => !t.deletedAt && t.projectId === project.id && !t.isSomeday);
  const uncompletedCount = projectTasks.filter(t => !t.completed).length;
  const completedCount = projectTasks.filter(t => t.completed).length;
  const totalCount = projectTasks.length;
  const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const activeShares = projectShares
    .filter(s => s.projectId === project.id && s.status === 'active' && s.sharedWith)
    .map(s => profiles.find(p => p.id === s.sharedWith))
    .filter(Boolean);
  const invitedShares = projectShares.filter(s => s.projectId === project.id && s.status === 'invited');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center" {...attributes} {...listeners}>
      <button
        onClick={() => {
          log.info('project_clicked', { projectId: project.id, projectTitle: project.title, isOwner: project.userId === useTaskStore.getState().userId })
          setActiveView('project', project.id)
        }}
        className={`flex-1 flex items-center gap-2.5 px-3 py-1 text-sm rounded-lg transition-colors ${
          isActive
            ? 'bg-gray-100 dark:bg-[#2C2C2E] text-gray-900 dark:text-[#F5F5F5] font-medium'
            : 'text-gray-500 dark:text-[#98989D] hover:text-gray-800 dark:hover:text-[#F5F5F5] hover:bg-gray-50 dark:hover:bg-[#252526]'
        }`}
      >
        <ProgressRing
          percentage={percentage}
          size={14}
          color={PROJECT_COLOR_MAP[project.color]}
          className={isActive ? '' : 'opacity-80'}
        />
        <span className="truncate">{project.title}</span>
        {activeShares.length > 0 && (
          <div className="flex -space-x-1 ml-1">
            {activeShares.slice(0, 3).map(profile => profile && (
              <div
                key={profile.id}
                className="w-3.5 h-3.5 rounded-full bg-blue-100 dark:bg-[#1C3A5C] border border-white dark:border-[#151516] flex items-center justify-center"
                title={profile.displayName}
              >
                <span className="text-[6px] font-medium text-blue-600 dark:text-[#64B5F6]">
                  {profile.displayName.charAt(0)}
                </span>
              </div>
            ))}
          </div>
        )}
        {invitedShares.length > 0 && (
          <span className="text-[9px] text-amber-500 dark:text-amber-400 font-medium ml-1" title={`${invitedShares.length} invited`}>
            +{invitedShares.length}
          </span>
        )}
        {uncompletedCount > 0 && (
          <span className="text-xs text-gray-400 dark:text-[#636366] font-medium ml-auto">{uncompletedCount}</span>
        )}
      </button>
    </div>
  );
}

export function SidebarContent({ onSearchOpen, onSettingsOpen }: { onSearchOpen?: () => void; onSettingsOpen?: () => void }) {
  const tasks = useTaskStore(s => s.tasks);
  const projects = useTaskStore(s => s.projects);
  const activeView = useTaskStore(s => s.activeView);
  const activeProjectId = useTaskStore(s => s.activeProjectId);
  const setActiveView = useTaskStore(s => s.setActiveView);
  const addProject = useTaskStore(s => s.addProject);
  const signOut = useAuthStore(s => s.signOut);
  const userId = useTaskStore(s => s.userId);
  const { resolvedTheme, toggle: toggleTheme } = useThemeStore();

  const conversations = useAIStudioStore(s => s.conversations);
  const activeConversationId = useAIStudioStore(s => s.activeConversationId);

  const [adding, setAdding] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');

  const trashCount = tasks.filter(t => t.deletedAt !== null).length;
  const sharedProjects = projects.filter(p => p.userId !== userId);
  // Merge planning conversations and user projects into one sorted list.
  // Conversations sort by their last-updated time; projects sort by creation
  // date (no updatedAt column on projects yet).
  const mergedItems: MergedItem[] = useMemo(() => {
    const planningConvs = conversations
      .filter(c => c.status !== 'active' && c.status !== 'archived')
      .map(c => ({ type: 'conversation' as const, item: c, sortDate: c.updatedAt }));

    const userProjects = projects
      .filter(p => p.userId === userId)
      .map(p => ({ type: 'project' as const, item: p, sortDate: p.createdAt }));

    const items = [...planningConvs, ...userProjects];
    items.sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());
    return items;
  }, [conversations, projects, userId]);

  const handleAddProject = () => {
    if (newProjectTitle.trim()) {
      addProject(newProjectTitle.trim());
      setNewProjectTitle('');
      setAdding(false);
    }
  };

  return (
    <>
      <div className="p-5 pb-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-[#F5F5F5]">Doing</h1>
        <button
          onClick={onSearchOpen}
          className="text-gray-300 dark:text-[#48484A] hover:text-gray-500 dark:hover:text-[#98989D] transition-colors"
          title="Search"
        >
          <SearchIcon size={16} />
        </button>
      </div>

      <nav className="px-3 space-y-0.5">
        <SidebarButton
          active={activeView === 'home' && !activeConversationId && !activeProjectId}
          onClick={() => setActiveView('home')}
        >
          <HomeIcon size={16} className="text-blue-500" />
          <span>Home</span>
        </SidebarButton>
      </nav>

      <div className="mt-6 px-5 mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.08em]">Projects</span>
        <button
          onClick={() => setAdding(true)}
          className="text-gray-300 dark:text-[#48484A] hover:text-gray-500 dark:hover:text-[#98989D] transition-colors"
          title="Add Project"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M7 2v10M2 7h10" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {mergedItems.map(entry => {
          if (entry.type === 'conversation') {
            return (
              <ConversationItem
                key={`conv-${entry.item.id}`}
                conv={entry.item}
                isActive={activeConversationId === entry.item.id}
              />
            );
          }
          return (
            <ProjectItem
              key={`proj-${entry.item.id}`}
              project={entry.item}
              isActive={activeView === 'project' && activeProjectId === entry.item.id}
            />
          );
        })}
      </nav>

      {adding && (
        <div className="px-3">
          <input
            autoFocus
            className="w-full px-3 py-1 text-sm border border-gray-200 dark:border-[#38383A] rounded-lg outline-none focus:border-gray-300 dark:focus:border-[#48484A] bg-transparent text-gray-900 dark:text-[#F5F5F5] placeholder:text-gray-400 dark:placeholder:text-[#636366]"
            placeholder="Project name"
            value={newProjectTitle}
            onChange={e => setNewProjectTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAddProject();
              if (e.key === 'Escape') { setAdding(false); setNewProjectTitle(''); }
            }}
            onBlur={() => {
              if (!newProjectTitle.trim()) { setAdding(false); }
              else handleAddProject();
            }}
          />
        </div>
      )}

      {sharedProjects.length > 0 && (
        <>
          <div className="mt-6 px-5 mb-2">
            <span className="text-[11px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.08em]">Shared with me</span>
          </div>
          <nav className="px-3 space-y-0.5">
            {sharedProjects.map(project => (
              <button
                key={project.id}
                onClick={() => {
                  log.info('shared_project_clicked', { projectId: project.id, projectTitle: project.title })
                  setActiveView('project', project.id)
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-1 text-sm rounded-lg transition-colors ${
                  activeView === 'project' && activeProjectId === project.id
                    ? 'bg-gray-100 dark:bg-[#2C2C2E] text-gray-900 dark:text-[#F5F5F5] font-medium'
                    : 'text-gray-500 dark:text-[#98989D] hover:text-gray-800 dark:hover:text-[#F5F5F5] hover:bg-gray-50 dark:hover:bg-[#252526]'
                }`}
              >
                <ProgressRing percentage={0} size={14} color={PROJECT_COLOR_MAP[project.color]} className="opacity-80" />
                <span className="truncate">{project.title}</span>
              </button>
            ))}
          </nav>
        </>
      )}

      <div className="px-3 pt-4 space-y-0.5">
        <SidebarButton
          active={activeView === 'logbook'}
          onClick={() => setActiveView('logbook')}
        >
          <LogbookIcon size={16} className="text-green-500" />
          <span>Logbook</span>
        </SidebarButton>

        <SidebarButton
          active={activeView === 'trash'}
          onClick={() => setActiveView('trash')}
        >
          <TrashIcon size={16} className="text-gray-400" />
          <span>Trash</span>
          {trashCount > 0 && (
            <span className="text-xs text-gray-400 dark:text-[#636366] font-medium ml-auto">{trashCount}</span>
          )}
        </SidebarButton>
      </div>

      <div className="px-3 pb-3 mt-3 space-y-1 border-t border-gray-100 dark:border-[#38383A] pt-3">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2 px-3 py-1 text-xs text-gray-300 dark:text-[#636366] hover:text-gray-500 dark:hover:text-[#98989D] transition-colors"
        >
          {resolvedTheme === 'dark' ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7" cy="7" r="2.5" />
              <path d="M7 1v1.5M7 11.5V13M2.5 2.5l1 1M10.5 10.5l1 1M1 7h1.5M11.5 7H13M2.5 11.5l1-1M10.5 3.5l1-1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11.5 8.5a5 5 0 0 1-6-6 5 5 0 1 0 6 6z" />
            </svg>
          )}
          {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        <button
          onClick={onSettingsOpen}
          className="w-full flex items-center gap-2 px-3 py-1 text-xs text-gray-300 dark:text-[#636366] hover:text-gray-500 dark:hover:text-[#98989D] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="7" cy="7" r="1.5" />
            <path d="M7 1v2M7 11v2M1 7h2M11 7h2M3.5 3.5l1 1M9.5 9.5l1 1M3.5 10.5l1-1M9.5 4.5l1-1" />
          </svg>
          Settings
        </button>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-1 text-xs text-gray-300 dark:text-[#636366] hover:text-gray-500 dark:hover:text-[#98989D] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3.5a4 4 0 1 0 4 0" />
            <path d="M7 1v5" />
          </svg>
          Sign out
        </button>
      </div>
    </>
  );
}

export default function Sidebar({ onSearchOpen, onSettingsOpen }: { onSearchOpen?: () => void; onSettingsOpen?: () => void }) {
  const sidebarRef = useRef<HTMLElement | null>(null)

  return (
    <aside
      ref={sidebarRef}
      className="hidden md:flex h-screen border-r border-gray-100 dark:border-[#38383A] bg-white dark:bg-[#151516] flex-shrink-0"
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        <SidebarContent onSearchOpen={onSearchOpen} onSettingsOpen={onSettingsOpen} />
      </div>
      <ResizeHandle containerRef={sidebarRef} position="right" minWidth={180} maxWidth={400} storageKey="sidebarWidth" defaultWidth={240} />
    </aside>
  );
}

function SidebarButton({ active, onClick, children, className = '' }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-1 text-sm rounded-lg transition-colors ${
        active
          ? 'bg-gray-100 dark:bg-[#2C2C2E] text-gray-900 dark:text-[#F5F5F5] font-medium'
          : 'text-gray-500 dark:text-[#98989D] hover:text-gray-800 dark:hover:text-[#F5F5F5] hover:bg-gray-50 dark:hover:bg-[#252526]'
      } ${className}`}
    >
      {children}
    </button>
  );
}
