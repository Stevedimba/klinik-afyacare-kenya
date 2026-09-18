import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ListChecks, Plus, PencilSimple, Trash, X, Copy } from "@phosphor-icons/react"
import { toast } from "sonner"
import type { ReminderTemplate } from "../types/pharmacy"

interface Props {
  templates: ReminderTemplate[]
  setTemplates: React.Dispatch<React.SetStateAction<ReminderTemplate[]>>
  addAuditEvent: (d: string) => void
}

const PLACEHOLDERS = ["{name}", "{medication}", "{days}", "{pharmacy}", "{phone}", "{rider}", "{dueDate}"]
const CHANNEL_COLORS: Record<string, string> = {
  SMS: "bg-blue-100 text-blue-700",
  WhatsApp: "bg-emerald-100 text-emerald-700",
  Call: "bg-purple-100 text-purple-700",
}

export function TemplateManagement({ templates, setTemplates, addAuditEvent }: Props) {
  const [channelFilter, setChannelFilter] = useState<"all" | "SMS" | "WhatsApp" | "Call">("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ReminderTemplate | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<ReminderTemplate | null>(null)

  const filtered = templates.filter(t => channelFilter === "all" || t.channel === channelFilter)

  const handleDelete = () => {
    if (!deletingTemplate) return
    setTemplates(prev => prev.filter(t => t.id !== deletingTemplate.id))
    toast.success(`Template "${deletingTemplate.name}" deleted`)
    addAuditEvent(`Template deleted: ${deletingTemplate.name}`)
    setDeletingTemplate(null)
  }

  const handleCopy = (body: string) => {
    navigator.clipboard.writeText(body)
    toast.success("Template body copied to clipboard")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 bg-zinc-100 rounded-lg p-1">
          {(["all", "SMS", "WhatsApp", "Call"] as const).map(ch => (
            <button key={ch} onClick={() => setChannelFilter(ch)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${channelFilter === ch ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>
              {ch === "all" ? "All" : ch}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all">
          <Plus size={16} /> New Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(t => (
          <motion.div key={t.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-zinc-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-zinc-900">{t.name}</h4>
                {t.timingTag && <span className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded font-medium">{t.timingTag}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${CHANNEL_COLORS[t.channel]}`}>{t.channel}</span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-600 capitalize">{t.category}</span>
              </div>
            </div>
            <p className="text-xs text-zinc-600 bg-zinc-50 rounded-lg p-3 font-mono leading-relaxed">{t.body}</p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] text-zinc-400">Updated: {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" }) : "N/A"}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => handleCopy(t.body)} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors" aria-label="Copy template">
                  <Copy size={14} />
                </button>
                <button onClick={() => setEditingTemplate(t)} className="p-1.5 rounded-lg text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors" aria-label="Edit template">
                  <PencilSimple size={14} />
                </button>
                <button onClick={() => setDeletingTemplate(t)} className="p-1.5 rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" aria-label="Delete template">
                  <Trash size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-500">
            <ListChecks size={32} className="mx-auto mb-3 text-zinc-300" />
            <p className="text-sm">No templates found for this channel.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && <TemplateFormModal onClose={() => setShowAddModal(false)} onSave={(data) => {
          const newTpl: ReminderTemplate = { ...data, id: `tpl${Date.now()}`, updatedAt: new Date().toISOString() }
          setTemplates(prev => [...prev, newTpl])
          toast.success(`Template "${newTpl.name}" created`)
          addAuditEvent(`Template created: ${newTpl.name}`)
          setShowAddModal(false)
        }} />}
      </AnimatePresence>

      <AnimatePresence>
        {editingTemplate && <TemplateFormModal template={editingTemplate} onClose={() => setEditingTemplate(null)} onSave={(data) => {
          setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t))
          toast.success(`Template "${data.name}" updated`)
          addAuditEvent(`Template updated: ${data.name}`)
          setEditingTemplate(null)
        }} />}
      </AnimatePresence>

      <AnimatePresence>
        {deletingTemplate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setDeletingTemplate(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                  <Trash size={18} className="text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Delete Template?</h3>
                  <p className="text-xs text-zinc-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-zinc-700 mb-5">
                You are about to delete <strong>{deletingTemplate.name}</strong>. Any scheduled reminders using this template will need to be reassigned.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeletingTemplate(null)} className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
                <button onClick={handleDelete} className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 active:scale-[0.98]">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TemplateFormModal({ template, onClose, onSave }: {
  template?: ReminderTemplate
  onClose: () => void
  onSave: (data: { name: string; channel: "SMS" | "WhatsApp" | "Call"; body: string; timingTag: string; category: ReminderTemplate["category"] }) => void
}) {
  const [name, setName] = useState(template?.name ?? "")
  const [channel, setChannel] = useState<"SMS" | "WhatsApp" | "Call">(template?.channel ?? "SMS")
  const [body, setBody] = useState(template?.body ?? "")
  const [timingTag, setTimingTag] = useState(template?.timingTag ?? "Custom")
  const [category, setCategory] = useState<ReminderTemplate["category"]>(template?.category ?? "refill")

  const insertPlaceholder = (ph: string) => { setBody(prev => prev + ph) }

  const preview = body
    .replace(/\{name\}/g, "Wanjiku Kamau")
    .replace(/\{medication\}/g, "Lisinopril 10mg")
    .replace(/\{days\}/g, "7")
    .replace(/\{pharmacy\}/g, "AfyaCare Pharmacy")
    .replace(/\{phone\}/g, "+254712345678")
    .replace(/\{rider\}/g, "Brian Odhiambo")
    .replace(/\{dueDate\}/g, "15 Dec 2024")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !body.trim()) {
      toast.error("Template name and body are required")
      return
    }
    onSave({ name: name.trim(), channel, body: body.trim(), timingTag, category })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-zinc-900">{template ? "Edit Template" : "New Template"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"><X size={18} className="text-zinc-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">Template Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. T-7 WhatsApp Reminder"
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">Channel *</label>
              <select value={channel} onChange={e => setChannel(e.target.value as "SMS" | "WhatsApp" | "Call")}
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                <option value="SMS">SMS</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Call">Call</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value as ReminderTemplate["category"])}
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                <option value="refill">Refill</option>
                <option value="delivery">Delivery</option>
                <option value="adherence">Adherence</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">Timing Tag</label>
              <select value={timingTag} onChange={e => setTimingTag(e.target.value)}
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                <option value="T-14">T-14 (14 days before)</option>
                <option value="T-7">T-7 (7 days before)</option>
                <option value="T-0">T-0 (Due today)</option>
                <option value="T+3">T+3 (3 days overdue)</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block">Message Body *</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={4}
              placeholder="Write your reminder message here..."
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 resize-none font-mono" />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PLACEHOLDERS.map(ph => (
                <button key={ph} type="button" onClick={() => insertPlaceholder(ph)}
                  className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded text-[10px] font-mono hover:bg-emerald-100 hover:text-emerald-700 transition-colors">
                  {ph}
                </button>
              ))}
            </div>
          </div>
          {body.trim() && (
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">Live Preview</label>
              <div className="px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-900 leading-relaxed">
                {preview}
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all">
              {template ? "Save Changes" : "Create Template"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
