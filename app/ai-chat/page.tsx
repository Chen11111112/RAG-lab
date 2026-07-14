'use client'
// 分頁
// 3. 在 Client Component 中使用
import { useState } from 'react'
import { getAIResponse } from '@/app/actions/ai-chat'

export default function ChatInterface() {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  
  const handleSubmit = async (formData: FormData) => {
    const prompt = formData.get('prompt') as string
    setLoading(true)

    const result = await getAIResponse(prompt)

    if (result.success) {
      setResponse(result.message)
    } else {
      // 失敗時也顯示錯誤，避免畫面空白誤以為沒回應
      setResponse(`錯誤：${result.error ?? '無法取得 AI 回應'}`)
    }
    setLoading(false)
    console.log(result)
  }

  return (
    <form action={handleSubmit}>
      <input name="prompt" disabled={loading} />
      <button type="submit" disabled={loading}>
        {loading ? '思考中...' : '送出'}
      </button>
      <div>{response}</div>
    </form>
  )
}