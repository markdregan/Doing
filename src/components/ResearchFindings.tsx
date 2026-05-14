interface ResearchFindingsProps {
  query?: string
  summary?: string
  findings?: string[]
  sources?: { title: string; url?: string }[]
  timestamp?: string
}

export default function ResearchFindings({ query, summary, findings, sources, timestamp }: ResearchFindingsProps) {
  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-gray-100 dark:border-[#38383A] p-4 animate-scale-in">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-green-500">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </span>
        <span className="text-[11px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.06em]">Research</span>
      </div>

      {query && (
        <div className="mb-2">
          <span className="text-[11px] text-gray-400 dark:text-[#636366]">Query: </span>
          <span className="text-[12px] text-gray-700 dark:text-[#D1D1D6] font-medium">&ldquo;{query}&rdquo;</span>
        </div>
      )}

      {summary && (
        <p className="text-[12px] text-gray-600 dark:text-[#98989D] leading-relaxed mb-2">{summary}</p>
      )}

      {findings && findings.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-[#38383A]">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.06em] mb-1.5">Findings</p>
          <ul className="space-y-1.5">
            {findings.map((finding, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-gray-600 dark:text-[#98989D] leading-snug">
                <span className="text-green-500 text-[10px] mt-0.5 shrink-0">{'\u2713'}</span>
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}

      {sources && sources.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-[#38383A]">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-[#636366] uppercase tracking-[0.06em] mb-1.5">Sources</p>
          <div className="space-y-1">
            {sources.map((source, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 dark:text-[#636366]">{'\u2197'}</span>
                <span className="text-[11px] text-gray-500 dark:text-[#98989D]">{source.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {timestamp && (
        <p className="text-[10px] text-gray-300 dark:text-[#48484A] mt-2">{timestamp}</p>
      )}
    </div>
  )
}
