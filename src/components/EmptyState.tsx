import type { ViewType } from '../types';

export default function EmptyState({ view }: { view: ViewType }) {
  if (view === 'inbox') {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-300">No tasks in your inbox</p>
        <p className="text-xs text-gray-200 mt-1">Add a task below or press ⌘K</p>
      </div>
    );
  }

  if (view === 'today') {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-300">No tasks for today</p>
        <p className="text-xs text-gray-200 mt-1">Add a task below or press ⌘K</p>
      </div>
    );
  }

  if (view === 'someday') {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-300">No tasks set for someday</p>
        <p className="text-xs text-gray-200 mt-1">Toggle the crescent moon on a task to set it as someday</p>
      </div>
    );
  }

  if (view === 'logbook') {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-300">No completed tasks yet</p>
        <p className="text-xs text-gray-200 mt-1">Tasks you complete will appear here</p>
      </div>
    );
  }

  if (view === 'trash') {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-300">Trash is empty</p>
      </div>
    );
  }

  if (view === 'all') {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-300">No tasks yet</p>
        <p className="text-xs text-gray-200 mt-1">Add your first task below</p>
      </div>
    );
  }

  return (
    <div className="py-12 text-center">
      <p className="text-sm text-gray-300">No tasks in this project</p>
      <p className="text-xs text-gray-200 mt-1">Add a task below</p>
    </div>
  );
}
