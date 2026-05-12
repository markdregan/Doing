import { differenceInCalendarDays, parseISO, format, isToday, isTomorrow, isYesterday } from 'date-fns';

export function getDeadlineLabel(dateStr: string): { label: string; sublabel?: string; isUrgent: boolean; isOverdue: boolean } {
  const date = parseISO(dateStr);
  const today = new Date();
  const diff = differenceInCalendarDays(date, today);

  let label = '';
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
