export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TIMEZONES = [
  'UTC -12:00 International Date Line West',
  'UTC -11:00 Coordinated Universal Time-11',
  'UTC -10:00 Hawaii',
  'UTC -09:00 Alaska',
  'UTC -08:00 Pacific Time (US & Canada)',
  'UTC -07:00 Mountain Time (US & Canada)',
  'UTC -06:00 Central Time (US & Canada)',
  'UTC -05:00 Eastern Time (US & Canada)',
  'UTC -04:00 Atlantic Time (Canada)',
  'UTC +00:00 UTC',
  'UTC +01:00 London',
  'UTC +05:30 Chennai, Mumbai, New Delhi',
  'UTC +08:00 Beijing, Hong Kong',
  'UTC +09:00 Tokyo',
];

export const HOURS = [
  '12:00 AM', '12:30 AM',
  '01:00 AM', '01:30 AM',
  '02:00 AM', '02:30 AM',
  '03:00 AM', '03:30 AM',
  '04:00 AM', '04:30 AM',
  '05:00 AM', '05:30 AM',
  '06:00 AM', '06:30 AM',
  '07:00 AM', '07:30 AM',
  '08:00 AM', '08:30 AM',
  '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM',
  '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM',
  '09:00 PM', '09:30 PM',
  '10:00 PM', '10:30 PM',
  '11:00 PM', '11:30 PM',
];

export const DURATIONS = ['15 min', '30 min', '45 min', '60 min', '90 min', '120 min'];
export const TYPES = ['1:1', 'Group'];
export const MODES = ['Video', 'Phone', 'In-person', 'Chat'];

export const ROOM_DEFAULT_INTAKE_FIELDS = [
  { id: 'chief_complaint',   label: 'Chief Complaint',       required: true,  enabled: true  },
  { id: 'medical_history',   label: 'Medical History',       required: false, enabled: true  },
  { id: 'medications',       label: 'Current Medications',   required: false, enabled: true  },
  { id: 'allergies',         label: 'Allergies',             required: false, enabled: true  },
  { id: 'insurance_info',    label: 'Insurance Information', required: false, enabled: false },
  { id: 'emergency_contact', label: 'Emergency Contact',     required: false, enabled: false },
];

export const ROOM_DEFAULT_NOTES_TEMPLATE = `Subjective:\n\nObjective:\n\nAssessment:\n\nPlan:\n`;

export const NOTES_PRESETS = {
  soap:     `Subjective:\n\nObjective:\n\nAssessment:\n\nPlan:\n`,
  progress: `Progress Note\n\nInterval History:\n\nExam:\n\nImpression:\n\nPlan:\n`,
  blank:    ``,
};

export const defaultSchedule = DAYS.map((day) => ({
  day,
  closed: day === 'Sunday' || day === 'Saturday',
  slots: [{ open: '09:00 AM', close: '05:00 PM' }],
}));

// payment method per patient type on a visit option:
// method: 'specific' | 'copay' | 'none'
// amount: fixed dollar amount (for 'specific')
// fallback: fallback amount when copay can't be determined (for 'copay')
export const defaultVisitOptions = [
  {
    id: 1,
    name: 'New Patient Consult',
    duration: '30 min',
    type: '1:1',
    slots: 1,
    mode: 'Video',
    visible: true,
    patientTypes: ['self-pay', 'insurance'],
    intakeInherited: true,
    notesInherited: true,
    pricing: {
      'self-pay': { method: 'specific', amount: '150', fallback: '' },
      'insurance': {
        eligible:     { method: 'copay',    amount: '',    fallback: '30' },
        not_eligible: { method: 'specific', amount: '150', fallback: '' },
        pending:      { method: 'none',     amount: '',    fallback: '' },
        error:        { method: 'none',     amount: '',    fallback: '' },
      },
    },
  },
  {
    id: 2,
    name: 'Urgent Care Visit',
    duration: '15 min',
    type: '1:1',
    slots: 1,
    mode: 'Video',
    visible: true,
    patientTypes: ['self-pay', 'group-covered', 'insurance'],
    intakeInherited: true,
    notesInherited: true,
    pricing: {
      'self-pay': { method: 'specific', amount: '75', fallback: '' },
      'group-covered': {
        verified:     { method: 'copay',    amount: '',   fallback: '20' },
        not_verified: { method: 'specific', amount: '75', fallback: '' },
        pending:      { method: 'none',     amount: '',   fallback: '' },
        error:        { method: 'none',     amount: '',   fallback: '' },
      },
      'insurance': {
        eligible:     { method: 'copay',    amount: '',   fallback: '30' },
        not_eligible: { method: 'specific', amount: '75', fallback: '' },
        pending:      { method: 'none',     amount: '',   fallback: '' },
        error:        { method: 'none',     amount: '',   fallback: '' },
      },
    },
  },
];

export const defaultPaymentConfig = {
  'self-pay': {
    acceptPayments: true,
    processor: 'stripe',          // 'stripe' | 'manual'
    stripeConnected: false,
    timing: 'before',             // 'before' | 'after' | 'choice'
    defaultPrice: '50',
    noShowFee: { enabled: false, amount: '25' },
  },
  'group-covered': {
    requireGroupId: true,
    requireReferral: false,
    verificationAccess: {
      verified:     { access: 'allow' },
      not_verified: { access: 'block' },
      pending:      { access: 'review' },
      error:        { access: 'review' },
    },
  },
  'insurance': {
    eligibilityAccess: {
      eligible:     { access: 'allow' },
      not_eligible: { access: 'block' },
      pending:      { access: 'review' },
      error:        { access: 'review' },
    },
  },
};
