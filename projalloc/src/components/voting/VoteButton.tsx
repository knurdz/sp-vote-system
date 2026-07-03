import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { useVote } from '@/hooks/useVote'
import { formatDateTime } from '@/lib/utils'

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
    cvUploaded,
    cvUploadDeadline,
    uploadDeadlinePassed,
    role,
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

  // Show locking warnings to team leaders
  if (role === 'leader') {
    // 1. If CV upload deadline has not passed, block voting
    if (cvUploadDeadline && !uploadDeadlinePassed) {
      return (
        <div className="space-y-2">
          <Alert
            variant="info"
            message={`Voting will open after the CV upload window closes on ${formatDateTime(cvUploadDeadline)}.`}
          />
          <p className="text-[11px] text-text-muted text-center italic font-medium">
            Make sure your team has uploaded its ZIP archive in your Home page workspace before this deadline!
          </p>
        </div>
      )
    }

    // 2. If deadline has passed, but this team didn't upload a CV ZIP
    if (uploadDeadlinePassed && !cvUploaded) {
      return (
        <Alert
          variant="error"
          message="Voting locked. Your team is ineligible to vote because no CV ZIP archive was uploaded before the deadline."
        />
      )
    }
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
