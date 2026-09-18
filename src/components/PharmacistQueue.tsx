import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { WarningCircle, Clock, Phone, ChatCircleText, Check, X, Pill, ArrowRight, ShieldCheck, Plus, Package, Timer, CalendarCheck, ArrowsClockwise, Flask, BellRinging } from "@phosphor-icons/react"
import { toast } from "sonner"
import type { Patient, RefillTask, CommunicationLog, Medication, RecipientType } from "../types/pharmacy"
import { AddMedicationModal } from "./AddMedicationModal"
import { ReminderVerificationModal } from "./ReminderVerificationModal"
import { dispatchToPatient, dispatchToSponsor, dispatchToPharmacist, resultToCommLog } from "../lib/reminderEngine"

interface Props {
  patients: Patient[]
  refillTasks: RefillTask[]
  onDispense: (taskId: string) => void
  onSendCommunication: (log: Omit<CommunicationLog, "id" | "sentAt" | "delivered" | "acknowledged">) => void
  onAddMedication: (patientId: string, medication: Medication) => void
  onReminderDispatch: (patientId: string, results: import("../types/pharmacy").DispatchResult[]) => void
}

type FilterStatus = "all" | "Overdue" | "Due Today" | "Due in 7 Days" | "Follow-up"

const URGENCY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  "Overdue": { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", dot: "bg-rose-500" },
  "Due Today": { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  "Due in 2 Days": { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", dot: "bg-orange-500" },
  "Due in 7 Days": { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  "Due in 14 Days": { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
}

export function PharmacistQueue({ patients, refillTasks, onDispense, onSendCommunication, onAddMedication, onReminderDispatch }: Props) {
  const [filter, setFilter] = useState<FilterStatus>("all")
  const [selectedTask, setSelectedTask] = useState<RefillTask | null>(null)
  const [actionModal, setActionModal] = useState<"sms" | "whatsapp" | "call" | "reminder" | null>(null)
  const [isAddMedOpen, setIsAddMedOpen] = useState(false)
  const [isVerifyOpen, setIsVerifyOpen] = useState(false)
  const [reminderRecipient, setReminderRecipient] = useState<RecipientType>("patient")

  const filtered = refillTasks.filter(t => {
    if (filter === "all") return t.status !== "Refilled" && t.status !== "Discontinued"
    if (filter === "Overdue") return t.status === "Overdue"
    if (filter === "Due Today") return t.status === "Due Today"
    if (filter === "Due in 7 Days") return t.status === "Due in 7 Days" || t.status === "Due in 2 Days"
    if (filter === "Follow-up") return t.status === "Patient Unreachable"
    return true
  }).sort((a, b) => a.daysRemaining - b.daysRemaining)

  const getPatient = (id: string) => patients.find(p => p.id === id)
  const getMedication = (patientId: string, medId: string) => {
    const p = getPatient(patientId)
    return p?.medications.find(m => m.id === medId)
  }

  const handleDispense = (task: RefillTask) => {
    onDispense(task.id)
    toast.success("Medication dispensed successfully", { description: "Patient record updated with new refill date." })
    setSelectedTask(null)
  }

  const handleSendMsg = (channel: "SMS" | "WhatsApp") => {
    if (!selectedTask) return
    const patient = getPatient(selectedTask.patientId)
    if (!patient) return
    const msg = channel === "SMS"
      ? `Hello ${patient.firstName}, your scheduled prescription refill is due for pickup at AfyaCare Pharmacy. Reply STOP to opt out.`
      : `Habari ${patient.firstName}, your monthly prescription is ready for collection at AfyaCare Pharmacy. We are open Mon-Sat 8am-8pm.`
    onSendCommunication({
      patientId: patient.id,
      channel,
      direction: "outbound",
      message: msg,
      templateUsed: `${selectedTask.status} reminder`,
    })
    toast.success(`${channel} sent to ${patient.firstName} ${patient.lastName}`)
    setActionModal(null)
  }

  const handleCall = () => {
    if (!selectedTask) return
    const patient = getPatient(selectedTask.patientId)
    if (!patient) return
    onSendCommunication({
      patientId: patient.id,
      channel: "Call",
      direction: "outbound",
      message: `Outbound call to ${patient.phone} regarding overdue medication.`,
      templateUsed: "Escalation call",
    })
    toast.info(`Call logged for ${patient.firstName} ${patient.lastName}`)
    setActionModal(null)
  }

  const handleReminderDispatch = () => {
    if (!selectedTask) return
    const patient = getPatient(selectedTask.patientId)
    if (!patient) return
    const med = getMedication(selectedTask.patientId, selectedTask.medicationId)
    if (!med) return
    let result = null
    if (reminderRecipient === "patient") {
      result = dispatchToPatient(patient, med, selectedTask.daysRemaining)
    } else if (reminderRecipient === "sponsor") {
      result = dispatchToSponsor(patient, med, selectedTask.daysRemaining)
      if (!result) {
        toast.warning("No sponsor registered or consent not given for this patient.")
        return
      }
    } else {
      result = dispatchToPharmacist(patient, med, selectedTask.daysRemaining)
    }
    const log = resultToCommLog(result)
    onSendCommunication({ ...log, patientId: patient.id })
    onReminderDispatch(patient.id, [result])
    toast.success(`Reminder dispatched to ${result.recipientType}: ${result.recipientName}`, {
      description: result.formattedMessage.substring(0, 80),
    })
    setActionModal(null)
  }

  const counts = {
    all: refillTasks.filter(t => t.status !== "Refilled" && t.status !== "Discontinued").length,
    "Overdue": refillTasks.filter(t => t.status === "Overdue").length,
    "Due Today": refillTasks.filter(t => t.status === "Due Today").length,
    "Due in 7 Days": refillTasks.filter(t => t.status === "Due in 7 Days" || t.status === "Due in 2 Days").length,
    "Follow-up": refillTasks.filter(t => t.status === "Patient Unreachable").length,
  }

  return (
    <div className="space-y-5">
      {/* Header actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-zinc-500">Dispense refills and prescribe new medications to patients.</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVerifyOpen(true)}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 active:scale-[0.98] transition-all"
          >
            <Flask size={16} />
            Verify Reminder Engine
          </button>
          <button
            onClick={() => setIsAddMedOpen(true)}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all"
          >
            <Plus size={16} weight="bold" />
            New Prescription
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "Overdue", "Due Today", "Due in 7 Days", "Follow-up"] as FilterStatus[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              filter === f ? "bg-emerald-900 text-white shadow-sm" : "bg-white text-zinc-600 border border-zinc-200 hover:border-emerald-300 hover:text-emerald-700"
            }`}
          >
            {f === "all" ? "All Tasks" : f}
            <span className={`text-xs px-1.5 py-0.5 rounded ${filter === f ? "bg-emerald-700 text-emerald-100" : "bg-zinc-100 text-zinc-500"}`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map(task => {
            const patient = getPatient(task.patientId)
            const med = getMedication(task.patientId, task.medicationId)
            const style = URGENCY_STYLES[task.status] || URGENCY_STYLES["Due in 14 Days"]
            if (!patient || !med) return null
            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setSelectedTask(task)}
                className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition-all ${
                  selectedTask?.id === task.id ? "ring-2 ring-emerald-500 border-emerald-300" : style.bg
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full mt-2 ${style.dot}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900">{patient.firstName} {patient.lastName}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{med.name} {med.dosage}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-zinc-500">
                        <span className="inline-flex items-center gap-1"><Package size={11} className="text-zinc-400" />x{med.quantityPerFill}</span>
                        <span className="inline-flex items-center gap-1"><Timer size={11} className="text-zinc-400" />{med.frequency}</span>
                        {med.duration && <span className="inline-flex items-center gap-1"><CalendarCheck size={11} className="text-zinc-400" />{med.duration}</span>}
                        {med.refillIntervalDays && <span className="inline-flex items-center gap-1"><ArrowsClockwise size={11} className="text-zinc-400" />{med.refillIntervalDays}d refill</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-xs font-medium ${style.text}`}>{task.status}</span>
                        <span className="text-xs text-zinc-400">
                          {task.daysRemaining < 0 ? `${Math.abs(task.daysRemaining)} days overdue` : task.daysRemaining === 0 ? "Today" : `${task.daysRemaining} days remaining`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-zinc-400">{patient.phone}</span>
                    <ArrowRight size={14} className="text-zinc-400" />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <ShieldCheck size={32} className="mx-auto mb-3 text-emerald-400" />
            <p className="text-sm font-medium">All clear! No tasks in this category.</p>
          </div>
        )}
      </div>

      {/* Action Panel */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-zinc-200 shadow-2xl p-5 sm:rounded-t-2xl sm:max-w-lg sm:mx-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  {getPatient(selectedTask.patientId)?.firstName} {getPatient(selectedTask.patientId)?.lastName}
                </h3>
                <p className="text-xs text-zinc-500">
                  {getMedication(selectedTask.patientId, selectedTask.medicationId)?.name} - {selectedTask.status}
                </p>
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-zinc-100 rounded-lg">
                <X size={16} className="text-zinc-500" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button onClick={() => handleDispense(selectedTask)}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                <Check size={14} /> Dispense
              </button>
              <button onClick={() => setActionModal("sms")}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 border border-blue-200 transition-colors">
                <ChatCircleText size={14} /> SMS
              </button>
              <button onClick={() => setActionModal("whatsapp")}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 border border-green-200 transition-colors">
                <Phone size={14} /> WhatsApp
              </button>
              <button onClick={() => setActionModal("call")}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 border border-purple-200 transition-colors">
                <Phone size={14} /> Call
              </button>
              <button onClick={() => { setActionModal("reminder"); setReminderRecipient("patient") }}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 border border-amber-200 transition-colors">
                <BellRinging size={14} /> Reminder
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Medication Modal */}
      <AddMedicationModal
        open={isAddMedOpen}
        onClose={() => setIsAddMedOpen(false)}
        patients={patients}
        onAddMedication={onAddMedication}
      />

      {/* Reminder Verification Modal */}
      <ReminderVerificationModal
        open={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        patients={patients}
        onDispatchComplete={(results, patientId) => {
          onReminderDispatch(patientId, results)
          setIsVerifyOpen(false)
        }}
      />

      {/* Message Preview Modal */}
      <AnimatePresence>
        {actionModal && selectedTask && actionModal !== "reminder" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
            onClick={() => setActionModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${actionModal === "sms" ? "bg-blue-100" : actionModal === "whatsapp" ? "bg-green-100" : "bg-purple-100"}`}>
                  {actionModal === "call" ? <Phone size={18} className="text-purple-600" /> : <ChatCircleText size={18} className={actionModal === "sms" ? "text-blue-600" : "text-green-600"} />}
                </div>
                <h4 className="text-sm font-semibold text-zinc-900 capitalize">Send {actionModal}</h4>
              </div>
              <div className="bg-zinc-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-zinc-700 leading-relaxed">
                  {actionModal === "call"
                    ? `Calling ${getPatient(selectedTask.patientId)?.phone}...`
                    : actionModal === "sms"
                    ? `Hello ${getPatient(selectedTask.patientId)?.firstName}, your scheduled prescription refill is due for pickup at AfyaCare Pharmacy. Reply STOP to opt out.`
                    : `Habari ${getPatient(selectedTask.patientId)?.firstName}, your monthly prescription is ready for collection at AfyaCare Pharmacy. We are open Mon-Sat 8am-8pm.`
                  }
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActionModal(null)} className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (actionModal === "sms") handleSendMsg("SMS")
                    else if (actionModal === "whatsapp") handleSendMsg("WhatsApp")
                    else handleCall()
                  }}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                >
                  Send
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {actionModal === "reminder" && selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
            onClick={() => setActionModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-amber-100">
                  <BellRinging size={18} className="text-amber-600" />
                </div>
                <h4 className="text-sm font-semibold text-zinc-900">Send Reminder</h4>
              </div>
              <div className="mb-4">
                <p className="text-xs font-medium text-zinc-500 mb-2">Select Recipient</p>
                <div className="flex gap-2">
                  {(["patient", "sponsor", "pharmacist"] as RecipientType[]).map(r => (
                    <button key={r} onClick={() => setReminderRecipient(r)}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all border ${
                        reminderRecipient === r
                          ? r === "patient" ? "bg-blue-50 text-blue-700 border-blue-300"
                          : r === "sponsor" ? "bg-amber-50 text-amber-700 border-amber-300"
                          : "bg-purple-50 text-purple-700 border-purple-300"
                          : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4 mb-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-2">Payload Preview</p>
                <pre className="text-xs text-emerald-300 font-mono whitespace-pre-wrap">
                  {(() => {
                    const p = getPatient(selectedTask.patientId)
                    const m = getMedication(selectedTask.patientId, selectedTask.medicationId)
                    if (!p || !m) return ""
                    const fn = reminderRecipient === "patient" ? dispatchToPatient : reminderRecipient === "sponsor" ? dispatchToSponsor : dispatchToPharmacist
                    const r = fn(p, m, selectedTask.daysRemaining)
                    return r ? r.formattedMessage : "No sponsor configured"
                  })()}
                </pre>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActionModal(null)} className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                  Cancel
                </button>
                <button onClick={handleReminderDispatch}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                  Dispatch
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}