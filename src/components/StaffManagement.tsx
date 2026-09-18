import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, PencilSimple, Prohibit, Check, X, MagnifyingGlass, UserPlus } from "@phosphor-icons/react"
import { toast } from "sonner"
import type { StaffMember, Role } from "../types/pharmacy"

interface Props {
  staff: StaffMember[]
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>
  addAuditEvent: (d: string) => void
}

export function StaffManagement({ staff, setStaff, addAuditEvent }: Props) {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)

  const filtered = staff.filter(s => {
    const q = search.toLowerCase()
    const matchesSearch = !q || `${s.name} ${s.email} ${s.phone}`.toLowerCase().includes(q)
    const matchesRole = roleFilter === "all" || s.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleToggleActive = (id: string) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s))
    const member = staff.find(s => s.id === id)
    if (member) {
      const action = member.active ? "deactivated" : "reactivated"
      toast.success(`${member.name} ${action}`)
      addAuditEvent(`Staff ${action}: ${member.name}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search staff by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
        </div>
        <div className="flex gap-2">
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as "all" | Role)}
            className="px-3 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="pharmacist">Pharmacist</option>
            <option value="assistant">Assistant</option>
          </select>
          <button onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all">
            <UserPlus size={16} /> Add Staff
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="divide-y divide-zinc-100">
          {filtered.map(s => (
            <div key={s.id} className={`flex items-center gap-4 p-4 hover:bg-zinc-50 transition-colors ${!s.active ? "opacity-60" : ""}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.active ? "bg-emerald-100" : "bg-zinc-200"}`}>
                <span className={`text-sm font-bold ${s.active ? "text-emerald-700" : "text-zinc-500"}`}>
                  {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900">{s.name}</p>
                <p className="text-xs text-zinc-500">{s.email} | {s.phone}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  s.role === "admin" ? "bg-purple-100 text-purple-700" : s.role === "pharmacist" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                }`}>{s.role}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                  s.active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-500"
                }`}>{s.active ? "Active" : "Inactive"}</span>
                <button onClick={() => setEditingStaff(s)} className="p-1.5 rounded-lg text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors" aria-label={`Edit ${s.name}`}>
                  <PencilSimple size={14} />
                </button>
                <button onClick={() => handleToggleActive(s.id)}
                  className={`p-1.5 rounded-lg transition-colors ${s.active ? "text-zinc-400 hover:bg-rose-50 hover:text-rose-600" : "text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600"}`}
                  aria-label={s.active ? `Deactivate ${s.name}` : `Reactivate ${s.name}`}>
                  {s.active ? <Prohibit size={14} /> : <Check size={14} />}
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <Users size={32} className="mx-auto mb-3 text-zinc-300" />
              <p className="text-sm">No staff members match your search.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && <StaffFormModal onClose={() => setShowAddModal(false)} onSave={(data) => {
          const newStaff: StaffMember = { ...data, id: `st${Date.now()}`, joinedAt: new Date().toISOString().slice(0, 10), active: true }
          setStaff(prev => [...prev, newStaff])
          toast.success(`${newStaff.name} added to team`)
          addAuditEvent(`New staff added: ${newStaff.name} (${newStaff.role})`)
          setShowAddModal(false)
        }} />}
      </AnimatePresence>

      <AnimatePresence>
        {editingStaff && <StaffFormModal staff={editingStaff} onClose={() => setEditingStaff(null)} onSave={(data) => {
          setStaff(prev => prev.map(s => s.id === editingStaff.id ? { ...s, ...data } : s))
          toast.success(`${data.name} updated`)
          addAuditEvent(`Staff updated: ${data.name}`)
          setEditingStaff(null)
        }} />}
      </AnimatePresence>
    </div>
  )
}

function StaffFormModal({ staff, onClose, onSave }: {
  staff?: StaffMember
  onClose: () => void
  onSave: (data: { name: string; role: Role; email: string; phone: string }) => void
}) {
  const [name, setName] = useState(staff?.name ?? "")
  const [role, setRole] = useState<Role>(staff?.role ?? "assistant")
  const [email, setEmail] = useState(staff?.email ?? "")
  const [phone, setPhone] = useState(staff?.phone ?? "+254")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please fill all required fields")
      return
    }
    onSave({ name: name.trim(), role, email: email.trim(), phone: phone.trim() })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-zinc-900">{staff ? "Edit Staff Member" : "Add Staff Member"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"><X size={18} className="text-zinc-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block">Full Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Pharm. Jane Wairimu"
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block">Role *</label>
            <select value={role} onChange={e => setRole(e.target.value as Role)}
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
              <option value="admin">Administrator</option>
              <option value="pharmacist">Pharmacist</option>
              <option value="assistant">Assistant</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block">Email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@afyacare.co.ke"
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block">Phone *</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254700000000"
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
          </div>
          {staff && (
            <div className="text-xs text-zinc-400">Joined: {new Date(staff.joinedAt).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}</div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all">
              {staff ? "Save Changes" : "Add Staff"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
