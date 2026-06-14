import { useState } from 'react'
import { addDays, setHours, setMinutes } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '@/lib/utils'
import type { Project, ProjectStatus } from '@/types'

export interface ProjectFormData {
  title: string
  company: string
  description: string
  tech_stack: string[]
  team_size: number
  voting_deadline: string
  status: ProjectStatus
}

interface ProjectFormProps {
  initial?: Partial<Project>
  onSubmit: (data: ProjectFormData) => Promise<void>
  onCancel: () => void
}

export function ProjectForm({ initial, onSubmit, onCancel }: ProjectFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [company, setCompany] = useState(initial?.company ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [techStack, setTechStack] = useState<string[]>(initial?.tech_stack ?? [])
  const [tagInput, setTagInput] = useState('')
  const [teamSize, setTeamSize] = useState(initial?.team_size ?? 4)
  const defaultDeadline = toDatetimeLocalValue(
    setMinutes(setHours(addDays(new Date(), 1), 9), 0).toISOString(),
  )
  const [deadline, setDeadline] = useState(
    initial?.voting_deadline
      ? toDatetimeLocalValue(initial.voting_deadline)
      : defaultDeadline,
  )
  const [status, setStatus] = useState<ProjectStatus>(initial?.status ?? 'upcoming')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !techStack.includes(tag)) {
      setTechStack([...techStack, tag])
    }
    setTagInput('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit({
        title,
        company,
        description,
        tech_stack: techStack,
        team_size: teamSize,
        voting_deadline: fromDatetimeLocalValue(deadline),
        status,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'input-field input-field-focus'

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      {error && (
        <div className="rounded-btn border border-red/30 bg-red/10 px-3 py-2 text-sm text-red">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm text-text-secondary">Title</label>
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div>
        <label className="mb-1 block text-sm text-text-secondary">Company</label>
        <input className={inputClass} value={company} onChange={(e) => setCompany(e.target.value)} required />
      </div>

      <div>
        <label className="mb-1 block text-sm text-text-secondary">Description</label>
        <textarea
          className={`${inputClass} min-h-24 resize-y`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-text-secondary">Tech Stack</label>
        <div className="mb-2 flex flex-wrap gap-2">
          {techStack.map((tag) => (
            <span
              key={tag}
              className="font-mono flex items-center gap-1 rounded border border-border px-2 py-0.5 text-xs"
            >
              {tag}
              <button
                type="button"
                className="text-text-secondary hover:text-white"
                onClick={() => setTechStack(techStack.filter((t) => t !== tag))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className={`${inputClass} min-w-0 flex-1`}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag()
              }
            }}
            placeholder="Type and press Enter"
          />
          <Button type="button" variant="secondary" onClick={addTag} className="shrink-0 sm:w-auto">
            Add
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-text-secondary">Team Size</label>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={teamSize}
            onChange={(e) => setTeamSize(Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-secondary">Status</label>
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          >
            <option value="upcoming">Upcoming</option>
            <option value="voting">Voting Open</option>
            <option value="closed">Closed</option>
            <option value="assigned">Assigned</option>
          </select>
        </div>
      </div>

      <DateTimePicker
        label="Voting Deadline"
        value={deadline}
        onChange={setDeadline}
        required
      />

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? 'Saving…' : 'Save Project'}
        </Button>
      </div>
    </form>
  )
}
