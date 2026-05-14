import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

function log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>) {
  const entry = { level, message, timestamp: new Date().toISOString(), ...data }
  if (level === 'error') console.error(JSON.stringify(entry))
  else console.log(JSON.stringify(entry))
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    log('error', 'missing configuration', { hasGeminiKey: !!GEMINI_API_KEY, hasUrl: !!SUPABASE_URL, hasKey: !!SUPABASE_SERVICE_ROLE_KEY })
    return new Response(JSON.stringify({ error: 'Missing configuration' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()

    if (body.action !== 'chat') {
      return new Response(JSON.stringify({ error: 'Unknown action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { conversationId, messages, attachments } = body

    if (!conversationId || !messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    log('info', 'request started', {
      conversationId,
      messageCount: messages.length,
      lastRole: messages[messages.length - 1]?.role,
      attachmentCount: attachments?.length ?? 0,
    })

    const response = await callGemini(messages, attachments as Attachment[] | undefined)
    const { reply, planDraft } = parsePlanFromResponse(response)

    const now = new Date().toISOString()

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const lastUserContent = messages.filter(m => m.role === 'user').pop()?.content
    if (lastUserContent) {
      const userMsg = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        role: 'user',
        content: lastUserContent,
        metadata: {},
        created_at: now,
      }
      const { error: userMsgError } = await supabase.from('agent_messages').insert(userMsg)
      if (userMsgError) log('error', 'failed to save user msg', { error: userMsgError.message, conversationId })
    }

    const agentMessage = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      role: 'agent',
      content: reply,
      metadata: planDraft ? { planDraft } : {},
      created_at: now,
    }

    const { error: msgError } = await supabase.from('agent_messages').insert(agentMessage)
    if (msgError) {
      log('error', 'failed to save agent msg', { error: msgError.message, conversationId })
    }

    log('info', 'request completed', {
      conversationId,
      replyLength: reply.length,
      hasPlanDraft: !!planDraft,
    })

    return new Response(JSON.stringify({
      messages: [
        { role: 'agent', content: reply, created_at: now },
      ],
      planDraft,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    log('error', 'agent-chat error', { error: err instanceof Error ? err.message : String(err) })
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

const SYSTEM_PROMPT = `You are a friendly and knowledgeable planning assistant integrated into a task management app. Your job is to help users break down their goals into actionable plans through natural conversation.

Guidelines:
- Be conversational, warm, and concise
- Ask clarifying questions naturally to understand the user's goal
- Cover: timeline, budget (if relevant), key priorities, constraints
- Once you have enough information, generate a structured plan
- Wrap the plan in \`\`\`plan ... \`\`\` markers as JSON

Plan JSON structure:
{
  "projectTitle": "short project name",
  "projectColor": "blue|red|orange|yellow|green|purple|pink|gray",
  "tasks": [
    { "title": "task name", "notes": "optional details", "dueDate": "YYYY-MM-DD or empty string", "tags": ["optional"] }
  ]
}

Create 4-8 tasks that cover the key steps. Only output the plan when you have enough context.
If you need more information, just ask questions naturally - don't output a plan yet.
Keep your responses helpful and concise.`

interface Attachment {
  name: string
  mimeType: string
  dataUrl: string
}

function dataUrlToInlineData(dataUrl: string): { mimeType: string; data: string } | null {
  // dataUrl format: "data:mime/type;base64,base64data"
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/)
  if (!match) return null
  return { mimeType: match[1], data: match[2] }
}

async function callGemini(messages: { role: string; content: string }[], attachments?: Attachment[]): Promise<string> {
  // Build Gemini content parts from messages
  const contents = messages.map((m, i) => {
    const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = []

    // Add text part
    if (m.content) {
      parts.push({ text: m.content })
    }

    // Attach files to the last user message
    if (attachments && attachments.length > 0 && m.role === 'user' && i === messages.length - 1) {
      for (const att of attachments) {
        const inlineData = dataUrlToInlineData(att.dataUrl)
        if (inlineData) {
          parts.push({ inlineData })
        }
      }
    }

    return {
      role: m.role === 'agent' ? 'model' : 'user',
      parts,
    }
  })

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    }
  )

  if (!res.ok) {
    const errText = await res.text()
    log('error', 'Gemini API error', { status: res.status })
    throw new Error(`Gemini API error: ${res.status} ${errText}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

function parsePlanFromResponse(text: string): { reply: string; planDraft: Record<string, unknown> | null } {
  // Match ```plan, ```json, or bare ``` fences with flexible whitespace
  const planMatch = text.match(/```(?:plan|json)?[ \t]*\n?([\s\S]*?)\n?[ \t]*```/)
  if (!planMatch) {
    return { reply: text, planDraft: null }
  }

  try {
    const planDraft = JSON.parse(planMatch[1].trim())
    const reply = text.replace(/```(?:plan|json)?[ \t]*\n?[\s\S]*?\n?[ \t]*```/, '').trim()
    return { reply, planDraft }
  } catch {
    return { reply: text, planDraft: null }
  }
}
