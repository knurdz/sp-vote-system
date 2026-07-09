import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { parseTeamsCsv, TEAMS_CSV_TEMPLATE, type ParsedTeamRow } from '@/lib/parseTeamsCsv'
import { supabase } from '@/lib/supabase'
import type { Team } from '@/types'

interface TeamCsvUploadProps {
  teams: Team[]
  onComplete: () => Promise<void>
}

interface ImportSummary {
  created: number
  updated: number
  failed: string[]
}

function downloadTemplate() {
  const blob = new Blob([TEAMS_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'teams-template.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export function TeamCsvUpload({ teams, onComplete }: TeamCsvUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [preview, setPreview] = useState<ParsedTeamRow[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const resetSelection = () => {
    setFileName(null)
    setPreview([])
    setParseErrors([])
    setSummary(null)
    setImportError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setSummary(null)
    setImportError(null)

    if (!file) {
      resetSelection()
      return
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseErrors(['Please upload a .csv file.'])
      setPreview([])
      setFileName(file.name)
      return
    }

    const content = await file.text()
    const { rows, errors } = parseTeamsCsv(content)
    setFileName(file.name)
    setPreview(rows)
    setParseErrors(errors)
  }

  const handleImport = async () => {
    if (preview.length === 0 || parseErrors.length > 0) return

    setImporting(true)
    setImportError(null)
    setSummary(null)

    const existingByEmail = new Map(
      teams.map((team) => [team.leader_email.toLowerCase(), team]),
    )

    const result: ImportSummary = { created: 0, updated: 0, failed: [] }

    for (const row of preview) {
      const existing = existingByEmail.get(row.leader_email)

      if (existing) {
        const { error } = await supabase
          .from('teams')
          .update({ name: row.name })
          .eq('id', existing.id)

        if (error) {
          result.failed.push(`Line ${row.line} (${row.name}): ${error.message}`)
        } else {
          result.updated += 1
        }
        continue
      }

      const { error } = await supabase.from('teams').insert({
        name: row.name,
        leader_email: row.leader_email,
      })

      if (error) {
        result.failed.push(`Line ${row.line} (${row.name}): ${error.message}`)
      } else {
        result.created += 1
      }
    }

    setSummary(result)
    setImporting(false)

    if (result.failed.length === 0) {
      await onComplete()
      setFileName(null)
      setPreview([])
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const canImport = preview.length > 0 && parseErrors.length === 0 && !importing

  return (
    <section className="panel mb-8 p-6 sm:p-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-text-primary">Import Teams from CSV</h2>
          <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-text-secondary">
            Upload a CSV with team name and account email. Existing teams are matched by account
            email and updated; new emails are added as teams.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={downloadTemplate}>
          Download Template
        </Button>
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-bg-base/40 p-5">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => void handleFileChange(e)}
          className="block w-full text-sm text-text-secondary file:mr-4 file:rounded-xl file:border-0 file:bg-accent file:px-4 file:py-2 file:text-xs file:font-display file:font-bold file:uppercase file:tracking-wide file:text-white hover:file:bg-accent-hover cursor-pointer"
        />
        <p className="mt-2.5 font-mono text-[11px] text-text-muted">
          Expected columns: <span className="font-mono text-text-secondary">team_name (or group_name), account_email (or personal_email)</span>
        </p>
      </div>

      {fileName && (
        <p className="mt-3 text-sm text-text-secondary">
          Selected file: <span className="text-text-primary">{fileName}</span>
        </p>
      )}

      {parseErrors.length > 0 && (
        <div className="mt-4 space-y-2">
          {parseErrors.map((message) => (
            <Alert key={message} message={message} />
          ))}
        </div>
      )}

      {importError && (
        <div className="mt-4">
          <Alert message={importError} />
        </div>
      )}

      {preview.length > 0 && parseErrors.length === 0 && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-bg-surface/50 backdrop-blur-md shadow-panel">
          <div className="border-b border-border bg-bg-elevated/40 px-5 py-3 text-sm font-display font-bold text-text-primary">
            Preview ({preview.length} team{preview.length === 1 ? '' : 's'})
          </div>
          <div className="max-h-56 overflow-y-auto w-full overflow-x-auto">
            <table className="w-full min-w-[400px] text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-bg-elevated/20">
                  <th className="px-5 py-2.5 font-display font-semibold text-[12px] uppercase tracking-wider text-text-muted">Team Name</th>
                  <th className="px-5 py-2.5 font-display font-semibold text-[12px] uppercase tracking-wider text-text-muted">Action</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => {
                  const exists = teams.some(
                    (team) => team.leader_email.toLowerCase() === row.leader_email,
                  )
                  return (
                    <tr key={`${row.line}-${row.leader_email}`} className="border-b border-border/60 hover:bg-bg-elevated/10 transition-colors">
                      <td className="px-5 py-3 font-medium text-text-primary">{row.name}</td>
                      <td className="px-5 py-3 text-text-secondary">
                        {exists ? (
                          <span className="text-yellow font-semibold">Update name</span>
                        ) : (
                          <span className="text-accent font-semibold">Create team</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" onClick={() => void handleImport()} disabled={!canImport}>
          {importing ? 'Importing…' : 'Import teams'}
        </Button>
        {(fileName || preview.length > 0) && (
          <Button type="button" variant="ghost" onClick={resetSelection} disabled={importing}>
            Clear
          </Button>
        )}
      </div>

      {summary && (
        <div className="mt-4 rounded-xl border border-border bg-bg-elevated p-4 text-sm">
          <p className="font-medium text-text-primary">Import complete</p>
          <p className="mt-1 text-text-secondary">
            Created {summary.created}, updated {summary.updated}
            {summary.failed.length > 0 ? `, failed ${summary.failed.length}` : ''}.
          </p>
          {summary.failed.length > 0 && (
            <ul className="mt-2 space-y-1 text-red">
              {summary.failed.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
