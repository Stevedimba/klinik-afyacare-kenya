import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Heartbeat, Pill, ChatCircleText, CalendarCheck, IdentificationCard, Phone, MapPin, WarningCircle, ShieldCheck, Clock, Plus, Package, Timer, ArrowsClockwise, NotePencil, PencilSimple, Sparkle, Copy, CheckCircle, Stethoscope } from "@phosphor-icons/react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { Patient, TimelineEvent, CommunicationLog, Medication } from "../types/pharmacy"
import { AddMedicationModal } from "./AddMedicationModal"

interface Props {
  patient: Patient
  timeline: TimelineEvent[]
  communications: CommunicationLog[]
  onClose: () => void
  patients?: Patient[]
  onAddMedication?: (patientId: string, medication: Medication) => void
  onEditPatient?: (patient: Patient) => void
}

const TYPE_ICONS: Record<string, { icon: typeof Pill; color: string; bg: string }> = {
  dispense: { icon: Pill, color: "text-emerald-600", bg: "bg-emerald-100" },
  vital: { icon: Heartbeat, color: "text-rose-600", bg: "bg-rose-100" },
  communication: { icon: ChatCircleText, color: "text-blue-600", bg: "bg-blue-100" },
  order: { icon: CalendarCheck, color: "text-amber-600", bg: "bg-amber-100" },
  "check-in": { icon: ShieldCheck, color: "text-teal-600", bg: "bg-teal-100" },
  registration: { icon: IdentificationCard, color: "text-purple-600", bg: "bg-purple-100" },
  update: { icon: PencilSimple, color: "text-indigo-600", bg: "bg-indigo-100" },
}

function getAdherenceColor(score: number) {
  if (score >= 90) return "text-emerald-600"
  if (score >= 80) return "text-teal-600"
  if (score >= 60) return "text-amber-600"
  return "text-rose-600"
}

function getAdherenceBg(score: number) {
  if (score >= 90) return "bg-emerald-50 border-emerald-200"
  if (score >= 80) return "bg-teal-50 border-teal-200"
  if (score >= 60) return "bg-amber-50 border-amber-200"
  return "bg-rose-50 border-rose-200"
}

export function Patient360({ patient, timeline, communications, onClose, patients, onAddMedication, onEditPatient }: Props) {
  const [tab, setTab] = useState<"clinical" | "timeline" | "comms">("clinical")
  const [isAddMedOpen, setIsAddMedOpen] = useState(false)
  const patientTimeline = timeline.filter(t => t.patientId === patient.id)
  const patientComms = communications.filter(c => c.patientId === patient.id)

  const bpData = patient.vitals
    .filter(v => v.systolic && v.diastolic)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .map(v => ({
      date: new Date(v.recordedAt).toLocaleDateString("en-KE", { month: "short", day: "numeric" }),
      systolic: v.systolic,
      diastolic: v.diastolic,
    }))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end"
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-zinc-100 p-5 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-lg font-bold text-emerald-700">{patient.firstName[0]}{patient.lastName[0]}</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">{patient.firstName} {patient.lastName}</h2>
                <p className="text-xs text-zinc-500">{patient.gender}, {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} yrs | {patient.county}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onEditPatient && (
                <button
                  onClick={() => onEditPatient(patient)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 active:scale-[0.98] transition-all"
                >
                  <PencilSimple size={13} weight="bold" />
                  Edit
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                <X size={18} className="text-zinc-500" />
              </button>
            </div>
          </div>
          {/* Adherence Badge */}
          <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${getAdherenceBg(patient.adherenceScore)}`}>
            <ShieldCheck size={12} className={getAdherenceColor(patient.adherenceScore)} />
            <span className={getAdherenceColor(patient.adherenceScore)}>Adherence: {patient.adherenceScore}%</span>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-zinc-100">
          {(["clinical", "timeline", "comms"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                tab === t ? "text-emerald-700" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {t === "clinical" ? "Clinical" : t === "timeline" ? "Timeline" : "Communications"}
              {tab === t && <motion.div layoutId="drawer-tab" className="absolute bottom-0 left-4 right-4 h-0.5 bg-emerald-600 rounded-full" />}
            </button>
          ))}
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {tab === "clinical" && (
              <motion.div key="clinical" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <ClinicalCopilot patient={patient} />

                {/* Demographics */}
                <section>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Demographics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-50 rounded-lg p-3">
                      <p className="text-xs text-zinc-500">National ID</p>
                      <p className="text-sm font-medium text-zinc-900 mt-0.5">{patient.nationalId}</p>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-3">
                      <p className="text-xs text-zinc-500">Phone</p>
                      <p className="text-sm font-medium text-zinc-900 mt-0.5">{patient.phone}</p>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-3">
                      <p className="text-xs text-zinc-500">County</p>
                      <p className="text-sm font-medium text-zinc-900 mt-0.5">{patient.county}</p>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-3">
                      <p className="text-xs text-zinc-500">Sub-County</p>
                      <p className="text-sm font-medium text-zinc-900 mt-0.5">{patient.subCounty}</p>
                    </div>
                  </div>
                </section>

                {/* Diagnoses */}
                <section>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Chronic Conditions</h3>
                  <div className="space-y-2">
                    {patient.diagnoses.map(d => (
                      <div key={d.id} className="flex items-start gap-3 p-3 bg-white border border-zinc-200 rounded-lg">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${d.severity === "Severe" ? "bg-rose-500" : d.severity === "Moderate" ? "bg-amber-500" : "bg-emerald-500"}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-900">{d.condition}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">Since {new Date(d.diagnosedOn).toLocaleDateString("en-KE", { month: "short", year: "numeric" })} | {d.severity}</p>
                          <p className="text-xs text-zinc-400 mt-1">{d.notes}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Medications */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Medications</h3>
                    {onAddMedication && patients && (
                      <button
                        onClick={() => setIsAddMedOpen(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 active:scale-[0.98] transition-all"
                      >
                        <Plus size={12} weight="bold" />
                        Add Medication
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {patient.medications.filter(m => m.active).map(m => (
                      <div key={m.id} className="p-3 bg-white border border-zinc-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 rounded-lg shrink-0">
                            <Pill size={14} className="text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900">{m.name} {m.dosage}</p>
                            <p className="text-xs text-zinc-500">{m.frequency}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-medium text-zinc-700">{m.refillsRemaining} refills</p>
                            <p className="text-xs text-zinc-400">x{m.quantityPerFill}</p>
                          </div>
                        </div>
                        {(m.prescription || m.duration || m.refillIntervalDays) && (
                          <div className="mt-2.5 pt-2.5 border-t border-zinc-100 space-y-1.5">
                            {m.prescription && (
                              <p className="text-xs text-zinc-600 leading-relaxed flex items-start gap-1.5">
                                <NotePencil size={12} className="text-zinc-400 mt-0.5 shrink-0" />
                                {m.prescription}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                              {m.duration && <span className="inline-flex items-center gap-1"><CalendarCheck size={11} className="text-zinc-400" />{m.duration}</span>}
                              <span className="inline-flex items-center gap-1"><Package size={11} className="text-zinc-400" />x{m.quantityPerFill}/fill</span>
                              <span className="inline-flex items-center gap-1"><Timer size={11} className="text-zinc-400" />{m.dailyDose}/day</span>
                              {m.refillIntervalDays && <span className="inline-flex items-center gap-1"><ArrowsClockwise size={11} className="text-zinc-400" />{m.refillIntervalDays}d cycle</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* BP Chart */}
                {bpData.length >= 2 && (
                  <section>
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Blood Pressure Trend</h3>
                    <div className="bg-zinc-50 rounded-lg p-4">
                      <ResponsiveContainer width="100%" height={140}>
                        <LineChart data={bpData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#71717a" }} />
                          <YAxis domain={[60, 180]} tick={{ fontSize: 11, fill: "#71717a" }} />
                          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 11 }} />
                          <Line type="monotone" dataKey="systolic" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} name="Systolic" />
                          <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Diastolic" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                )}

                {/* Sponsor */}
                {patient.sponsor && (
                  <section>
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Sponsor / Caregiver</h3>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                          <Phone size={14} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-900">{patient.sponsor.name}</p>
                          <p className="text-xs text-purple-600">{patient.sponsor.relationship} | {patient.sponsor.phone}</p>
                        </div>
                      </div>
                      <p className="text-xs text-purple-500 mt-2">Consent given: {new Date(patient.sponsor.consentDate).toLocaleDateString()}</p>
                    </div>
                  </section>
                )}

                {/* Consent */}
                <section>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Data Consent (DPA 2019)</h3>
                  <div className="space-y-2">
                    {[
                      { label: "Data Processing", given: patient.consentDataProcessing },
                      { label: "SMS Reminders", given: patient.consentSmsReminders },
                      { label: "WhatsApp Reminders", given: patient.consentWhatsAppReminders },
                    ].map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                        <span className="text-sm text-zinc-700">{c.label}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.given ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-500"}`}>
                          {c.given ? "Granted" : "Declined"}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {tab === "timeline" && (
              <motion.div key="timeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-200" />
                  <div className="space-y-4">
                    {patientTimeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(event => {
                      const meta = TYPE_ICONS[event.type] || TYPE_ICONS.dispense
                      return (
                        <div key={event.id} className="relative flex items-start gap-4 pl-2">
                          <div className={`relative z-10 w-6 h-6 rounded-full ${meta.bg} flex items-center justify-center shrink-0`}>
                            <meta.icon size={12} className={meta.color} />
                          </div>
                          <div className="flex-1 pb-2">
                            <p className="text-sm text-zinc-900">{event.description}</p>
                            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                              <Clock size={10} />
                              {new Date(event.timestamp).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                              <span className="text-zinc-300">|</span>
                              {event.actor}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    {patientTimeline.length === 0 && (
                      <p className="text-sm text-zinc-500 text-center py-8">No timeline events yet.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "comms" && (
              <motion.div key="comms" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                {patientComms.map(c => (
                  <div key={c.id} className="p-4 bg-white border border-zinc-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          c.channel === "SMS" ? "bg-blue-100 text-blue-700" : c.channel === "WhatsApp" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
                        }`}>{c.channel}</span>
                        <span className="text-xs text-zinc-400">{c.direction}</span>
                      </div>
                      <span className="text-xs text-zinc-400">{new Date(c.sentAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</span>
                    </div>
                    <p className="text-sm text-zinc-700 leading-relaxed">{c.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-xs ${c.delivered ? "text-emerald-600" : "text-zinc-400"}`}>
                        {c.delivered ? "✓ Delivered" : "○ Pending"}
                      </span>
                      <span className={`text-xs ${c.acknowledged ? "text-emerald-600" : "text-zinc-400"}`}>
                        {c.acknowledged ? "✓ Read" : "○ Unread"}
                      </span>
                    </div>
                  </div>
                ))}
                {patientComms.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-8">No communications logged yet.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {onAddMedication && patients && (
        <AddMedicationModal
          open={isAddMedOpen}
          onClose={() => setIsAddMedOpen(false)}
          patients={patients}
          defaultPatientId={patient.id}
          onAddMedication={onAddMedication}
        />
      )}
    </motion.div>
  )
}

function ClinicalCopilot({ patient }: { patient: Patient }) {
  const [summary, setSummary] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
  const activeMeds = patient.medications.filter(m => m.active)

  const generate = () => {
    const conds = patient.diagnoses.length
      ? patient.diagnoses.map(d => `${d.condition} (${d.severity})`).join(", ")
      : "none recorded"
    const risk =
      patient.adherenceScore >= 90 ? "excellent" :
      patient.adherenceScore >= 80 ? "good" :
      patient.adherenceScore >= 60 ? "needs attention" : "high risk"
    const meds = activeMeds.length ? activeMeds.map(m => `${m.name} ${m.dosage}`).join(", ") : "none active"
    const intervention =
      patient.adherenceScore < 80
        ? "Suggested intervention: schedule adherence counselling, verify refill access, and enable SMS/WhatsApp reminders."
        : "Continue routine refill reminders; no adherence intervention flagged."
    setSummary(
      `${patient.firstName} ${patient.lastName}, ${patient.gender.toLowerCase()}, ${age}y, ${patient.county}. Chronic conditions: ${conds}. Active medications: ${meds}. Adherence ${patient.adherenceScore}% (${risk}). Last visit ${new Date(patient.lastVisit).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}. ${intervention}`
    )
    setCopied(false)
  }

  const copy = async () => {
    if (!summary) return
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Sparkle size={14} className="text-white" weight="fill" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-900">Clinical Assistant Copilot</p>
            <p className="text-[10px] text-zinc-500">Instant record summary &amp; adherence notes</p>
          </div>
        </div>
        <button
          onClick={generate}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all"
        >
          <Stethoscope size={13} />
          {summary ? "Regenerate" : "Summarize"}
        </button>
      </div>
      {summary && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
          <p className="text-xs text-zinc-700 leading-relaxed bg-white/70 border border-emerald-100 rounded-lg p-3">{summary}</p>
          <button
            onClick={copy}
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            {copied ? <CheckCircle size={13} weight="fill" /> : <Copy size={13} />}
            {copied ? "Copied to clipboard" : "Copy summary"}
          </button>
        </motion.div>
      )}
    </section>
  )
}