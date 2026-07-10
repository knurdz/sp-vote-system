import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { useVotes } from '@/hooks/useVotes'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface VoterListProps {
  projectId: string
  visible: boolean
  cvRequired?: boolean
}

export function VoterList({ projectId, visible, cvRequired }: VoterListProps) {
  const { role, user } = useAuth()
  const { votes, loading, error } = useVotes(projectId)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  if (!visible) return null

  if (!user) {
    return (
      <div className="rounded-2xl border border-border bg-white dark:bg-[#14120B] py-12 text-center shadow-panel flex flex-col items-center">
        <svg className="mx-auto mb-4 h-12 w-12 text-text-secondary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <p className="font-display font-bold text-text-primary text-[14px] uppercase tracking-wide">Authentication Required</p>
        <p className="mt-1.5 text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
          Please log in to view the teams that have voted on this project.
        </p>
        <Link
          to="/login"
          className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-accent bg-accent/5 text-accent hover:bg-accent hover:text-white px-5 py-2.5 text-xs font-display font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
        >
          <span>Sign In to Continue</span>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-white dark:bg-[#14120B] py-12 text-center shadow-panel">
        <svg className="mx-auto mb-4 h-12 w-12 text-text-secondary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        <p className="font-display font-bold text-text-primary text-[14px] uppercase tracking-wide">Access Restricted</p>
        <p className="mt-1.5 text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
          You do not have permission to view the voter list for this project. Only team leaders and administrators can access this data.
        </p>
      </div>
    )
  }

  if (votes.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white dark:bg-[#14120B] py-12 text-center shadow-panel">
        <svg className="mx-auto mb-4 h-12 w-12 text-text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
        <p className="font-display font-bold text-text-primary text-[14px] uppercase tracking-wide">No Votes Yet</p>
        <p className="mt-1.5 text-xs text-text-secondary">Teams that vote for this project will appear here.</p>
      </div>
    )
  }

  const handleDownloadCV = async (teamId: string, cvUrl: string) => {
    setDownloadingId(teamId)
    try {
      const { data, error } = await supabase.storage
        .from('cvs')
        .createSignedUrl(cvUrl, 60)
      
      if (error) throw error
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    } catch (err) {
      console.error('Could not download file:', err)
      alert('Failed to download CV archive.')
    } finally {
      setDownloadingId(null)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const isAdmin = role === 'admin'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {votes.map((vote) => {
        if (!vote.team) return null
        const team = vote.team
        const isUserTeam = team.leader_email === user?.email
        const hasCv = !!team.cv_url
        const canDownloadCv = isAdmin || isUserTeam

        return (
          <div
            key={vote.id}
            className="flex flex-col justify-between rounded-2xl border border-border/80 bg-white dark:bg-[#14120B] p-5 shadow-panel transition-all hover:shadow-lg hover:border-accent/25"
          >
            
            {/* Top Info */}
            <div className="space-y-4">
              
              {/* Profile Avatar / Initials Header */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 border border-accent/20 text-accent font-display text-sm font-bold tracking-wider">
                  {getInitials(team.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <h4 className="truncate font-display text-sm font-bold text-text-primary uppercase tracking-tight">
                      {team.name}
                    </h4>
                    {hasCv && (
                      <svg className="h-4 w-4 text-blue-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="truncate font-mono text-[10px] text-text-muted mt-0.5">
                    {team.leader_email}
                  </p>
                </div>
              </div>

              {/* Stats Panel box */}
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/60 bg-bg-base/30 dark:bg-bg-base/20 p-3 text-center">
                <div className="border-r border-border/40 text-left pl-2">
                  <p className="font-display text-[9px] font-bold uppercase tracking-wider text-text-muted">
                    VOTED AT
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-text-primary truncate">
                    {new Date(vote.voted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="text-left pl-4">
                  <p className="font-display text-[9px] font-bold uppercase tracking-wider text-text-muted">
                    CV STATUS
                  </p>
                  <p className={`mt-0.5 text-[11px] font-bold ${hasCv ? 'text-blue-500' : 'text-rose-500'}`}>
                    {hasCv ? 'Verified' : 'Missing'}
                  </p>
                </div>
              </div>

            </div>

            {/* Bottom Actions Row */}
            <div className="mt-5 space-y-3.5">
              
              <div className="flex items-center gap-2">
                {/* Download CV (Wishlist equivalent) */}
                {hasCv && canDownloadCv ? (
                  <button
                    onClick={() => team.cv_url && handleDownloadCV(team.id, team.cv_url)}
                    disabled={downloadingId === team.id}
                    className="inline-flex h-9 px-3.5 items-center justify-center gap-1.5 rounded-xl border border-border bg-white dark:bg-[#14120B] text-xs font-display font-bold text-text-secondary hover:text-text-primary hover:bg-bg-base transition-colors flex-1 cursor-pointer"
                  >
                    {downloadingId === team.id ? (
                      <Spinner className="h-3 w-3" />
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Download CV</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="text-[11px] text-text-muted bg-bg-base/40 border border-border/40 rounded-xl py-2 px-3 text-center flex-1 font-medium">
                    {hasCv ? 'CV restricted to Admin' : 'CV submission missing'}
                  </div>
                )}
                
                {/* Invited style button if is user team */}
                {isUserTeam && (
                  <div className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 px-4 text-xs font-display font-bold text-blue-600 dark:text-blue-400">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    <span>Your Vote</span>
                  </div>
                )}
              </div>

              {/* Verification status text at the bottom */}
              <div className="pt-2.5 border-t border-border/30 text-center">
                {hasCv ? (
                  <span className="text-[11px] font-semibold text-blue-500">
                    {cvRequired ? 'Verified - Eligible for Matching' : 'Verified - Eligible for Spin'}
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-rose-500">
                    Not Eligible - Upload Required
                  </span>
                )}
              </div>

            </div>

          </div>
        )
      })}
    </div>
  )
}
