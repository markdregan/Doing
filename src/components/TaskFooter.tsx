import { useState, useRef } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { getDeadlineLabel } from '../lib/dateUtils';
import { TAG_COLOR_MAP, PROJECT_COLOR_MAP } from '../lib/constants';
import { REPEAT_INTERVALS } from '../types';
import type { Task } from '../types';

interface TaskFooterProps {
  task: Task;
}

export default function TaskFooter({ task }: TaskFooterProps) {
  const updateTask = useTaskStore(s => s.updateTask);
  const toggleTaskTag = useTaskStore(s => s.toggleTaskTag);
  const moveTaskToToday = useTaskStore(s => s.moveTaskToToday);
  const removeTaskFromToday = useTaskStore(s => s.removeTaskFromToday);
  const moveTaskToSomeday = useTaskStore(s => s.moveTaskToSomeday);
  const removeTaskFromSomeday = useTaskStore(s => s.removeTaskFromSomeday);
  const updateRepeat = useTaskStore(s => s.updateRepeat);
  const moveTaskToProject = useTaskStore(s => s.moveTaskToProject);
  const softDeleteTask = useTaskStore(s => s.softDeleteTask);
  const tags = useTaskStore(s => s.tags);
  const projects = useTaskStore(s => s.projects);
  const activeView = useTaskStore(s => s.activeView);

  const [activePicker, setActivePicker] = useState<'tags' | 'repeat' | 'project' | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const currentProject = projects.find(p => p.id === task.projectId);
  const isLogbook = activeView === 'logbook';
  const isTrash = activeView === 'trash';
  const todayStr = new Date().toISOString().slice(0, 10);
  const isOverdue = task.dueDate != null && task.dueDate < todayStr && !task.completed;

  const handleDelete = () => {
    if (deleteConfirm) {
      softDeleteTask(task.id);
      setDeleteConfirm(false);
    } else {
      setDeleteConfirm(true);
    }
  };

  const closePicker = () => { setActivePicker(null); setDeleteConfirm(false); };

  if (isLogbook || isTrash) return null;

  return (
    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-[#2C2C2E]">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {task.dueDate && (
          <span className={`text-[11px] px-1.5 py-0.5 rounded-md ${
            isOverdue
              ? 'text-red-400 dark:text-[#F48FB1] bg-red-50/50 dark:bg-[#3C1C1E]'
              : 'text-blue-400 dark:text-[#64B5F6] bg-blue-50/50 dark:bg-[#1C3A5C]'
          }`}>
            {getDeadlineLabel(task.dueDate).label}
          </span>
        )}
        {task.tagIds.map(tagId => {
          const tag = tags.find(t => t.id === tagId);
          if (!tag) return null;
          return (
            <span
              key={tagId}
              className="w-1.5 h-1.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: TAG_COLOR_MAP[tag.color] }}
              title={tag.title}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => dateInputRef.current?.showPicker()}
          className="p-1 rounded text-gray-400 dark:text-[#636366] hover:text-blue-500 dark:hover:text-[#64B5F6] hover:bg-blue-50 dark:hover:bg-[#1C3A5C] transition-colors"
          title="Set Deadline"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" />
            <path d="M1.5 5.5h11" />
            <path d="M4.5 1v3M9.5 1v3" />
          </svg>
        </button>
        <input
          ref={dateInputRef}
          type="date"
          className="absolute opacity-0 pointer-events-none"
          value={task.dueDate ?? ''}
          onChange={e => updateTask(task.id, { dueDate: e.target.value || null })}
        />

        <div className="relative">
          <button
            onClick={() => setActivePicker(activePicker === 'repeat' ? null : 'repeat')}
            className={`p-1 rounded transition-colors ${
              task.repeat
                ? 'text-blue-500 dark:text-[#64B5F6] bg-blue-50 dark:bg-[#1C3A5C]'
                : 'text-gray-400 dark:text-[#636366] hover:text-blue-500 dark:hover:text-[#64B5F6] hover:bg-blue-50 dark:hover:bg-[#1C3A5C]'
            }`}
            title="Set Repeat"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 2.5v4.5l2.5 1.5" />
              <path d="M3.5 3.5l-1.5-1.5-1.5 1.5" />
              <path d="M2 8.5l1.5-1.5 1.5 1.5" />
              <circle cx="7" cy="7" r="5" />
            </svg>
          </button>
          {activePicker === 'repeat' && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#2C2C2E] rounded-lg shadow-xl border border-gray-100 dark:border-[#38383A] py-1 z-50 max-h-48 overflow-y-auto animate-fade-in">
              <button
                onClick={() => { updateRepeat(task.id, null); closePicker(); }}
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-gray-50 dark:hover:bg-[#252526] text-gray-500 dark:text-[#636366] transition-colors"
              >
                None
              </button>
              {REPEAT_INTERVALS.map(interval => (
                <button
                  key={interval}
                  onClick={() => { updateRepeat(task.id, interval); closePicker(); }}
                  className={`w-full px-3 py-1.5 text-xs text-left hover:bg-gray-50 dark:hover:bg-[#252526] transition-colors ${
                    task.repeat === interval ? 'text-blue-500 dark:text-[#64B5F6] font-medium' : 'text-gray-700 dark:text-[#E5E5E5]'
                  }`}
                >
                  {interval.charAt(0).toUpperCase() + interval.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setActivePicker(activePicker === 'tags' ? null : 'tags')}
            className={`p-1 rounded transition-colors ${
              task.tagIds.length > 0
                ? 'text-blue-500 dark:text-[#64B5F6] bg-blue-50 dark:bg-[#1C3A5C]'
                : 'text-gray-400 dark:text-[#636366] hover:text-blue-500 dark:hover:text-[#64B5F6] hover:bg-blue-50 dark:hover:bg-[#1C3A5C]'
            }`}
            title="Tags"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 2.5h4l5.5 5.5a1.5 1.5 0 0 1 0 2.12l-2 2a1.5 1.5 0 0 1-2.12 0L2 6.5v-4z" />
              <circle cx="4.5" cy="4.5" r="0.8" fill="currentColor" stroke="none" />
            </svg>
          </button>
          {activePicker === 'tags' && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#2C2C2E] rounded-lg shadow-xl border border-gray-100 dark:border-[#38383A] py-1 z-50 max-h-48 overflow-y-auto animate-fade-in">
              {tags.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-400 dark:text-[#636366]">No tags yet</p>
              ) : (
                tags.map(tag => {
                  const hasTag = task.tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTaskTag(task.id, tag.id)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-50 dark:hover:bg-[#252526] transition-colors"
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${hasTag ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-[#48484A]'}`}>
                        {hasTag && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 5l2 2 4-4" />
                          </svg>
                        )}
                      </div>
                      <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: TAG_COLOR_MAP[tag.color] }} />
                      <span className="text-gray-700 dark:text-[#F5F5F5]">{tag.title}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setActivePicker(activePicker === 'project' ? null : 'project')}
            className={`p-1 rounded transition-colors ${
              currentProject
                ? 'text-gray-500 dark:text-[#98989D] bg-gray-100 dark:bg-[#2C2C2E]'
                : 'text-gray-400 dark:text-[#636366] hover:text-gray-500 dark:hover:text-[#98989D] hover:bg-gray-100 dark:hover:bg-[#2C2C2E]'
            }`}
            title="Move to Project"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="10" height="10" rx="1.5" />
              <path d="M5 7h4M5 5h2M5 9h3" />
            </svg>
          </button>
          {activePicker === 'project' && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#2C2C2E] rounded-lg shadow-xl border border-gray-100 dark:border-[#38383A] py-1 z-50 max-h-48 overflow-y-auto animate-fade-in">
              <button
                onClick={() => { moveTaskToProject(task.id, null); closePicker(); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left ${!task.projectId ? 'bg-gray-50 dark:bg-[#252526] text-gray-900 dark:text-[#F5F5F5] font-medium' : 'text-gray-600 dark:text-[#98989D] hover:bg-gray-50 dark:hover:bg-[#252526]'} transition-colors`}
              >
                Inbox
              </button>
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => { moveTaskToProject(task.id, p.id); closePicker(); }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left ${task.projectId === p.id ? 'bg-gray-50 dark:bg-[#252526] text-gray-900 dark:text-[#F5F5F5] font-medium' : 'text-gray-600 dark:text-[#98989D] hover:bg-gray-50 dark:hover:bg-[#252526]'} transition-colors`}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PROJECT_COLOR_MAP[p.color] }} />
                  {p.title}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => task.isToday ? removeTaskFromToday(task.id) : moveTaskToToday(task.id)}
          className={`p-1 rounded transition-colors ${
            task.isToday
              ? 'text-orange-500 dark:text-[#F5A623] bg-orange-50 dark:bg-[#3C2E1C]'
              : 'text-gray-400 dark:text-[#636366] hover:text-orange-500 dark:hover:text-[#F5A623] hover:bg-orange-50 dark:hover:bg-[#3C2E1C]'
          }`}
          title={task.isToday ? 'Remove from Today' : 'Add to Today'}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill={task.isToday ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="7" cy="7" r="2.5" />
            <path d="M7 1v1.5M7 11.5V13M2.5 2.5l1 1M10.5 10.5l1 1M1 7h1.5M11.5 7H13M2.5 11.5l1-1M10.5 3.5l1-1" />
          </svg>
        </button>

        <button
          onClick={() => task.isSomeday ? removeTaskFromSomeday(task.id) : moveTaskToSomeday(task.id)}
          className={`p-1 rounded transition-colors ${
            task.isSomeday
              ? 'text-indigo-400 bg-indigo-50 dark:bg-[#2C1C3E]'
              : 'text-gray-400 dark:text-[#636366] hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-[#2C1C3E]'
          }`}
          title={task.isSomeday ? 'Remove from Someday' : 'Add to Someday'}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill={task.isSomeday ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.5 1.5a5.5 5.5 0 1 0 4 9.5A6 6 0 0 1 9.5 1.5z" />
          </svg>
        </button>

        {!isTrash && (
          <button
            onClick={handleDelete}
            className={`p-1 rounded transition-colors ${
              deleteConfirm
                ? 'text-white bg-red-500'
                : 'text-gray-400 dark:text-[#636366] hover:text-red-400 hover:bg-red-50 dark:hover:bg-[#3C1C1E]'
            }`}
            title={deleteConfirm ? 'Tap again to confirm' : 'Delete'}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 3.5h8M5.5 3.5V2.5h3v1M5.5 6v4.5M8.5 6v4.5" />
              <path d="M3.5 3.5l.5 7.5h6l.5-7.5" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
