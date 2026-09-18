import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, PencilSimple, IdentificationCard, Phone, MapPin, Calendar, Heart, ShieldCheck, Check, ListChecks, NotePencil, EnvelopeSimple } from "@phosphor-icons/react"
import { toast } from "sonner"
import type { ChronicCondition, Gender, Patient, Diagnosis, Sponsor } from "../types/pharmacy"
import { KENYA_COUNTIES } from "../data/mockData"

const CONDITIONS: ChronicCondition[] = [
  "Hypertension",
  "Type 2 Diabetes",
  "Asthma",
  "COPD",
  "Cardiovascular Disease",
  "Epilepsy",
  "HIV",
  "Hyperlipidemia",
  "Chronic Kidney Disease",
  "Arthritis",
  "Thyroid Disorder",
  "Mental Health",
]

const RELATIONSHIPS = ["Spouse", "Parent", "Child", "Sibling", "Friend", "Other"]

interface FormState {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: Gender
  phone: string
  email: string
  nationalId: string
  county: string
  subCounty: string
  conditions: ChronicCondition[]
  severities: Record<string, Diagnosis["severity"]>
  sponsorName: string
  sponsorPhone: string
  sponsorRelationship: string
  adherenceScore: number
  clinicalNotes: string
  consentDataProcessing: boolean
  consentSmsReminders: boolean
  consentWhatsAppReminders: boolean
}

const inputCls =
  "w-full pl-9 pr-3 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"

function Field({
  label,
  icon,
  children,
  error,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
  error?: string
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wide mb-1.5 block">
        {label}
      </span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">{icon}</span>
        {children}
      </div>
      {error && <span className="text-[11px] text-rose-600 mt-1 block">{error}</span>}
    </label>
  )
}

function fromPatient(p: Patient): FormState {
  const severities: Record<string, Diagnosis["severity"]> = {}
  p.diagnoses.forEach(d => {
    severities[d.condition] = d.severity
  })
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: p.dateOfBirth,
    gender: p.gender,
    phone: p.phone,
    email: p.email ?? "",
    nationalId: p.nationalId,
    county: p.county,
    subCounty: p.subCounty,
    conditions: p.diagnoses.map(d => d.condition),
    severities,
    sponsorName: p.sponsor?.name ?? "",
    sponsorPhone: p.sponsor?.phone ?? "",
    sponsorRelationship: p.sponsor?.relationship ?? "Spouse",
    adherenceScore: p.adherenceScore,
    clinicalNotes: p.clinicalNotes ?? "",
    consentDataProcessing: p.consentDataProcessing,
    consentSmsReminders: p.consentSmsReminders,
    consentWhatsAppReminders: p.consentWhatsAppReminders,
  }
}

interface Props {
  open: boolean
  patient: Patient | null
  onClose: () => void
  onSave: (updated: Patient) => void
}

export function EditPatientModal({ open, patient, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormState | null>(patient ? fromPatient(patient) : null)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [tab, setTab] = useState<"demographics" | "conditions" | "sponsor">("demographics")

  useEffect(() => {
    if (open && patient) {
      setForm(fromPatient(patient))
      setErrors({})
      setTab("demographics")
    }
  }, [open, patient])

  if (!open || !patient || !form) return null

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => (prev ? { ...prev, [key]: value } : prev))

  const toggleCondition = (c: ChronicCondition) =>
    setForm(prev => {
      if (!prev) return prev
      const has = prev.conditions.includes(c)
      const severities = { ...prev.severities }
      if (has) delete severities[c]
      else severities[c] = "Mild"
      return {
        ...prev,
        conditions: has ? prev.conditions.filter(x => x !== c) : [...prev.conditions, c],
        severities,
      }
    })

  const setSeverity = (c: ChronicCondition, s: Diagnosis["severity"]) =>
    setForm(prev => (prev ? { ...prev, severities: { ...prev.severities, [c]: s } } : prev))

  const close = () => {
    setErrors({})
    onClose()
  }

  const handleSubmit = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {}
    if (!form.firstName.trim()) nextErrors.firstName = "First name is required"
    if (!form.lastName.trim()) nextErrors.lastName = "Last name is required"
    if (!form.dateOfBirth) nextErrors.dateOfBirth = "Date of birth is required"
    if (!form.phone.trim()) nextErrors.phone = "Phone number is required"
    else if (!/^\+?[0-9]{9,13}$/.test(form.phone.replace(/[\s-]/g, "")))
      nextErrors.phone = "Enter a valid phone number"
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      nextErrors.email = "Enter a valid email address"
    if (!form.county) nextErrors.county = "Select a county"
    if (!form.nationalId.trim()) nextErrors.nationalId = "National ID is required"
    else if (form.nationalId.trim().length < 6) nextErrors.nationalId = "Enter a valid national ID"
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setTab("demographics")
      toast.error("Please fix the highlighted fields")
      return
    }

    const now = new Date().toISOString()
    const existing = new Map(patient.diagnoses.map(d => [d.condition, d]))
    const diagnoses: Diagnosis[] = form.conditions.map((condition, i) => {
      const prev = existing.get(condition)
      return {
        id: prev?.id ?? `d${Date.now()}-${i}`,
        condition,
        diagnosedOn: prev?.diagnosedOn ?? now.slice(0, 10),
        severity: form.severities[condition] ?? "Mild",
        notes: prev?.notes ?? "Updated during record edit",
      }
    })

    const sponsor: Sponsor | undefined = form.sponsorName.trim()
      ? {
          id: patient.sponsor?.id ?? `s${Date.now()}`,
          name: form.sponsorName.trim(),
          phone: form.sponsorPhone.trim() || "-",
          relationship: form.sponsorRelationship,
          consentGiven: patient.sponsor?.consentGiven ?? true,
          consentDate: patient.sponsor?.consentDate ?? now,
        }
      : undefined

    const updated: Patient = {
      ...patient,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      nationalId: form.nationalId.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      county: form.county,
      subCounty: form.subCounty.trim() || form.county,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      diagnoses,
      sponsor,
      adherenceScore: Math.max(0, Math.min(100, Math.round(form.adherenceScore))),
      clinicalNotes: form.clinicalNotes.trim() || undefined,
      consentDataProcessing: form.consentDataProcessing,
      consentSmsReminders: form.consentSmsReminders,
      consentWhatsAppReminders: form.consentWhatsAppReminders,
      updatedAt: now,
    }

    onSave(updated)
    toast.success("Patient details updated", {
      description: `${updated.firstName} ${updated.lastName}'s record was saved successfully.`,
    })
    onClose()
  }

  const TABS = [
    { id: "demographics", label: "Demographics", icon: IdentificationCard },
    { id: "conditions", label: "Conditions", icon: ListChecks },
    { id: "sponsor", label: "Sponsor & Notes", icon: ShieldCheck },
  ] as const

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-zinc-950/50 backdrop-blur-sm p-4 sm:p-6 flex items-start sm:items-center justify-center overflow-y-auto"
        onClick={close}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ ease: "easeOut", duration: 0.2 }}
          className="w-full max-w-2xl bg-white rounded-2xl border border-zinc-200 shadow-2xl my-4"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
                <PencilSimple size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">Edit Patient Details</h2>
                <p className="text-xs text-zinc-500">
                  {patient.firstName} {patient.lastName} | {patient.nationalId}
                </p>
              </div>
            </div>
            <button
              onClick={close}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-zinc-100 px-6">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-zinc-500 hover:text-zinc-700"
                }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>

          <div className="px-6 py-5 max-h-[calc(100vh-260px)] overflow-y-auto space-y-6">
            {tab === "demographics" && (
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First name" icon={<PencilSimple size={14} />} error={errors.firstName}>
                  <input value={form.firstName} onChange={e => set("firstName", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Last name" icon={<PencilSimple size={14} />} error={errors.lastName}>
                  <input value={form.lastName} onChange={e => set("lastName", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Date of birth" icon={<Calendar size={14} />} error={errors.dateOfBirth}>
                  <input type="date" value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Gender" icon={<Heart size={14} />}>
                  <div className="flex gap-2">
                    {(["Male", "Female", "Other"] as const).map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => set("gender", g)}
                        className={`flex-1 px-2 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                          form.gender === g
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                            : "bg-white border-zinc-200 text-zinc-600 hover:border-emerald-200"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Phone number" icon={<Phone size={14} />} error={errors.phone}>
                  <input value={form.phone} onChange={e => set("phone", e.target.value)} inputMode="tel" className={inputCls} />
                </Field>
                <Field label="Email" icon={<EnvelopeSimple size={14} />} error={errors.email}>
                  <input value={form.email} onChange={e => set("email", e.target.value)} placeholder="optional" className={inputCls} />
                </Field>
                <Field label="National ID" icon={<IdentificationCard size={14} />} error={errors.nationalId}>
                  <input value={form.nationalId} onChange={e => set("nationalId", e.target.value)} inputMode="numeric" className={inputCls} />
                </Field>
                <Field label="County" icon={<MapPin size={14} />} error={errors.county}>
                  <select value={form.county} onChange={e => set("county", e.target.value)} className={`${inputCls} ${!form.county ? "text-zinc-400" : ""}`}>
                    <option value="">Select county...</option>
                    {KENYA_COUNTIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Sub-county" icon={<MapPin size={14} />}>
                  <input value={form.subCounty} onChange={e => set("subCounty", e.target.value)} placeholder="e.g. Westlands" className={inputCls} />
                </Field>
                <Field label="Adherence score (%)" icon={<ShieldCheck size={14} />}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.adherenceScore}
                    onChange={e => set("adherenceScore", Number(e.target.value))}
                    className={inputCls}
                  />
                </Field>
              </section>
            )}

            {tab === "conditions" && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  <ListChecks size={14} className="text-emerald-600" />
                  Chronic Diagnoses
                </div>
                <p className="text-xs text-zinc-500">Toggle conditions and set severity for each active diagnosis.</p>
                <div className="space-y-2">
                  {CONDITIONS.map(c => {
                    const active = form.conditions.includes(c)
                    return (
                      <div
                        key={c}
                        className={`flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl border transition-all ${
                          active ? "bg-emerald-50/50 border-emerald-200" : "bg-white border-zinc-200"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleCondition(c)}
                          className={`flex-1 inline-flex items-center gap-2 text-sm font-medium ${active ? "text-emerald-800" : "text-zinc-600"}`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                              active ? "bg-emerald-600 border-emerald-600" : "bg-white border-zinc-300"
                            }`}
                          >
                            {active && <Check size={12} weight="bold" className="text-white" />}
                          </span>
                          {c}
                        </button>
                        {active && (
                          <div className="flex gap-1.5">
                            {(["Mild", "Moderate", "Severe"] as const).map(s => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setSeverity(c, s)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                                  form.severities[c] === s
                                    ? s === "Severe"
                                      ? "bg-rose-600 border-rose-600 text-white"
                                      : s === "Moderate"
                                        ? "bg-amber-500 border-amber-500 text-white"
                                        : "bg-emerald-600 border-emerald-600 text-white"
                                    : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {tab === "sponsor" && (
              <>
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    Sponsor / Next-of-Kin
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Sponsor name" icon={<PencilSimple size={14} />}>
                      <input value={form.sponsorName} onChange={e => set("sponsorName", e.target.value)} placeholder="e.g. Peter Kamau" className={inputCls} />
                    </Field>
                    <Field label="Sponsor phone" icon={<Phone size={14} />}>
                      <input value={form.sponsorPhone} onChange={e => set("sponsorPhone", e.target.value)} inputMode="tel" className={inputCls} />
                    </Field>
                    <Field label="Relationship" icon={<Heart size={14} />}>
                      <select value={form.sponsorRelationship} onChange={e => set("sponsorRelationship", e.target.value)} className={inputCls}>
                        {RELATIONSHIPS.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    <NotePencil size={14} className="text-emerald-600" />
                    Clinical Notes
                  </div>
                  <textarea
                    value={form.clinicalNotes}
                    onChange={e => set("clinicalNotes", e.target.value)}
                    rows={4}
                    placeholder="Add care notes, adherence interventions, or referral context..."
                    className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors resize-none"
                  />
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    Consent &amp; Communication
                  </div>
                  <div className="space-y-2.5 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
                    {(
                      [
                        ["Data processing consent", "consentDataProcessing"],
                        ["SMS medication reminders", "consentSmsReminders"],
                        ["WhatsApp medication reminders", "consentWhatsAppReminders"],
                      ] as const
                    ).map(([label, key]) => (
                      <button key={key} type="button" onClick={() => set(key, !form[key])} className="w-full flex items-center justify-between py-1">
                        <span className="text-sm text-zinc-700">{label}</span>
                        <span className={`w-9 h-5 rounded-full transition-colors relative ${form[key] ? "bg-emerald-600" : "bg-zinc-300"}`}>
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${form[key] ? "left-[18px]" : "left-0.5"}`} />
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>

          {/* Sticky footer */}
          <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-end gap-2">
            <button onClick={close} className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all"
            >
              <Check size={16} weight="bold" />
              Save Changes
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
