import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskItem from './TaskItem'
import type { Task } from '../types'

export default function DraggableTaskItem({ task, rightSlot }: { task: Task; rightSlot?: React.ReactNode }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({
    id: `task-${task.id}`,
    data: { type: 'task', taskId: task.id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
    position: 'relative' as const,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskItem task={task} dragListeners={listeners} rightSlot={rightSlot} />
    </div>
  )
}
