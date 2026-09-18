import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, UserPlus, IdentificationCard, Phone, MapPin, Calendar, Heart, ShieldCheck, Check, ListChecks } from "@phosphor-icons/react"
import { toast } from "sonner"
import type { ChronicCondition, Gender, Patient, Sponsor } from "../types/pharmacy"
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
  nationalId: string
  county: string
  subCounty: string
  conditions: ChronicCondition[]
  sponsorName: string
  sponsorPhone: string
  sponsorRelationship: string
  consentDataProcessing: boolean
  consentSmsReminders: boolean
  consentWhatsAppReminders: boolean
}

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "Female",
  phone: "",
  nationalId: "",
  county: "",
  subCounty: "",
  conditions: [],
  sponsorName: "",
  sponsorPhone: "",
  sponsorRelationship: "Spouse",
  consentDataProcessing: true,
  consentSmsReminders: true,
  consentWhatsAppReminders: false,
}

export const TEST_PATIENT_PRESET: FormState = {
  ...EMPTY_FORM,
  firstName: "Test",
  lastName: "Patient",
  dateOfBirth: "1980-01-01",
  gender: "Male",
  phone: "0700000000",
  nationalId: "00000000",
  county: "Nairobi",
  subCounty: "Central",
  sponsorName: "Test Sponsor",
  sponsorPhone: "0700000001",
  sponsorRelationship: "Other",
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

interface AddPatientModalProps {
  open: boolean
  onClose: () => void
  onAddPatient: (patient: Patient) => void
}

export function AddPatientModal({ open, onClose, onAddPatient }: AddPatientModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const toggleCondition = (c: ChronicCondition) =>
    setForm(prev => ({
      ...prev,
      conditions: prev.conditions.includes(c)
        ? prev.conditions.filter(x => x !== c)
        : [...prev.conditions, c],
    }))

  const close = () => {
    setErrors({})
    onClose()
  }

  const prefillTestPatient = () => {
    setForm(TEST_PATIENT_PRESET)
    setErrors({})
    toast.info("Test patient details pre-filled", { description: "Review and click Add Patient to save." })
  }

  const resetAndClose = () => {
    setForm(EMPTY_FORM)
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
    if (!form.county) nextErrors.county = "Select a county"
    if (!form.nationalId.trim()) nextErrors.nationalId = "National ID is required"
    else if (form.nationalId.trim().length < 6) nextErrors.nationalId = "Enter a valid national ID"
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields")
      return
    }

    const now = new Date().toISOString()
    const id = `p${Date.now()}`
    const sponsor: Sponsor | undefined = form.sponsorName.trim()
      ? {
          id: `s${Date.now()}`,
          name: form.sponsorName.trim(),
          phone: form.sponsorPhone.trim() || "-",
          relationship: form.sponsorRelationship,
          consentGiven: true,
          consentDate: now,
        }
      : undefined

    const patient: Patient = {
      id,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      nationalId: form.nationalId.trim(),
      phone: form.phone.trim(),
      county: form.county,
      subCounty: form.subCounty.trim() || form.county,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      diagnoses: form.conditions.map((condition, i) => ({
        id: `d${Date.now()}-${i}`,
        condition,
        diagnosedOn: now.slice(0, 10),
        severity: "Mild" as const,
        notes: "Initial diagnosis on registration",
      })),
      medications: [],
      vitals: [],
      sponsor,
      adherenceScore: 100,
      lastVisit: now.slice(0, 10),
      registeredAt: now,
      consentDataProcessing: form.consentDataProcessing,
      consentSmsReminders: form.consentSmsReminders,
      consentWhatsAppReminders: form.consentWhatsAppReminders,
    }

    onAddPatient(patient)
    toast.success("Patient added successfully", {
      description: `${patient.firstName} ${patient.lastName} is now in the register and searchable.`,
    })
    resetAndClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-sm p-4 sm:p-6 flex items-start sm:items-center justify-center overflow-y-auto"
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
                  <UserPlus size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900">Add New Patient</h2>
                  <p className="text-xs text-zinc-500">Register a patient in the chronic care hub</p>
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

            <div className="px-6 py-5 max-h-[calc(100vh-220px)] overflow-y-auto space-y-6">
              {/* Personal details */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  <IdentificationCard size={14} className="text-emerald-600" />
                  Personal Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="First name" icon={<UserPlus size={14} />} error={errors.firstName}>
                    <input
                      value={form.firstName}
                      onChange={e => set("firstName", e.target.value)}
                      placeholder="e.g. Wanjiku"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Last name" icon={<UserPlus size={14} />} error={errors.lastName}>
                    <input
                      value={form.lastName}
                      onChange={e => set("lastName", e.target.value)}
                      placeholder="e.g. Kamau"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Date of birth" icon={<Calendar size={14} />} error={errors.dateOfBirth}>
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={e => set("dateOfBirth", e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Gender" icon={<Heart size={14} />}>
                    <div className="flex gap-2">
                      {(["Male", "Female", "Other"] as const).map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => set("gender", g)}
                          className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
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
                    <input
                      value={form.phone}
                      onChange={e => set("phone", e.target.value)}
                      placeholder="e.g. 0700000000"
                      inputMode="tel"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="National ID" icon={<IdentificationCard size={14} />} error={errors.nationalId}>
                    <input
                      value={form.nationalId}
                      onChange={e => set("nationalId", e.target.value)}
                      placeholder="e.g. 28475619"
                      inputMode="numeric"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="County" icon={<MapPin size={14} />} error={errors.county}>
                    <select
                      value={form.county}
                      onChange={e => set("county", e.target.value)}
                      className={`${inputCls} ${!form.county ? "text-zinc-400" : ""}`}
                    >
                      <option value="">Select county...</option>
                      {KENYA_COUNTIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Sub-county" icon={<MapPin size={14} />}>
                    <input
                      value={form.subCounty}
                      onChange={e => set("subCounty", e.target.value)}
                      placeholder="e.g. Westlands"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </section>

              {/* Chronic conditions */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  <ListChecks size={14} className="text-emerald-600" />
                  Chronic Conditions
                </div>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map(c => {
                    const active = form.conditions.includes(c)
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCondition(c)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          active
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "bg-white border-zinc-200 text-zinc-600 hover:border-emerald-300"
                        }`}
                      >
                        {active && <Check size={12} weight="bold" />}
                        {c}
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Sponsor */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  Sponsor Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Sponsor name" icon={<UserPlus size={14} />}>
                    <input
                      value={form.sponsorName}
                      onChange={e => set("sponsorName", e.target.value)}
                      placeholder="e.g. Peter Kamau"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Sponsor phone" icon={<Phone size={14} />}>
                    <input
                      value={form.sponsorPhone}
                      onChange={e => set("sponsorPhone", e.target.value)}
                      placeholder="e.g. 0700000001"
                      inputMode="tel"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Relationship" icon={<Heart size={14} />}>
                    <select
                      value={form.sponsorRelationship}
                      onChange={e => set("sponsorRelationship", e.target.value)}
                      className={`${inputCls} ${!form.sponsorRelationship ? "text-zinc-400" : ""}`}
                    >
                      {RELATIONSHIPS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </section>

              {/* Consent */}
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
                    <button
                      key={key}
                      type="button"
                      onClick={() => set(key, !form[key])}
                      className="w-full flex items-center justify-between py-1"
                    >
                      <span className="text-sm text-zinc-700">{label}</span>
                      <span
                        className={`w-9 h-5 rounded-full transition-colors relative ${
                          form[key] ? "bg-emerald-600" : "bg-zinc-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                            form[key] ? "left-[18px]" : "left-0.5"
                          }`}
                        />
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between gap-3">
              <button
                onClick={prefillTestPatient}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors"
              >
                Pre-fill test patient
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={close}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all"
                >
                  <UserPlus size={16} />
                  Add Patient
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}