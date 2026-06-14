export interface ParsedTeamRow {
  name: string
  leader_email: string
  line: number
}

export interface ParseTeamsCsvResult {
  rows: ParsedTeamRow[]
  errors: string[]
}

const NAME_HEADERS = new Set(['name', 'team', 'team_name', 'teamname'])
const EMAIL_HEADERS = new Set(['leader_email', 'email', 'account_email', 'leader', 'leader_gmail', 'gmail'])

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '_')
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += char
  }

  cells.push(current.trim())
  return cells
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function parseTeamsCsv(content: string): ParseTeamsCsvResult {
  const errors: string[] = []
  const rows: ParsedTeamRow[] = []
  const seenEmails = new Set<string>()

  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return { rows: [], errors: ['CSV file is empty.'] }
  }

  const firstCells = parseCsvLine(lines[0])
  const normalized = firstCells.map(normalizeHeader)
  const hasHeader =
    normalized.some((cell) => NAME_HEADERS.has(cell)) &&
    normalized.some((cell) => EMAIL_HEADERS.has(cell))

  let nameIndex = 0
  let emailIndex = 1

  if (hasHeader) {
    nameIndex = normalized.findIndex((cell) => NAME_HEADERS.has(cell))
    emailIndex = normalized.findIndex((cell) => EMAIL_HEADERS.has(cell))
  }

  const dataLines = hasHeader ? lines.slice(1) : lines

  dataLines.forEach((line, index) => {
    const lineNumber = hasHeader ? index + 2 : index + 1
    const cells = parseCsvLine(line)

    if (cells.length < 2) {
      errors.push(`Line ${lineNumber}: expected team name and account email.`)
      return
    }

    const name = cells[nameIndex]?.trim()
    const leaderEmail = cells[emailIndex]?.trim().toLowerCase()

    if (!name || name.length < 2 || name.length > 60) {
      errors.push(`Line ${lineNumber}: team name must be 2–60 characters.`)
      return
    }

    if (!leaderEmail || !isValidEmail(leaderEmail)) {
      errors.push(`Line ${lineNumber}: invalid account email "${cells[emailIndex] ?? ''}".`)
      return
    }

    if (seenEmails.has(leaderEmail)) {
      errors.push(`Line ${lineNumber}: duplicate account email "${leaderEmail}".`)
      return
    }

    seenEmails.add(leaderEmail)
    rows.push({ name, leader_email: leaderEmail, line: lineNumber })
  })

  return { rows, errors }
}

export const TEAMS_CSV_TEMPLATE = `team_name,account_email
Example Team,team@example.com
`
