import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { useVote } from '@/hooks/useVote'

interface VoteButtonProps {
  projectId: string
  votingOpen: boolean
}

export function VoteButton({ projectId, votingOpen }: VoteButtonProps) {
  const {
    hasVoted,
    loading,
    actionLoading,
    error,
    canVote,
    assignedElsewhere,
    assignment,
    vote,
    withdraw,
  } = useVote(projectId)

  if (!votingOpen) return null

  if (loading) return <Spinner className="h-6 w-6" />

  if (assignedElsewhere && assignment) {
    return (
      <Alert
        message={`Your team has been assigned to "${assignment.projectTitle}". You cannot vote on other projects.`}
      />
    )
  }

  if (!canVote) return null

  return (
    <div className="space-y-3">
      {error && <Alert message={error} />}
      {hasVoted ? (
        <Button
          variant="secondary"
          size="lg"
          disabled={actionLoading}
          onClick={() => void withdraw()}
        >
          {actionLoading ? 'Withdrawing…' : 'Withdraw Vote'}
        </Button>
      ) : (
        <Button
          size="lg"
          disabled={actionLoading}
          onClick={() => void vote()}
        >
          {actionLoading ? 'Voting…' : 'Vote for this Project'}
        </Button>
      )}
    </div>
  )
}
