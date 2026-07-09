import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/hooks/useSettings'
import { formatDateTime, getErrorMessage, openExternalUrl } from '@/lib/utils'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import type { Team } from '@/types'

interface TeamWorkspaceProps {
  team: Team
  onUpdate: () => void | Promise<void>
}

export function TeamWorkspace({ team, onUpdate }: TeamWorkspaceProps) {
  const { settings, loading: settingsLoading, error: settingsError } = useSettings()
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Determine timeline state
  const now = new Date()
  const start = settings ? new Date(settings.cv_upload_start) : null
  const deadline = settings ? new Date(settings.cv_upload_deadline) : null

  const isNotStarted = start ? now < start : false
  const isClosed = deadline ? now > deadline : false

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const processFile = async (file: File) => {
    setError(null)
    setSuccess(null)

    // Enforce ZIP only
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    if (fileExt !== 'zip') {
      setError('Invalid file format. Please upload a .zip archive containing your team’s CVs.')
      return
    }

    const validMimes = [
      'application/zip',
      'application/x-zip',
      'application/x-zip-compressed',
      'application/octet-stream',
    ]
    if (file.type && !validMimes.includes(file.type)) {
      setError('Invalid file type. Only ZIP archives are accepted.')
      return
    }

    const header = await file.slice(0, 4).arrayBuffer()
    const bytes = new Uint8Array(header)
    const isZip =
      bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04
    if (!isZip) {
      setError('File does not appear to be a valid ZIP archive.')
      return
    }

    // Enforce 20MB limit
    const maxSize = 20 * 1024 * 1024 // 20 MB
    if (file.size > maxSize) {
      setError('File size too large. The maximum limit for CV ZIP uploads is 20MB.')
      return
    }

    setUploading(true)

    try {
      // 1. Upload to Supabase Storage
      const uniqueName = `${team.id}/${Date.now()}_${file.name}`
      
      const { data, error: uploadErr } = await supabase.storage
        .from('cvs')
        .upload(uniqueName, file, { cacheControl: '3600', upsert: true })

      if (uploadErr) {
        throw new Error(`Storage Upload Failed: ${uploadErr.message}`)
      }

      // 2. Clean up previous file if it existed
      if (team.cv_url) {
        await supabase.storage.from('cvs').remove([team.cv_url])
      }

      // 3. Update database
      const { error: dbErr } = await supabase
        .from('teams')
        .update({ cv_url: data.path })
        .eq('id', team.id)

      if (dbErr) {
        throw new Error(`Database Update Failed: ${dbErr.message}`)
      }

      setSuccess('Your team’s CV ZIP archive has been successfully uploaded!')
      await onUpdate()
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'An unexpected error occurred during the upload.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (isClosed || isNotStarted) return

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void processFile(e.dataTransfer.files[0])
    }
  }, [team.id, isClosed, isNotStarted, team.cv_url])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      void processFile(e.target.files[0])
    }
  }

  const handleDownload = async () => {
    if (!team.cv_url) return

    try {
      const { data, error: downloadErr } = await supabase.storage
        .from('cvs')
        .createSignedUrl(team.cv_url, 60)

      if (downloadErr) throw downloadErr
      if (data?.signedUrl) {
        openExternalUrl(data.signedUrl)
      }
    } catch (err: unknown) {
      setError('Could not download file: ' + getErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!team.cv_url) return

    setConfirmDelete(false)
    setDeleting(true)
    setError(null)
    setSuccess(null)

    try {
      // 1. Remove from Storage
      const { error: storageErr } = await supabase.storage.from('cvs').remove([team.cv_url])
      if (storageErr) throw storageErr

      // 2. Update Database
      const { error: dbErr } = await supabase
        .from('teams')
        .update({ cv_url: null })
        .eq('id', team.id)

      if (dbErr) throw dbErr

      setSuccess('Your team’s CV ZIP archive was deleted.')
      await onUpdate()
    } catch (err: unknown) {
      setError('Could not delete file: ' + getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  // Get simple filename from storage path (team-id/timestamp_filename.zip)
  const getFileName = () => {
    if (!team.cv_url) return ''
    const parts = team.cv_url.split('/')
    const baseName = parts[parts.length - 1]
    const underscoreIndex = baseName.indexOf('_')
    return underscoreIndex !== -1 ? baseName.substring(underscoreIndex + 1) : baseName
  }

  if (settingsLoading) {
    return (
      <div className="panel p-6 flex justify-center items-center bg-bg-surface/30 backdrop-blur-md border border-border/80 rounded-2xl">
        <Spinner />
      </div>
    )
  }

  return (
    <section className="panel relative overflow-hidden p-6 sm:p-8 bg-bg-surface/30 backdrop-blur-md border border-border/80 rounded-2xl shadow-panel">
      {/* Header section with glass banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/40 pb-6 mb-6">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full">
            Team Leader Workspace
          </span>
          <h2 className="mt-2 font-display text-2xl font-extrabold text-text-primary tracking-tight">
            Team Workspace: {team.name}
          </h2>
          <p className="mt-1 text-xs text-text-secondary">
            Leader Account: <span className="font-mono">{team.leader_email}</span>
          </p>
        </div>

        {/* Timeline Status Display */}
        {settings && (
          <div className="shrink-0 flex items-center gap-3">
            <span className={`inline-flex items-center rounded-lg px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider border ${
              isClosed 
                ? 'bg-red/8 text-red border-red/20 shadow-[0_2px_8px_rgba(255,107,107,0.06)]' 
                : isNotStarted 
                ? 'bg-yellow/8 text-yellow border-yellow/20 shadow-[0_2px_8px_rgba(244,211,94,0.06)]' 
                : 'bg-accent/8 text-accent border-accent/20 shadow-[0_2px_8px_rgba(54,242,161,0.06)]'
            }`}>
              {isClosed ? 'Closed' : isNotStarted ? 'Upcoming' : 'Active'}
            </span>
            <div className="text-right">
              <p className="text-[10px] text-text-muted font-mono leading-tight">
                {isClosed 
                  ? `Closed ${formatDateTime(settings.cv_upload_deadline)}` 
                  : isNotStarted 
                  ? `Opens ${formatDateTime(settings.cv_upload_start)}`
                  : `Deadline: ${formatDateTime(settings.cv_upload_deadline)}`
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {settingsError && <div className="mb-4"><Alert message={`Failed to load timeline settings: ${settingsError}`} /></div>}
      {error && <div className="mb-4"><Alert message={error} /></div>}
      {success && (
        <div className="mb-4 rounded-xl border border-accent/20 bg-accent/5 p-4 text-xs font-medium text-accent">
          {success}
        </div>
      )}

      {/* Main interactive area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Team Status Rules */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-display text-sm font-bold text-text-primary">Rules & Requirements:</h3>
            <ul className="text-xs text-text-secondary space-y-2 list-disc pl-4 leading-relaxed">
              <li>Upload a **single ZIP file** (`.zip`) containing CVs of all group members.</li>
              <li>Maximum file size is **20MB**.</li>
              <li>You can only upload or edit your archive within the active upload window.</li>
              <li><strong className="text-text-primary">Ineligibility lock:</strong> You will be unable to vote on projects unless a CV ZIP is successfully uploaded before the deadline.</li>
              <li>Voting opens only after the submission window closes.</li>
            </ul>
          </div>

          <div className="rounded-xl bg-bg-base/40 border border-border/50 p-4 mt-4">
            <h4 className="font-display text-xs font-bold text-text-primary mb-1">Voting Status:</h4>
            {isClosed ? (
              team.cv_url ? (
                <p className="text-xs text-accent font-semibold flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Eligible & Ready to Vote
                </p>
              ) : (
                <p className="text-xs text-danger font-semibold flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Locked — No CV Uploaded
                </p>
              )
            ) : (
              <p className="text-xs text-text-muted italic flex items-center gap-1.5 font-medium">
                <svg className="h-4 w-4 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Waiting for Upload Window to Close
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Upload widget / Uploaded representation */}
        <div className="lg:col-span-7 flex flex-col">
          {team.cv_url ? (
            /* File Uploaded Card representation */
            <div className="flex-1 flex flex-col justify-center items-center border-2 border-dashed border-accent/20 bg-accent/5 rounded-xl p-6 text-center space-y-4">
              {deleting ? (
                <div className="py-6 flex flex-col items-center gap-2">
                  <Spinner />
                  <p className="text-xs text-text-secondary">Deleting file from storage...</p>
                </div>
              ) : (
                <>
                  <div className="h-16 w-16 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shadow-[0_0_15px_rgba(0,201,120,0.15)]">
                    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 22h14a2 2 0 002-2V7.5L16.5 3H5a2 2 0 00-2 2v15a2 2 0 002 2z" />
                      <path d="M16 3v5h5M12 11v6m0 0l-3-3m3 3l3-3m-6 5h6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="font-display font-bold text-text-primary text-sm max-w-sm truncate">
                      {getFileName()}
                    </p>
                    <p className="text-[10px] font-mono text-accent uppercase tracking-wider font-semibold">
                      Archive Uploaded
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 justify-center pt-2">
                    <Button onClick={handleDownload} variant="secondary" className="flex items-center gap-1.5 text-xs font-semibold">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 15V3m0 12l-4-4m4 4l4-4M4 17v4h16" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Download ZIP
                    </Button>

                    {!isClosed && (
                      <Button onClick={() => setConfirmDelete(true)} variant="danger" className="flex items-center gap-1.5 text-xs font-semibold">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Remove
                      </Button>
                    )}
                  </div>

                  {isClosed && (
                    <p className="text-[10px] text-text-muted italic bg-bg-elevated/40 border border-border/30 rounded px-2.5 py-0.5">
                      Deadline passed. CV archive is locked and cannot be removed.
                    </p>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Dropzone upload area */
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`flex-1 flex flex-col justify-center items-center border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                isClosed || isNotStarted
                  ? 'border-border/40 bg-bg-elevated/10 cursor-not-allowed opacity-60'
                  : dragActive
                  ? 'border-accent bg-accent/5 shadow-[inset_0_0_10px_rgba(0,201,120,0.1)]'
                  : 'border-border/80 hover:border-accent bg-transparent hover:bg-bg-elevated/10 cursor-pointer'
              }`}
            >
              {uploading ? (
                <div className="py-6 flex flex-col items-center gap-2">
                  <Spinner />
                  <p className="text-xs text-text-secondary">Uploading ZIP archive...</p>
                </div>
              ) : isClosed ? (
                <div className="py-6 space-y-2">
                  <div className="mx-auto h-12 w-12 rounded-full border border-border bg-bg-elevated flex items-center justify-center text-text-muted">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-text-muted">Submission Window Closed</p>
                  <p className="text-[10px] text-text-muted max-w-[240px]">
                    The timeline for submitting CVs has passed. Your team is locked out of uploads.
                  </p>
                </div>
              ) : isNotStarted ? (
                <div className="py-6 space-y-2">
                  <div className="mx-auto h-12 w-12 rounded-full border border-border bg-bg-elevated flex items-center justify-center text-text-muted animate-pulse">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-text-muted">Upload Window Inactive</p>
                  <p className="text-[10px] text-text-muted max-w-[240px]">
                    ZIP submission has not started yet. Check the timeline countdown.
                  </p>
                </div>
              ) : (
                <label className="w-full h-full flex flex-col justify-center items-center cursor-pointer py-6 space-y-3">
                  <input
                    type="file"
                    className="hidden"
                    accept=".zip"
                    onChange={handleFileInput}
                  />
                  <div className="h-12 w-12 rounded-xl bg-bg-elevated border border-border/80 flex items-center justify-center text-text-secondary transition-colors group-hover:text-accent shadow-panel">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-text-primary">
                      Drag & drop your ZIP file here, or <span className="text-accent underline hover:text-accent-hover">browse</span>
                    </p>
                    <p className="text-[10px] text-text-muted font-mono">
                      Accepts only .zip (Max 20MB)
                    </p>
                  </div>
                </label>
              )}
            </div>
          )}
        </div>

      </div>
      <ConfirmModal
        open={confirmDelete}
        title="Remove CV Archive?"
        message="Are you sure you want to remove your team's CV archive? This will make your team ineligible for project voting."
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </section>
  )
}
