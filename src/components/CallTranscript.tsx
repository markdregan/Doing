interface CallTranscriptProps {
  duration?: string
  participants?: string[]
  summary?: string
  keyPoints?: string[]
  timestamp?: string
}

export default function CallTranscript({ duration, participants, summary, keyPoints, timestamp }: CallTranscriptProps) {
  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-gray-100 dark:border-[#38383A] p-4 animate-scale-in">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-purple-500">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </span>
        <span className="text-[11px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.06em]">Call</span>
        {duration && (
          <span className="text-[10px] text-gray-400 dark:text-[#636366] ml-auto">{duration}</span>
        )}
      </div>

      {participants && participants.length > 0 && (
        <div className="mb-2">
          <span className="text-[11px] text-gray-400 dark:text-[#636366]">Participants: </span>
          <span className="text-[12px] text-gray-700 dark:text-[#D1D1D6]">{participants.join(', ')}</span>
        </div>
      )}

      {summary && (
        <p className="text-[12px] text-gray-600 dark:text-[#98989D] leading-relaxed mb-2">{summary}</p>
      )}

      {keyPoints && keyPoints.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-[#38383A]">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.06em] mb-1.5">Key Points</p>
          <ul className="space-y-1">
            {keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-gray-600 dark:text-[#98989D]">
                <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-[#636366] mt-1.5 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {timestamp && (
        <p className="text-[10px] text-gray-300 dark:text-[#48484A] mt-2">{timestamp}</p>
      )}
    </div>
  )
}
