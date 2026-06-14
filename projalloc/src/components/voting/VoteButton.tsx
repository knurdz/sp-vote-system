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
        message={`Your team is already on "${assignment.projectTitle}". You can only vote on one project.`}
      />
    )
  }

  if (!canVote) return null

  return (
    <div className="space-y-3">
      {error && <Alert message={error} />}
      {hasVoted ? (
        <>
          <p className="text-sm text-text-secondary">
            Your team picked this one. Changed your mind?
          </p>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            disabled={actionLoading}
            onClick={() => void withdraw()}
          >
            {actionLoading ? 'Removing vote…' : 'Undo our vote'}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-text-secondary">
            Want this project? Lock in your team&apos;s vote before the deadline.
          </p>
          <Button
            size="lg"
            className="w-full"
            disabled={actionLoading}
            onClick={() => void vote()}
          >
            {actionLoading ? 'Submitting…' : 'Vote for this one'}
          </Button>
        </>
      )}
    </div>
  )
}
