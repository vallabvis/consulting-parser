'use client'

import { useState } from 'react'
import type { RoleType } from '@/lib/types'

const ROLE_TYPES: { value: RoleType; label: string }[] = [
  { value: 'summer_internship', label: 'Summer Internship' },
  { value: 'sophomore_program', label: 'Sophomore Program' },
  { value: 'freshman_program',  label: 'Freshman Program'  },
  { value: 'diversity_program', label: 'Diversity Program' },
  { value: 'full_time',         label: 'Full-Time'         },
  { value: 'case_competition',  label: 'Case Competition'  },
  { value: 'networking_event',  label: 'Networking Event'  },
]

const GRAD_YEARS = [2026, 2027, 2028, 2029]

interface Props {
  firms: { id: string; name: string }[]
  userEmail: string
}

export default function SubmitOpportunityForm({ firms, userEmail }: Props) {
  const [firmName,        setFirmName]        = useState('')
  const [title,           setTitle]           = useState('')
  const [roleType,        setRoleType]        = useState<RoleType>('summer_internship')
  const [gradYears,       setGradYears]       = useState<number[]>([])
  const [location,        setLocation]        = useState('')
  const [applicationUrl,  setApplicationUrl]  = useState('')
  const [deadline,        setDeadline]        = useState('')
  const [description,     setDescription]     = useState('')
  const [howToApply,      setHowToApply]      = useState('')
  const [submitting,      setSubmitting]      = useState(false)
  const [success,         setSuccess]         = useState(false)
  const [error,           setError]           = useState('')

  function toggleYear(y: number) {
    setGradYears((prev) => prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firmName.trim() || !title.trim() || !applicationUrl.trim()) {
      setError('Firm name, role title, and application URL are required.')
      return
    }
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firm_name:            firmName.trim(),
          title:                title.trim(),
          role_type:            roleType,
          grad_years:           gradYears,
          location:             location.trim() || null,
          application_url:      applicationUrl.trim(),
          application_deadline: deadline || null,
          description:          description.trim() || null,
          how_to_apply:         howToApply.trim() || null,
          submitted_by_email:   userEmail,
        }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError((json as { error?: string }).error ?? 'Submission failed. Please try again.')
        setSubmitting(false)
        return
      }

      setSuccess(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    }

    setSubmitting(false)
  }

  if (success) {
    return (
      <div className="border rounded-lg p-10 text-center">
        <p className="text-lg font-semibold">Submitted — thanks!</p>
        <p className="text-sm text-muted-foreground mt-2">
          Officers will review and publish it within 24 hours.
        </p>
        <button
          onClick={() => {
            setSuccess(false)
            setFirmName('')
            setTitle('')
            setRoleType('summer_internship')
            setGradYears([])
            setLocation('')
            setApplicationUrl('')
            setDeadline('')
            setDescription('')
            setHowToApply('')
          }}
          className="mt-6 text-sm text-primary hover:underline"
        >
          Submit another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Firm name with datalist autocomplete */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          Firm <span className="text-destructive">*</span>
        </label>
        <input
          list="firms-list"
          value={firmName}
          onChange={(e) => setFirmName(e.target.value)}
          placeholder="McKinsey & Company"
          className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
        <datalist id="firms-list">
          {firms.map((f) => <option key={f.id} value={f.name} />)}
        </datalist>
      </div>

      {/* Role title */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          Role Title <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Business Analyst Intern 2026"
          className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>

      {/* Role type */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          Role Type <span className="text-destructive">*</span>
        </label>
        <select
          value={roleType}
          onChange={(e) => setRoleType(e.target.value as RoleType)}
          className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {ROLE_TYPES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Grad years */}
      <div>
        <label className="block text-sm font-medium mb-2">Target Grad Years</label>
        <div className="flex gap-5">
          {GRAD_YEARS.map((y) => (
            <label key={y} className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={gradYears.includes(y)}
                onChange={() => toggleYear(y)}
                className="accent-primary"
              />
              &apos;{String(y).slice(2)}
            </label>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Chicago, IL / Multiple Offices"
          className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Application URL */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          Application URL <span className="text-destructive">*</span>
        </label>
        <input
          type="url"
          value={applicationUrl}
          onChange={(e) => setApplicationUrl(e.target.value)}
          placeholder="https://careers.mckinsey.com/..."
          className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>

      {/* Deadline */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Application Deadline</label>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Brief description of the opportunity (1-3 sentences)..."
          className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {/* How to apply */}
      <div>
        <label className="block text-sm font-medium mb-1.5">How to Apply / Notes</label>
        <textarea
          value={howToApply}
          onChange={(e) => setHowToApply(e.target.value)}
          rows={3}
          placeholder="Step-by-step instructions, tips from networking, etc..."
          className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#8B1A1A] text-white py-2.5 rounded-md font-semibold text-sm hover:bg-[#6e1515] transition-colors disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Submit Opportunity'}
      </button>
    </form>
  )
}
