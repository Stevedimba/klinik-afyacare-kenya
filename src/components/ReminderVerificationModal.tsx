import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Flask, X, CheckCircle, ArrowUp, PaperPlaneTilt, Bell, WarningCircle, Play } from "@phosphor-icons/react"
import { toast } from "sonner"
import type { Patient, Medication, DispatchResult, RecipientType } from "../types/pharmacy"
import {
  generateReminderPayload,
  formatPayload,
  dispatchToPatient,
  dispatchToSponsor,
  dispatchToPharmacist,
} from "../lib/reminderEngine"

interface Props {
  open: boolean
  onClose: () => void
  patients: Patient[]
  onDispatchComplete: (results: DispatchResult[], patientId: string) => void
}

type Step = "configure" | "patient" | "sponsor" | "pharmacist" | "complete"

const STEP_ORDER: Step[] = ["configure", "patient", "sponsor", "pharmacist", "complete"]

export function ReminderVerificationModal({ open, onClose, patients, onDispatchComplete }: Props) {
  const [step, setStep] = useState<Step>("configure")
  const [selectedPatientId, setSelectedPatientId] = useState("p-test")
  const [medName, setMedName] = useState("TEST-MED")
  const [daysRemaining, setDaysRemaining] = useState(5)
  const [results, setResults] = useState<DispatchResult[]>([])
  const [dispatching, setDispatching] = useState(false)

  const patient = patients.find(p => p.id === selectedPatientId) || patients[0]
  const patientName = patient ? `${patient.firstName} ${patient.lastName}` : "Test Patient"

  const previewPayload = generateReminderPayload({
    patientName,
    medicationName: medName,
    daysRemaining,
    action: "Contact patient",
  })
  const previewFormatted = formatPayload(previewPayload)

  const executeStep = useCallback((targetStep: Step) => {
    if (!patient) return
    setDispatching(true)
    const med: Medication = {
      id: "test-med",
      name: medName,
      genericName: medName,
      dosage: "1 tablet",
      frequency: "Once daily",
      dailyDose: 1,
      quantityPerFill: 30,
      startDate: new Date().toISOString().slice(0, 10),
      active: true,
      refillsRemaining: 3,
    }

    setTimeout(() => {
      let result: DispatchResult | null = null
      if (targetStep === "patient") {
        result = dispatchToPatient(patient, med, daysRemaining)
      } else if (targetStep === "sponsor") {
        result = dispatchToSponsor(patient, med, daysRemaining)
        if (!result) {
          toast.warning("No sponsor registered for this patient, or consent not given.")
          setDispatching(false)
          setStep("pharmacist")
          return
        }
      } else if (targetStep === "pharmacist") {
        result = dispatchToPharmacist(patient, med, daysRemaining)
      }
      if (result) {
        setResults(prev => [...prev, result!])
        toast.success(`Dispatched to ${result.recipientType}: ${result.recipientName}`, {
          description: result.formattedMessage.substring(0, 80),
        })
      }
      setDispatching(false)
      const idx = STEP_ORDER.indexOf(targetStep)
      if (idx < STEP_ORDER.length - 1) {
        setStep(STEP_ORDER[idx + 1])
      }
    }, 800)
  }, [patient, medName, daysRemaining])

  const handleComplete = () => {
    if (patient) {
      onDispatchComplete(results, patient.id)
    }
    toast.success("Reminder pipeline verification complete!", {
      description: `${results.length} notifications dispatched and logged.`,
    })
  }

  const handleReset = () => {
    setStep("configure")
    setResults([])
    setDispatching(false)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-zinc-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Flask size={18} className="text-emerald-700" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-900">Reminder Engine Verification Lab</h2>
                <p className="text-xs text-zinc-500">Test multi-recipient dispatch pipeline end-to-end</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-zinc-100 rounded-lg">
              <X size={16} className="text-zinc-500" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 pt-4">
            <div className="flex items-center gap-1">
              {STEP_ORDER.map((s, i) => {
                const activeIdx = STEP_ORDER.indexOf(step)
                const isDone = i < activeIdx
                const isCurrent = i === activeIdx
                return (
                  <div key={s} className="flex items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone ? "bg-emerald-500 text-white" :
                      isCurrent ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300" :
                      "bg-zinc-100 text-zinc-400"
                    }`}>
                      {isDone ? <CheckCircle size={14} /> : i + 1}
                    </div>
                    {i < STEP_ORDER.length - 1 && (
                      <div className={`w-8 h-0.5 ${isDone ? "bg-emerald-400" : "bg-zinc-200"}`} />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-zinc-500 uppercase font-medium">
              <span>Configure</span>
              <span>Patient</span>
              <span>Sponsor</span>
              <span>Pharmacist</span>
              <span>Done</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {step === "configure" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Test Patient</label>
                    <select
                      value={selectedPatientId}
                      onChange={e => setSelectedPatientId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                    >
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Medication Name</label>
                    <input
                      type="text"
                      value={medName}
                      onChange={e => setMedName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600 mb-1.5 block">Days Until Refill (negative = overdue)</label>
                  <input
                    type="number"
                    value={daysRemaining}
                    onChange={e => setDaysRemaining(Number(e.target.value))}
                    className="w-32 px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                  />
                </div>

                {/* Live Payload Preview */}
                <div className="bg-zinc-900 rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-2 font-medium">Live Payload Preview</p>
                  <pre className="text-sm text-emerald-300 font-mono whitespace-pre-wrap leading-relaxed">{previewFormatted}</pre>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <WarningCircle size={14} className="text-amber-500" />
                  <span>This will simulate dispatch to all 3 recipients: Patient, Sponsor, Pharmacist.</span>
                </div>

                <button
                  onClick={() => { setStep("patient"); setResults([]) }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all"
                >
                  <Play size={16} weight="fill" />
                  Start Verification Pipeline
                </button>
              </motion.div>
            )}

            {(step === "patient" || step === "sponsor" || step === "pharmacist") && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <StepCard
                  step={step}
                  patient={patient}
                  medName={medName}
                  daysRemaining={daysRemaining}
                  dispatching={dispatching}
                  onDispatch={() => executeStep(step)}
                />

                {/* Results Log */}
                {results.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Dispatch Log</p>
                    {results.map((r, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-zinc-50 border border-zinc-200 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <RecipientBadge type={r.recipientType} />
                          <span className="text-xs font-medium text-zinc-700">{r.recipientName}</span>
                          <span className="text-[10px] text-zinc-400 ml-auto">{r.channel}</span>
                        </div>
                        <pre className="text-xs text-zinc-600 font-mono whitespace-pre-wrap">{r.formattedMessage}</pre>
                        <div className="flex items-center gap-2 mt-2">
                          <CheckCircle size={12} className="text-emerald-500" />
                          <span className="text-[10px] text-emerald-600 font-medium">Delivered</span>
                          <span className="text-[10px] text-zinc-400 ml-auto">
                            {new Date(r.deliveredAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === "complete" && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <CheckCircle size={32} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Pipeline Verified</h3>
                  <p className="text-sm text-zinc-500 mt-1">
                    All {results.length} notifications dispatched successfully across Patient, Sponsor, and Pharmacist channels.
                  </p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-4 text-left space-y-2">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      <span className="text-zinc-700">
                        <strong className="capitalize">{r.recipientType}</strong>: {r.recipientName} via {r.channel}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    Run Again
                  </button>
                  <button
                    onClick={handleComplete}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    Log to Communication Records
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function StepCard({ step, patient, medName, daysRemaining, dispatching, onDispatch }: {
  step: RecipientType
  patient?: Patient
  medName: string
  daysRemaining: number
  dispatching: boolean
  onDispatch: () => void
}) {
  const configs: Record<RecipientType, { title: string; desc: string; icon: typeof Bell; color: string; bg: string }> = {
    patient: {
      title: "Step 1: Patient Dispatch",
      desc: `Simulated ${patient?.consentWhatsAppReminders ? "WhatsApp" : "SMS"} to patient phone`,
      icon: PaperPlaneTilt,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-200",
    },
    sponsor: {
      title: "Step 2: Sponsor Escalation",
      desc: `Care alert SMS to sponsor${patient?.sponsor ? ` (${patient.sponsor.name})` : ""}`,
      icon: ArrowUp,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-200",
    },
    pharmacist: {
      title: "Step 3: Pharmacist Clinical Alert",
      desc: "In-app push notification into pharmacist task queue",
      icon: Bell,
      color: "text-purple-600",
      bg: "bg-purple-50 border-purple-200",
    },
  }
  const cfg = configs[step]
  const Icon = cfg.icon

  const patientName = patient ? `${patient.firstName} ${patient.lastName}` : "Test Patient"
  const payload = generateReminderPayload({ patientName, medicationName: medName, daysRemaining, action: "Contact patient" })
  const formatted = formatPayload(payload)

  return (
    <div className={`border rounded-xl p-4 ${cfg.bg}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <Icon size={18} className={cfg.color} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-zinc-900">{cfg.title}</h4>
          <p className="text-xs text-zinc-600">{cfg.desc}</p>
        </div>
      </div>
      <div className="bg-white/80 rounded-lg p-3 mb-3 border border-white">
        <pre className="text-xs text-zinc-700 font-mono whitespace-pre-wrap">{formatted}</pre>
      </div>
      <button
        onClick={onDispatch}
        disabled={dispatching}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-wait transition-all active:scale-[0.98]"
      >
        {dispatching ? (
          <>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <PaperPlaneTilt size={14} />
            </motion.div>
            Dispatching...
          </>
        ) : (
          <>
            <PaperPlaneTilt size={14} />
            Fire {step === "patient" ? "SMS/WhatsApp" : step === "sponsor" ? "Sponsor Alert" : "Pharmacist Alert"}
          </>
        )}
      </button>
    </div>
  )
}

function RecipientBadge({ type }: { type: RecipientType }) {
  const styles: Record<RecipientType, string> = {
    patient: "bg-blue-100 text-blue-700",
    sponsor: "bg-amber-100 text-amber-700",
    pharmacist: "bg-purple-100 text-purple-700",
  }
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${styles[type]}`}>
      {type}
    </span>
  )
}