import { useState, useRef } from 'react';
import { useTaskStore } from '../store/useTaskStore';

export default function AddTaskInput({ projectId }: { projectId?: string | null }) {
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [focused, setFocused] = useState(false);
  const addTask = useTaskStore(s => s.addTask);
  const activeView = useTaskStore(s => s.activeView);
  const inputRef = useRef<HTMLInputElement>(null);

  if (activeView === 'trash' || activeView === 'logbook') return null;

  const handleSubmit = () => {
    if (!value.trim()) return;
    addTask({
      title: value.trim(),
      notes: notes.trim() || undefined,
      projectId: projectId ?? undefined,
      isToday: activeView === 'today',
      isSomeday: activeView === 'someday',
    });
    setValue('');
    setNotes('');
    setFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setValue('');
      setNotes('');
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={`mt-2 rounded-lg transition-all ${focused ? 'ring-1 ring-gray-100 dark:ring-[#2C2C2E] shadow-sm' : ''}`}>
      <div className={focused ? 'px-4 pt-3' : 'px-1'}>
        <input
          ref={inputRef}
          className={`w-full text-[15px] text-gray-900 dark:text-[#F5F5F5] placeholder:text-gray-300 dark:placeholder:text-[#48484A] outline-none bg-transparent ${
            focused ? 'font-medium pb-1' : 'py-2'
          }`}
          placeholder={focused ? 'Task title' : '+ New Task'}
          value={value}
          onChange={e => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            if (!value.trim() && !notes.trim()) {
              setFocused(false);
            }
          }}
          onKeyDown={handleKeyDown}
        />
      </div>

      {focused && (
        <div className="px-4 pb-3 animate-expand-in">
          <textarea
            className="w-full text-[13px] text-gray-400 dark:text-[#98989D] outline-none bg-transparent resize-none leading-relaxed placeholder:text-gray-300 dark:placeholder:text-[#48484A]"
            placeholder="Notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                handleSubmit();
              }
            }}
            rows={2}
          />
        </div>
      )}
    </div>
  );
}
