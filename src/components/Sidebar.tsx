import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTaskStore } from '../store/useTaskStore';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { PROJECT_COLOR_MAP, TAG_COLOR_MAP } from '../lib/constants';
import type { Project } from '../types';
import {
  InboxIcon,
  TodayIcon,
  AnytimeIcon,
  SomedayIcon,
  LogbookIcon,
  TrashIcon,
  SearchIcon
} from '../lib/icons';
import ProgressRing from './ProgressRing';

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
        onClick={() => setActiveView('project', project.id)}
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

export function SidebarContent({ onSearchOpen }: { onSearchOpen?: () => void }) {
  const tasks = useTaskStore(s => s.tasks);
  const projects = useTaskStore(s => s.projects);
  const tags = useTaskStore(s => s.tags);
  const activeView = useTaskStore(s => s.activeView);
  const activeProjectId = useTaskStore(s => s.activeProjectId);
  const activeTagId = useTaskStore(s => s.activeTagId);
  const setActiveView = useTaskStore(s => s.setActiveView);
  const addProject = useTaskStore(s => s.addProject);
  const addTag = useTaskStore(s => s.addTag);
  const setActiveTagId = useTaskStore(s => s.setActiveTagId);
  const signOut = useAuthStore(s => s.signOut);
  const userId = useTaskStore(s => s.userId);
  const { theme, toggle: toggleTheme } = useThemeStore();

  const [adding, setAdding] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [newTagTitle, setNewTagTitle] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);
  const inboxCount = tasks.filter(
    t => !t.completed && !t.isSomeday && !t.deletedAt && t.projectId === null
  ).length;
  const todayCount = tasks.filter(
    t => !t.completed && !t.isSomeday && !t.deletedAt && (t.isToday || t.dueDate === todayStr)
  ).length;
  const trashCount = tasks.filter(t => t.deletedAt !== null).length;
  const assignedCount = tasks.filter(
    t => !t.completed && !t.deletedAt && t.assignedTo === userId
  ).length;
  const sharedProjects = projects.filter(p => p.userId !== userId);

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
        <h1 className="text-lg font-bold text-gray-900 dark:text-[#F5F5F5]">Things</h1>
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
          active={activeView === 'inbox'}
          onClick={() => setActiveView('inbox')}
        >
          <InboxIcon size={16} className="text-blue-500" />
          <span>Inbox</span>
          {inboxCount > 0 && (
            <span className="text-xs text-gray-400 dark:text-[#636366] font-medium ml-auto">{inboxCount}</span>
          )}
        </SidebarButton>

        <SidebarButton
          active={activeView === 'today'}
          onClick={() => setActiveView('today')}
        >
          <TodayIcon size={16} className="text-orange-400" />
          <span>Today</span>
          {todayCount > 0 && (
            <span className="text-xs text-gray-400 dark:text-[#636366] font-medium ml-auto">{todayCount}</span>
          )}
        </SidebarButton>

        <SidebarButton
          active={activeView === 'all'}
          onClick={() => setActiveView('all')}
        >
          <AnytimeIcon size={16} className="text-teal-500" />
          <span>Anytime</span>
        </SidebarButton>

        <SidebarButton
          active={activeView === 'someday'}
          onClick={() => setActiveView('someday')}
        >
          <SomedayIcon size={16} className="text-indigo-400" />
          <span>Someday</span>
        </SidebarButton>

        <SidebarButton
          active={activeView === 'assigned'}
          onClick={() => setActiveView('assigned')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-300">
            <circle cx="8" cy="5" r="2.5" />
            <path d="M3 14c0-2.5 2.5-4 5-4s5 1.5 5 4" />
            <path d="M11.5 5l2.5 2.5 3-3" strokeWidth="1" />
          </svg>
          <span>Assigned</span>
          {assignedCount > 0 && (
            <span className="text-xs text-gray-400 dark:text-[#636366] font-medium ml-auto">{assignedCount}</span>
          )}
        </SidebarButton>

        <div className="pt-4">
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
      </nav>

      <div className="mt-6 px-5 mb-2">
        <span className="text-[11px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.08em]">Projects</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {projects.map(project => (
          <ProjectItem
            key={project.id}
            project={project}
            isActive={activeView === 'project' && activeProjectId === project.id}
          />
        ))}
      </nav>

      <div className="px-3">
        {adding ? (
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
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full text-left px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-[#98989D] transition-colors"
          >
            + New Project
          </button>
        )}
      </div>

      {sharedProjects.length > 0 && (
        <>
          <div className="mt-6 px-5 mb-2">
            <span className="text-[11px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.08em]">Shared with me</span>
          </div>
          <nav className="px-3 space-y-0.5">
            {sharedProjects.map(project => (
              <button
                key={project.id}
                onClick={() => setActiveView('project', project.id)}
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

      {tags.length > 0 && (
        <>
          <div className="mt-4 px-5 mb-2">
            <span className="text-[11px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.08em]">Tags</span>
          </div>
          <nav className="max-h-[200px] overflow-y-auto px-3 space-y-0.5">
            {tags.map(tag => {
              const tagTaskCount = tasks.filter(t => !t.deletedAt && t.tagIds.includes(tag.id)).length;
              return (
                <button
                  key={tag.id}
                  onClick={() => setActiveTagId(activeTagId === tag.id ? null : tag.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1 text-sm rounded-lg transition-colors ${
                    activeTagId === tag.id
                      ? 'bg-gray-100 dark:bg-[#2C2C2E] text-gray-900 dark:text-[#F5F5F5] font-medium'
                      : 'text-gray-500 dark:text-[#98989D] hover:text-gray-800 dark:hover:text-[#F5F5F5] hover:bg-gray-50 dark:hover:bg-[#252526]'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: TAG_COLOR_MAP[tag.color] }} />
                  <span className="truncate">{tag.title}</span>
                  {tagTaskCount > 0 && (
                    <span className="text-xs text-gray-400 dark:text-[#636366] font-medium ml-auto">{tagTaskCount}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </>
      )}

      {addingTag ? (
        <div className="px-3 pt-2">
          <input
            autoFocus
            className="w-full px-3 py-1 text-sm border border-gray-200 dark:border-[#38383A] rounded-lg outline-none focus:border-gray-300 dark:focus:border-[#48484A] bg-transparent text-gray-900 dark:text-[#F5F5F5] placeholder:text-gray-400 dark:placeholder:text-[#636366]"
            placeholder="Tag name"
            value={newTagTitle}
            onChange={e => setNewTagTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newTagTitle.trim()) {
                addTag(newTagTitle.trim());
                setNewTagTitle('');
                setAddingTag(false);
              }
              if (e.key === 'Escape') { setAddingTag(false); setNewTagTitle(''); }
            }}
            onBlur={() => {
              if (!newTagTitle.trim()) { setAddingTag(false); }
              else { addTag(newTagTitle.trim()); setAddingTag(false); setNewTagTitle(''); }
            }}
          />
        </div>
      ) : (
        <div className="px-3 pt-2">
          <button
            onClick={() => setAddingTag(true)}
            className="w-full text-left px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-[#98989D] transition-colors"
          >
            + New Tag
          </button>
        </div>
      )}

      <div className="px-3 pb-3 mt-3 space-y-1 border-t border-gray-100 dark:border-[#2C2C2E] pt-3">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2 px-3 py-1 text-xs text-gray-300 dark:text-[#636366] hover:text-gray-500 dark:hover:text-[#98989D] transition-colors"
        >
          {theme === 'dark' ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7" cy="7" r="2.5" />
              <path d="M7 1v1.5M7 11.5V13M2.5 2.5l1 1M10.5 10.5l1 1M1 7h1.5M11.5 7H13M2.5 11.5l1-1M10.5 3.5l1-1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11.5 8.5a5 5 0 0 1-6-6 5 5 0 1 0 6 6z" />
            </svg>
          )}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
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

export default function Sidebar({ onSearchOpen }: { onSearchOpen?: () => void }) {
  return (
    <aside className="hidden md:flex w-[240px] h-screen border-r border-gray-100 dark:border-[#2C2C2E] flex-col bg-white dark:bg-[#151516] flex-shrink-0">
      <SidebarContent onSearchOpen={onSearchOpen} />
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
