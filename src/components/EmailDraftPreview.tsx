interface EmailDraftPreviewProps {
  to?: string
  subject?: string
  body?: string
  status?: 'draft' | 'sent'
  timestamp?: string
}

export default function EmailDraftPreview({ to, subject, body, status, timestamp }: EmailDraftPreviewProps) {
  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-gray-100 dark:border-[#38383A] p-4 animate-scale-in">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-purple-500">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 4l-10 8L2 4" />
          </svg>
        </span>
        <span className="text-[11px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.06em]">Email</span>
        {status && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ml-auto ${
            status === 'sent'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-500'
              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-500'
          }`}>
            {status}
          </span>
        )}
      </div>

      {to && (
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] text-gray-400 dark:text-[#636366] w-12 shrink-0">To:</span>
          <span className="text-[12px] text-gray-700 dark:text-[#D1D1D6]">{to}</span>
        </div>
      )}

      {subject && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] text-gray-400 dark:text-[#636366] w-12 shrink-0">Subject:</span>
          <span className="text-[12px] font-medium text-gray-800 dark:text-[#E5E5EA]">{subject}</span>
        </div>
      )}

      {body && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-[#38383A]">
          <p className="text-[12px] text-gray-600 dark:text-[#98989D] leading-relaxed line-clamp-4 whitespace-pre-line">
            {body}
          </p>
        </div>
      )}

      {timestamp && (
        <p className="text-[10px] text-gray-300 dark:text-[#48484A] mt-2">{timestamp}</p>
      )}
    </div>
  )
}
