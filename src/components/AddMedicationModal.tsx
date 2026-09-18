import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Pill, NotePencil, Package, Timer, CalendarCheck, ArrowsClockwise, Check, UserPlus, SquaresFour } from "@phosphor-icons/react"
import { toast } from "sonner"
import type { Medication, Patient } from "../types/pharmacy"

interface Props {
  open: boolean
  onClose: () => void
  patients: Patient[]
  defaultPatientId?: string
  onAddMedication: (patientId: string, medication: Medication) => void
}

const FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "Every other day",
  "Once weekly",
  "As needed",
]

const DURATIONS = ["7 days", "14 days", "30 days", "60 days", "90 days", "Ongoing"]

const REFILL_INTERVALS = ["7 days", "14 days", "30 days", "60 days", "90 days"]

interface FormState {
  patientId: string
  name: string
  dosage: string
  prescription: string
  quantityPerFill: number
  frequency: string
  duration: string
  refillIntervalDays: string
  refillsRemaining: number
}

const EMPTY_FORM: FormState = {
  patientId: "",
  name: "",
  dosage: "",
  prescription: "",
  quantityPerFill: 30,
  frequency: "Once daily",
  duration: "30 days",
  refillIntervalDays: "30 days",
  refillsRemaining: 3,
}

const TEST_MED_PRESET: FormState = {
  patientId: "",
  name: "TEST-MED",
  dosage: "500mg",
  prescription: "Take one tablet by mouth once daily with food.",
  quantityPerFill: 30,
  frequency: "Once daily",
  duration: "30 days",
  refillIntervalDays: "30 days",
  refillsRemaining: 3,
}

const inputCls =
  "w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors"

function StepSection({
  step,
  title,
  icon,
  children,
}: {
  step: number
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5">
        <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {step}
        </span>
        <span className="text-emerald-600">{icon}</span>
        <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="pl-[34px]">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1 block">{label}</span>
      {children}
    </label>
  )
}

export function AddMedicationModal({ open, onClose, patients, defaultPatientId, onAddMedication }: Props) {
  const [form, setForm] = useState<FormState>(() => ({ ...EMPTY_FORM, patientId: defaultPatientId ?? "" }))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const close = () => {
    setErrors({})
    setForm(EMPTY_FORM)
    onClose()
  }

  const prefillTestMed = () => {
    setForm(prev => ({ ...TEST_MED_PRESET, patientId: prev.patientId }))
    setErrors({})
    toast.info("TEST-MED template loaded", { description: "Once daily, 30 quantity, 30 days duration, 30 days refill." })
  }

  const handleSubmit = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {}
    if (!form.patientId) nextErrors.patientId = "Select a patient"
    if (!form.name.trim()) nextErrors.name = "Medication name is required"
    if (!form.dosage.trim()) nextErrors.dosage = "Dosage is required"
    if (form.quantityPerFill < 1) nextErrors.quantityPerFill = "Quantity must be at least 1"
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields")
      return
    }

    const refillDays = parseInt(form.refillIntervalDays) || 30
    const now = new Date()
    const endDate = new Date(now.getTime() + refillDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const medication: Medication = {
      id: `m${Date.now()}`,
      name: form.name.trim(),
      genericName: form.name.trim(),
      dosage: form.dosage.trim(),
      frequency: form.frequency,
      dailyDose: form.frequency.includes("Twice") ? 2 : form.frequency.includes("Three") ? 3 : 1,
      quantityPerFill: form.quantityPerFill,
      startDate: now.toISOString().slice(0, 10),
      endDate,
      active: true,
      refillsRemaining: form.refillsRemaining,
      prescription: form.prescription.trim(),
      duration: form.duration,
      refillIntervalDays: refillDays,
    }

    onAddMedication(form.patientId, medication)
    toast.success("Prescription created", {
      description: `${medication.name} ${medication.dosage} added to the queue with a ${form.refillIntervalDays} refill schedule.`,
    })
    close()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-zinc-950/50 backdrop-blur-sm p-4 sm:p-6 flex items-start sm:items-center justify-center overflow-y-auto"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ ease: "easeOut", duration: 0.2 }}
            className="w-full max-w-xl bg-white rounded-2xl border border-zinc-200 shadow-2xl my-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
                  <Pill size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900">New Prescription</h2>
                  <p className="text-xs text-zinc-500">Medication to Refill schedule in 6 steps</p>
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
              {/* Patient select */}
              <Field label="Patient">
                <select
                  value={form.patientId}
                  onChange={e => set("patientId", e.target.value)}
                  className={`${inputCls} ${!form.patientId ? "text-zinc-400" : ""}`}
                >
                  <option value="">Select patient...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.phone})
                    </option>
                  ))}
                </select>
                {errors.patientId && <span className="text-[11px] text-rose-600 mt-1 block">{errors.patientId}</span>}
              </Field>

              {/* Step 1: Medication */}
              <StepSection step={1} title="Medication" icon={<Pill size={14} />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Medication name">
                    <input
                      value={form.name}
                      onChange={e => set("name", e.target.value)}
                      placeholder="e.g. Metformin"
                      className={inputCls}
                    />
                    {errors.name && <span className="text-[11px] text-rose-600 mt-1 block">{errors.name}</span>}
                  </Field>
                  <Field label="Dosage">
                    <input
                      value={form.dosage}
                      onChange={e => set("dosage", e.target.value)}
                      placeholder="e.g. 500mg"
                      className={inputCls}
                    />
                    {errors.dosage && <span className="text-[11px] text-rose-600 mt-1 block">{errors.dosage}</span>}
                  </Field>
                </div>
              </StepSection>

              {/* Step 2: Prescription */}
              <StepSection step={2} title="Prescription Instructions" icon={<NotePencil size={14} />}>
                <textarea
                  value={form.prescription}
                  onChange={e => set("prescription", e.target.value)}
                  placeholder="e.g. Take one tablet by mouth once daily with food."
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </StepSection>

              {/* Step 3: Quantity */}
              <StepSection step={3} title="Quantity per Fill" icon={<Package size={14} />}>
                <input
                  type="number"
                  min={1}
                  value={form.quantityPerFill}
                  onChange={e => set("quantityPerFill", parseInt(e.target.value) || 0)}
                  className={inputCls}
                />
                {errors.quantityPerFill && (
                  <span className="text-[11px] text-rose-600 mt-1 block">{errors.quantityPerFill}</span>
                )}
              </StepSection>

              {/* Step 4: Frequency */}
              <StepSection step={4} title="Frequency" icon={<Timer size={14} />}>
                <div className="flex flex-wrap gap-2">
                  {FREQUENCIES.map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => set("frequency", f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        form.frequency === f
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-white border-zinc-200 text-zinc-600 hover:border-emerald-300"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </StepSection>

              {/* Step 5: Duration */}
              <StepSection step={5} title="Duration" icon={<CalendarCheck size={14} />}>
                <div className="flex flex-wrap gap-2">
                  {DURATIONS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => set("duration", d)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        form.duration === d
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-white border-zinc-200 text-zinc-600 hover:border-emerald-300"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </StepSection>

              {/* Step 6: Refill */}
              <StepSection step={6} title="Refill Schedule" icon={<ArrowsClockwise size={14} />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Refill interval">
                    <select
                      value={form.refillIntervalDays}
                      onChange={e => set("refillIntervalDays", e.target.value)}
                      className={inputCls}
                    >
                      {REFILL_INTERVALS.map(r => (
                        <option key={r} value={r}>
                          Every {r}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Refills remaining">
                    <input
                      type="number"
                      min={0}
                      value={form.refillsRemaining}
                      onChange={e => set("refillsRemaining", parseInt(e.target.value) || 0)}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </StepSection>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between gap-3">
              <button
                onClick={prefillTestMed}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors"
              >
                <SquaresFour size={13} />
                Load TEST-MED template
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
                  <Check size={16} weight="bold" />
                  <UserPlus size={16} className="hidden" />
                  Create Prescription
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}