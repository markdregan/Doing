import { useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';

export default function AddTaskInput({ projectId }: { projectId?: string | null }) {
  const [value, setValue] = useState('');
  const addTask = useTaskStore(s => s.addTask);
  const activeView = useTaskStore(s => s.activeView);

  if (activeView === 'trash' || activeView === 'logbook') return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      addTask({
        title: value.trim(),
        projectId: projectId ?? undefined,
        isToday: activeView === 'today',
        isSomeday: activeView === 'someday',
      });
      setValue('');
    }
  };

  return (
    <input
      className="w-full py-2 px-1 text-[15px] text-gray-900 dark:text-[#F5F5F5] placeholder:text-gray-300 dark:placeholder:text-[#48484A] outline-none bg-transparent mt-1"
      placeholder="+ New Task"
      value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
    />
  );
}
