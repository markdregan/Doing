import { useTaskStore } from '../store/useTaskStore';
import { getDeadlineLabel } from '../lib/dateUtils';
import { TAG_COLOR_MAP } from '../lib/constants';
import type { Task } from '../types';
import TaskOverflow from './TaskOverflow';

interface TaskFooterProps {
  task: Task;
}

export default function TaskFooter({ task }: TaskFooterProps) {
  const tags = useTaskStore(s => s.tags);
  const activeView = useTaskStore(s => s.activeView);

  const isLogbook = activeView === 'logbook';
  const isTrash = activeView === 'trash';
  const todayStr = new Date().toISOString().slice(0, 10);
  const isOverdue = task.dueDate != null && task.dueDate < todayStr && !task.completed;

  if (isLogbook || isTrash) return null;

  return (
    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-[#38383A]">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {task.dueDate && (
          <span className={`text-[11px] px-1.5 py-0.5 rounded-md ${
            isOverdue
              ? 'text-red-400 dark:text-[#F48FB1] bg-red-50/50 dark:bg-[#3C1C1E]'
              : 'text-blue-400 dark:text-[#64B5F6] bg-blue-50/50 dark:bg-[#1C3A5C]'
          }`}>
            {getDeadlineLabel(task.dueDate).label}
          </span>
        )}
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

      <TaskOverflow task={task} />
    </div>
  );
}
