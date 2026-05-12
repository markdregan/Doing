import { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useTaskStore } from '../store/useTaskStore';
import { PROJECT_COLOR_MAP, TAG_COLOR_MAP } from '../lib/constants';

interface QuickEntryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickEntry({ open, onOpenChange }: QuickEntryProps) {
  const [title, setTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isToday, setIsToday] = useState(false);
  const [isSomeday, setIsSomeday] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showProjectList, setShowProjectList] = useState(false);
  const [showTagList, setShowTagList] = useState(false);

  const addTask = useTaskStore(s => s.addTask);
  const projects = useTaskStore(s => s.projects);
  const tags = useTaskStore(s => s.tags);
  const inputRef = useRef<HTMLInputElement>(null);
  const projectButtonRef = useRef<HTMLButtonElement>(null);
  const tagButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTitle('');
      setSelectedProjectId(null);
      setIsToday(false);
      setIsSomeday(false);
      setSelectedTagIds([]);
      setShowProjectList(false);
      setShowTagList(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!showTagList) return;
    const handler = (e: MouseEvent) => {
      if (tagButtonRef.current && !tagButtonRef.current.contains(e.target as Node)) {
        setShowTagList(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTagList]);

  const handleSubmit = () => {
    if (title.trim()) {
      addTask({
        title: title.trim(),
        projectId: selectedProjectId ?? undefined,
        isToday,
        isSomeday,
        tagIds: selectedTagIds,
      });
      onOpenChange(false);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/15 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-[12%] left-1/2 -translate-x-1/2 w-[500px] bg-white dark:bg-[#2C2C2E] rounded-xl shadow-2xl border border-gray-100 dark:border-[#38383A] focus:outline-none animate-slide-up">
          <div className="p-5 pb-3">
            <input
              ref={inputRef}
              className="w-full text-[17px] outline-none placeholder:text-gray-300 dark:placeholder:text-[#48484A] text-gray-900 dark:text-[#F5F5F5]"
              placeholder="What are you working on?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSubmit();
                if (e.key === 'Escape') onOpenChange(false);
              }}
            />
          </div>

          <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-100 dark:border-[#38383A]" onClick={() => { if (showProjectList) setShowProjectList(false); if (showTagList) setShowTagList(false); }}>
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button
                ref={projectButtonRef}
                onClick={() => setShowProjectList(!showProjectList)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-500 dark:text-[#98989D] bg-gray-50 dark:bg-[#1C1C1E] hover:bg-gray-100 dark:hover:bg-[#252526] rounded-md transition-colors"
              >
                {selectedProject ? (
                  <>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PROJECT_COLOR_MAP[selectedProject.color] }} />
                    {selectedProject.title}
                  </>
                ) : (
                  <>Inbox</>
                )}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 3.5l2.5 3 2.5-3" />
                </svg>
              </button>

              {showProjectList && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-[#2C2C2E] rounded-lg shadow-lg border border-gray-100 dark:border-[#38383A] py-1 z-50 max-h-56 overflow-y-auto">
                  <button
                    onClick={() => { setSelectedProjectId(null); setShowProjectList(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left ${!selectedProjectId ? 'bg-gray-50 dark:bg-[#252526] text-gray-900 dark:text-[#F5F5F5]' : 'text-gray-600 dark:text-[#98989D] hover:bg-gray-50 dark:hover:bg-[#252526]'}`}
                  >
                    Inbox
                  </button>
                  {projects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedProjectId(p.id); setShowProjectList(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left ${selectedProjectId === p.id ? 'bg-gray-50 dark:bg-[#252526] text-gray-900 dark:text-[#F5F5F5]' : 'text-gray-600 dark:text-[#98989D] hover:bg-gray-50 dark:hover:bg-[#252526]'}`}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PROJECT_COLOR_MAP[p.color] }} />
                      {p.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsToday(!isToday)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                isToday ? 'bg-orange-50 dark:bg-[#3C2A1C] text-orange-500' : 'text-gray-400 dark:text-[#636366] bg-gray-50 dark:bg-[#1C1C1E] hover:bg-gray-100 dark:hover:bg-[#252526] hover:text-gray-600'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill={isToday ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7" cy="7" r="2.5" />
                <path d="M7 1v1.5M7 11.5V13M2.5 2.5l1 1M10.5 10.5l1 1M1 7h1.5M11.5 7H13M2.5 11.5l1-1M10.5 3.5l1-1" />
              </svg>
              Today
            </button>

            <button
              onClick={() => setIsSomeday(!isSomeday)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                isSomeday ? 'bg-indigo-50 dark:bg-[#1E1A3C] text-indigo-400' : 'text-gray-400 dark:text-[#636366] bg-gray-50 dark:bg-[#1C1C1E] hover:bg-gray-100 dark:hover:bg-[#252526] hover:text-gray-600'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill={isSomeday ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.5 1.5a5.5 5.5 0 1 0 4 9.5A6 6 0 0 1 9.5 1.5z" />
              </svg>
              Someday
            </button>

            <div className="relative" ref={tagButtonRef}>
              <button
                onClick={() => setShowTagList(!showTagList)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedTagIds.length > 0
                    ? 'bg-blue-50 dark:bg-[#1C3A5C] text-blue-500'
                    : 'text-gray-400 dark:text-[#636366] bg-gray-50 dark:bg-[#1C1C1E] hover:bg-gray-100 dark:hover:bg-[#252526] hover:text-gray-600'
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 2.5h4l5.5 5.5a1.5 1.5 0 0 1 0 2.12l-2 2a1.5 1.5 0 0 1-2.12 0L2 6.5v-4z" />
                  <circle cx="4.5" cy="4.5" r="0.8" fill="currentColor" stroke="none" />
                </svg>
                {selectedTagIds.length > 0 ? `${selectedTagIds.length} tag${selectedTagIds.length > 1 ? 's' : ''}` : 'Tags'}
              </button>
              {showTagList && (
                <div className="absolute bottom-full left-0 mb-1 w-40 bg-white dark:bg-[#2C2C2E] rounded-lg shadow-lg border border-gray-100 dark:border-[#38383A] py-1 z-50 max-h-56 overflow-y-auto">
                  {tags.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-gray-400 dark:text-[#636366]">No tags yet</p>
                  ) : (
                    tags.map(tag => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedTagIds(prev => isSelected ? prev.filter(id => id !== tag.id) : [...prev, tag.id]); }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-50 dark:hover:bg-[#252526] transition-colors"
                        >
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-[#48484A]'}`}>
                            {isSelected && (
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

            <div className="ml-auto">
              <span className="text-xs text-gray-300 dark:text-[#48484A]">Enter to add · Esc to cancel</span>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
