import type { AgentActivityEvent, ActivityEventType } from '../types'
import EmailDraftPreview from './EmailDraftPreview'
import CallTranscript from './CallTranscript'
import ResearchFindings from './ResearchFindings'

interface ExternalActionCardProps {
  event: AgentActivityEvent
}

const EXTERNAL_TYPES: ActivityEventType[] = ['email_sent', 'call_made', 'text_sent', 'research_complete']

export default function ExternalActionCard({ event }: ExternalActionCardProps) {
  if (!EXTERNAL_TYPES.includes(event.type)) return null

  const meta = event.metadata ?? {}

  if (event.type === 'email_sent' || event.type === 'text_sent') {
    return (
      <EmailDraftPreview
        to={meta.to as string}
        subject={meta.subject as string}
        body={event.details || (event.summary !== meta.subject ? event.summary : undefined)}
        status={event.type === 'email_sent' ? 'sent' : undefined}
        timestamp={event.timestamp ? new Date(event.timestamp).toLocaleString() : undefined}
      />
    )
  }

  if (event.type === 'call_made') {
    return (
      <CallTranscript
        duration={meta.duration as string}
        participants={meta.participants as string[]}
        summary={event.summary}
        keyPoints={meta.keyPoints as string[]}
        timestamp={event.timestamp ? new Date(event.timestamp).toLocaleString() : undefined}
      />
    )
  }

  if (event.type === 'research_complete') {
    return (
      <ResearchFindings
        query={meta.query as string}
        summary={event.summary}
        findings={meta.findings as string[]}
        sources={meta.sources as { title: string; url?: string }[]}
        timestamp={event.timestamp ? new Date(event.timestamp).toLocaleString() : undefined}
      />
    )
  }

  return null
}
