import MarkdownContent from './MarkdownContent'

interface ChatBubbleProps {
  role: 'user' | 'agent' | 'system'
  content: string
}

export default function ChatBubble({ role, content }: ChatBubbleProps) {
  const isAgent = role !== 'user'
  return (
    <div className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed ${
        isAgent
          ? 'bg-gray-100 dark:bg-[#252526] text-gray-700 dark:text-[#D1D1D6] rounded-bl-md'
          : 'bg-indigo-500 text-white rounded-br-md'
      }`}>
        {isAgent ? <MarkdownContent content={content} /> : content}
      </div>
    </div>
  )
}
