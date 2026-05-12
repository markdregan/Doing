import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const PUBLIC_ORIGIN = Deno.env.get('PUBLIC_ORIGIN')

interface InvitePayload {
  email: string
  token: string
  projectTitle: string
  inviterName: string
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured')
    return new Response('Email service not configured', { status: 500 })
  }

  try {
    const { email, token, projectTitle, inviterName } = await req.json() as InvitePayload

    if (!email || !token || !projectTitle || !inviterName) {
      return new Response('Missing required fields', { status: 400 })
    }

    const origin = PUBLIC_ORIGIN ?? req.headers.get('origin')
    if (!origin) {
      return new Response('Server origin not configured', { status: 500 })
    }

    const inviteLink = `${origin}/invite#token=${token}`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Things App <noreply@tryhuman.ai>',
        to: email,
        subject: `${inviterName} invited you to collaborate on "${projectTitle}"`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
              .container { max-width: 480px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
              .header { padding: 32px 32px 0; text-align: center; }
              .icon { width: 48px; height: 48px; background: #EBF5FF; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
              .icon svg { width: 24px; height: 24px; color: #3B82F6; }
              h1 { font-size: 20px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px; }
              p { font-size: 15px; color: #6b7280; line-height: 1.5; margin: 0 0 24px; text-align: center; }
              .project-name { font-weight: 600; color: #1a1a1a; }
              .btn { display: block; width: calc(100% - 64px); margin: 0 auto 32px; padding: 12px 24px; background: #1a1a1a; color: white; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; text-align: center; }
              .btn:hover { background: #333; }
              .footer { padding: 24px 32px; border-top: 1px solid #f0f0f0; text-align: center; }
              .footer p { font-size: 12px; color: #9ca3af; margin: 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 5v7l3 2"/>
                    <path d="M5 13l3-3 3 3"/>
                    <circle cx="12" cy="12" r="9"/>
                  </svg>
                </div>
                <h1>You're invited to collaborate</h1>
                <p>
                  <strong>${inviterName}</strong> wants to share
                  <span class="project-name">"${projectTitle}"</span> with you.
                </p>
              </div>
              <a href="${inviteLink}" class="btn">View Project</a>
              <div class="footer">
                <p>If you don't have an account yet, you'll be prompted to create one.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend API error:', JSON.stringify(data))
      return new Response(JSON.stringify({ error: data }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log('Email sent:', data)

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Failed to send email:', err)
    return new Response(JSON.stringify({ error: 'Failed to send email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
