import { Link } from 'react-router-dom'
import { Countdown } from '@/components/ui/Countdown'
import { cn } from '@/lib/utils'
import type { AssignedTeamInfo, Project } from '@/types'

interface ProjectCardProps {
  project: Project
  assignedTeam?: AssignedTeamInfo
  showAdminEmail?: boolean
  index: number
  layout?: 'grid' | 'list'
  /** True when the current leader's team has voted for this project */
  myVote?: boolean
  /** Total number of votes cast for this project */
  voteCount?: number
}

export function ProjectCard({
  project,
  assignedTeam,
  layout = 'grid',
  myVote = false,
  voteCount = 0,
}: ProjectCardProps) {

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const isVoting = project.status === 'voting'
  const isAssigned = project.status === 'assigned'
  const isClosed = project.status === 'closed'
  const isUpcoming = project.status === 'upcoming'

  /** "Your Vote" badge — shown in the top-right corner of the card */
  const MyVoteBadge = myVote ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-display font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
      <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      Your Vote
    </span>
  ) : null

  if (layout === 'list') {
    return (
      <Link
        to={`/project/${project.id}`}
        className={cn(
          "relative flex flex-col md:flex-row md:items-center justify-between rounded-2xl border bg-white dark:bg-[#14120B] py-5 px-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] gap-6 cursor-pointer",
          myVote
            ? "border-emerald-400/60 dark:border-emerald-500/40 hover:border-emerald-400 dark:hover:border-emerald-500/70 ring-1 ring-emerald-400/20 dark:ring-emerald-500/15"
            : "border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700"
        )}
      >
        {/* "Your Vote" — top-right corner */}
        {myVote && (
          <div className="absolute top-3 right-4">
            {MyVoteBadge}
          </div>
        )}

        {/* Left: Avatar, Title & Subtitle */}
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-50 dark:bg-bg-elevated/40 border border-slate-200 dark:border-border/40 text-slate-700 dark:text-text-primary font-display text-sm font-bold tracking-wider">
            {getInitials(project.company)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="truncate font-display text-sm font-bold text-slate-800 dark:text-text-primary uppercase tracking-tight">
                {project.title}
              </h3>
              {project.cv_required && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/12 border border-blue-500/30 px-2 py-0.5 text-[9px] font-display font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 shrink-0">
                  CV Required
                </span>
              )}
              {isVoting && (
                <svg className="h-4 w-4 text-blue-600 dark:text-blue-500 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-text-secondary">{project.company}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-zinc-700" />
              <span className={cn(
                "text-[10px] font-display font-bold uppercase tracking-wider",
                isVoting ? "text-emerald-600 dark:text-emerald-500" : isUpcoming ? "text-amber-500" : "text-slate-400 dark:text-text-muted"
              )}>
                {isUpcoming ? 'Upcoming' : isVoting ? 'Active' : isClosed ? 'Closed' : 'Matched'}
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Description excerpt */}
        <p className="text-xs text-slate-500 dark:text-[#9ab5a6] leading-relaxed flex-1 line-clamp-2 md:px-4">
          {project.description}
        </p>

        {/* Middle-Right: Compact Metrics */}
        <div className="flex items-center divide-x divide-slate-200 dark:divide-zinc-800/80 px-2 shrink-0">
          <div className="px-4 text-center">
            <p className="truncate text-sm font-display font-bold text-slate-800 dark:text-text-primary max-w-32">
              {voteCount} {voteCount === 1 ? 'Vote' : 'Votes'}
            </p>
            <p className="font-display text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#9ab5a6]/60 mt-0.5">
              VOTES CAST
            </p>
          </div>
          <div className="px-4 text-center">
            <p className="text-sm font-display font-bold text-slate-800 dark:text-text-primary">
              {new Date(project.voting_deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </p>
            <p className="font-display text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#9ab5a6]/60 mt-0.5">
              DEADLINE
            </p>
          </div>
        </div>

        {/* Far Right: Buttons & Status Footer */}
        <div className="flex flex-col md:flex-row items-center gap-4 shrink-0">
          
          <div className="text-center md:text-right shrink-0">
            {isVoting ? (
              <div className="flex items-center justify-center md:justify-end gap-1.5 text-[10px] font-semibold text-rose-500 dark:text-rose-400">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                </svg>
                <span>Closes:</span>
                <Countdown deadline={project.voting_deadline} className="font-mono font-bold" />
              </div>
            ) : isAssigned && assignedTeam ? (
              <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-500 truncate max-w-32">
                Assigned to: <span className="font-bold">{assignedTeam.name}</span>
              </div>
            ) : isClosed ? (
              <div className="text-[10px] font-semibold text-rose-500 dark:text-rose-400">
                Voting Closed
              </div>
            ) : (
              <div className="text-[10px] font-semibold text-amber-500">
                Opens {new Date(project.voting_deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
            )}
          </div>

          <div className="flex items-center">
            <div
              className="inline-flex h-9 px-4 items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#14120B] text-slate-600 dark:text-[#9ab5a6] hover:bg-slate-50 dark:hover:bg-zinc-800/40 hover:text-slate-800 dark:hover:text-text-primary transition-colors text-xs font-display font-bold cursor-pointer"
              title="View Details"
            >
              <svg className="h-4 w-4 shrink-0 text-slate-500 dark:text-[#9ab5a6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>View Details</span>
            </div>
          </div>

        </div>
      </Link>
    )
  }

  // grid card wrapper
  return (
    <Link
      to={`/project/${project.id}`}
      className={cn(
        "relative flex flex-col justify-between rounded-2xl border bg-white dark:bg-[#14120B] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] cursor-pointer",
        myVote
          ? "border-emerald-400/60 dark:border-emerald-500/40 hover:border-emerald-400 dark:hover:border-emerald-500/70 ring-1 ring-emerald-400/20 dark:ring-emerald-500/15"
          : "border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700"
      )}
    >
      {/* "Your Vote" — absolute top-right corner */}
      {myVote && (
        <div className="absolute top-3.5 right-4">
          {MyVoteBadge}
        </div>
      )}

      {/* Top Header Section */}
      <div className="space-y-4">
        
        {/* Avatar & Title Row */}
        <div className="flex items-center gap-3.5">
          {/* Company Initials Avatar */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-50 dark:bg-bg-elevated/40 border border-slate-200 dark:border-border/40 text-slate-700 dark:text-text-primary font-display text-sm font-bold tracking-wider">
            {getInitials(project.company)}
          </div>
 
          {/* Title and Company Subtitle */}
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="truncate font-display text-sm font-semibold text-slate-800 dark:text-text-primary uppercase tracking-tight">
                {project.title}
              </h3>
              {project.cv_required && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/12 border border-blue-500/30 px-2 py-0.5 text-[9px] font-display font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 shrink-0">
                  CV Required
                </span>
              )}
              {isVoting && (
                <svg className="h-4 w-4 text-blue-600 dark:text-blue-500 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-text-secondary">{project.company}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-zinc-700" />
              <span className={cn(
                "text-[10px] font-display font-bold uppercase tracking-wider",
                isVoting ? "text-emerald-600 dark:text-emerald-500" : isUpcoming ? "text-amber-500" : "text-slate-400 dark:text-text-muted"
              )}>
                {isUpcoming ? 'Upcoming' : isVoting ? 'Active' : isClosed ? 'Closed' : 'Matched'}
              </span>
            </div>
          </div>
        </div>

        {/* Project Description excerpt */}
        <p className="text-xs text-slate-500 dark:text-[#9ab5a6] leading-relaxed line-clamp-2 min-h-8">
          {project.description}
        </p>

        {/* Minimal Inner Metrics Box */}
        <div className="grid grid-cols-2 rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-bg-elevated/10 divide-x divide-slate-200 dark:divide-zinc-800/80 py-2.5">
          <div className="text-center">
            <p className="text-[13px] font-display font-bold text-slate-800 dark:text-text-primary px-2">
              {voteCount} {voteCount === 1 ? 'Vote' : 'Votes'}
            </p>
            <p className="font-display text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#9ab5a6]/60 mt-0.5">
              VOTES CAST
            </p>
          </div>
          <div className="text-center">
            <p className="text-[13px] font-display font-bold text-slate-800 dark:text-text-primary px-2">
              {new Date(project.voting_deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </p>
            <p className="font-display text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#9ab5a6]/60 mt-0.5">
              DEADLINE
            </p>
          </div>
        </div>

      </div>

      {/* Action Row */}
      <div className="mt-5 space-y-3">
        
        {/* Full-width Details button wrapper */}
        <div
          className="w-full inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#14120B] text-slate-600 dark:text-[#9ab5a6] hover:bg-slate-50 dark:hover:bg-zinc-800/40 hover:text-slate-800 dark:hover:text-text-primary transition-colors text-xs font-display font-semibold cursor-pointer"
          title="View Details"
        >
          <svg className="h-4 w-4 shrink-0 text-slate-500 dark:text-[#9ab5a6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>View Details</span>
        </div>

        {/* Status text at bottom */}
        <div className="pt-1 text-center">
          {isVoting ? (
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-rose-500 dark:text-rose-400">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
              </svg>
              <span>Closes in:</span>
              <Countdown deadline={project.voting_deadline} className="font-mono font-bold" />
            </div>
          ) : isAssigned && assignedTeam ? (
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-500 truncate">
              Assigned to: <span className="font-bold">{assignedTeam.name}</span>
            </div>
          ) : isClosed ? (
            <div className="text-[11px] font-semibold text-rose-500 dark:text-rose-400">
              Voting Closed
            </div>
          ) : (
            <div className="text-[11px] font-semibold text-amber-500">
              Opens {new Date(project.voting_deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
        </div>

      </div>

    </Link>
  )
}
