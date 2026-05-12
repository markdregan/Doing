import { useState, useRef, useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { TAG_COLOR_MAP } from '../lib/constants';
import type { Task, RepeatInterval } from '../types';
import { REPEAT_INTERVALS } from '../types';

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

function getDueDateLabel(dateStr: string): string {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  if (dateStr === todayStr) return 'Today';
  if (dateStr === tomorrowStr) return 'Tomorrow';

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const date = new Date(dateStr + 'T00:00:00');
  if (date.getFullYear() === today.getFullYear()) return `${days[date.getDay()]} ${date.getDate()}`;
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export default function TaskItem({ task }: { task: Task }) {
  const updateTask = useTaskStore(s => s.updateTask);
  const softDeleteTask = useTaskStore(s => s.softDeleteTask);
  const deleteTask = useTaskStore(s => s.deleteTask);
  const restoreTask = useTaskStore(s => s.restoreTask);
  const toggleTask = useTaskStore(s => s.toggleTask);
  const moveTaskToToday = useTaskStore(s => s.moveTaskToToday);
  const removeTaskFromToday = useTaskStore(s => s.removeTaskFromToday);
  const moveTaskToSomeday = useTaskStore(s => s.moveTaskToSomeday);
  const removeTaskFromSomeday = useTaskStore(s => s.removeTaskFromSomeday);
  const tags = useTaskStore(s => s.tags);
  const toggleTaskTag = useTaskStore(s => s.toggleTaskTag);
  const checklistItems = useTaskStore(s => s.checklistItems);
  const addChecklistItem = useTaskStore(s => s.addChecklistItem);
  const toggleChecklistItem = useTaskStore(s => s.toggleChecklistItem);
  const updateChecklistItem = useTaskStore(s => s.updateChecklistItem);
  const deleteChecklistItem = useTaskStore(s => s.deleteChecklistItem);
  const updateRepeat = useTaskStore(s => s.updateRepeat);
  const activeView = useTaskStore(s => s.activeView);

  const isLogbook = activeView === 'logbook';

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const tagPickerRef = useRef<HTMLDivElement>(null);
  const [repeatPickerOpen, setRepeatPickerOpen] = useState(false);
  const repeatPickerRef = useRef<HTMLDivElement>(null);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingChecklistTitle, setEditingChecklistTitle] = useState('');
  const checklistInputRef = useRef<HTMLInputElement>(null);

  const taskChecklistItems = checklistItems.filter(i => i.taskId === task.id && !task.deletedAt);
  const completedCount = taskChecklistItems.filter(i => i.completed).length;
  const totalCount = taskChecklistItems.length;

  const [notesOpen, setNotesOpen] = useState(false);
  const [notesText, setNotesText] = useState(task.notes);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const isOverdue = task.dueDate != null && task.dueDate < todayStr && !task.completed;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    if (notesOpen && notesRef.current) {
      notesRef.current.focus();
    }
  }, [notesOpen]);

  useEffect(() => {
    if (!tagPickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (tagPickerRef.current && !tagPickerRef.current.contains(e.target as Node)) {
        setTagPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [tagPickerOpen]);

  useEffect(() => {
    if (!repeatPickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (repeatPickerRef.current && !repeatPickerRef.current.contains(e.target as Node)) {
        setRepeatPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [repeatPickerOpen]);

  const startEditing = () => {
    if (isLogbook) return;
    setEditTitle(task.title);
    setEditing(true);
  };

  const saveEdit = () => {
    if (editTitle.trim() && editTitle.trim() !== task.title) {
      updateTask(task.id, { title: editTitle.trim() });
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditTitle(task.title);
    setEditing(false);
  };

  const handleSaveNotes = () => {
    if (notesText !== task.notes) {
      updateTask(task.id, { notes: notesText });
    }
  };

  return (
    <div className="group/item flex items-start gap-3 py-1.5 px-1">
      {isLogbook ? (
        <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-green-500 bg-green-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ) : (
      <button
        onClick={() => toggleTask(task.id)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
          task.completed
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 dark:border-[#48484A] group-hover/item:border-green-500 group-hover/item:bg-green-500'
        }`}
      >
        <svg
          className={`w-3 h-3 text-white transition-opacity duration-150 ${
            task.completed ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'
          }`}
          viewBox="0 0 12 12"
          fill="none"
        >
          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      )}

      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            className="w-full text-[15px] text-gray-900 dark:text-[#F5F5F5] outline-none bg-transparent"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
            onBlur={saveEdit}
          />
        ) : (
          <span
            className={`text-[15px] leading-snug cursor-text transition-colors ${
              task.completed ? 'line-through text-gray-300 dark:text-[#48484A]' : 'text-gray-800 dark:text-[#F5F5F5]'
            }`}
            onClick={startEditing}
          >
            {task.title}
          </span>
        )}

        {!editing && (notesOpen || task.notes) && (
          isLogbook ? (
            <p className="text-[13px] text-gray-400 dark:text-[#98989D] mt-0.5 leading-snug">
              {task.notes}
            </p>
          ) : notesOpen ? (
            <textarea
              ref={notesRef}
              className="w-full text-[13px] text-gray-500 dark:text-[#98989D] outline-none bg-transparent resize-none mt-1 leading-snug placeholder:text-gray-300 dark:placeholder:text-[#48484A]"
              placeholder="Add notes..."
              value={notesText}
              onChange={e => setNotesText(e.target.value)}
              onBlur={() => { handleSaveNotes(); setNotesOpen(false); }}
              onKeyDown={e => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  handleSaveNotes();
                  setNotesOpen(false);
                }
                if (e.key === 'Escape') {
                  setNotesText(task.notes);
                  setNotesOpen(false);
                }
              }}
              rows={2}
            />
          ) : (
            <p
              className="text-[13px] text-gray-400 dark:text-[#98989D] mt-0.5 leading-snug cursor-pointer"
              onClick={() => { setNotesOpen(true); setNotesText(task.notes); }}
            >
              {task.notes}
            </p>
          )
        )}

        {!isLogbook && checklistOpen && (
          <div className="mt-2 space-y-0.5">
            {taskChecklistItems.map(item => (
              <div key={item.id} className="flex items-start gap-2 py-0.5 group/clitem">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleChecklistItem(item.id); }}
                  className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    item.completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300 dark:border-[#48484A] hover:border-green-500'
                  }`}
                >
                  {item.completed && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 5l2 2 4-4" />
                    </svg>
                  )}
                </button>
                {editingChecklistId === item.id ? (
                  <input
                    autoFocus
                    className="flex-1 text-[13px] outline-none bg-transparent text-gray-700 dark:text-[#E5E5E5]"
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
                    className={`flex-1 text-[13px] leading-snug cursor-text ${
                      item.completed
                        ? 'line-through text-gray-300 dark:text-[#636366]'
                        : 'text-gray-600 dark:text-[#98989D]'
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
              ref={checklistInputRef}
              className="w-full py-0.5 px-1 text-[13px] text-gray-500 dark:text-[#98989D] placeholder:text-gray-300 dark:placeholder:text-[#48484A] outline-none bg-transparent"
              placeholder="Add item..."
              value={newChecklistTitle}
              onChange={e => setNewChecklistTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newChecklistTitle.trim()) {
                  addChecklistItem(task.id, newChecklistTitle.trim());
                  setNewChecklistTitle('');
                }
                if (e.key === 'Escape') { setChecklistOpen(false); }
              }}
            />
          </div>
        )}

      </div>

        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
        {task.dueDate && activeView !== 'trash' && !isLogbook && (
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
            isOverdue
              ? 'text-red-500 dark:text-[#F48FB1] bg-red-50 dark:bg-[#3C1C1E]'
              : 'text-blue-500 dark:text-[#64B5F6] bg-blue-50 dark:bg-[#1C3A5C]'
          }`}>
            {getDueDateLabel(task.dueDate)}
          </span>
        )}

        {!isLogbook && task.tagIds.length > 0 && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {task.tagIds.map(tagId => {
              const tag = tags.find(t => t.id === tagId);
              if (!tag) return null;
              return (
                <span
                  key={tagId}
                  className="w-2 h-2 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: TAG_COLOR_MAP[tag.color] }}
                  title={tag.title}
                />
              );
            })}
          </div>
        )}

        {!isLogbook && totalCount > 0 && (
          <span className="text-[11px] font-medium text-gray-400 dark:text-[#636366] flex-shrink-0">
            {completedCount}/{totalCount}
          </span>
        )}

        {isLogbook && task.completedAt && (
          <span className="text-[11px] text-gray-400 dark:text-[#636366] whitespace-nowrap">
            {getCompletedDateLabel(task.completedAt)}
          </span>
        )}

        {!isLogbook && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-100">
          {activeView === 'trash' ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); restoreTask(task.id); }}
                className="p-1 rounded text-gray-300 dark:text-[#48484A] hover:text-blue-500 dark:hover:text-[#64B5F6] hover:bg-blue-50 dark:hover:bg-[#1C3A5C] transition-colors"
                title="Restore"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7c0 1.5 1 2.5 2.5 2.5S9 8.5 9 7 8 4.5 6.5 4.5C5.5 4.5 4.8 5 4.5 5.5" />
                  <path d="M5.5 3.5L4 5l1.5 1.5" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                className="p-1 rounded text-gray-300 dark:text-[#48484A] hover:text-red-400 hover:bg-red-50 dark:hover:bg-[#3C1C1E] transition-colors"
                title="Delete permanently"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
                </svg>
              </button>
            </>
          ) : (
            <>
          {!task.notes && !notesOpen && (
            <button
              onClick={(e) => { e.stopPropagation(); setNotesOpen(true); setNotesText(task.notes); }}
              className="p-1 rounded text-gray-300 dark:text-[#48484A] hover:text-gray-500 dark:hover:text-[#98989D] hover:bg-gray-100 dark:hover:bg-[#2C2C2E] transition-colors"
              title="Add notes"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7h8M7 3v8" />
              </svg>
            </button>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); task.isToday ? removeTaskFromToday(task.id) : moveTaskToToday(task.id); }}
            className={`p-1 rounded transition-colors ${
              task.isToday ? 'text-orange-400 bg-orange-50 dark:bg-[#3C2A1C]' : 'text-gray-300 dark:text-[#48484A] hover:text-gray-500 dark:hover:text-[#98989D] hover:bg-gray-100 dark:hover:bg-[#2C2C2E]'
            }`}
            title={task.isToday ? 'Remove from Today' : 'Add to Today'}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill={task.isToday ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7" cy="7" r="2.5" />
              <path d="M7 1v1.5M7 11.5V13M2.5 2.5l1 1M10.5 10.5l1 1M1 7h1.5M11.5 7H13M2.5 11.5l1-1M10.5 3.5l1-1" />
            </svg>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); task.isSomeday ? removeTaskFromSomeday(task.id) : moveTaskToSomeday(task.id); }}
            className={`p-1 rounded transition-colors ${
              task.isSomeday ? 'text-indigo-400 bg-indigo-50 dark:bg-[#1E1A3C]' : 'text-gray-300 dark:text-[#48484A] hover:text-gray-500 dark:hover:text-[#98989D] hover:bg-gray-100 dark:hover:bg-[#2C2C2E]'
            }`}
            title={task.isSomeday ? 'Remove from Someday' : 'Add to Someday'}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill={task.isSomeday ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 1.5a5.5 5.5 0 1 0 4 9.5A6 6 0 0 1 9.5 1.5z" />
            </svg>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); dateInputRef.current?.showPicker(); }}
            className="p-1 rounded text-gray-300 dark:text-[#48484A] hover:text-gray-500 dark:hover:text-[#98989D] hover:bg-gray-100 dark:hover:bg-[#2C2C2E] transition-colors"
            title="Set due date"
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

          <div className="relative" ref={tagPickerRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setTagPickerOpen(!tagPickerOpen); }}
              className={`p-1 rounded transition-colors ${
                task.tagIds.length > 0
                  ? 'text-blue-400 bg-blue-50 dark:bg-[#1C3A5C]'
                  : 'text-gray-300 dark:text-[#48484A] hover:text-gray-500 dark:hover:text-[#98989D] hover:bg-gray-100 dark:hover:bg-[#2C2C2E]'
              }`}
              title="Tags"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 2.5h4l5.5 5.5a1.5 1.5 0 0 1 0 2.12l-2 2a1.5 1.5 0 0 1-2.12 0L2 6.5v-4z" />
                <circle cx="4.5" cy="4.5" r="0.8" fill="currentColor" stroke="none" />
              </svg>
            </button>
            {tagPickerOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#2C2C2E] rounded-lg shadow-lg border border-gray-100 dark:border-[#38383A] py-1 z-50 max-h-48 overflow-y-auto">
                {tags.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-gray-400 dark:text-[#636366]">No tags yet</p>
                ) : (
                  tags.map(tag => {
                    const hasTag = task.tagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={(e) => { e.stopPropagation(); toggleTaskTag(task.id, tag.id); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-50 dark:hover:bg-[#252526] transition-colors"
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${hasTag ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-[#48484A]'}`}>
                          {hasTag && (
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

          <button
            onClick={(e) => { e.stopPropagation(); setChecklistOpen(!checklistOpen); }}
            className={`p-1 rounded transition-colors ${
              checklistOpen || totalCount > 0
                ? 'text-green-400 bg-green-50 dark:bg-[#1C3C1E]'
                : 'text-gray-300 dark:text-[#48484A] hover:text-gray-500 dark:hover:text-[#98989D] hover:bg-gray-100 dark:hover:bg-[#2C2C2E]'
            }`}
            title="Checklist"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4l1.5 1.5L6 2" />
              <path d="M2 8l1.5 1.5L6 6" />
              <path d="M2 12l1.5 1.5L6 10" />
              <path d="M8 3.5h4M8 7.5h4M8 11.5h4" />
            </svg>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); softDeleteTask(task.id); }}
            className="p-1 rounded text-gray-300 dark:text-[#48484A] hover:text-red-400 hover:bg-red-50 dark:hover:bg-[#3C1C1E] transition-colors"
            title="Delete"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
            </svg>
          </button>
          </>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
