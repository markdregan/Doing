import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { logger as parentLogger } from '../lib/logger'
import type { AgentActivityEvent, ActivityEventType } from '../types'
import { useTaskStore } from './useTaskStore'

const log = parentLogger.child({ module: 'useActivityStore' })

function eventFromRow(row: Record<string, unknown>): AgentActivityEvent {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    type: row.type as ActivityEventType,
    summary: row.summary as string,
    details: (row.details as string) ?? undefined,
    timestamp: row.timestamp as string,
    metadata: (row.metadata as Record<string, unknown>) ?? undefined,
  }
}

function eventToRow(event: AgentActivityEvent) {
  return {
    id: event.id,
    project_id: event.projectId,
    type: event.type,
    summary: event.summary,
    details: event.details ?? null,
    timestamp: event.timestamp,
    metadata: event.metadata ?? null,
  }
}

interface ActivityStore {
  events: AgentActivityEvent[]
  loading: boolean

  loadEvents: (projectId: string) => Promise<void>
  loadGlobalEvents: () => Promise<void>
  addEvent: (event: AgentActivityEvent) => void
  addEventFromAgent: (event: Omit<AgentActivityEvent, 'id' | 'timestamp'>) => Promise<void>
  clearEvents: (projectId?: string) => void
  eventsForProject: (projectId: string) => AgentActivityEvent[]
  eventsForDashboard: () => AgentActivityEvent[]
}

export const useActivityStore = create<ActivityStore>()((set, get) => ({
  events: [],
  loading: false,

  loadEvents: async (projectId) => {
    log.info('load_events_start', { projectId })
    set({ loading: true })

    const { data, error } = await supabase
      .from('agent_activity_events')
      .select('*')
      .eq('project_id', projectId)
      .order('timestamp', { ascending: false })
      .limit(50)

    if (error) {
      log.error('load_events_failed', error, { projectId })
      set({ loading: false })
      return
    }

    const events = (data ?? []).map(eventFromRow)
    set(s => {
      const filtered = s.events.filter(e => e.projectId !== projectId)
      return { events: [...filtered, ...events], loading: false }
    })
  },

  loadGlobalEvents: async () => {
    const userId = useTaskStore.getState().userId
    if (!userId) return

    log.info('load_global_events_start')
    set({ loading: true })

    const { data, error } = await supabase
      .from('agent_activity_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100)

    if (error) {
      log.error('load_global_events_failed', error)
      set({ loading: false })
      return
    }

    const events = (data ?? []).map(eventFromRow)
    set({ events, loading: false })
  },

  addEvent: (event) => {
    set(s => ({ events: [event, ...s.events] }))
  },

  addEventFromAgent: async (eventFields) => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const event: AgentActivityEvent = {
      id,
      timestamp: now,
      ...eventFields,
    }

    set(s => ({ events: [event, ...s.events] }))

    const { error } = await supabase.from('agent_activity_events').insert(eventToRow(event))
    if (error) {
      log.error('add_event_failed', error, { projectId: event.projectId, type: event.type })
      set(s => ({ events: s.events.filter(e => e.id !== id) }))
    }
  },

  clearEvents: (projectId) => {
    if (projectId) {
      set(s => ({ events: s.events.filter(e => e.projectId !== projectId) }))
    } else {
      set({ events: [] })
    }
  },

  eventsForProject: (projectId) => {
    return get().events
      .filter(e => e.projectId === projectId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  },

  eventsForDashboard: () => {
    return [...get().events]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50)
  },
}))
