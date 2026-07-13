'use server'

export async function getAIResponse(prompt: string) {
  // 1. 安全性檢查：確保有 API Key
  const apiKey = process.env.NVIDIA_NIM_API_KEY; // .env.local 的變數名稱
  if (!apiKey) {
    throw new Error("Missing NVIDIA_NIM_API_KEY");
  }

  // 2. 呼叫 NIM API (假設使用其標準推理端點)
  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,// f字串
      },
      body: JSON.stringify({
        model: "deepseek-ai/deepseek-v4-flash", // 替換成您選擇的 NIM 模型名稱
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`NIM API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, message: data.choices[0].message.content };
  } catch (error) {
    return { success: false, error: "無法取得 AI 回應" };
  }
}