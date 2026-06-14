import type { Project, ProjectStatus } from '@/types'

export const POLL_INTERVAL_MS = 15_000

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function toDatetimeLocalValue(iso: string) {
  const date = new Date(iso)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

export function fromDatetimeLocalValue(value: string) {
  return new Date(value).toISOString()
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  upcoming: 'Upcoming',
  voting: 'Voting Open',
  closed: 'Closed',
  assigned: 'Assigned',
}

export function getEffectiveStatus(project: Project): ProjectStatus {
  if (
    project.status === 'voting' &&
    new Date(project.voting_deadline) < new Date()
  ) {
    return 'closed'
  }
  return project.status
}

export function truncate(text: string, max: number) {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

export function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase()
}
