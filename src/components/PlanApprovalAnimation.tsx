interface PlanApprovalAnimationProps {
  projectTitle: string
  taskCount: number
}

export default function PlanApprovalAnimation({ projectTitle, taskCount }: PlanApprovalAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      {/* Animated checkmark circle */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center animate-scale-in">
          <svg
            className="w-8 h-8 text-green-500 animate-checkmark-draw"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        {/* Ripple rings */}
        <div className="absolute inset-0 rounded-full border-2 border-green-400/30 animate-ping" />
        <div className="absolute inset-0 rounded-full border border-green-400/20 animate-ping" style={{ animationDelay: '300ms' }} />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-[#F5F5F5] mb-1">
        Plan Approved!
      </h3>
      <p className="text-sm text-gray-400 dark:text-[#636366] text-center max-w-xs">
        Created project <span className="font-medium text-gray-600 dark:text-[#98989D]">{projectTitle}</span> with {taskCount} task{taskCount !== 1 ? 's' : ''}.
      </p>
      <p className="text-xs text-gray-300 dark:text-[#48484A] mt-3">
        Opening your project...
      </p>
    </div>
  )
}
