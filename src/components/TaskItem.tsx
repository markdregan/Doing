import { useState, useRef, useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { TAG_COLOR_MAP } from '../lib/constants';
import { getTaskDueLabel } from '../lib/dateUtils';
import type { Task } from '../types';
import TaskFooter from './TaskFooter';
import TaskOverflow from './TaskOverflow';

function getCompletedDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const dateOnly = dateStr.slice(0, 10);

  if (dateOnly === todayStr) return 'Completed today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateOnly === yesterday.toISOString().slice(0, 10)) return 'Completed yesterday';

  return `Completed ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined })}`;
}

interface TaskItemProps {
  task: Task;
  dragListeners?: Record<string, unknown>;
  rightSlot?: React.ReactNode;
}

export default function TaskItem({ task, dragListeners, rightSlot }: TaskItemProps) {
  const updateTask = useTaskStore(s => s.updateTask);
  const toggleTask = useTaskStore(s => s.toggleTask);
  const tags = useTaskStore(s => s.tags);
  const checklistItems = useTaskStore(s => s.checklistItems);
  const addChecklistItem = useTaskStore(s => s.addChecklistItem);
  const toggleChecklistItem = useTaskStore(s => s.toggleChecklistItem);
  const updateChecklistItem = useTaskStore(s => s.updateChecklistItem);
  const deleteChecklistItem = useTaskStore(s => s.deleteChecklistItem);
  const activeView = useTaskStore(s => s.activeView);
  const restoreTask = useTaskStore(s => s.restoreTask);
  const deleteTask = useTaskStore(s => s.deleteTask);
  const profiles = useTaskStore(s => s.profiles);

  const isLogbook = activeView === 'logbook';
  const isTrash = activeView === 'trash';
  const todayStr = new Date().toISOString().slice(0, 10);
  const isOverdue = task.dueDate != null && task.dueDate < todayStr && !task.completed;

  // Unified active state
  const [isActive, setIsActive] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [notesText, setNotesText] = useState(task.notes);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingChecklistTitle, setEditingChecklistTitle] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const taskChecklistItems = checklistItems.filter(i => i.taskId === task.id && !task.deletedAt);
  const completedCount = taskChecklistItems.filter(i => i.completed).length;
  const totalCount = taskChecklistItems.length;

  const handleSaveNotes = () => {
    if (notesText !== task.notes) {
      updateTask(task.id, { notes: notesText });
    }
  };

  // Focus title input when expanding
  useEffect(() => {
    if (isActive && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isActive]);

  // Click/tap outside to collapse
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleSaveNotes();
        setIsActive(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [isActive, notesText, task.notes]);

  const expand = () => {
    if (isLogbook) return;
    setEditTitle(task.title);
    setNotesText(task.notes);
    setIsActive(true);
  };

  const collapse = () => {
    handleSaveNotes();
    handleSaveTitle();
    setIsActive(false);
  };

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle.trim() !== task.title) {
      updateTask(task.id, { title: editTitle.trim() });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditTitle(task.title);
      setNotesText(task.notes);
      collapse();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`group/item rounded-lg transition-all duration-200 relative ${
        isActive ? 'border-b border-gray-50 dark:border-[#252526]' : 'hover:bg-gray-50/30 dark:hover:bg-white/[0.03]'
      }`}
      onKeyDown={handleKeyDown}
    >
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 dark:bg-[#007AFF] rounded-sm" />
      )}
      <div className="flex items-start gap-2 py-1.5 px-2">
        {/* Drag handle + Checkbox column */}
        <div className="flex items-start gap-0.5 mt-0.5">
          <button
            {...(dragListeners ?? {}) as React.HTMLAttributes<HTMLButtonElement>}
            className={`p-0.5 rounded cursor-grab active:cursor-grabbing transition-all ${
              isLogbook ? 'hidden' : 'max-md:opacity-100 opacity-0 group-hover/item:opacity-100'
            } text-gray-300 dark:text-[#48484A] hover:text-gray-500 dark:hover:text-[#98989D]`}
            title="Drag to reorder"
          >
            <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
              <circle cx="3" cy="3" r="1" />
              <circle cx="7" cy="3" r="1" />
              <circle cx="3" cy="7" r="1" />
              <circle cx="7" cy="7" r="1" />
              <circle cx="3" cy="11" r="1" />
              <circle cx="7" cy="11" r="1" />
            </svg>
          </button>

          {isLogbook ? (
            <div className="w-4 h-4 rounded-full border-[1.5px] border-green-500 bg-green-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                task.completed
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-300 dark:border-[#48484A] group-hover/item:border-green-500 group-hover/item:bg-green-500'
              }`}
            >
              <svg
                className={`w-3 h-3 text-white transition-opacity duration-150 ${
                  task.completed ? 'opacity-100' : 'max-md:opacity-100 opacity-0 group-hover/item:opacity-100'
                }`}
                viewBox="0 0 12 12"
                fill="none"
              >
                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {isActive ? (
            <input
              ref={titleInputRef}
              className="w-full text-[15px] font-medium text-gray-900 dark:text-[#F5F5F5] outline-none bg-transparent"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  notesRef.current?.focus();
                }
                if (e.key === 'Escape') {
                  setEditTitle(task.title);
                  collapse();
                }
              }}
            />
          ) : (
            <div className="flex items-center gap-2 min-h-[22px]">
              <span
                className={`text-[15px] leading-snug cursor-text transition-colors flex-1 ${
                  task.completed ? 'line-through text-gray-300 dark:text-[#636366]' : 'text-gray-800 dark:text-[#F5F5F5]'
                }`}
                onClick={expand}
              >
                {task.title}
              </span>

              {/* Presence indicators (collapsed) */}
              {task.notes && (
                <svg
                  className="w-3 h-3 text-gray-300 dark:text-[#48484A] flex-shrink-0"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.5 2.5h9v7l-2.5 2.5-2.5-2.5-2.5 2.5-2.5-2.5v-7z" />
                  <path d="M5 6.5h4M5 9h2.5" />
                </svg>
              )}
              {totalCount > 0 && (
                <span className="text-[10px] text-gray-300 dark:text-[#48484A] flex-shrink-0">
                  {completedCount}/{totalCount}
                </span>
              )}
            </div>
          )}

          {/* Expanded content */}
          {isActive && (
            <div className="mt-2 animate-expand-in">
              {/* Notes */}
              <textarea
                ref={notesRef}
                className="w-full text-[13px] text-gray-400 dark:text-[#98989D] outline-none bg-transparent resize-none leading-relaxed placeholder:text-gray-300 dark:placeholder:text-[#48484A]"
                placeholder="Notes"
                value={notesText}
                onChange={e => setNotesText(e.target.value)}
                onBlur={handleSaveNotes}
                onKeyDown={e => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    collapse();
                  }
                  if (e.key === 'Escape') {
                    setNotesText(task.notes);
                    collapse();
                  }
                }}
                rows={1}
              />

              {/* Checklist */}
              <div className="mt-5 space-y-0.5">
                {taskChecklistItems.map(item => (
                  <div key={item.id} className="flex items-start gap-2 py-0.5 group/clitem">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleChecklistItem(item.id); }}
                        className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                        item.completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 dark:border-[#48484A] hover:border-green-500'
                      }`}
                    >
                      {item.completed && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 5l2 2 4-4" />
                        </svg>
                      )}
                    </button>
                    {editingChecklistId === item.id ? (
                      <input
                        autoFocus
                        className="flex-1 text-[12.5px] outline-none bg-transparent text-gray-500 dark:text-[#98989D]"
                        value={editingChecklistTitle}
                        onChange={e => setEditingChecklistTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            if (editingChecklistTitle.trim()) {
                              updateChecklistItem(item.id, editingChecklistTitle.trim());
                            }
                            setEditingChecklistId(null);
                          }
                          if (e.key === 'Escape') { setEditingChecklistId(null); }
                        }}
                        onBlur={() => {
                          if (editingChecklistTitle.trim() && editingChecklistTitle !== item.title) {
                            updateChecklistItem(item.id, editingChecklistTitle.trim());
                          }
                          setEditingChecklistId(null);
                        }}
                      />
                    ) : (
                      <span
                        className={`flex-1 text-[12.5px] leading-snug cursor-text ${
                          item.completed
                            ? 'line-through text-gray-300 dark:text-[#48484A]'
                            : 'text-gray-500 dark:text-[#98989D]'
                        }`}
                        onClick={() => {
                          setEditingChecklistId(item.id);
                          setEditingChecklistTitle(item.title);
                        }}
                      >
                        {item.title}
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteChecklistItem(item.id); }}
                      className="opacity-0 group-hover/clitem:opacity-100 p-0.5 text-gray-300 dark:text-[#48484A] hover:text-red-400 transition-all"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M2 2l6 6M8 2l-6 6" />
                      </svg>
                    </button>
                  </div>
                ))}
                <input
                  className="w-full py-0.5 px-1 text-[12.5px] text-gray-500 dark:text-[#98989D] placeholder:text-gray-300 dark:placeholder:text-[#48484A] outline-none bg-transparent"
                  placeholder="+ Add sub task"
                  value={newChecklistTitle}
                  onChange={e => setNewChecklistTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newChecklistTitle.trim()) {
                      addChecklistItem(task.id, newChecklistTitle.trim());
                      setNewChecklistTitle('');
                    }
                  }}
                />
              </div>

              {/* Metadata footer */}
              <TaskFooter task={task} />
            </div>
          )}
        </div>

        {/* Right side metadata (collapsed) */}
        {!isActive && !isLogbook && !isTrash && (
          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
            {rightSlot}

            {task.assignedTo && (() => {
              const assignee = profiles.find(p => p.id === task.assignedTo);
              return (
                <div
                  className="w-4 h-4 rounded-full bg-orange-100 dark:bg-[#3C2E1C] flex items-center justify-center"
                  title={assignee ? `Assigned to ${assignee.displayName}` : 'Assigned'}
                >
                  {assignee ? (
                    assignee.avatarUrl ? (
                      <img src={assignee.avatarUrl} alt="" className="w-4 h-4 rounded-full" />
                    ) : (
                      <span className="text-[7px] font-medium text-orange-500 dark:text-orange-400">
                        {assignee.displayName.charAt(0).toUpperCase()}
                      </span>
                    )
                  ) : (
                    <svg width="6" height="6" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                      <circle cx="5" cy="4.5" r="2" />
                      <path d="M1 11c0-2 1.5-2.8 3-2.8s3 .8 3 2.8" />
                      <path d="M10.5 3.5l2 2 2.5-2.5" strokeWidth="1" />
                    </svg>
                  )}
                </div>
              );
            })()}
            {task.dueDate && (
              <span               className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                isOverdue
                  ? 'text-red-400 dark:text-[#F48FB1] bg-red-50/50 dark:bg-[#3C1C1E]'
                  : 'text-blue-400 dark:text-[#64B5F6] bg-blue-50/50 dark:bg-[#1C3A5C]'
              }`}>
                {getTaskDueLabel(task.dueDate)}
              </span>
            )}

            {task.tagIds.length > 0 && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
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
            )}
            <div className="max-md:opacity-100 opacity-0 group-hover/item:opacity-100 transition-opacity duration-100">
              <TaskOverflow task={task} />
            </div>
          </div>
        )}

        {/* Logbook date */}
        {isLogbook && task.completedAt && (
          <span className="text-[11px] text-gray-400 dark:text-[#636366] whitespace-nowrap mt-0.5">
            {getCompletedDateLabel(task.completedAt)}
          </span>
        )}

        {/* Trash actions */}
        {isTrash && (
          <div className="flex items-center gap-0.5 max-md:opacity-100 opacity-0 group-hover/item:opacity-100 transition-opacity duration-100 mt-0.5">
            <button
              onClick={() => restoreTask(task.id)}
              className="p-1 rounded text-gray-300 dark:text-[#48484A] hover:text-blue-500 dark:hover:text-[#64B5F6] hover:bg-blue-50 dark:hover:bg-[#1C3A5C] transition-colors"
              title="Restore"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7c0 1.5 1 2.5 2.5 2.5S9 8.5 9 7 8 4.5 6.5 4.5C5.5 4.5 4.8 5 4.5 5.5" />
                <path d="M5.5 3.5L4 5l1.5 1.5" />
              </svg>
            </button>
            <button
              onClick={() => deleteTask(task.id)}
              className="p-1 rounded text-gray-300 dark:text-[#48484A] hover:text-red-400 hover:bg-red-50 dark:hover:bg-[#3C1C1E] transition-colors"
              title="Delete permanently"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
