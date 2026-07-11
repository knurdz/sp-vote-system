export function canVoteForProject(
  role: string | null,
  teamId: string | null,
  assignedElsewhere: boolean,
  cvRequired: boolean,
  cvUploaded: boolean,
) {
  return role === 'leader' && !!teamId && !assignedElsewhere && (!cvRequired || cvUploaded)
}
