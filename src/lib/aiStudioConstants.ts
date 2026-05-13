export const SUGGESTION_CHIPS = [
  { label: 'Sell my house', prompt: 'I need to sell my house' },
  { label: 'Book summer camps for my kids', prompt: 'I need to book summer camps for my kids' },
  { label: 'Plan a family reunion', prompt: 'I need to plan a family reunion' },
  { label: 'Find a new apartment', prompt: 'I need to find a new apartment' },
  { label: 'File my taxes', prompt: 'I need to file my taxes' },
]

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  planning: 'Planning...',
  review: 'Ready for review',
  active: 'Active',
  archived: 'Archived',
}

export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-300 dark:bg-[#48484A]',
  planning: 'bg-blue-400 animate-pulse',
  review: 'bg-amber-400',
  active: 'bg-green-400',
  archived: 'bg-gray-200 dark:bg-[#38383A]',
}
