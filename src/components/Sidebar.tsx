import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTaskStore } from '../store/useTaskStore';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { PROJECT_COLOR_MAP, TAG_COLOR_MAP } from '../lib/constants';
import type { Project } from '../types';

function ProjectItem({ project, isActive }: { project: Project; isActive: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `project-${project.id}`,
    data: { type: 'project', projectId: project.id },
  });

  const setActiveView = useTaskStore(s => s.setActiveView);
  const deleteProject = useTaskStore(s => s.deleteProject);
  const tasks = useTaskStore(s => s.tasks);

  const taskCount = tasks.filter(t => !t.completed && !t.isSomeday && !t.deletedAt && t.projectId === project.id).length;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="group flex items-center" {...attributes} {...listeners}>
      <button
        onClick={() => setActiveView('project', project.id)}
        className={`flex-1 flex items-center gap-2.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
          isActive
            ? 'bg-gray-100 dark:bg-[#2C2C2E] text-gray-900 dark:text-[#F5F5F5] font-medium'
            : 'text-gray-500 dark:text-[#98989D] hover:text-gray-800 dark:hover:text-[#F5F5F5] hover:bg-gray-50 dark:hover:bg-[#252526]'
        }`}
      >
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PROJECT_COLOR_MAP[project.color] }} />
        <span className="truncate">{project.title}</span>
        {taskCount > 0 && (
          <span className="text-xs text-gray-400 dark:text-[#636366] font-medium ml-auto">{taskCount}</span>
        )}
      </button>
      <button
        onClick={() => deleteProject(project.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 dark:text-[#48484A] hover:text-gray-500 dark:hover:text-[#98989D] transition-all mr-1"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 3l6 6M9 3l-6 6"/>
        </svg>
      </button>
    </div>
  );
}

export default function Sidebar({ onSearchOpen }: { onSearchOpen?: () => void }) {
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
  const logbookCount = tasks.filter(t => t.completed && !t.deletedAt).length;

  const handleAddProject = () => {
    if (newProjectTitle.trim()) {
      addProject(newProjectTitle.trim());
      setNewProjectTitle('');
      setAdding(false);
    }
  };

  return (
    <aside className="w-[240px] h-screen border-r border-gray-100 dark:border-[#2C2C2E] flex flex-col bg-white dark:bg-[#151516] flex-shrink-0">
      <div className="p-5 pb-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-[#F5F5F5]">Things</h1>
        <button
          onClick={onSearchOpen}
          className="text-gray-300 dark:text-[#48484A] hover:text-gray-500 dark:hover:text-[#98989D] transition-colors"
          title="Search"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="7" cy="7" r="4.5" />
            <path d="M10.5 10.5L14 14" />
          </svg>
        </button>
      </div>

      <nav className="px-3 space-y-0.5">
        <SidebarButton
          active={activeView === 'inbox'}
          onClick={() => setActiveView('inbox')}
        >
          <span>Inbox</span>
          {inboxCount > 0 && (
            <span className="text-xs text-gray-400 dark:text-[#636366] font-medium ml-auto">{inboxCount}</span>
          )}
        </SidebarButton>

        <SidebarButton
          active={activeView === 'today'}
          onClick={() => setActiveView('today')}
        >
          <span>Today</span>
          {todayCount > 0 && (
            <span className="text-xs text-gray-400 dark:text-[#636366] font-medium ml-auto">{todayCount}</span>
          )}
        </SidebarButton>

        <SidebarButton
          active={activeView === 'someday'}
          onClick={() => setActiveView('someday')}
        >
          <span>Someday</span>
        </SidebarButton>

        <SidebarButton
          active={activeView === 'all'}
          onClick={() => setActiveView('all')}
        >
          <span>All</span>
        </SidebarButton>

        <div className="pt-4">
          <SidebarButton
            active={activeView === 'trash'}
            onClick={() => setActiveView('trash')}
          >
            <span>Trash</span>
            {trashCount > 0 && (
              <span className="text-xs text-gray-400 dark:text-[#636366] font-medium ml-auto">{trashCount}</span>
            )}
          </SidebarButton>

          <SidebarButton
            active={activeView === 'logbook'}
            onClick={() => setActiveView('logbook')}
          >
            <span>Logbook</span>
            {logbookCount > 0 && (
              <span className="text-xs text-gray-400 dark:text-[#636366] font-medium ml-auto">{logbookCount}</span>
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
            className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-[#38383A] rounded-lg outline-none focus:border-gray-300 dark:focus:border-[#48484A] bg-transparent text-gray-900 dark:text-[#F5F5F5] placeholder:text-gray-400 dark:placeholder:text-[#636366]"
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
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
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
            className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-[#38383A] rounded-lg outline-none focus:border-gray-300 dark:focus:border-[#48484A] bg-transparent text-gray-900 dark:text-[#F5F5F5] placeholder:text-gray-400 dark:placeholder:text-[#636366]"
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
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 dark:text-[#636366] hover:text-gray-500 dark:hover:text-[#98989D] transition-colors"
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
          className="w-full text-left px-3 py-1.5 text-xs text-gray-300 dark:text-[#636366] hover:text-gray-500 dark:hover:text-[#98989D] transition-colors"
        >
          Sign out
        </button>
      </div>
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
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
        active
          ? 'bg-gray-100 dark:bg-[#2C2C2E] text-gray-900 dark:text-[#F5F5F5] font-medium'
          : 'text-gray-500 dark:text-[#98989D] hover:text-gray-800 dark:hover:text-[#F5F5F5] hover:bg-gray-50 dark:hover:bg-[#252526]'
      } ${className}`}
    >
      {children}
    </button>
  );
}
