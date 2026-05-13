import type { ViewType } from '../types';

export default function EmptyState({ view }: { view: ViewType }) {
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

  return (
    <div className="py-16 text-center animate-fade-in">
      <p className="text-[15px] font-medium text-gray-400 dark:text-[#7C7C80]">Nothing here</p>
    </div>
  );
}
