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
      <p className="text-sm text-text-secondary">No teams voted for this project.</p>
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
