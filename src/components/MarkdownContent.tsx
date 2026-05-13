import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

interface MarkdownContentProps {
  content: string
  className?: string
}

const components: Partial<Components> = {
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-500 dark:text-indigo-400 hover:underline"
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className
    if (isInline) {
      return (
        <code
          className="px-1.5 py-0.5 rounded-md text-[13px] font-mono bg-gray-100 dark:bg-[#323233] text-gray-800 dark:text-[#E5E5EA]"
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <pre className="mb-3 last:mb-0 overflow-x-auto rounded-xl bg-gray-50 dark:bg-[#1C1C1E] border border-gray-100 dark:border-[#38383A] p-4">
        <code className={`text-[13px] font-mono leading-relaxed ${className ?? ''}`} {...props}>
          {children}
        </code>
      </pre>
    )
  },
  pre: ({ children }) => <>{children}</>,
  ul: ({ children }) => (
    <ul className="mb-3 last:mb-0 space-y-1 list-disc list-outside pl-5 text-[14px] leading-relaxed">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 last:mb-0 space-y-1 list-decimal list-outside pl-5 text-[14px] leading-relaxed">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-gray-700 dark:text-[#D1D1D6] marker:text-gray-400 dark:marker:text-[#636366]">
      {children}
    </li>
  ),
  h1: ({ children }) => (
    <h1 className="mb-3 last:mb-0 text-[18px] font-semibold text-gray-900 dark:text-[#F5F5F5] tracking-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 last:mb-0 text-[16px] font-semibold text-gray-900 dark:text-[#F5F5F5] tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 last:mb-0 text-[14px] font-semibold text-gray-900 dark:text-[#F5F5F5]">
      {children}
    </h3>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 last:mb-0 pl-4 border-l-2 border-gray-200 dark:border-[#48484A] text-gray-500 dark:text-[#98989D] italic">
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr className="mb-3 last:mb-0 border-t border-gray-100 dark:border-[#38383A]" />
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900 dark:text-[#F5F5F5]">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-800 dark:text-[#E5E5EA]">
      {children}
    </em>
  ),
}

export default function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={`text-[14px] leading-relaxed text-gray-700 dark:text-[#D1D1D6] ${className ?? ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
