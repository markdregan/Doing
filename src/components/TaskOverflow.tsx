import { useState, useRef, useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { TAG_COLOR_MAP, PROJECT_COLOR_MAP } from '../lib/constants';
import { REPEAT_INTERVALS } from '../types';
import type { Task } from '../types';
import AssigneePicker from './AssigneePicker';

interface TaskOverflowProps {
  task: Task;
  align?: 'right' | 'left';
}

type SubMenu = 'main' | 'repeat' | 'tags' | 'project' | 'assign';

export default function TaskOverflow({ task, align = 'right' }: TaskOverflowProps) {
  const [open, setOpen] = useState(false);
  const [subMenu, setSubMenu] = useState<SubMenu>('main');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const updateTask = useTaskStore(s => s.updateTask);
  const toggleTaskTag = useTaskStore(s => s.toggleTaskTag);
  const moveTaskToToday = useTaskStore(s => s.moveTaskToToday);
  const removeTaskFromToday = useTaskStore(s => s.removeTaskFromToday);
  const moveTaskToSomeday = useTaskStore(s => s.moveTaskToSomeday);
  const removeTaskFromSomeday = useTaskStore(s => s.removeTaskFromSomeday);
  const updateRepeat = useTaskStore(s => s.updateRepeat);
  const moveTaskToProject = useTaskStore(s => s.moveTaskToProject);
  const softDeleteTask = useTaskStore(s => s.softDeleteTask);
  const addTag = useTaskStore(s => s.addTag);
  const tags = useTaskStore(s => s.tags);
  const projects = useTaskStore(s => s.projects);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const closeMenu = () => {
    setOpen(false);
    setSubMenu('main');
    setDeleteConfirm(false);
    setNewTagName('');
  };

  const currentProject = projects.find(p => p.id === task.projectId);

  const handleDelete = () => {
    if (deleteConfirm) {
      softDeleteTask(task.id);
      closeMenu();
    } else {
      setDeleteConfirm(true);
    }
  };

  const BackButton = ({ label }: { label: string }) => (
    <button
      onClick={() => { setSubMenu('main'); setNewTagName(''); }}
      className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-left text-gray-500 dark:text-[#98989D] hover:bg-gray-50 dark:hover:bg-[#252526] transition-colors"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 2l-3 3 3 3" />
      </svg>
      {label}
    </button>
  );

  const Divider = () => (
    <div className="border-t border-gray-100 dark:border-[#38383A]" />
  );

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-0.5 rounded text-gray-300 dark:text-[#48484A] hover:text-gray-500 dark:hover:text-[#98989D] hover:bg-gray-50 dark:hover:bg-[#252526] transition-colors"
        title="More"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="7" cy="3" r="1.5" />
          <circle cx="7" cy="7" r="1.5" />
          <circle cx="7" cy="11" r="1.5" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1 w-44 bg-white dark:bg-[#2C2C2E] rounded-lg shadow-xl border border-gray-100 dark:border-[#38383A] py-1 z-50 animate-fade-in`}
          onClick={e => e.stopPropagation()}
        >
          {subMenu === 'tags' && (
            <>
              <BackButton label="Tags" />
              <Divider />
              {tags.map(tag => {
                const hasTag = task.tagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTaskTag(task.id, tag.id)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-50 dark:hover:bg-[#252526] transition-colors"
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${hasTag ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-[#48484A]'}`}>
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
              })}
              <Divider />
              <div className="px-2 py-1.5">
                <input
                  className="w-full text-xs outline-none bg-transparent text-gray-500 dark:text-[#98989D] placeholder:text-gray-300 dark:placeholder:text-[#48484A]"
                  placeholder="+ New label"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newTagName.trim()) {
                      addTag(newTagName.trim());
                      setNewTagName('');
                    }
                    if (e.key === 'Escape') {
                      setSubMenu('main');
                      setNewTagName('');
                    }
                  }}
                />
              </div>
            </>
          )}

          {subMenu === 'repeat' && (
            <>
              <BackButton label="Repeat" />
              <Divider />
              <button
                onClick={() => { updateRepeat(task.id, null); closeMenu(); }}
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-gray-50 dark:hover:bg-[#252526] text-gray-500 dark:text-[#636366] transition-colors"
              >
                None
              </button>
              {REPEAT_INTERVALS.map(interval => (
                <button
                  key={interval}
                  onClick={() => { updateRepeat(task.id, interval); closeMenu(); }}
                  className={`w-full px-3 py-1.5 text-xs text-left hover:bg-gray-50 dark:hover:bg-[#252526] transition-colors ${
                    task.repeat === interval ? 'text-blue-500 dark:text-[#64B5F6] font-medium' : 'text-gray-700 dark:text-[#E5E5E5]'
                  }`}
                >
                  {interval.charAt(0).toUpperCase() + interval.slice(1)}
                </button>
              ))}
            </>
          )}

          {subMenu === 'project' && (
            <>
              <BackButton label="Move to" />
              <Divider />
              <button
                onClick={() => { moveTaskToProject(task.id, null); closeMenu(); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left ${!task.projectId ? 'bg-gray-50 dark:bg-[#252526] text-gray-900 dark:text-[#F5F5F5] font-medium' : 'text-gray-600 dark:text-[#98989D] hover:bg-gray-50 dark:hover:bg-[#252526]'} transition-colors`}
              >
                Inbox
              </button>
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => { moveTaskToProject(task.id, p.id); closeMenu(); }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left ${task.projectId === p.id ? 'bg-gray-50 dark:bg-[#252526] text-gray-900 dark:text-[#F5F5F5] font-medium' : 'text-gray-600 dark:text-[#98989D] hover:bg-gray-50 dark:hover:bg-[#252526]'} transition-colors`}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PROJECT_COLOR_MAP[p.color] }} />
                  {p.title}
                </button>
              ))}
            </>
          )}

          {subMenu === 'assign' && (
            <>
              <div className="px-3 py-1.5">
                <button
                  onClick={() => setSubMenu('main')}
                  className="flex items-center gap-1 text-xs text-gray-500 dark:text-[#98989D] hover:text-gray-700 dark:hover:text-[#F5F5F5] transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6.5 2l-3 3 3 3" />
                  </svg>
                  Assign
                </button>
              </div>
              <Divider />
              <div className="px-2 py-1">
                <AssigneePicker
                  taskId={task.id}
                  currentAssigneeId={task.assignedTo}
                  onClose={closeMenu}
                />
              </div>
            </>
          )}

          {subMenu === 'main' && (
            <>
              <button
                onClick={() => { dateInputRef.current?.showPicker(); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#252526] transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0">
                  <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" />
                  <path d="M1.5 5.5h11" />
                  <path d="M4.5 1v3M9.5 1v3" />
                </svg>
                Set Deadline
              </button>
              <input
                ref={dateInputRef}
                type="date"
                className="absolute opacity-0 pointer-events-none"
                value={task.dueDate ?? ''}
                onChange={e => { updateTask(task.id, { dueDate: e.target.value || null }); closeMenu(); }}
              />

              <button
                onClick={() => setSubMenu('repeat')}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#252526] transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0">
                  <path d="M7 2.5v4.5l2.5 1.5" />
                  <path d="M3.5 3.5l-1.5-1.5-1.5 1.5" />
                  <path d="M2 8.5l1.5-1.5 1.5 1.5" />
                  <circle cx="7" cy="7" r="5" />
                </svg>
                Repeat
                {task.repeat && <span className="ml-auto text-blue-500 dark:text-[#64B5F6] text-[10px]">{task.repeat}</span>}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-[#48484A] ml-1">
                  <path d="M3.5 2l3 3-3 3" />
                </svg>
              </button>

              <button
                onClick={() => setSubMenu('tags')}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#252526] transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0">
                  <path d="M2 2.5h4l5.5 5.5a1.5 1.5 0 0 1 0 2.12l-2 2a1.5 1.5 0 0 1-2.12 0L2 6.5v-4z" />
                  <circle cx="4.5" cy="4.5" r="0.8" fill="currentColor" stroke="none" />
                </svg>
                Tags
                {task.tagIds.length > 0 && <span className="ml-auto text-blue-500 dark:text-[#64B5F6] text-[10px]">{task.tagIds.length}</span>}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-[#48484A] ml-1">
                  <path d="M3.5 2l3 3-3 3" />
                </svg>
              </button>

              <button
                onClick={() => setSubMenu('project')}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#252526] transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0">
                  <rect x="2" y="2" width="10" height="10" rx="1.5" />
                  <path d="M5 7h4M5 5h2M5 9h3" />
                </svg>
                Move to
                {currentProject && <span className="ml-auto text-gray-500 dark:text-[#98989D] text-[10px] truncate max-w-[60px]">{currentProject.title}</span>}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-[#48484A] ml-1">
                  <path d="M3.5 2l3 3-3 3" />
                </svg>
              </button>

              <button
                onClick={() => setSubMenu('assign')}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#252526] transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0">
                  <circle cx="5" cy="4.5" r="2" />
                  <path d="M1 11c0-2 1.5-2.8 3-2.8s3 .8 3 2.8" />
                  <path d="M10.5 3.5l2 2 2.5-2.5" strokeWidth="1" />
                </svg>
                Assign
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-[#48484A] ml-auto">
                  <path d="M3.5 2l3 3-3 3" />
                </svg>
              </button>

              <div className="border-t border-gray-100 dark:border-[#38383A] my-1" />

              <button
                onClick={() => { task.isToday ? removeTaskFromToday(task.id) : moveTaskToToday(task.id); closeMenu(); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#252526] transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 ${task.isToday ? 'text-orange-500' : 'text-gray-400'}`}>
                  <circle cx="7" cy="7" r="2.5" />
                  <path d="M7 1v1.5M7 11.5V13M2.5 2.5l1 1M10.5 10.5l1 1M1 7h1.5M11.5 7H13M2.5 11.5l1-1M10.5 3.5l1-1" />
                </svg>
                {task.isToday ? 'Remove from Today' : 'Add to Today'}
              </button>

              <button
                onClick={() => { task.isSomeday ? removeTaskFromSomeday(task.id) : moveTaskToSomeday(task.id); closeMenu(); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#252526] transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 ${task.isSomeday ? 'text-indigo-400' : 'text-gray-400'}`}>
                  <path d="M9.5 1.5a5.5 5.5 0 1 0 4 9.5A6 6 0 0 1 9.5 1.5z" />
                </svg>
                {task.isSomeday ? 'Remove from Someday' : 'Add to Someday'}
              </button>

              <div className="border-t border-gray-100 dark:border-[#38383A] my-1" />

              <button
                onClick={handleDelete}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                  deleteConfirm ? 'text-white bg-red-500' : 'text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#252526]'
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="flex-shrink-0">
                  <path d="M3 3.5h8M5.5 3.5V2.5h3v1M5.5 6v4.5M8.5 6v4.5" />
                  <path d="M3.5 3.5l.5 7.5h6l.5-7.5" />
                </svg>
                {deleteConfirm ? 'Tap again to confirm' : 'Delete'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
