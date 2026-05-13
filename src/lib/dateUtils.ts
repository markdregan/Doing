import { differenceInCalendarDays, parseISO, format, isToday, isTomorrow, isYesterday } from 'date-fns';

export function getTaskDueLabel(dateStr: string): string {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  if (dateStr === todayStr) return 'Today';
  if (dateStr === tomorrowStr) return 'Tomorrow';

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const date = new Date(dateStr + 'T00:00:00');
  if (date.getFullYear() === today.getFullYear()) return `${days[date.getDay()]} ${date.getDate()}`;
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function getDeadlineLabel(dateStr: string): { label: string; sublabel?: string; isUrgent: boolean; isOverdue: boolean } {
  const date = parseISO(dateStr);
  const today = new Date();
  const diff = differenceInCalendarDays(date, today);

  let label: string;
  if (isToday(date)) label = 'Today';
  else if (isTomorrow(date)) label = 'Tomorrow';
  else if (isYesterday(date)) label = 'Yesterday';
  else label = format(date, 'EEE, d MMM');

  const isOverdue = diff < 0 && !isToday(date);
  const isUrgent = diff <= 3;

  let sublabel = '';
  if (diff === 0) sublabel = '';
  else if (diff === 1) sublabel = 'tomorrow';
  else if (diff === -1) sublabel = 'yesterday';
  else if (diff > 1) sublabel = `${diff} days left`;
  else if (diff < -1) sublabel = `${Math.abs(diff)} days overdue`;

  return {
    label: `Deadline: ${label}`,
    sublabel,
    isUrgent,
    isOverdue
  };
}
