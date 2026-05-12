import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useTaskStore } from '../store/useTaskStore';
import { PROJECT_COLOR_MAP, TAG_COLOR_MAP } from '../lib/constants';

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let i = lower.indexOf(q);
  let key = 0;
  while (i !== -1) {
    if (i > lastIndex) parts.push(text.slice(lastIndex, i));
    parts.push(<mark key={key++} className="bg-yellow-200 dark:bg-yellow-700 rounded px-0.5">{text.slice(i, i + q.length)}</mark>);
    lastIndex = i + q.length;
    i = lower.indexOf(q, lastIndex);
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts}</>;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const tasks = useTaskStore(s => s.tasks);
  const projects = useTaskStore(s => s.projects);
  const tags = useTaskStore(s => s.tags);
  const setActiveView = useTaskStore(s => s.setActiveView);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return tasks
      .filter(t => !t.deletedAt && (t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q)))
      .slice(0, 20);
  }, [tasks, query]);

  const handleNavigate = (_taskId: string, projectId: string | null) => {
    if (projectId) {
      setActiveView('project', projectId);
    } else {
      setActiveView('inbox');
    }
    onOpenChange(false);
  };

  const projectMap = useMemo(() => {
    const map = new Map(projects.map(p => [p.id, p]));
    return map;
  }, [projects]);

  const tagMap = useMemo(() => {
    const map = new Map(tags.map(t => [t.id, t]));
    return map;
  }, [tags]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/15 backdrop-blur-sm" />
        <Dialog.Content className="fixed max-md:top-[10%] max-md:w-[calc(100vw-32px)] max-md:max-h-[80vh] top-[15%] left-1/2 -translate-x-1/2 w-[520px] max-h-[60vh] bg-white dark:bg-[#2C2C2E] rounded-xl shadow-2xl border border-gray-100 dark:border-[#38383A] focus:outline-none flex flex-col">
          <div className="p-4 pb-3">
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-[#38383A] rounded-lg focus-within:border-gray-300 dark:focus-within:border-[#48484A] transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-gray-400 dark:text-[#636366] flex-shrink-0">
                <circle cx="7" cy="7" r="4.5" />
                <path d="M10.5 10.5L14 14" />
              </svg>
              <input
                ref={inputRef}
                className="flex-1 text-[15px] outline-none bg-transparent text-gray-900 dark:text-[#F5F5F5] placeholder:text-gray-400 dark:placeholder:text-[#636366]"
                placeholder="Search tasks"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') onOpenChange(false);
                  if (e.key === 'Enter' && results.length > 0) {
                    handleNavigate(results[0].id, results[0].projectId);
                  }
                }}
              />
            </div>
          </div>

          {query.trim() && (
            <div className="flex-1 overflow-y-auto pb-2">
              {results.length > 0 ? (
                <div className="space-y-0">
                  {results.map(task => {
                    const project = task.projectId ? projectMap.get(task.projectId) : null;
                    return (
                      <button
                        key={task.id}
                        onClick={() => handleNavigate(task.id, task.projectId)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#252526] transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          {project ? (
                            <>
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PROJECT_COLOR_MAP[project.color] }} />
                              <span className="text-[11px] text-gray-400 dark:text-[#636366] font-medium">{project.title}</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full flex-shrink-0 bg-gray-300 dark:bg-[#48484A]" />
                              <span className="text-[11px] text-gray-400 dark:text-[#636366] font-medium">Inbox</span>
                            </>
                          )}
                          {task.tagIds.length > 0 && (
                            <div className="flex items-center gap-0.5 ml-1">
                              {task.tagIds.map(tagId => {
                                const tag = tagMap.get(tagId);
                                if (!tag) return null;
                                return (
                                  <span
                                    key={tagId}
                                    className="w-1.5 h-1.5 rounded-sm"
                                    style={{ backgroundColor: TAG_COLOR_MAP[tag.color] }}
                                    title={tag.title}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <p className="text-[14px] text-gray-900 dark:text-[#F5F5F5] leading-snug">
                          <Highlight text={task.title} query={query} />
                        </p>
                        {task.notes && (
                          <p className="text-[12px] text-gray-400 dark:text-[#98989D] mt-0.5 leading-snug line-clamp-1">
                            <Highlight text={task.notes} query={query} />
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-400 dark:text-[#636366]">No tasks match "{query}"</p>
                </div>
              )}
            </div>
          )}

          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-[#38383A]">
            <span className="text-xs text-gray-300 dark:text-[#636366] max-md:hidden">
              Type to search · <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-[#1C1C1E] rounded text-[11px] font-medium">↵</kbd> to navigate · <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-[#1C1C1E] rounded text-[11px] font-medium">Esc</kbd> to close
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
