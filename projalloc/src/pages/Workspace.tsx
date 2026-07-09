import { PageWrapper } from '@/components/layout/PageWrapper'
import { TeamWorkspace } from '@/components/team/TeamWorkspace'
import { useAuth } from '@/hooks/useAuth'
import { useUserTeam } from '@/hooks/useTeams'
import { Spinner } from '@/components/ui/Spinner'

export function Workspace() {
  const { role, user } = useAuth()
  const { team, loading, refetch } = useUserTeam(user?.email, role)

  return (
    <PageWrapper>
      <div className="relative z-10 space-y-6">
        
        {loading ? (
          <div className="panel p-12 flex justify-center items-center bg-bg-surface/30 backdrop-blur-md border border-border/80 rounded-2xl">
            <Spinner />
          </div>
        ) : team ? (
          <TeamWorkspace team={team} onUpdate={refetch} />
        ) : (
          <div className="panel p-12 text-center bg-bg-surface/30 backdrop-blur-md border border-border/80 rounded-2xl">
            <h3 className="font-display text-lg font-bold text-text-primary mb-2">Team Not Found</h3>
            <p className="text-xs text-text-secondary">We couldn't locate a team registered for your leader email address.</p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
