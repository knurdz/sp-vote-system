export type Role = 'admin' | 'leader' | 'viewer'

export interface Profile {
  id: string
  email: string
  role: Role
  created_at: string
}

export interface Team {
  id: string
  name: string
  leader_email: string
  created_at: string
}

export type ProjectStatus = 'upcoming' | 'voting' | 'closed' | 'assigned'

export interface Project {
  id: string
  title: string
  company: string
  description: string
  tech_stack: string[]
  team_size: number
  voting_deadline: string
  status: ProjectStatus
  created_by: string | null
  created_at: string
}

export interface Vote {
  id: string
  project_id: string
  team_id: string
  leader_email: string
  voted_at: string
}

export interface SpinEvent {
  id: string
  project_id: string
  zoom_link: string | null
  scheduled_at: string | null
  spun_at: string | null
  winning_team_id: string | null
  triggered_by: string | null
  created_at: string
}

export interface SpinLog {
  id: string
  spin_event_id: string
  all_candidates: { team_id: string; team_name: string }[]
  winning_team_name: string
  project_title: string
  company: string
  timestamp: string
}

export interface VoteWithTeam extends Vote {
  team?: Team
}
