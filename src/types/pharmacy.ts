export type Role = "admin" | "pharmacist" | "assistant" | "patient"

export type ChronicCondition =
  | "Hypertension"
  | "Type 2 Diabetes"
  | "Asthma"
  | "COPD"
  | "Cardiovascular Disease"
  | "Epilepsy"
  | "HIV"
  | "Hyperlipidemia"
  | "Chronic Kidney Disease"
  | "Arthritis"
  | "Thyroid Disorder"
  | "Mental Health"

export type Gender = "Male" | "Female" | "Other"

export type AdherenceRisk = "Excellent" | "Good" | "Needs Attention" | "High Risk"

export type RefillStatus =
  | "Overdue"
  | "Due Today"
  | "Due in 2 Days"
  | "Due in 7 Days"
  | "Due in 14 Days"
  | "Refilled"
  | "Patient Unreachable"
  | "Discontinued"

export type OrderStatus =
  | "Requested"
  | "Reviewing"
  | "Approved"
  | "Ready"
  | "Dispatched"
  | "Delivered"
  | "Collected"
  | "Closed"

export type FulfilmentMethod = "Click & Collect" | "Delivery"

export interface Diagnosis {
  id: string
  condition: ChronicCondition
  diagnosedOn: string
  severity: "Mild" | "Moderate" | "Severe"
  notes: string
}

export interface Medication {
  id: string
  name: string
  genericName: string
  dosage: string
  frequency: string
  dailyDose: number
  quantityPerFill: number
  startDate: string
  endDate?: string
  active: boolean
  refillsRemaining: number
  prescription?: string
  duration?: string
  refillIntervalDays?: number
}

export interface VitalRecord {
  id: string
  recordedAt: string
  systolic?: number
  diastolic?: number
  glucose?: number
  weight?: number
  pulse?: number
  spo2?: number
  notes: string
}

export interface Sponsor {
  id: string
  name: string
  phone: string
  relationship: string
  consentGiven: boolean
  consentDate: string
}

export interface Patient {
  id: string
  firstName: string
  lastName: string
  nationalId: string
  phone: string
  email?: string
  county: string
  subCounty: string
  dateOfBirth: string
  gender: Gender
  diagnoses: Diagnosis[]
  medications: Medication[]
  vitals: VitalRecord[]
  sponsor?: Sponsor
  adherenceScore: number
  lastVisit: string
  registeredAt: string
  consentDataProcessing: boolean
  consentSmsReminders: boolean
  consentWhatsAppReminders: boolean
  clinicalNotes?: string
  updatedAt?: string
}

export interface RefillTask {
  id: string
  patientId: string
  medicationId: string
  status: RefillStatus
  dueDate: string
  daysRemaining: number
  lastDispensed?: string
}

export type RecipientType = "patient" | "sponsor" | "pharmacist"

export interface ReminderPayload {
  header: string
  patientName: string
  medicationName: string
  action: string
  daysDue: number
}

export interface CommunicationLog {
  id: string
  patientId: string
  channel: "SMS" | "WhatsApp" | "Call" | "In-App" | "Push"
  direction: "outbound" | "inbound"
  message: string
  sentAt: string
  delivered: boolean
  acknowledged: boolean
  templateUsed?: string
  recipientType?: RecipientType
  recipientName?: string
  recipientContact?: string
  reminderPayload?: ReminderPayload
}

export interface DispatchResult {
  success: boolean
  recipientType: RecipientType
  recipientName: string
  recipientContact: string
  channel: CommunicationLog["channel"]
  payload: ReminderPayload
  formattedMessage: string
  deliveredAt: string
  acknowledged: boolean
}

export interface Order {
  id: string
  patientId: string
  status: OrderStatus
  method: FulfilmentMethod
  items: { medicationId: string; quantity: number }[]
  createdAt: string
  updatedAt: string
  deliveryAddress?: string
  riderName?: string
  riderPhone?: string
}

export interface StaffMember {
  id: string
  name: string
  role: Role
  email: string
  phone: string
  active: boolean
  joinedAt: string
}

export interface TimelineEvent {
  id: string
  patientId: string
  type: "dispense" | "vital" | "communication" | "order" | "check-in" | "registration" | "update"
  description: string
  timestamp: string
  actor: string
}

export interface CheckInForm {
  missedDoses: number
  sideEffects: string
  feelingBetter: boolean
  refillNeeded: boolean
  pharmacistCallRequested: boolean
  notes: string
}

export interface ReminderTemplate {
  id: string
  name: string
  channel: "SMS" | "WhatsApp" | "Call"
  body: string
  timingTag?: string
  category: "refill" | "delivery" | "adherence" | "general"
  updatedAt?: string
}

export interface AppStore {
  patients: Patient[]
  refillTasks: RefillTask[]
  orders: Order[]
  communications: CommunicationLog[]
  staff: StaffMember[]
  templates: ReminderTemplate[]
  timeline: TimelineEvent[]
}

export interface PharmacistAlert {
  id: string
  patientId: string
  patientName: string
  medicationName: string
  message: string
  timestamp: string
  read: boolean
  severity: "info" | "warning" | "critical"
}