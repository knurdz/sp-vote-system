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

  const processFile = useCallback(async (file: File) => {
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
  }, [team.id, team.cv_url, onUpdate])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (isClosed || isNotStarted) return

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void processFile(e.dataTransfer.files[0])
    }
  }, [isClosed, isNotStarted, processFile])

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
      <div className="rounded-3xl border border-border bg-white dark:bg-[#14120B] p-12 flex justify-center items-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Redesigned Header: Premium Glassmorphic Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-white/70 dark:bg-[#14120B]/80 p-6 sm:p-8 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="absolute top-0 right-0 h-40 w-40 bg-accent/5 rounded-full blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-display font-extrabold tracking-wider bg-accent/10 border border-accent/20 text-accent uppercase">
              Leader Workspace
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight uppercase">
              Team Workspace: {team.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Leader Account: <span className="font-medium text-text-primary">{team.leader_email}</span></span>
            </div>
          </div>

          {/* Timeline Status Display */}
          {settings && (
            <div className="flex items-center gap-4 bg-bg-base/40 dark:bg-bg-base/20 border border-border/40 rounded-2xl p-4 shrink-0 shadow-sm">
              <span className={`inline-flex items-center rounded-xl px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-wider border ${
                isClosed 
                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                  : isNotStarted 
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                  : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              }`}>
                {isClosed ? 'Closed' : isNotStarted ? 'Upcoming' : 'Active'}
              </span>
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
                  Submission Window
                </p>
                <p className="text-xs font-semibold text-text-primary">
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
      </div>

      {settingsError && <Alert message={`Failed to load timeline settings: ${settingsError}`} />}
      {error && <Alert message={error} />}
      {success && (
        <div className="rounded-2xl border border-blue-500/25 bg-blue-500/5 p-4 text-xs font-semibold text-blue-500 flex items-center gap-2">
          <svg className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* Main content split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Hand Column (Dropzone & interactive) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-border bg-white dark:bg-[#14120B] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-base font-bold text-text-primary uppercase tracking-wide">
                CV Submission Archive
              </h2>
              <p className="text-xs text-text-secondary">
                Upload and manage your team's compiled CV folder.
              </p>
            </div>

            {team.cv_url ? (
              /* Premium Verified File Card */
              <div className="relative overflow-hidden border border-blue-500/20 bg-blue-500/5 rounded-2xl p-6 text-center space-y-4">
                {deleting ? (
                  <div className="py-8 flex flex-col items-center gap-3">
                    <Spinner />
                    <p className="text-xs text-text-secondary font-semibold">Deleting archive from storage...</p>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent shadow-[0_0_12px_var(--accent-glow)]">
                      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
                        <path d="M5 22h14a2 2 0 002-2V7.5L16.5 3H5a2 2 0 00-2 2v15a2 2 0 002 2z" />
                        <path d="M16 3v5h5M12 11v6m0 0l-3-3m3 3l3-3m-6 5h6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>

                    <div className="space-y-1">
                      <p className="font-display font-bold text-text-primary text-sm max-w-md mx-auto truncate px-4">
                        {getFileName()}
                      </p>
                      <p className="inline-flex items-center gap-1 text-[10px] font-display font-extrabold text-accent uppercase tracking-wider bg-accent/10 border border-accent/25 px-2.5 py-1 rounded-full">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Archive Uploaded & Active
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5 justify-center pt-2">
                      <Button onClick={handleDownload} variant="secondary" className="flex items-center gap-1.5 text-xs font-semibold px-4 h-9 cursor-pointer">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 15V3m0 12l-4-4m4 4l4-4M4 17v4h16" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Download ZIP</span>
                      </Button>

                      {!isClosed && (
                        <Button onClick={() => setConfirmDelete(true)} variant="danger" className="flex items-center gap-1.5 text-xs font-semibold px-4 h-9 cursor-pointer">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span>Remove</span>
                        </Button>
                      )}
                    </div>

                    {isClosed && (
                      <p className="text-[10px] text-text-muted bg-bg-base/30 border border-border/40 rounded px-2.5 py-1 max-w-sm mx-auto">
                        Timeline closed. CV submission is locked and cannot be edited.
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* Dropzone Upload Area */
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`flex flex-col justify-center items-center border border-dashed rounded-2xl p-8 text-center transition-all min-h-[220px] ${
                  isClosed || isNotStarted
                    ? 'border-border/40 bg-bg-base/20 cursor-not-allowed opacity-65'
                    : dragActive
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent bg-transparent hover:bg-bg-base/40 cursor-pointer shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]'
                }`}
              >
                {uploading ? (
                  <div className="py-6 flex flex-col items-center gap-3">
                    <Spinner />
                    <p className="text-xs text-text-secondary font-semibold">Uploading ZIP archive...</p>
                  </div>
                ) : isClosed ? (
                  <div className="space-y-3 flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 dark:text-rose-400">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    </div>
                    <div className="space-y-1 text-center">
                      <p className="text-xs font-bold text-text-primary uppercase tracking-wider">Submission Window Closed</p>
                      <p className="text-xs text-text-secondary max-w-[280px] leading-relaxed">
                        The deadline for submitting CVs has passed. Your team is locked out of uploads.
                      </p>
                    </div>
                  </div>
                ) : isNotStarted ? (
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full border border-border bg-bg-base flex items-center justify-center text-text-muted animate-pulse">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Upload Window Inactive</p>
                    <p className="text-xs text-text-muted max-w-[280px] leading-relaxed">
                      ZIP submission has not started yet. Refer to the timeline indicators.
                    </p>
                  </div>
                ) : (
                  <label className="w-full flex flex-col justify-center items-center cursor-pointer py-4 space-y-3">
                    <input
                      type="file"
                      className="hidden"
                      accept=".zip"
                      onChange={handleFileInput}
                    />
                    <div className="h-12 w-12 rounded-xl bg-bg-base border border-border flex items-center justify-center text-text-secondary transition-colors shadow-panel">
                      <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-text-primary">
                        Drag & drop your ZIP archive, or <span className="text-accent underline hover:text-accent-hover font-bold">browse</span>
                      </p>
                      <p className="text-[10px] text-text-muted">
                        ZIP format files only (Max 20MB)
                      </p>
                    </div>
                  </label>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Hand Column (Rules / Info & Eligibility) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Rules & Requirements Card */}
          <div className="rounded-3xl border border-border bg-white dark:bg-[#14120B] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-5">
            <h3 className="font-display text-sm font-bold text-text-primary uppercase tracking-wider border-b border-border/40 pb-3">
              Submission Guidelines
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-[10px] font-bold text-accent shrink-0">
                  1
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Compile all group member CVs into a <span className="font-bold text-text-primary">single ZIP archive</span>.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-[10px] font-bold text-accent shrink-0">
                  2
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Ensure the overall archive file size stays below <span className="font-bold text-text-primary">20MB</span>.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-[10px] font-bold text-accent shrink-0">
                  3
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Submission modifications are only allowed while the timeline window is <span className="font-bold text-text-primary">active</span>.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-[10px] font-bold text-rose-500 shrink-0">
                  !
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  <span className="font-bold text-text-primary">CV Required projects:</span> Teams missing CV archives cannot vote on projects marked CV Required.
                </p>
              </div>
            </div>
          </div>

          {/* Voting Eligibility status panel */}
          <div className="rounded-3xl border border-border bg-white dark:bg-[#14120B] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
            <h3 className="font-display text-sm font-bold text-text-primary uppercase tracking-wider border-b border-border/40 pb-3">
              Voting Status
            </h3>

            {isClosed ? (
              team.cv_url ? (
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3">
                    <svg className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Eligible & Ready</p>
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        Your CV folder has been successfully uploaded and locked in. Your team can vote on CV Required projects.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-start gap-3">
                    <svg className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">CV Required Locked</p>
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        No archive was uploaded prior to the deadline. Your team can still vote on regular projects.
                      </p>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="rounded-xl border border-border bg-bg-base/40 dark:bg-bg-base/20 p-4 flex items-start gap-3">
                <svg className="h-5 w-5 text-text-muted shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Awaiting Final Lock</p>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    Eligibility status will be finalized and locked as soon as the submission timeline window finishes.
                  </p>
                </div>
              </div>
            )}
          </div>
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
    </div>
  )
}
