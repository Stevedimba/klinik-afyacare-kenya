import type {
  Patient,
  RefillTask,
  Medication,
  RecipientType,
  ReminderPayload,
  DispatchResult,
  CommunicationLog,
  PharmacistAlert,
} from "../types/pharmacy"

/**
 * Generates the exact formatted reminder payload requested:
 * 🔔 Refill due in X days
 * Patient: [Name]
 * Medication: [Med]
 * Action: [Action]
 */
export function generateReminderPayload(params: {
  patientName: string
  medicationName: string
  daysRemaining: number
  action?: string
}): ReminderPayload {
  const { patientName, medicationName, daysRemaining, action } = params
  let header: string
  if (daysRemaining < 0) {
    header = `\u{1F514} Overdue by ${Math.abs(daysRemaining)} days`
  } else if (daysRemaining === 0) {
    header = `\u{1F514} Due Today`
  } else {
    header = `\u{1F514} Refill due in ${daysRemaining} days`
  }
  return {
    header,
    patientName,
    medicationName,
    action: action || "Contact patient",
    daysDue: daysRemaining,
  }
}

/** Formats the payload into the multi-line notification string */
export function formatPayload(payload: ReminderPayload): string {
  return `${payload.header}
Patient: ${payload.patientName}
Medication: ${payload.medicationName}
Action: ${payload.action}`
}

/** Determines the appropriate action based on urgency */
export function getActionForUrgency(daysRemaining: number, recipientType: RecipientType): string {
  if (recipientType === "pharmacist") {
    if (daysRemaining < -7) return "URGENT: Clinical intervention required"
    if (daysRemaining < 0) return "Review and escalate patient outreach"
    if (daysRemaining <= 2) return "Prepare refill for dispensing"
    return "Monitor upcoming refill schedule"
  }
  if (recipientType === "sponsor") {
    if (daysRemaining < 0) return "Please ensure patient collects medication urgently"
    if (daysRemaining <= 3) return "Remind patient to collect their medication"
    return "Patient refill coming up - assist if needed"
  }
  // patient
  if (daysRemaining < 0) return "Visit pharmacy urgently to collect your medication"
  if (daysRemaining === 0) return "Your medication is ready for collection today"
  if (daysRemaining <= 3) return "Plan to collect your medication soon"
  return "Your refill is approaching - book collection"
}

/** Simulates dispatching a reminder to the patient */
export function dispatchToPatient(
  patient: Patient,
  medication: Medication,
  daysRemaining: number
): DispatchResult {
  const patientName = `${patient.firstName} ${patient.lastName}`
  const action = getActionForUrgency(daysRemaining, "patient")
  const payload = generateReminderPayload({
    patientName,
    medicationName: medication.name,
    daysRemaining,
    action,
  })
  return {
    success: true,
    recipientType: "patient",
    recipientName: patientName,
    recipientContact: patient.phone,
    channel: patient.consentWhatsAppReminders ? "WhatsApp" : "SMS",
    payload,
    formattedMessage: formatPayload(payload),
    deliveredAt: new Date().toISOString(),
    acknowledged: false,
  }
}

/** Simulates dispatching a reminder to the patient's sponsor */
export function dispatchToSponsor(
  patient: Patient,
  medication: Medication,
  daysRemaining: number
): DispatchResult | null {
  if (!patient.sponsor || !patient.sponsor.consentGiven) return null
  const patientName = `${patient.firstName} ${patient.lastName}`
  const action = getActionForUrgency(daysRemaining, "sponsor")
  const payload = generateReminderPayload({
    patientName,
    medicationName: medication.name,
    daysRemaining,
    action,
  })
  return {
    success: true,
    recipientType: "sponsor",
    recipientName: patient.sponsor.name,
    recipientContact: patient.sponsor.phone,
    channel: "SMS",
    payload,
    formattedMessage: formatPayload(payload),
    deliveredAt: new Date().toISOString(),
    acknowledged: false,
  }
}

/** Simulates dispatching a clinical alert to the pharmacist queue */
export function dispatchToPharmacist(
  patient: Patient,
  medication: Medication,
  daysRemaining: number
): DispatchResult {
  const patientName = `${patient.firstName} ${patient.lastName}`
  const action = getActionForUrgency(daysRemaining, "pharmacist")
  const payload = generateReminderPayload({
    patientName,
    medicationName: medication.name,
    daysRemaining,
    action,
  })
  return {
    success: true,
    recipientType: "pharmacist",
    recipientName: "Pharm. John Otieno",
    recipientContact: "In-App Queue",
    channel: "In-App",
    payload,
    formattedMessage: formatPayload(payload),
    deliveredAt: new Date().toISOString(),
    acknowledged: false,
  }
}

/** Converts a DispatchResult to a CommunicationLog entry */
export function resultToCommLog(result: DispatchResult): Omit<CommunicationLog, "id" | "sentAt" | "delivered" | "acknowledged"> {
  return {
    patientId: "", // caller must set this
    channel: result.channel,
    direction: "outbound",
    message: result.formattedMessage,
    templateUsed: `Reminder Engine (${result.recipientType})`,
    recipientType: result.recipientType,
    recipientName: result.recipientName,
    recipientContact: result.recipientContact,
    reminderPayload: result.payload,
  }
}

/** Converts a DispatchResult to a PharmacistAlert */
export function resultToPharmacistAlert(result: DispatchResult, patientId: string): PharmacistAlert {
  const severity: PharmacistAlert["severity"] =
    result.payload.daysDue < -7 ? "critical" :
    result.payload.daysDue < 0 ? "warning" : "info"
  return {
    id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    patientId,
    patientName: result.payload.patientName,
    medicationName: result.payload.medicationName,
    message: result.formattedMessage,
    timestamp: new Date().toISOString(),
    read: false,
    severity,
  }
}

/**
 * Automatic sweep: calculates all active reminders from refill tasks.
 * Returns dispatch results grouped by recipient for the escalation pipeline.
 */
export function runReminderSweep(
  patients: Patient[],
  refillTasks: RefillTask[]
): { patientDispatches: DispatchResult[]; sponsorDispatches: DispatchResult[]; pharmacistDispatches: DispatchResult[] } {
  const patientDispatches: DispatchResult[] = []
  const sponsorDispatches: DispatchResult[] = []
  const pharmacistDispatches: DispatchResult[] = []

  const activeTasks = refillTasks.filter(t => t.status !== "Refilled" && t.status !== "Discontinued")

  for (const task of activeTasks) {
    const patient = patients.find(p => p.id === task.patientId)
    if (!patient) continue
    const med = patient.medications.find(m => m.id === task.medicationId)
    if (!med) continue

    // Always dispatch to patient
    const pResult = dispatchToPatient(patient, med, task.daysRemaining)
    patientDispatches.push(pResult)

    // Escalate to sponsor if overdue or high-risk patient
    if (task.daysRemaining <= 2 || patient.adherenceScore < 60) {
      const sResult = dispatchToSponsor(patient, med, task.daysRemaining)
      if (sResult) sponsorDispatches.push(sResult)
    }

    // Always alert pharmacist for overdue or critical
    if (task.daysRemaining <= 0 || patient.adherenceScore < 60) {
      const phResult = dispatchToPharmacist(patient, med, task.daysRemaining)
      pharmacistDispatches.push(phResult)
    }
  }

  return { patientDispatches, sponsorDispatches, pharmacistDispatches }
}
