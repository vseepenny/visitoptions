/* Built-in forms, shared by the editor, the flow scope model and the preview.
 *
 * These used to be name-and-description only, which meant a Conditional Branch
 * on "Answer to a Form Question" could never target them — the question picker
 * had nothing to list. They now carry real field definitions, matching what
 * each form's description already promised.
 */

export const BUILTIN_FORMS = [
  {
    id: '_intake_form',
    name: 'Intake Form',
    desc: 'Basic patient intake — demographics, contact info, reason for visit, and file attachments.',
    fields: [
      { id: 'reason_for_visit', label: 'Reason for Visit',      required: true,  enabled: true, type: 'textarea' },
      { id: 'symptom_onset',    label: 'When Symptoms Started', required: false, enabled: true, type: 'date' },
      { id: 'pain_level',       label: 'Pain Level (0–10)',     required: false, enabled: true, type: 'scale' },
      { id: 'medications',      label: 'Current Medications',   required: false, enabled: true, type: 'textarea' },
      { id: 'allergies',        label: 'Allergies',             required: false, enabled: true, type: 'textarea' },
      { id: 'attachments',      label: 'Photos or Documents',   required: false, enabled: true, type: 'file' },
    ],
  },
  {
    id: '_guest_intake',
    name: 'Guest Intake',
    desc: 'Simplified intake for walk-in guests — health concern and optional file attachments.',
    fields: [
      { id: 'health_concern', label: 'Health Concern',       required: true,  enabled: true, type: 'textarea' },
      { id: 'urgency',        label: 'How Urgent Is This?',   required: false, enabled: true, type: 'select', options: ['Routine', 'Soon', 'Urgent'] },
      { id: 'attachments',    label: 'Photos or Documents',   required: false, enabled: true, type: 'file' },
    ],
  },
  {
    id: '_insurance_form',
    name: 'Insurance Form',
    desc: 'Insurance carrier, subscriber ID, group number, guarantor, and card photo uploads.',
    fields: [
      { id: 'carrier',        label: 'Insurance Carrier',   required: true,  enabled: true, type: 'text' },
      { id: 'subscriber_id',  label: 'Subscriber ID',       required: true,  enabled: true, type: 'text' },
      { id: 'group_number',   label: 'Group Number',        required: false, enabled: true, type: 'text' },
      { id: 'plan_type',      label: 'Plan Type',           required: false, enabled: true, type: 'select', options: ['HMO', 'PPO', 'EPO', 'POS', 'Medicare', 'Medicaid'] },
      { id: 'is_subscriber',  label: 'Patient Is the Subscriber', required: false, enabled: true, type: 'checkbox' },
      { id: 'card_photos',    label: 'Insurance Card Photos', required: false, enabled: true, type: 'file' },
    ],
  },
  {
    id: '_guarantor',
    name: 'Guarantor',
    desc: 'Billing/responsible party details — name, relationship, contact info, and address.',
    fields: [
      { id: 'guarantor_name',  label: 'Guarantor Name',        required: true,  enabled: true, type: 'text' },
      { id: 'relationship',    label: 'Relationship to Patient', required: true, enabled: true, type: 'select', options: ['Self', 'Spouse', 'Parent', 'Guardian', 'Other'] },
      { id: 'guarantor_phone', label: 'Phone',                 required: true,  enabled: true, type: 'tel' },
      { id: 'guarantor_email', label: 'Email',                 required: false, enabled: true, type: 'email' },
      { id: 'billing_address', label: 'Billing Address',       required: false, enabled: true, type: 'textarea' },
    ],
  },
  {
    id: '_emergency_contact',
    name: 'Emergency Contact',
    desc: 'Emergency contact person\'s name, relationship, phone, and address.',
    fields: [
      { id: 'contact_name',   label: 'Contact Name',            required: true,  enabled: true, type: 'text' },
      { id: 'relationship',   label: 'Relationship to Patient', required: true,  enabled: true, type: 'select', options: ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Other'] },
      { id: 'contact_phone',  label: 'Phone',                   required: true,  enabled: true, type: 'tel' },
      { id: 'contact_address', label: 'Address',                required: false, enabled: true, type: 'textarea' },
    ],
  },
  {
    id: '_create_dependant',
    name: 'Create Dependant',
    desc: 'Register a new family member/dependant under the patient\'s account.',
    fields: [
      { id: 'dependant_name', label: 'Full Name',               required: true,  enabled: true, type: 'text' },
      { id: 'dependant_dob',  label: 'Date of Birth',           required: true,  enabled: true, type: 'date' },
      { id: 'relationship',   label: 'Relationship to Patient',  required: true,  enabled: true, type: 'select', options: ['Child', 'Spouse', 'Parent', 'Other'] },
      { id: 'dependant_sex',  label: 'Sex',                     required: false, enabled: true, type: 'select', options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
    ],
  },
  {
    id: '_cancel_survey',
    name: 'Cancel Intake Survey',
    desc: 'Asks the patient why they\'re cancelling the intake.',
    fields: [
      { id: 'cancel_reason', label: 'Reason for Cancelling', required: true,  enabled: true, type: 'select', options: ['Cost', 'Wait time', 'Found care elsewhere', 'Changed my mind', 'Other'] },
      { id: 'cancel_notes',  label: 'Anything Else?',        required: false, enabled: true, type: 'textarea' },
    ],
  },
];

export function allForms(clinic) {
  return [...BUILTIN_FORMS, ...((clinic?.formLibrary) || [])];
}

export function findForm(clinic, formId) {
  if (!formId) return null;
  return allForms(clinic).find(f => f.id === formId) || null;
}

export function formFields(form) {
  return (form?.fields || []).filter(f => f.enabled !== false);
}
