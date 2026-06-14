import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { useVotes } from '@/hooks/useVotes'

interface VoterListProps {
  projectId: string
  visible: boolean
}

export function VoterList({ projectId, visible }: VoterListProps) {
  const { votes, loading, error } = useVotes(projectId)

  if (!visible) return null

  if (loading) return <Spinner className="h-6 w-6" />
  if (error) return <Alert message={error} />

  if (votes.length === 0) {
    return (
      <div className="text-sm text-text-secondary">
        <p>No votes yet on this one.</p>
        <p className="mt-1 text-text-muted">Teams show up here after someone votes.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {votes.map((vote) => (
        <li
          key={vote.id}
          className="rounded-lg border border-border bg-bg-base px-4 py-2 text-sm text-text-primary"
        >
          {vote.team?.name ?? 'Unknown team'}
        </li>
      ))}
    </ul>
  )
}
