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
  upcoming: 'Coming soon',
  voting: 'Open for votes',
  closed: 'Voting closed',
  assigned: 'Team picked',
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

const STATUS_SORT_ORDER: Record<ProjectStatus, number> = {
  voting: 0,
  upcoming: 1,
  closed: 2,
  assigned: 3,
}

export function sortProjectsByStatus(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    const byStatus = STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status]
    if (byStatus !== 0) return byStatus
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export function truncate(text: string, max: number) {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

export function getInitials(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return '?'

  if (trimmed.includes('@')) {
    return trimmed.slice(0, 2).toUpperCase()
  }

  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return trimmed.slice(0, 2).toUpperCase()
}

export function openExternalUrl(url: string): void {
  const a = document.createElement('a')
  a.href = url
  a.rel = 'noopener noreferrer'
  a.target = '_blank'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return 'An unexpected error occurred'
}
