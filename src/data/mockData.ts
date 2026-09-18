import type { Patient, RefillTask, Order, CommunicationLog, StaffMember, TimelineEvent, ReminderTemplate } from "../types/pharmacy"

export const MOCK_PATIENTS: Patient[] = [
  {
    id: "p-test",
    firstName: "Test",
    lastName: "Patient",
    nationalId: "00000000",
    phone: "0700000000",
    county: "Nairobi",
    subCounty: "Central",
    dateOfBirth: "1980-01-01",
    gender: "Male",
    diagnoses: [],
    medications: [],
    vitals: [],
    sponsor: { id: "s-test", name: "Test Sponsor", phone: "0700000001", relationship: "Other", consentGiven: true, consentDate: "2024-12-06" },
    adherenceScore: 100,
    lastVisit: "2024-12-06",
    registeredAt: "2024-12-06",
    consentDataProcessing: true,
    consentSmsReminders: true,
    consentWhatsAppReminders: true,
  },
  {
    id: "p1",
    firstName: "Wanjiku",
    lastName: "Kamau",
    nationalId: "28475619",
    phone: "+254712345678",
    county: "Nairobi",
    subCounty: "Westlands",
    dateOfBirth: "1968-03-15",
    gender: "Female",
    diagnoses: [
      { id: "d1", condition: "Hypertension", diagnosedOn: "2019-06-12", severity: "Moderate", notes: "BP consistently elevated, on ACE inhibitor" },
      { id: "d2", condition: "Type 2 Diabetes", diagnosedOn: "2021-01-20", severity: "Mild", notes: "Managed with metformin, diet controlled" }
    ],
    medications: [
      { id: "m1", name: "Lisinopril", genericName: "Lisinopril", dosage: "10mg", frequency: "Once daily", dailyDose: 1, quantityPerFill: 30, startDate: "2019-06-15", active: true, refillsRemaining: 8, prescription: "Take one tablet by mouth every morning with or without food.", duration: "30 days", refillIntervalDays: 30 },
      { id: "m2", name: "Metformin", genericName: "Metformin HCl", dosage: "500mg", frequency: "Twice daily", dailyDose: 2, quantityPerFill: 60, startDate: "2021-01-25", active: true, refillsRemaining: 5, prescription: "Take one tablet twice daily with meals to reduce stomach upset.", duration: "30 days", refillIntervalDays: 30 }
    ],
    vitals: [
      { id: "v1", recordedAt: "2024-11-15T09:30:00", systolic: 142, diastolic: 92, glucose: 7.2, weight: 78, pulse: 78, spo2: 97, notes: "Slightly elevated BP" },
      { id: "v2", recordedAt: "2024-10-15T10:00:00", systolic: 138, diastolic: 88, glucose: 6.8, weight: 79, pulse: 72, spo2: 98, notes: "Stable" }
    ],
    sponsor: { id: "s1", name: "Peter Kamau", phone: "+254723456789", relationship: "Son", consentGiven: true, consentDate: "2023-05-10" },
    adherenceScore: 82,
    lastVisit: "2024-11-15",
    registeredAt: "2019-06-12",
    consentDataProcessing: true,
    consentSmsReminders: true,
    consentWhatsAppReminders: true
  },
  {
    id: "p2",
    firstName: "James",
    lastName: "Ochieng",
    nationalId: "34561298",
    phone: "+254734567890",
    county: "Kisumu",
    subCounty: "Kisumu Central",
    dateOfBirth: "1955-11-02",
    gender: "Male",
    diagnoses: [
      { id: "d3", condition: "Cardiovascular Disease", diagnosedOn: "2017-03-08", severity: "Severe", notes: "Post-MI, on dual antiplatelet" },
      { id: "d4", condition: "Hyperlipidemia", diagnosedOn: "2017-03-08", severity: "Moderate", notes: "Statin therapy" }
    ],
    medications: [
      { id: "m3", name: "Aspirin", genericName: "Acetylsalicylic Acid", dosage: "75mg", frequency: "Once daily", dailyDose: 1, quantityPerFill: 30, startDate: "2017-03-10", active: true, refillsRemaining: 12 },
      { id: "m4", name: "Atorvastatin", genericName: "Atorvastatin Calcium", dosage: "40mg", frequency: "Once daily at night", dailyDose: 1, quantityPerFill: 30, startDate: "2017-03-10", active: true, refillsRemaining: 6 },
      { id: "m5", name: "Clopidogrel", genericName: "Clopidogrel Bisulfate", dosage: "75mg", frequency: "Once daily", dailyDose: 1, quantityPerFill: 30, startDate: "2017-06-15", active: true, refillsRemaining: 3 }
    ],
    vitals: [
      { id: "v3", recordedAt: "2024-11-10T14:00:00", systolic: 155, diastolic: 95, glucose: 5.8, weight: 92, pulse: 88, spo2: 94, notes: "BP high, refer to cardiologist" },
      { id: "v4", recordedAt: "2024-09-10T11:00:00", systolic: 148, diastolic: 90, glucose: 5.5, weight: 94, pulse: 82, spo2: 96, notes: "Improving" }
    ],
    adherenceScore: 65,
    lastVisit: "2024-11-10",
    registeredAt: "2017-03-08",
    consentDataProcessing: true,
    consentSmsReminders: true,
    consentWhatsAppReminders: false
  },
  {
    id: "p3",
    firstName: "Amina",
    lastName: "Hassan",
    nationalId: "41256789",
    phone: "+254745678901",
    county: "Mombasa",
    subCounty: "Likoni",
    dateOfBirth: "1985-07-22",
    gender: "Female",
    diagnoses: [
      { id: "d5", condition: "Asthma", diagnosedOn: "2010-04-15", severity: "Moderate", notes: "Exercise-induced, uses preventer" },
      { id: "d6", condition: "HIV", diagnosedOn: "2015-09-01", severity: "Mild", notes: "Well controlled on ART, undetectable viral load" }
    ],
    medications: [
      { id: "m6", name: "Salbutamol Inhaler", genericName: "Salbutamol", dosage: "100mcg/puff", frequency: "As needed (max 8/day)", dailyDose: 2, quantityPerFill: 1, startDate: "2010-04-20", active: true, refillsRemaining: 4 },
      { id: "m7", name: "Tenofovir/Lamivudine/DTG", genericName: "TDF/3TC/DTG", dosage: "300/300/50mg", frequency: "Once daily", dailyDose: 1, quantityPerFill: 30, startDate: "2015-09-15", active: true, refillsRemaining: 10 }
    ],
    vitals: [
      { id: "v5", recordedAt: "2024-11-20T08:00:00", systolic: 118, diastolic: 76, glucose: 5.1, weight: 62, pulse: 70, spo2: 99, notes: "All parameters normal" }
    ],
    sponsor: { id: "s2", name: "Fatuma Hassan", phone: "+254756789012", relationship: "Mother", consentGiven: true, consentDate: "2022-01-15" },
    adherenceScore: 94,
    lastVisit: "2024-11-20",
    registeredAt: "2010-04-15",
    consentDataProcessing: true,
    consentSmsReminders: true,
    consentWhatsAppReminders: true
  },
  {
    id: "p4",
    firstName: "David",
    lastName: "Mutua",
    nationalId: "29876543",
    phone: "+254767890123",
    county: "Machakos",
    subCounty: "Kangundo",
    dateOfBirth: "1972-01-30",
    gender: "Male",
    diagnoses: [
      { id: "d7", condition: "Chronic Kidney Disease", diagnosedOn: "2020-08-12", severity: "Severe", notes: "Stage 3b, declining GFR" },
      { id: "d8", condition: "Hypertension", diagnosedOn: "2015-02-20", severity: "Severe", notes: "Resistant hypertension" }
    ],
    medications: [
      { id: "m8", name: "Amlodipine", genericName: "Amlodipine Besylate", dosage: "10mg", frequency: "Once daily", dailyDose: 1, quantityPerFill: 30, startDate: "2015-02-25", active: true, refillsRemaining: 2 },
      { id: "m9", name: "Losartan", genericName: "Losartan Potassium", dosage: "50mg", frequency: "Once daily", dailyDose: 1, quantityPerFill: 30, startDate: "2020-08-15", active: true, refillsRemaining: 4 }
    ],
    vitals: [
      { id: "v6", recordedAt: "2024-11-05T13:00:00", systolic: 168, diastolic: 102, glucose: 6.1, weight: 85, pulse: 92, spo2: 95, notes: "CRITICAL: BP dangerously high, urgent referral" },
      { id: "v7", recordedAt: "2024-08-05T10:30:00", systolic: 152, diastolic: 94, glucose: 5.9, weight: 87, pulse: 85, spo2: 96, notes: "Elevated" }
    ],
    adherenceScore: 48,
    lastVisit: "2024-11-05",
    registeredAt: "2015-02-20",
    consentDataProcessing: true,
    consentSmsReminders: false,
    consentWhatsAppReminders: false
  },
  {
    id: "p5",
    firstName: "Grace",
    lastName: "Wanjala",
    nationalId: "38765432",
    phone: "+254778901234",
    county: "Nakuru",
    subCounty: "Nakuru Town East",
    dateOfBirth: "1990-05-18",
    gender: "Female",
    diagnoses: [
      { id: "d9", condition: "Epilepsy", diagnosedOn: "2012-11-03", severity: "Moderate", notes: "Controlled with carbamazepine, seizure-free 2 years" }
    ],
    medications: [
      { id: "m10", name: "Carbamazepine", genericName: "Carbamazepine", dosage: "200mg", frequency: "Twice daily", dailyDose: 2, quantityPerFill: 60, startDate: "2012-11-10", active: true, refillsRemaining: 7 }
    ],
    vitals: [
      { id: "v8", recordedAt: "2024-10-20T09:00:00", systolic: 112, diastolic: 72, glucose: 4.9, weight: 58, pulse: 68, spo2: 99, notes: "Normal" }
    ],
    adherenceScore: 91,
    lastVisit: "2024-10-20",
    registeredAt: "2012-11-03",
    consentDataProcessing: true,
    consentSmsReminders: true,
    consentWhatsAppReminders: false
  },
  {
    id: "p6",
    firstName: "Samuel",
    lastName: "Kiprop",
    nationalId: "45678912",
    phone: "+254789012345",
    county: "Uasin Gishu",
    subCounty: "Eldoret East",
    dateOfBirth: "1960-09-25",
    gender: "Male",
    diagnoses: [
      { id: "d10", condition: "Type 2 Diabetes", diagnosedOn: "2014-07-10", severity: "Severe", notes: "On insulin, history of hypoglycemic episodes" },
      { id: "d11", condition: "Hypertension", diagnosedOn: "2016-03-22", severity: "Moderate", notes: "On combination therapy" }
    ],
    medications: [
      { id: "m11", name: "Insulin Glargine", genericName: "Insulin Glargine", dosage: "20 units", frequency: "Once daily at bedtime", dailyDose: 1, quantityPerFill: 1, startDate: "2018-01-15", active: true, refillsRemaining: 3 },
      { id: "m12", name: "Gliclazide", genericName: "Gliclazide", dosage: "80mg", frequency: "Twice daily", dailyDose: 2, quantityPerFill: 60, startDate: "2014-07-15", active: true, refillsRemaining: 5 },
      { id: "m13", name: "Ramipril", genericName: "Ramipril", dosage: "5mg", frequency: "Once daily", dailyDose: 1, quantityPerFill: 30, startDate: "2016-03-25", active: true, refillsRemaining: 9 }
    ],
    vitals: [
      { id: "v9", recordedAt: "2024-11-22T07:30:00", systolic: 135, diastolic: 85, glucose: 11.2, weight: 88, pulse: 76, spo2: 97, notes: "Glucose high, adjust insulin" },
      { id: "v10", recordedAt: "2024-10-22T08:00:00", systolic: 130, diastolic: 82, glucose: 9.8, weight: 89, pulse: 74, spo2: 98, notes: "Improving" }
    ],
    sponsor: { id: "s3", name: "Ruth Kiprop", phone: "+254790123456", relationship: "Wife", consentGiven: true, consentDate: "2020-06-01" },
    adherenceScore: 73,
    lastVisit: "2024-11-22",
    registeredAt: "2014-07-10",
    consentDataProcessing: true,
    consentSmsReminders: true,
    consentWhatsAppReminders: true
  }
]

export const MOCK_REFILL_TASKS: RefillTask[] = [
  { id: "rt1", patientId: "p1", medicationId: "m1", status: "Overdue", dueDate: "2024-12-01", daysRemaining: -5, lastDispensed: "2024-11-01" },
  { id: "rt2", patientId: "p1", medicationId: "m2", status: "Due in 7 Days", dueDate: "2024-12-15", daysRemaining: 7, lastDispensed: "2024-11-15" },
  { id: "rt3", patientId: "p2", medicationId: "m3", status: "Due Today", dueDate: "2024-12-06", daysRemaining: 0, lastDispensed: "2024-11-06" },
  { id: "rt4", patientId: "p2", medicationId: "m5", status: "Overdue", dueDate: "2024-11-28", daysRemaining: -8, lastDispensed: "2024-10-28" },
  { id: "rt5", patientId: "p3", medicationId: "m7", status: "Due in 14 Days", dueDate: "2024-12-20", daysRemaining: 14, lastDispensed: "2024-11-20" },
  { id: "rt6", patientId: "p4", medicationId: "m8", status: "Overdue", dueDate: "2024-11-25", daysRemaining: -11, lastDispensed: "2024-10-25" },
  { id: "rt7", patientId: "p4", medicationId: "m9", status: "Due in 2 Days", dueDate: "2024-12-08", daysRemaining: 2, lastDispensed: "2024-11-08" },
  { id: "rt8", patientId: "p5", medicationId: "m10", status: "Due in 7 Days", dueDate: "2024-12-13", daysRemaining: 7, lastDispensed: "2024-11-13" },
  { id: "rt9", patientId: "p6", medicationId: "m11", status: "Due Today", dueDate: "2024-12-06", daysRemaining: 0, lastDispensed: "2024-11-06" },
  { id: "rt10", patientId: "p6", medicationId: "m12", status: "Due in 14 Days", dueDate: "2024-12-22", daysRemaining: 14, lastDispensed: "2024-11-22" }
]

export const MOCK_ORDERS: Order[] = [
  { id: "o1", patientId: "p1", status: "Ready", method: "Click & Collect", items: [{ medicationId: "m1", quantity: 30 }], createdAt: "2024-12-04T10:00:00", updatedAt: "2024-12-05T14:30:00" },
  { id: "o2", patientId: "p3", status: "Dispatched", method: "Delivery", items: [{ medicationId: "m7", quantity: 30 }], createdAt: "2024-12-03T09:00:00", updatedAt: "2024-12-05T11:00:00", deliveryAddress: "Moi Avenue, Mombasa", riderName: "Brian Odhiambo", riderPhone: "+254711223344" },
  { id: "o3", patientId: "p5", status: "Requested", method: "Click & Collect", items: [{ medicationId: "m10", quantity: 60 }], createdAt: "2024-12-05T16:00:00", updatedAt: "2024-12-05T16:00:00" },
  { id: "o4", patientId: "p6", status: "Approved", method: "Delivery", items: [{ medicationId: "m11", quantity: 1 }, { medicationId: "m12", quantity: 60 }], createdAt: "2024-12-04T08:00:00", updatedAt: "2024-12-05T10:00:00", deliveryAddress: "Oloo Street, Eldoret" }
]

export const MOCK_COMMUNICATIONS: CommunicationLog[] = [
  { id: "c1", patientId: "p1", channel: "SMS", direction: "outbound", message: "Hello Wanjiku, your scheduled prescription refill is due for pickup at AfyaCare Pharmacy. Please visit us at your earliest convenience. Reply STOP to opt out.", sentAt: "2024-12-01T09:00:00", delivered: true, acknowledged: true, templateUsed: "T-5 overdue" },
  { id: "c2", patientId: "p2", channel: "WhatsApp", direction: "outbound", message: "Habari James, your monthly prescription is ready for collection at AfyaCare Pharmacy, Kisumu. We are open Mon-Sat 8am-8pm.", sentAt: "2024-12-05T10:00:00", delivered: true, acknowledged: false, templateUsed: "T-0 due today" },
  { id: "c3", patientId: "p4", channel: "Call", direction: "outbound", message: "Left voicemail - requested patient to contact pharmacy urgently regarding overdue medication.", sentAt: "2024-12-02T14:00:00", delivered: false, acknowledged: false, templateUsed: "Escalation call" },
  { id: "c4", patientId: "p3", channel: "SMS", direction: "outbound", message: "Hello Amina, your prescription refill will be due in 14 days. You can request early collection or use our delivery service.", sentAt: "2024-12-06T08:00:00", delivered: true, acknowledged: false, templateUsed: "T-14 advance notice" },
  { id: "c5", patientId: "p6", channel: "WhatsApp", direction: "outbound", message: "Habari Samuel, your delivery order is on the way. Rider Brian will contact you upon arrival. Thank you for choosing AfyaCare.", sentAt: "2024-12-05T11:30:00", delivered: true, acknowledged: true, templateUsed: "Delivery dispatched" }
]

export const MOCK_STAFF: StaffMember[] = [
  { id: "st1", name: "Dr. Mary Njeri", role: "admin", email: "mary@afyacare.co.ke", phone: "+254701112222", active: true, joinedAt: "2019-01-15" },
  { id: "st2", name: "Pharm. John Otieno", role: "pharmacist", email: "john@afyacare.co.ke", phone: "+254702223333", active: true, joinedAt: "2019-06-01" },
  { id: "st3", name: "Catherine Wambui", role: "assistant", email: "catherine@afyacare.co.ke", phone: "+254703334444", active: true, joinedAt: "2021-03-15" },
  { id: "st4", name: "Kevin Mwangi", role: "assistant", email: "kevin@afyacare.co.ke", phone: "+254704445555", active: true, joinedAt: "2023-01-10" }
]

export const MOCK_TIMELINE: TimelineEvent[] = [
  { id: "t1", patientId: "p1", type: "dispense", description: "Dispensed Lisinopril 10mg x30", timestamp: "2024-11-01T10:30:00", actor: "Pharm. John Otieno" },
  { id: "t2", patientId: "p1", type: "vital", description: "BP recorded: 142/92 mmHg (elevated)", timestamp: "2024-11-15T09:30:00", actor: "Catherine Wambui" },
  { id: "t3", patientId: "p1", type: "communication", description: "SMS sent: Refill overdue reminder", timestamp: "2024-12-01T09:00:00", actor: "System" },
  { id: "t4", patientId: "p1", type: "order", description: "Click & Collect order created", timestamp: "2024-12-04T10:00:00", actor: "Wanjiku Kamau" },
  { id: "t5", patientId: "p2", type: "dispense", description: "Dispensed Aspirin 75mg x30", timestamp: "2024-11-06T11:00:00", actor: "Pharm. John Otieno" },
  { id: "t6", patientId: "p2", type: "vital", description: "BP recorded: 155/95 mmHg - urgent flag raised", timestamp: "2024-11-10T14:00:00", actor: "Pharm. John Otieno" },
  { id: "t7", patientId: "p4", type: "vital", description: "CRITICAL: BP 168/102 - emergency referral initiated", timestamp: "2024-11-05T13:00:00", actor: "Pharm. John Otieno" },
  { id: "t8", patientId: "p4", type: "communication", description: "Call attempt failed - patient unreachable", timestamp: "2024-12-02T14:00:00", actor: "System" },
  { id: "t9", patientId: "p3", type: "check-in", description: "Patient completed monthly check-in: No missed doses", timestamp: "2024-11-20T08:15:00", actor: "Amina Hassan" },
  { id: "t10", patientId: "p6", type: "order", description: "Delivery order approved - rider assigned", timestamp: "2024-12-05T10:00:00", actor: "Kevin Mwangi" }
]

export const MOCK_TEMPLATES: ReminderTemplate[] = [
  { id: "tpl1", name: "T-14 Advance Notice", channel: "SMS", body: "Hello {name}, your prescription refill for {medication} will be due in {days} days. You can request early collection or use our delivery service. Reply STOP to opt out.", timingTag: "T-14", category: "refill", updatedAt: "2024-11-01T08:00:00" },
  { id: "tpl2", name: "T-7 Reminder", channel: "WhatsApp", body: "Habari {name}, just a reminder that your {medication} pickup is due in {days} days at {pharmacy}. We are open Mon-Sat 8am-8pm.", timingTag: "T-7", category: "refill", updatedAt: "2024-11-01T08:00:00" },
  { id: "tpl3", name: "T-0 Due Today", channel: "SMS", body: "Hello {name}, your {medication} refill is due today for pickup at {pharmacy}. Please visit us at your earliest convenience.", timingTag: "T-0", category: "refill", updatedAt: "2024-11-01T08:00:00" },
  { id: "tpl4", name: "T+3 Overdue", channel: "Call", body: "Automated call: {name}, your {medication} is now overdue. Please contact {pharmacy} urgently to arrange collection. Your health matters to us.", timingTag: "T+3", category: "adherence", updatedAt: "2024-11-01T08:00:00" },
  { id: "tpl5", name: "Delivery Dispatched", channel: "WhatsApp", body: "Habari {name}, your delivery order is on the way. Rider {rider} ({phone}) will contact you upon arrival. Thank you for choosing {pharmacy}.", timingTag: "Custom", category: "delivery", updatedAt: "2024-11-15T10:00:00" },
  { id: "tpl6", name: "Post-Refill Check-in", channel: "SMS", body: "Hello {name}, it has been 7 days since your last {medication} pickup. How are you feeling? Reply YES for a pharmacist callback or STOP to opt out.", timingTag: "Custom", category: "adherence", updatedAt: "2024-11-20T12:00:00" },
]

export const KENYA_COUNTIES = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa",
  "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi",
  "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos",
  "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a",
  "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri",
  "Samburu", "Siaya", "Taita-Taveta", "Tana River", "Tharaka-Nithi", "Trans Nzoia",
  "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
]