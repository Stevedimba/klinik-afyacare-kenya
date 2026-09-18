import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Users, ChartBar, Pill, ShieldCheck, WarningCircle, Phone, GearSix, Storefront, Star, ListChecks, User, HandHeart, FirstAidKit } from "@phosphor-icons/react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import type { Patient, StaffMember, CommunicationLog, TimelineEvent, ReminderTemplate } from "../types/pharmacy"
import { StaffManagement } from "./StaffManagement"
import { TemplateManagement } from "./TemplateManagement"

interface Props {
  patients: Patient[]
  staff: StaffMember[]
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>
  templates: ReminderTemplate[]
  setTemplates: React.Dispatch<React.SetStateAction<ReminderTemplate[]>>
  communications: CommunicationLog[]
  timeline: TimelineEvent[]
  setTimeline: React.Dispatch<React.SetStateAction<TimelineEvent[]>>
}

const ADHERENCE_COLORS = ["#10b981", "#6ee7b7", "#f59e0b", "#f43f5e"]
const ADHERENCE_LABELS = ["Excellent (90+)", "Good (80-89)", "Needs Attention (60-79)", "High Risk (<60)"]
const REFILL_DATA = [
  { month: "Jul", dispensed: 142, overdue: 18 },
  { month: "Aug", dispensed: 156, overdue: 22 },
  { month: "Sep", dispensed: 148, overdue: 15 },
  { month: "Oct", dispensed: 167, overdue: 20 },
  { month: "Nov", dispensed: 173, overdue: 12 },
  { month: "Dec", dispensed: 95, overdue: 8 },
]

function getAdherenceBand(score: number): number {
  if (score >= 90) return 0
  if (score >= 80) return 1
  if (score >= 60) return 2
  return 3
}

export function AdminWorkspace({ patients, staff, setStaff, templates, setTemplates, communications, setTimeline }: Props) {
  const [tab, setTab] = useState<"overview" | "staff" | "templates" | "settings">("overview")

  const avgAdherence = Math.round(patients.reduce((s, p) => s + p.adherenceScore, 0) / patients.length)
  const highRisk = patients.filter(p => p.adherenceScore < 60).length
  const totalMeds = patients.reduce((s, p) => s + p.medications.filter(m => m.active).length, 0)
  const adherenceDist = [0, 1, 2, 3].map(i => ({
    name: ADHERENCE_LABELS[i],
    value: patients.filter(p => getAdherenceBand(p.adherenceScore) === i).length,
  }))

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: ChartBar },
    { id: "staff" as const, label: "Staff", icon: Users },
    { id: "templates" as const, label: "Templates", icon: ListChecks },
    { id: "settings" as const, label: "Settings", icon: GearSix },
  ]

  const addAuditEvent = useCallback((description: string) => {
    setTimeline(prev => [...prev, {
      id: `t${Date.now()}`,
      patientId: "system",
      type: "update" as const,
      description,
      timestamp: new Date().toISOString(),
      actor: "Dr. Mary Njeri",
    }])
  }, [setTimeline])

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-zinc-100 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? "bg-white text-emerald-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <t.icon size={16} weight={tab === t.id ? "fill" : "regular"} />
            {t.label}
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {tab === "overview" && (
          <OverviewTab patients={patients} communications={communications} avgAdherence={avgAdherence} highRisk={highRisk} totalMeds={totalMeds} adherenceDist={adherenceDist} />
        )}
        {tab === "staff" && (
          <StaffManagement staff={staff} setStaff={setStaff} addAuditEvent={addAuditEvent} />
        )}
        {tab === "templates" && (
          <TemplateManagement templates={templates} setTemplates={setTemplates} addAuditEvent={addAuditEvent} />
        )}
        {tab === "settings" && <SettingsTab />}
      </motion.div>
    </div>
  )
}

function OverviewTab({ patients, communications, avgAdherence, highRisk, totalMeds, adherenceDist }: {
  patients: Patient[]; communications: CommunicationLog[]; avgAdherence: number; highRisk: number; totalMeds: number; adherenceDist: { name: string; value: number }[]
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Patients", value: patients.length, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Avg Adherence", value: `${avgAdherence}%`, icon: ShieldCheck, color: "text-teal-600", bg: "bg-teal-50" },
          { label: "High Risk Patients", value: highRisk, icon: WarningCircle, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "Active Prescriptions", value: totalMeds, icon: Pill, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-zinc-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 font-medium">{kpi.label}</p>
                <p className="text-2xl font-bold text-zinc-900 mt-1">{kpi.value}</p>
              </div>
              <div className={`${kpi.bg} p-3 rounded-lg`}><kpi.icon size={22} className={kpi.color} /></div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-5">
          <h3 className="text-sm font-semibold text-zinc-700 mb-4">Monthly Dispensing vs Overdue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={REFILL_DATA} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#71717a" }} />
              <YAxis tick={{ fontSize: 12, fill: "#71717a" }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 12 }} />
              <Bar dataKey="dispensed" fill="#10b981" radius={[4, 4, 0, 0]} name="Dispensed" />
              <Bar dataKey="overdue" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Overdue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <h3 className="text-sm font-semibold text-zinc-700 mb-4">Adherence Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={adherenceDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {adherenceDist.map((_, i) => <Cell key={i} fill={ADHERENCE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {adherenceDist.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ADHERENCE_COLORS[i] }} />
                <span className="text-zinc-600">{d.name}</span>
                <span className="ml-auto font-medium text-zinc-900">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h3 className="text-sm font-semibold text-zinc-700 mb-4">Recent Communications</h3>
        <div className="space-y-3">
          {communications.slice(0, 8).map(c => {
            const patient = patients.find(p => p.id === c.patientId)
            return (
              <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50">
                <div className={`p-2 rounded-lg ${c.channel === "SMS" ? "bg-blue-100" : c.channel === "WhatsApp" ? "bg-green-100" : c.channel === "Push" ? "bg-teal-100" : "bg-purple-100"}`}>
                  <Phone size={14} className={c.channel === "SMS" ? "text-blue-600" : c.channel === "WhatsApp" ? "text-green-600" : c.channel === "Push" ? "text-teal-600" : "text-purple-600"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-900">{patient?.firstName} {patient?.lastName}</p>
                    {c.recipientType && (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        c.recipientType === "patient" ? "bg-blue-100 text-blue-700" :
                        c.recipientType === "sponsor" ? "bg-amber-100 text-amber-700" :
                        "bg-purple-100 text-purple-700"
                      }`}>
                        {c.recipientType === "patient" ? <User size={9} /> : c.recipientType === "sponsor" ? <HandHeart size={9} /> : <FirstAidKit size={9} />}
                        {c.recipientName || c.recipientType}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">{c.message}</p>
                </div>
                <span className="text-xs text-zinc-400 whitespace-nowrap">{new Date(c.sentAt).toLocaleDateString()}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SettingsTab() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Storefront size={20} className="text-emerald-600" />
          <h3 className="text-sm font-semibold text-zinc-700">Pharmacy Profile</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="text-xs font-medium text-zinc-500">Name</label><p className="text-sm font-medium text-zinc-900 mt-1">AfyaCare Pharmacy</p></div>
          <div><label className="text-xs font-medium text-zinc-500">Location</label><p className="text-sm font-medium text-zinc-900 mt-1">Nairobi, Kenya</p></div>
          <div><label className="text-xs font-medium text-zinc-500">PCPB License</label><p className="text-sm font-medium text-zinc-900 mt-1">PCPB/PB/2019/04521</p></div>
          <div><label className="text-xs font-medium text-zinc-500">Till Number</label><p className="text-sm font-medium text-zinc-900 mt-1">M-Pesa: 482917</p></div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Star size={20} className="text-amber-500" />
          <h3 className="text-sm font-semibold text-zinc-700">Subscription Plan</h3>
        </div>
        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <div>
            <p className="text-sm font-semibold text-emerald-900">Clinical Pro</p>
            <p className="text-xs text-emerald-700 mt-0.5">Unlimited patients, SMS/WhatsApp, delivery tracking</p>
          </div>
          <span className="text-xs font-medium text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-emerald-200">KES 4,500/mo</span>
        </div>
      </div>
    </div>
  )
}