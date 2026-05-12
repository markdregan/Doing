import type { ViewType } from '../types';

export default function EmptyState({ view }: { view: ViewType }) {
  if (view === 'inbox') {
    return (
      <div className="py-16 text-center animate-fade-in">
        <p className="text-[15px] font-medium text-gray-400 dark:text-[#7C7C80]">No tasks in your inbox</p>
        <p className="text-xs text-gray-300 dark:text-[#636366] mt-2 max-w-[220px] mx-auto leading-relaxed">Press ⌘K to quickly add a task from anywhere</p>
      </div>
    );
  }

  if (view === 'today') {
    return (
      <div className="py-16 text-center animate-fade-in">
        <p className="text-[15px] font-medium text-gray-400 dark:text-[#7C7C80]">No tasks for today</p>
        <p className="text-xs text-gray-300 dark:text-[#636366] mt-2 max-w-[220px] mx-auto leading-relaxed">Tag a task with "today" to see it here</p>
      </div>
    );
  }

  if (view === 'someday') {
    return (
      <div className="py-16 text-center animate-fade-in">
        <p className="text-[15px] font-medium text-gray-400 dark:text-[#7C7C80]">No someday tasks</p>
        <p className="text-xs text-gray-300 dark:text-[#636366] mt-2 max-w-[220px] mx-auto leading-relaxed">Toggle the crescent moon on a task to park it for later</p>
      </div>
    );
  }

  if (view === 'logbook') {
    return (
      <div className="py-16 text-center animate-fade-in">
        <p className="text-[15px] font-medium text-gray-400 dark:text-[#7C7C80]">No completed tasks yet</p>
        <p className="text-xs text-gray-300 dark:text-[#636366] mt-2 max-w-[220px] mx-auto leading-relaxed">Check off a task and it will appear here</p>
      </div>
    );
  }

  if (view === 'trash') {
    return (
      <div className="py-16 text-center animate-fade-in">
        <p className="text-[15px] font-medium text-gray-400 dark:text-[#7C7C80]">Trash is empty</p>
      </div>
    );
  }

  if (view === 'all') {
    return (
      <div className="py-16 text-center animate-fade-in">
        <p className="text-[15px] font-medium text-gray-400 dark:text-[#7C7C80]">No tasks yet</p>
        <p className="text-xs text-gray-300 dark:text-[#636366] mt-2 max-w-[220px] mx-auto leading-relaxed">Add your first task to get started</p>
      </div>
    );
  }

  if (view === 'assigned') {
    return (
      <div className="py-16 text-center animate-fade-in">
        <p className="text-[15px] font-medium text-gray-400 dark:text-[#7C7C80]">No tasks assigned to you</p>
        <p className="text-xs text-gray-300 dark:text-[#636366] mt-2 max-w-[220px] mx-auto leading-relaxed">Tasks your friends assign to you will appear here</p>
      </div>
    );
  }

  return (
    <div className="py-16 text-center animate-fade-in">
      <p className="text-[15px] font-medium text-gray-400 dark:text-[#7C7C80]">No tasks in this project</p>
      <p className="text-xs text-gray-300 dark:text-[#636366] mt-2 max-w-[220px] mx-auto leading-relaxed">Add a task to get started</p>
    </div>
  );
}
