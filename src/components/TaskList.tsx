import { useMemo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useTaskStore } from '../store/useTaskStore';
import { format } from 'date-fns';
import { TAG_COLOR_MAP, PROJECT_COLOR_MAP } from '../lib/constants';
import DraggableTaskItem from './DraggableTaskItem';
import TaskItem from './TaskItem';
import AddTaskInput from './AddTaskInput';
import EmptyState from './EmptyState';
import ProgressRing from './ProgressRing';
import type { Task } from '../types';

function getDateGroupKey(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const dayOfWeek = todayStart.getDay();
  const monday = new Date(todayStart);
  monday.setDate(monday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const lastMonday = new Date(monday);
  lastMonday.setDate(lastMonday.getDate() - 7);

  if (date >= todayStart) return 'Today';
  if (date >= yesterdayStart) return 'Yesterday';
  if (date >= monday) return 'This Week';
  if (date >= lastMonday) return 'Last Week';
  return 'Earlier';
}

export default function TaskList() {
  const tasks = useTaskStore(s => s.tasks);
  const projects = useTaskStore(s => s.projects);
  const tags = useTaskStore(s => s.tags);
  const activeView = useTaskStore(s => s.activeView);
  const activeProjectId = useTaskStore(s => s.activeProjectId);
  const activeTagId = useTaskStore(s => s.activeTagId);
  const setActiveTagId = useTaskStore(s => s.setActiveTagId);
  const emptyTrash = useTaskStore(s => s.emptyTrash);
  const updateProject = useTaskStore(s => s.updateProject);

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  const completionTimestamps = useRef<Map<string, number>>(new Map());
  const [pendingVersion, setPendingVersion] = useState(0);

  // Detect newly completed tasks synchronously during render
  // (before useMemos evaluate — prevents flash to completed section)
  for (const task of tasks) {
    if (task.completed) {
      if (!completionTimestamps.current.has(task.id)) {
        completionTimestamps.current.set(task.id, Date.now());
      }
    } else {
      completionTimestamps.current.delete(task.id);
    }
  }

  const isPendingComplete = (id: string): boolean => {
    const ts = completionTimestamps.current.get(id);
    return ts !== undefined && Date.now() - ts < 3000;
  };

  useLayoutEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    for (const [, ts] of completionTimestamps.current) {
      const elapsed = Date.now() - ts;
      if (elapsed < 3000) {
        timeouts.push(setTimeout(() => {
          setPendingVersion(v => v + 1);
        }, 3000 - elapsed));
      }
    }
    return () => timeouts.forEach(clearTimeout);
  }, [tasks, pendingVersion]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    if (activeView === 'trash') {
      filtered = filtered.filter(t => t.deletedAt !== null);
      filtered.sort((a, b) => {
        const aTime = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
        const bTime = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
        return bTime - aTime;
      });
      return filtered;
    }

    filtered = filtered.filter(t => !t.deletedAt);

    if (activeView === 'logbook') {
      filtered = filtered.filter(t => t.completed && t.completedAt !== null);
      filtered.sort((a, b) => {
        const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return bTime - aTime;
      });
    } else if (activeView === 'inbox') {
      filtered = filtered.filter(t => !t.completed && !t.isSomeday && t.projectId === null);
      filtered.sort((a, b) => a.sortOrder - b.sortOrder);
    } else if (activeView === 'today') {
      filtered = filtered.filter(t => (!t.completed || isPendingComplete(t.id)) && !t.isSomeday && (t.isToday || t.dueDate === todayStr));
      filtered.sort((a, b) => {
        const aOverdue = a.dueDate && a.dueDate < todayStr ? 1 : 0;
        const bOverdue = b.dueDate && b.dueDate < todayStr ? 1 : 0;
        if (aOverdue !== bOverdue) return bOverdue - aOverdue;
        if (a.isToday !== b.isToday) return a.isToday ? -1 : 1;
        return a.sortOrder - b.sortOrder;
      });
    } else if (activeView === 'someday') {
      filtered = filtered.filter(t => !t.completed && t.isSomeday);
      filtered.sort((a, b) => a.sortOrder - b.sortOrder);
    } else if (activeView === 'all') {
      filtered = filtered.filter(t => !t.completed && !t.isSomeday);
      filtered.sort((a, b) => a.sortOrder - b.sortOrder);
    } else if (activeView === 'project' && activeProjectId) {
      filtered = filtered.filter(t => (!t.completed || isPendingComplete(t.id)) && !t.isSomeday && t.projectId === activeProjectId);
      filtered.sort((a, b) => a.sortOrder - b.sortOrder);
    }

    if (activeTagId) {
      filtered = filtered.filter(t => t.tagIds.includes(activeTagId));
    }

    return filtered;
  }, [tasks, activeView, activeProjectId, activeTagId, todayStr, pendingVersion]);

  const logbookGroups = useMemo(() => {
    if (activeView !== 'logbook') return null;
    const groups = new Map<string, Task[]>();
    for (const task of filteredTasks) {
      const key = task.completedAt ? getDateGroupKey(task.completedAt) : 'Unknown';
      const existing = groups.get(key);
      if (existing) existing.push(task);
      else groups.set(key, [task]);
    }
    const order = ['Today', 'Yesterday', 'This Week', 'Last Week', 'Earlier', 'Unknown'];
    return order.filter(k => groups.has(k)).map(label => ({ label, tasks: groups.get(label)! }));
  }, [filteredTasks, activeView]);

  const completedTasks = useMemo(() => {
    let result: Task[] = [];

    if (activeView === 'today') {
      result = tasks.filter(t => !t.deletedAt && t.completed && !isPendingComplete(t.id) && (t.isToday || t.dueDate === todayStr));
    } else if (activeView === 'project' && activeProjectId) {
      result = tasks
        .filter(t => !t.deletedAt && t.completed && !isPendingComplete(t.id) && !t.isSomeday && t.projectId === activeProjectId)
        .sort((a, b) => {
          const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          return bTime - aTime;
        });
    }

    if (activeTagId) {
      result = result.filter(t => t.tagIds.includes(activeTagId));
    }

    return result;
  }, [tasks, activeView, activeProjectId, activeTagId, todayStr, pendingVersion]);

  const isTrash = activeView === 'trash';
  const isLogbook = activeView === 'logbook';
  const sortableIds = useMemo(() =>
    isTrash || isLogbook ? [] : filteredTasks.map(t => `task-${t.id}`),
  [filteredTasks, isTrash, isLogbook]);

  let title = '';
  let subtitle = '';

  if (activeView === 'inbox') {
    title = 'Inbox';
  } else if (activeView === 'today') {
    title = 'Today';
    subtitle = format(new Date(), 'EEEE, MMMM d');
  } else if (activeView === 'someday') {
    title = 'Someday';
  } else if (activeView === 'trash') {
    title = 'Trash';
  } else if (activeView === 'logbook') {
    title = 'Logbook';
  } else if (activeView === 'all') {
    title = 'All';
  } else if (activeView === 'project' && activeProjectId) {
    const project = projects.find(p => p.id === activeProjectId);
    title = project?.title ?? 'Project';
  }

  const projectHeaderData = useMemo(() => {
    if (activeView !== 'project' || !activeProjectId) return null;
    const project = projects.find(p => p.id === activeProjectId);
    const projectTasksAll = tasks.filter(t => !t.deletedAt && t.projectId === activeProjectId && !t.isSomeday);
    const comp = projectTasksAll.filter(t => t.completed).length;
    const tot = projectTasksAll.length;
    return {
      project,
      percentage: tot > 0 ? (comp / tot) * 100 : 0,
    };
  }, [activeView, activeProjectId, tasks, projects]);

  const currentProjectId = activeView === 'project' ? activeProjectId : null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[680px] mx-auto max-md:pt-8 max-md:pb-12 max-md:px-5 py-16 px-10">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {projectHeaderData && (
              <ProgressRing
                percentage={projectHeaderData.percentage}
                size={24}
                strokeWidth={2}
                color={projectHeaderData.project ? PROJECT_COLOR_MAP[projectHeaderData.project.color] : undefined}
              />
            )}
            <div>
              {activeView === 'project' && projectHeaderData?.project ? (
                editingTitle ? (
                  <input
                    ref={titleInputRef}
                    className="text-[28px] font-bold text-gray-900 dark:text-[#F5F5F5] outline-none bg-transparent w-full"
                    value={editingTitleValue}
                    onChange={e => setEditingTitleValue(e.target.value)}
                    onBlur={() => {
                      if (editingTitleValue.trim() && editingTitleValue.trim() !== projectHeaderData.project!.title) {
                        updateProject(projectHeaderData.project!.id, { title: editingTitleValue.trim() });
                      }
                      setEditingTitle(false);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                      if (e.key === 'Escape') {
                        setEditingTitleValue(projectHeaderData.project!.title);
                        setEditingTitle(false);
                      }
                    }}
                  />
                ) : (
                  <h1
                    className="text-[28px] font-bold text-gray-900 dark:text-[#F5F5F5] cursor-text"
                    onClick={() => {
                      setEditingTitleValue(projectHeaderData.project!.title);
                      setEditingTitle(true);
                    }}
                  >
                    {title}
                  </h1>
                )
              ) : (
                <h1 className="text-[28px] font-bold text-gray-900 dark:text-[#F5F5F5]">{title}</h1>
              )}
              {subtitle && <p className="text-sm text-gray-400 dark:text-[#98989D] mt-1">{subtitle}</p>}
            </div>
          </div>
          {isTrash && filteredTasks.length > 0 && (
            <button
              onClick={emptyTrash}
              className="text-sm text-gray-400 dark:text-[#636366] hover:text-red-500 dark:hover:text-[#F48FB1] transition-colors"
            >
              Empty Trash
            </button>
          )}
        </div>

        {activeTagId && (
          <div className="mb-5 flex items-center gap-2">
            <span className="text-xs text-gray-400 dark:text-[#636366]">Filtered by tag:</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-[#2C2C2E] text-gray-700 dark:text-[#F5F5F5] rounded-md">
              {(() => {
                const tag = tags.find(t => t.id === activeTagId);
                return tag ? (
                  <>
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: TAG_COLOR_MAP[tag.color] }} />
                    {tag.title}
                  </>
                ) : 'Unknown';
              })()}
              <button
                onClick={() => setActiveTagId(null)}
                className="ml-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-[#98989D]"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M3 3l6 6M9 3l-6 6" />
                </svg>
              </button>
            </span>
          </div>
        )}

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
                    <div className="flex-1 h-px bg-gray-100 dark:bg-[#2C2C2E]" />
                  </div>
                  {group.tasks.map(task => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-0">
                {filteredTasks.map(task => (
                  <DraggableTaskItem key={task.id} task={task} />
                ))}
              </div>
            </SortableContext>
          )
        ) : (
          <EmptyState view={activeView} />
        )}

        {!isTrash && !isLogbook && <AddTaskInput projectId={currentProjectId} />}

        {completedTasks.length > 0 && (
          <>
            <div className="mt-8 mb-3 flex items-center gap-3">
              <span className="text-[11px] font-semibold text-gray-300 dark:text-[#636366] uppercase tracking-[0.08em]">Completed</span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-[#2C2C2E]" />
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
  );
}
