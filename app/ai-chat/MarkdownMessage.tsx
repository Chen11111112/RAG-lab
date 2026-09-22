'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type MarkdownMessageProps = {
  content: string
  variant?: 'default' | 'error'
}

export function MarkdownMessage({ content, variant = 'default' }: MarkdownMessageProps) {
  return (
    <div
      className={`chat-markdown ${variant === 'error' ? 'chat-markdown-error' : ''}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
