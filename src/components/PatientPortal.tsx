import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Pill, Truck, ChatCircleText, Heartbeat, MapPin, Check, Clock, ArrowRight, ShieldCheck, Phone } from "@phosphor-icons/react"
import { toast } from "sonner"
import type { Patient, Order, RefillTask, CommunicationLog, TimelineEvent } from "../types/pharmacy"

interface Props {
  patient: Patient
  orders: Order[]
  refillTasks: RefillTask[]
  communications: CommunicationLog[]
  onOrderUpdate: (orderId: string, status: Order["status"]) => void
  onCheckIn: (patientId: string, data: { missedDoses: number; sideEffects: string; feelingBetter: boolean }) => void
  onRequestRefill: (patientId: string, medicationId: string) => void
}

const ORDER_STEPS: Order["status"][] = ["Requested", "Reviewing", "Approved", "Ready", "Dispatched", "Delivered", "Collected", "Closed"]
const STEP_LABELS: Record<string, string> = {
  Requested: "Order Placed",
  Reviewing: "Pharmacist Review",
  Approved: "Approved",
  Ready: "Ready for Pickup",
  Dispatched: "Out for Delivery",
  Delivered: "Delivered",
  Collected: "Collected",
  Closed: "Complete",
}

export function PatientPortal({ patient, orders, refillTasks, communications, onOrderUpdate, onCheckIn, onRequestRefill }: Props) {
  const [tab, setTab] = useState<"home" | "refills" | "delivery" | "checkin" | "comms">("home")
  const [checkinForm, setCheckinForm] = useState({ missedDoses: 0, sideEffects: "", feelingBetter: true })
  const [showCheckinSuccess, setShowCheckinSuccess] = useState(false)

  const patientOrders = orders.filter(o => o.patientId === patient.id)
  const patientRefills = refillTasks.filter(r => r.patientId === patient.id && r.status !== "Refilled")
  const patientComms = communications.filter(c => c.patientId === patient.id)

  const handleCheckin = () => {
    onCheckIn(patient.id, checkinForm)
    setShowCheckinSuccess(true)
    toast.success("Check-in submitted", { description: "Your pharmacist will review your responses." })
    setTimeout(() => setShowCheckinSuccess(false), 3000)
    setCheckinForm({ missedDoses: 0, sideEffects: "", feelingBetter: true })
  }

  const handleRefillRequest = (medId: string) => {
    onRequestRefill(patient.id, medId)
    toast.success("Refill requested", { description: "Your pharmacist will review and approve shortly." })
  }

  const getStepIndex = (status: Order["status"]) => ORDER_STEPS.indexOf(status)

  const tabs = [
    { id: "home" as const, label: "Home", icon: ShieldCheck },
    { id: "refills" as const, label: "Refills", icon: Pill },
    { id: "delivery" as const, label: "Delivery", icon: Truck },
    { id: "checkin" as const, label: "Check-in", icon: Heartbeat },
    { id: "comms" as const, label: "Messages", icon: ChatCircleText },
  ]

  return (
    <div className="space-y-5">
      {/* Patient Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-800 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-200 text-xs font-medium">Karibu, {patient.firstName}</p>
            <p className="text-sm font-medium mt-1">Adherence Score: {patient.adherenceScore}%</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
            <span className="text-lg font-bold">{patient.firstName[0]}{patient.lastName[0]}</span>
          </div>
        </div>
        <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${patient.adherenceScore}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-emerald-300 rounded-full"
          />
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              tab === t.id ? "bg-emerald-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            <t.icon size={14} weight={tab === t.id ? "fill" : "regular"} />
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {tab === "home" && (
            <div className="space-y-4">
              {/* Upcoming Refills */}
              <div className="bg-white rounded-xl border border-zinc-200 p-4">
                <h3 className="text-sm font-semibold text-zinc-700 mb-3">Upcoming Refills</h3>
                {patientRefills.length > 0 ? (
                  <div className="space-y-2">
                    {patientRefills.slice(0, 3).map(r => {
                      const med = patient.medications.find(m => m.id === r.medicationId)
                      return (
                        <div key={r.id} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
                          <div className={`w-2 h-2 rounded-full ${r.daysRemaining < 0 ? "bg-rose-500" : r.daysRemaining <= 2 ? "bg-amber-500" : "bg-emerald-500"}`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-zinc-900">{med?.name} {med?.dosage}</p>
                            <p className="text-xs text-zinc-500">{r.status}</p>
                          </div>
                          <button onClick={() => med && handleRefillRequest(med.id)}
                            className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
                            Request
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 text-center py-4">No upcoming refills. You're all caught up!</p>
                )}
              </div>

              {/* Active Orders */}
              {patientOrders.length > 0 && (
                <div className="bg-white rounded-xl border border-zinc-200 p-4">
                  <h3 className="text-sm font-semibold text-zinc-700 mb-3">Active Orders</h3>
                  <div className="space-y-3">
                    {patientOrders.filter(o => o.status !== "Closed" && o.status !== "Delivered").slice(0, 2).map(o => (
                      <div key={o.id} className="p-3 bg-zinc-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-zinc-700">{STEP_LABELS[o.status]}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${o.method === "Delivery" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{o.method}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {ORDER_STEPS.slice(0, 6).map((step, i) => (
                            <div key={step} className={`h-1.5 flex-1 rounded-full ${i <= getStepIndex(o.status) ? "bg-emerald-500" : "bg-zinc-200"}`} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setTab("checkin")} className="flex flex-col items-center gap-2 p-4 bg-white border border-zinc-200 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all">
                  <Heartbeat size={20} className="text-rose-500" />
                  <span className="text-xs font-medium text-zinc-700">Monthly Check-in</span>
                </button>
                <button onClick={() => setTab("refills")} className="flex flex-col items-center gap-2 p-4 bg-white border border-zinc-200 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all">
                  <Pill size={20} className="text-emerald-500" />
                  <span className="text-xs font-medium text-zinc-700">Request Refill</span>
                </button>
              </div>
            </div>
          )}

          {tab === "refills" && (
            <div className="space-y-3">
              {patient.medications.filter(m => m.active).map(med => {
                const task = patientRefills.find(r => r.medicationId === med.id)
                return (
                  <div key={med.id} className="bg-white rounded-xl border border-zinc-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                          <Pill size={16} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{med.name} {med.dosage}</p>
                          <p className="text-xs text-zinc-500">{med.frequency} | {med.refillsRemaining} refills left</p>
                        </div>
                      </div>
                      <button onClick={() => handleRefillRequest(med.id)}
                        className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors">
                        Request Refill
                      </button>
                    </div>
                    {task && (
                      <div className={`mt-3 flex items-center gap-2 text-xs ${task.daysRemaining < 0 ? "text-rose-600" : "text-zinc-500"}`}>
                        <Clock size={12} />
                        {task.daysRemaining < 0 ? `Overdue by ${Math.abs(task.daysRemaining)} days` : `Due in ${task.daysRemaining} days`}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {tab === "delivery" && (
            <div className="space-y-3">
              {patientOrders.length > 0 ? patientOrders.map(o => (
                <div key={o.id} className="bg-white rounded-xl border border-zinc-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-zinc-500">Order #{o.id.toUpperCase()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.method === "Delivery" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{o.method}</span>
                  </div>
                  {/* Progress */}
                  <div className="space-y-2">
                    {ORDER_STEPS.slice(0, getStepIndex(o.status) + 1).map((step, i) => (
                      <div key={step} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${i === getStepIndex(o.status) ? "bg-emerald-600" : "bg-emerald-100"}`}>
                          <Check size={10} className={i === getStepIndex(o.status) ? "text-white" : "text-emerald-600"} />
                        </div>
                        <span className={`text-xs ${i === getStepIndex(o.status) ? "font-semibold text-zinc-900" : "text-zinc-500"}`}>{STEP_LABELS[step]}</span>
                      </div>
                    ))}
                  </div>
                  {o.riderName && (
                    <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2">
                        <Truck size={14} className="text-amber-600" />
                        <p className="text-xs font-medium text-amber-900">Rider: {o.riderName}</p>
                      </div>
                      {o.riderPhone && <p className="text-xs text-amber-700 mt-1">{o.riderPhone}</p>}
                    </div>
                  )}
                  {o.deliveryAddress && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                      <MapPin size={12} />
                      {o.deliveryAddress}
                    </div>
                  )}
                </div>
              )) : (
                <div className="text-center py-12">
                  <Truck size={32} className="mx-auto text-zinc-300 mb-3" />
                  <p className="text-sm text-zinc-500">No orders yet. Request a refill to get started.</p>
                </div>
              )}
            </div>
          )}

          {tab === "checkin" && (
            <div className="bg-white rounded-xl border border-zinc-200 p-5">
              <h3 className="text-sm font-semibold text-zinc-900 mb-1">Monthly Health Check-in</h3>
              <p className="text-xs text-zinc-500 mb-5">Help your pharmacist understand how you're managing your condition.</p>

              {showCheckinSuccess ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check size={28} className="text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">Check-in Submitted!</p>
                  <p className="text-xs text-zinc-500 mt-1">Your pharmacist will review your responses.</p>
                </motion.div>
              ) : (
                <div className="space-y-5">
                  {/* Missed Doses */}
                  <div>
                    <label className="text-xs font-medium text-zinc-700 mb-2 block">Missed doses this month?</label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setCheckinForm(f => ({ ...f, missedDoses: n }))}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                            checkinForm.missedDoses === n ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                          }`}
                        >{n}</button>
                      ))}
                    </div>
                  </div>

                  {/* Feeling Better */}
                  <div>
                    <label className="text-xs font-medium text-zinc-700 mb-2 block">Are you feeling better than last month?</label>
                    <div className="flex gap-2">
                      <button onClick={() => setCheckinForm(f => ({ ...f, feelingBetter: true }))}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          checkinForm.feelingBetter ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600"
                        }`}>Yes, improving</button>
                      <button onClick={() => setCheckinForm(f => ({ ...f, feelingBetter: false }))}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          !checkinForm.feelingBetter ? "bg-amber-500 text-white" : "bg-zinc-100 text-zinc-600"
                        }`}>No change / worse</button>
                    </div>
                  </div>

                  {/* Side Effects */}
                  <div>
                    <label className="text-xs font-medium text-zinc-700 mb-2 block">Any side effects? (optional)</label>
                    <textarea
                      value={checkinForm.sideEffects}
                      onChange={e => setCheckinForm(f => ({ ...f, sideEffects: e.target.value }))}
                      placeholder="Describe any side effects you've experienced..."
                      className="w-full p-3 border border-zinc-200 rounded-lg text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                    />
                  </div>

                  <button onClick={handleCheckin}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                    Submit Check-in <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "comms" && (
            <div className="space-y-3">
              {patientComms.length > 0 ? patientComms.map(c => (
                <div key={c.id} className={`p-4 rounded-xl border ${c.direction === "outbound" ? "bg-white border-zinc-200" : "bg-emerald-50 border-emerald-200"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      c.channel === "SMS" ? "bg-blue-100 text-blue-700" : c.channel === "WhatsApp" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
                    }`}>{c.channel}</span>
                    <span className="text-xs text-zinc-400">{new Date(c.sentAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</span>
                  </div>
                  <p className="text-sm text-zinc-700 leading-relaxed">{c.message}</p>
                </div>
              )) : (
                <div className="text-center py-12">
                  <ChatCircleText size={32} className="mx-auto text-zinc-300 mb-3" />
                  <p className="text-sm text-zinc-500">No messages yet.</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
