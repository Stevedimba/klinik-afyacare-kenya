import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Pill, Storefront, Heart, ShieldCheck, WarningCircle, ListChecks, GearSix, CaretDown, Plus, PencilSimple } from "@phosphor-icons/react"
import { Toaster } from "sonner"
import type { Role, Patient, RefillTask, Order, CommunicationLog, StaffMember, TimelineEvent, Medication, RefillStatus, ReminderTemplate, DispatchResult } from "./types/pharmacy"
import { MOCK_PATIENTS, MOCK_REFILL_TASKS, MOCK_ORDERS, MOCK_COMMUNICATIONS, MOCK_STAFF, MOCK_TIMELINE, MOCK_TEMPLATES } from "./data/mockData"
import { AdminWorkspace } from "./components/AdminWorkspace"
import { PharmacistQueue } from "./components/PharmacistQueue"
import { Patient360 } from "./components/Patient360"
import { PatientPortal } from "./components/PatientPortal"
import { AddPatientModal } from "./components/AddPatientModal"
import { EditPatientModal } from "./components/EditPatientModal"

const ROLE_CONFIG: Record<Role, { label: string; icon: typeof Users; description: string }> = {
  admin: { label: "Administrator", icon: ShieldCheck, description: "Business analytics, staff, settings" },
  pharmacist: { label: "Pharmacist", icon: Pill, description: "Clinical queue, dispensing, patient 360" },
  assistant: { label: "Assistant", icon: ListChecks, description: "Order fulfilment, delivery tracking" },
  patient: { label: "Patient Portal", icon: Heart, description: "Refills, check-ins, delivery status" },
}

const NAV_ITEMS: Record<Role, { id: string; label: string; icon: typeof Users }[]> = {
  admin: [
    { id: "workspace", label: "Dashboard", icon: Storefront },
    { id: "patients", label: "Patients", icon: Users },
  ],
  pharmacist: [
    { id: "queue", label: "Refill Queue", icon: WarningCircle },
    { id: "patients", label: "Patient Records", icon: Users },
  ],
  assistant: [
    { id: "orders", label: "Orders", icon: ListChecks },
    { id: "patients", label: "Patients", icon: Users },
  ],
  patient: [
    { id: "portal", label: "My Health", icon: Heart },
  ],
}

function App() {
  const [role, setRole] = useState<Role>("admin")
  const [navItem, setNavItem] = useState("workspace")
  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const raw = localStorage.getItem("afyacare.patients")
      if (raw) return JSON.parse(raw) as Patient[]
    } catch {
      /* ignore */
    }
    return MOCK_PATIENTS
  })
  const [refillTasks, setRefillTasks] = useState<RefillTask[]>(MOCK_REFILL_TASKS)
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS)
  const [communications, setCommunications] = useState<CommunicationLog[]>(MOCK_COMMUNICATIONS)
  const [timeline, setTimeline] = useState<TimelineEvent[]>(MOCK_TIMELINE)
  const [staff, setStaff] = useState<StaffMember[]>(() => {
    try {
      const raw = localStorage.getItem("afyacare.staff")
      if (raw) return JSON.parse(raw) as StaffMember[]
    } catch { /* ignore */ }
    return MOCK_STAFF
  })
  const [templates, setTemplates] = useState<ReminderTemplate[]>(() => {
    try {
      const raw = localStorage.getItem("afyacare.templates")
      if (raw) return JSON.parse(raw) as ReminderTemplate[]
    } catch { /* ignore */ }
    return MOCK_TEMPLATES
  })
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)
  const [patientSearch, setPatientSearch] = useState("")
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false)
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem("afyacare.patients", JSON.stringify(patients))
    } catch {
      /* ignore */
    }
  }, [patients])

  useEffect(() => {
    try {
      localStorage.setItem("afyacare.staff", JSON.stringify(staff))
    } catch { /* ignore */ }
  }, [staff])

  useEffect(() => {
    try {
      localStorage.setItem("afyacare.templates", JSON.stringify(templates))
    } catch { /* ignore */ }
  }, [templates])

  const handleDispense = useCallback((taskId: string) => {
    setRefillTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, status: "Refilled" as const, daysRemaining: 30 }
      }
      return t
    }))
    const task = refillTasks.find(t => t.id === taskId)
    if (task) {
      const patient = patients.find(p => p.id === task.patientId)
      const med = patient?.medications.find(m => m.id === task.medicationId)
      setTimeline(prev => [...prev, {
        id: `t${Date.now()}`,
        patientId: task.patientId,
        type: "dispense",
        description: `Dispensed ${med?.name} ${med?.dosage} x${med?.quantityPerFill}`,
        timestamp: new Date().toISOString(),
        actor: "Pharm. John Otieno",
      }])
    }
  }, [refillTasks, patients])

  const handleSendCommunication = useCallback((log: Omit<CommunicationLog, "id" | "sentAt" | "delivered" | "acknowledged">) => {
    const newLog: CommunicationLog = {
      ...log,
      id: `c${Date.now()}`,
      sentAt: new Date().toISOString(),
      delivered: true,
      acknowledged: false,
    }
    setCommunications(prev => [...prev, newLog])
    setTimeline(prev => [...prev, {
      id: `t${Date.now()}`,
      patientId: log.patientId,
      type: "communication",
      description: `${log.channel} sent: ${log.message.slice(0, 60)}...`,
      timestamp: new Date().toISOString(),
      actor: "System",
    }])
  }, [])

  const handleOrderUpdate = useCallback((orderId: string, status: Order["status"]) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o))
  }, [])

  const handleCheckIn = useCallback((patientId: string, data: { missedDoses: number; sideEffects: string; feelingBetter: boolean }) => {
    setTimeline(prev => [...prev, {
      id: `t${Date.now()}`,
      patientId,
      type: "check-in",
      description: `Patient completed check-in: ${data.missedDoses} missed doses, ${data.feelingBetter ? "improving" : "no improvement"}${data.sideEffects ? `, side effects: ${data.sideEffects}` : ""}`,
      timestamp: new Date().toISOString(),
      actor: patients.find(p => p.id === patientId)?.firstName || "Patient",
    }])
  }, [patients])

  const handleRequestRefill = useCallback((patientId: string, medicationId: string) => {
    const newOrder: Order = {
      id: `o${Date.now()}`,
      patientId,
      status: "Requested",
      method: "Click & Collect",
      items: [{ medicationId, quantity: patients.find(p => p.id === patientId)?.medications.find(m => m.id === medicationId)?.quantityPerFill || 30 }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setOrders(prev => [...prev, newOrder])
    setTimeline(prev => [...prev, {
      id: `t${Date.now()}`,
      patientId,
      type: "order",
      description: "Refill request submitted by patient",
      timestamp: new Date().toISOString(),
      actor: patients.find(p => p.id === patientId)?.firstName || "Patient",
    }])
  }, [patients])

  const handleAddPatient = useCallback((patient: Patient) => {
    setPatients(prev => [...prev, patient])
    setTimeline(prev => [...prev, {
      id: `t${Date.now()}`,
      patientId: patient.id,
      type: "registration",
      description: `Patient registered: ${patient.firstName} ${patient.lastName}`,
      timestamp: new Date().toISOString(),
      actor: "System",
    }])
  }, [])

  const handleUpdatePatient = useCallback((updated: Patient) => {
    setPatients(prev => prev.map(p => (p.id === updated.id ? updated : p)))
    setSelectedPatient(prev => (prev && prev.id === updated.id ? updated : prev))
    setTimeline(prev => [
      ...prev,
      {
        id: `t${Date.now()}`,
        patientId: updated.id,
        type: "update",
        description: `Patient details updated: ${updated.firstName} ${updated.lastName}`,
        timestamp: new Date().toISOString(),
        actor: "Dr. Mary Njeri",
      },
    ])
    setIsEditPatientOpen(false)
    setEditingPatient(null)
  }, [])

  const handleReminderDispatch = useCallback((patientId: string, results: DispatchResult[]) => {
    results.forEach(r => {
      setTimeline(prev => [...prev, {
        id: `t${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        patientId,
        type: "communication",
        description: `Reminder dispatched to ${r.recipientType} (${r.recipientName}) via ${r.channel}`,
        timestamp: new Date().toISOString(),
        actor: "Reminder Engine",
      }])
    })
  }, [])

  const handleAddMedication = useCallback((patientId: string, medication: Medication) => {
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, medications: [...p.medications, medication] } : p))
    const interval = medication.refillIntervalDays ?? 30
    const due = new Date()
    due.setDate(due.getDate() + interval)
    const status: RefillStatus = interval <= 2 ? "Due in 2 Days" : interval <= 7 ? "Due in 7 Days" : "Due in 14 Days"
    const newTask: RefillTask = {
      id: `rt${Date.now()}`,
      patientId,
      medicationId: medication.id,
      status,
      dueDate: due.toISOString().slice(0, 10),
      daysRemaining: interval,
      lastDispensed: new Date().toISOString().slice(0, 10),
    }
    setRefillTasks(prev => [...prev, newTask])
    setTimeline(prev => [...prev, {
      id: `t${Date.now()}`,
      patientId,
      type: "dispense",
      description: `Prescribed ${medication.name} ${medication.dosage} x${medication.quantityPerFill} (${medication.frequency})`,
      timestamp: new Date().toISOString(),
      actor: "Pharm. John Otieno",
    }])
  }, [])

  const filteredPatients = patients.filter(p => {
    const q = patientSearch.toLowerCase()
    return !q || `${p.firstName} ${p.lastName} ${p.phone} ${p.nationalId}`.toLowerCase().includes(q)
  })

  const RoleIcon = ROLE_CONFIG[role].icon

  return (
    <div className="min-h-screen bg-zinc-50">
      <Toaster position="top-right" richColors />

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-zinc-200 flex-col z-40">
        {/* Logo */}
        <div className="p-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Storefront size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">AfyaCare</p>
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Chronic Care Hub</p>
            </div>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="p-4 border-b border-zinc-100">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Workspace</p>
          <div className="space-y-1">
            {(Object.keys(ROLE_CONFIG) as Role[]).map(r => {
              const cfg = ROLE_CONFIG[r]
              return (
                <button key={r} onClick={() => { setRole(r); setNavItem(r === "admin" ? "workspace" : r === "pharmacist" ? "queue" : r === "assistant" ? "orders" : "portal") }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    role === r ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <cfg.icon size={16} weight={role === r ? "fill" : "regular"} className={role === r ? "text-emerald-600" : "text-zinc-400"} />
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Navigate</p>
          <div className="space-y-1">
            {NAV_ITEMS[role].map(item => (
              <button key={item.id} onClick={() => setNavItem(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  navItem === item.id ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <item.icon size={16} className={navItem === item.id ? "text-emerald-600" : "text-zinc-400"} />
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-xs font-bold text-emerald-700">MN</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-900 truncate">Dr. Mary Njeri</p>
              <p className="text-[10px] text-zinc-400">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-zinc-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Storefront size={16} className="text-white" />
              </div>
              <span className="text-sm font-bold text-zinc-900">AfyaCare</span>
            </div>
            <div className="relative">
              <button onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-lg text-xs font-medium text-zinc-700">
                <RoleIcon size={14} className="text-emerald-600" />
                {ROLE_CONFIG[role].label}
                <CaretDown size={12} className="text-zinc-400" />
              </button>
              <AnimatePresence>
                {roleMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.96 }}
                    className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-zinc-200 shadow-lg py-1 z-50"
                  >
                    {(Object.keys(ROLE_CONFIG) as Role[]).map(r => {
                      const IconEl = ROLE_CONFIG[r].icon
                      return (
                      <button key={r} onClick={() => { setRole(r); setRoleMenuOpen(false); setNavItem(r === "admin" ? "workspace" : r === "pharmacist" ? "queue" : r === "assistant" ? "orders" : "portal") }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 ${role === r ? "text-emerald-700 font-medium" : "text-zinc-700"}`}
                      >
                        <IconEl size={14} />
                        {ROLE_CONFIG[r].label}
                      </button>
                    )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-zinc-200 px-6 py-3 items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-900">{ROLE_CONFIG[role].label} Workspace</h1>
            <p className="text-xs text-zinc-500">{ROLE_CONFIG[role].description}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-zinc-400">
              {patients.length} patients | {refillTasks.filter(t => t.status !== "Refilled").length} active tasks
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Admin Workspace */}
            {role === "admin" && navItem === "workspace" && (
              <motion.div key="admin-ws" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <AdminWorkspace patients={patients} staff={staff} setStaff={setStaff} templates={templates} setTemplates={setTemplates} communications={communications} timeline={timeline} setTimeline={setTimeline} />
              </motion.div>
            )}

            {/* Pharmacist Queue */}
            {role === "pharmacist" && navItem === "queue" && (
              <motion.div key="pharm-queue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <PharmacistQueue
                  patients={patients}
                  refillTasks={refillTasks}
                  onDispense={handleDispense}
                  onSendCommunication={handleSendCommunication}
                  onAddMedication={handleAddMedication}
                  onReminderDispatch={handleReminderDispatch}
                />
              </motion.div>
            )}

            {/* Assistant Orders */}
            {role === "assistant" && navItem === "orders" && (
              <motion.div key="assistant-orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <AssistantOrders orders={orders} patients={patients} onOrderUpdate={handleOrderUpdate} />
              </motion.div>
            )}

            {/* Patient Portal */}
            {role === "patient" && navItem === "portal" && (
              <motion.div key="patient-portal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <PatientPortal
                  patient={patients[0]}
                  orders={orders}
                  refillTasks={refillTasks}
                  communications={communications}
                  onOrderUpdate={handleOrderUpdate}
                  onCheckIn={handleCheckIn}
                  onRequestRefill={handleRequestRefill}
                />
              </motion.div>
            )}

            {/* Patient List (shared across roles) */}
            {(navItem === "patients") && (
              <motion.div key="patients-list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="space-y-4">
                  {/* Search + Add Patient */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={patientSearch}
                        onChange={e => setPatientSearch(e.target.value)}
                        placeholder="Search by name, phone, or ID..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      />
                      <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    </div>
                    <button
                      onClick={() => setIsAddPatientOpen(true)}
                      className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all"
                    >
                      <Plus size={16} className="text-white" weight="bold" />
                      Add Patient
                    </button>
                  </div>

                  {/* Patient Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredPatients.map(p => (
                      <motion.div
                        key={p.id}
                        layout
                        onClick={() => setSelectedPatient(p)}
                        className="bg-white rounded-xl border border-zinc-200 p-4 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                              <span className="text-sm font-bold text-emerald-700">{p.firstName[0]}{p.lastName[0]}</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-zinc-900">{p.firstName} {p.lastName}</p>
                              <p className="text-xs text-zinc-500">{p.county} | {p.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                              p.adherenceScore >= 90 ? "bg-emerald-100 text-emerald-700" :
                              p.adherenceScore >= 80 ? "bg-teal-100 text-teal-700" :
                              p.adherenceScore >= 60 ? "bg-amber-100 text-amber-700" :
                              "bg-rose-100 text-rose-700"
                            }`}>{p.adherenceScore}%</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingPatient(p); setIsEditPatientOpen(true) }}
                              className="p-1.5 rounded-lg text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                              aria-label={`Edit ${p.firstName} ${p.lastName}`}
                            >
                              <PencilSimple size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {p.diagnoses.map(d => (
                            <span key={d.id} className="text-[10px] px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full">{d.condition}</span>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                          <Pill size={12} />
                          {p.medications.filter(m => m.active).length} active meds
                          <span className="mx-1">|</span>
                          <span>Last visit: {new Date(p.lastVisit).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Add Patient Modal */}
      <AddPatientModal
        open={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onAddPatient={handleAddPatient}
      />

      {/* Edit Patient Modal */}
      <EditPatientModal
        open={isEditPatientOpen}
        patient={editingPatient}
        onClose={() => { setIsEditPatientOpen(false); setEditingPatient(null) }}
        onSave={handleUpdatePatient}
      />

      {/* Patient 360 Drawer */}
      <AnimatePresence>
        {selectedPatient && (
          <Patient360
            patient={selectedPatient}
            timeline={timeline}
            communications={communications}
            patients={patients}
            onAddMedication={handleAddMedication}
            onEditPatient={(p) => { setEditingPatient(p); setIsEditPatientOpen(true) }}
            onClose={() => setSelectedPatient(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* Inline Assistant Orders component */
function AssistantOrders({ orders, patients, onOrderUpdate }: {
  orders: Order[]
  patients: Patient[]
  onOrderUpdate: (orderId: string, status: Order["status"]) => void
}) {
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "completed">("all")

  const filtered = orders.filter(o => {
    if (filter === "pending") return o.status === "Requested" || o.status === "Reviewing"
    if (filter === "active") return o.status === "Approved" || o.status === "Ready" || o.status === "Dispatched"
    if (filter === "completed") return o.status === "Delivered" || o.status === "Collected" || o.status === "Closed"
    return true
  })

  const nextStatus = (s: Order["status"]): Order["status"] | null => {
    const idx = ["Requested", "Reviewing", "Approved", "Ready", "Dispatched", "Delivered", "Collected", "Closed"].indexOf(s)
    return idx < 7 ? (["Requested", "Reviewing", "Approved", "Ready", "Dispatched", "Delivered", "Collected", "Closed"][idx + 1] as Order["status"]) : null
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(["all", "pending", "active", "completed"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              filter === f ? "bg-emerald-900 text-white" : "bg-white text-zinc-600 border border-zinc-200 hover:border-emerald-300"
            }`}
          >{f}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(o => {
          const patient = patients.find(p => p.id === o.patientId)
          const next = nextStatus(o.status)
          return (
            <motion.div key={o.id} layout className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                    <ListChecks size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{patient?.firstName} {patient?.lastName}</p>
                    <p className="text-xs text-zinc-500">Order #{o.id.toUpperCase()} | {o.method}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    o.status === "Requested" || o.status === "Reviewing" ? "bg-amber-100 text-amber-700" :
                    o.status === "Approved" || o.status === "Ready" ? "bg-blue-100 text-blue-700" :
                    o.status === "Dispatched" ? "bg-purple-100 text-purple-700" :
                    "bg-emerald-100 text-emerald-700"
                  }`}>{o.status}</span>
                  {next && (
                    <button onClick={() => onOrderUpdate(o.id, next)}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors">
                      Advance
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <ListChecks size={32} className="mx-auto mb-3 text-zinc-300" />
            <p className="text-sm">No orders in this category.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App