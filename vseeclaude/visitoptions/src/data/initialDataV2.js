import { defaultSchedule, defaultPaymentConfig } from './initialData';

// ── Clinic-level config ────────────────────────────────────
// One per clinic. Payment config is set once here (not per-room).
// Intake & notes templates are reusable across all rooms.

export const initialClinic = {

  paymentConfig: defaultPaymentConfig,

  defaultIntakeTemplateId: 'it_1',
  defaultNotesTemplateId:  'nt_1',

  intakeTemplates: [
    {
      id: 'it_1',
      name: 'Standard Intake',
      fields: [
        { id: 'chief_complaint',   label: 'Chief Complaint',       required: true,  enabled: true  },
        { id: 'medical_history',   label: 'Medical History',       required: false, enabled: true  },
        { id: 'medications',       label: 'Current Medications',   required: false, enabled: true  },
        { id: 'allergies',         label: 'Allergies',             required: false, enabled: true  },
        { id: 'insurance_info',    label: 'Insurance Information', required: false, enabled: false },
        { id: 'emergency_contact', label: 'Emergency Contact',     required: false, enabled: false },
      ],
    },
    {
      id: 'it_2',
      name: 'Mental Health Intake',
      fields: [
        { id: 'chief_complaint',   label: 'Chief Complaint',       required: true,  enabled: true  },
        { id: 'medical_history',   label: 'Medical History',       required: true,  enabled: true  },
        { id: 'medications',       label: 'Current Medications',   required: true,  enabled: true  },
        { id: 'allergies',         label: 'Allergies',             required: false, enabled: false },
        { id: 'insurance_info',    label: 'Insurance Information', required: false, enabled: true  },
        { id: 'emergency_contact', label: 'Emergency Contact',     required: true,  enabled: true  },
      ],
    },
  ],

  notesTemplates: [
    { id: 'nt_1', name: 'SOAP Note',     content: 'Subjective:\n\nObjective:\n\nAssessment:\n\nPlan:\n' },
    { id: 'nt_2', name: 'Progress Note', content: 'Progress Note\n\nInterval History:\n\nExam:\n\nImpression:\n\nPlan:\n' },
    { id: 'nt_3', name: 'Blank',         content: '' },
  ],
};

// ── Rooms ──────────────────────────────────────────────────

export const initialRooms = [
  {
    id: 'room_1',
    roomName: "General Waiting Room",
    roomCode: 'GHTNC',
    hours: {
      timezone: 'UTC -08:00 Pacific Time (US & Canada)',
      mode: 'always',
      schedule: defaultSchedule,
      closureMessage: 'Service currently not available. Please check back later.',
    },
    visibility: 'public',
    patientTypes: ['self-pay', 'group-covered', 'insurance'],
    visitOptions: [
      {
        id: 'vo_1',
        name: 'New Patient Consult',
        duration: '30 min',
        type: '1:1',
        slots: 1,
        mode: 'Video',
        visible: true,
        patientTypes: ['self-pay', 'insurance'],
        pricing: {
          'self-pay':  { method: 'specific', amount: '150', fallback: '' },
          'insurance': {
            eligible:     { method: 'copay',    amount: '',    fallback: '30' },
            not_eligible: { method: 'specific', amount: '150', fallback: ''  },
            pending:      { method: 'none',     amount: '',    fallback: ''  },
            error:        { method: 'none',     amount: '',    fallback: ''  },
          },
        },
        intakeTemplateId: null,
        notesTemplateId:  null,
      },
      {
        id: 'vo_2',
        name: 'Urgent Care Visit',
        duration: '15 min',
        type: '1:1',
        slots: 1,
        mode: 'Video',
        visible: true,
        patientTypes: ['self-pay', 'group-covered', 'insurance'],
        pricing: {
          'self-pay':      { method: 'specific', amount: '75', fallback: '' },
          'group-covered': {
            verified:     { method: 'copay',    amount: '',   fallback: '20' },
            not_verified: { method: 'specific', amount: '75', fallback: ''  },
            pending:      { method: 'none',     amount: '',   fallback: ''  },
            error:        { method: 'none',     amount: '',   fallback: ''  },
          },
          'insurance': {
            eligible:     { method: 'copay',    amount: '',   fallback: '30' },
            not_eligible: { method: 'specific', amount: '75', fallback: ''  },
            pending:      { method: 'none',     amount: '',   fallback: ''  },
            error:        { method: 'none',     amount: '',   fallback: ''  },
          },
        },
        intakeTemplateId: null,
        notesTemplateId:  'nt_2',
      },
    ],
  },
  {
    id: 'room_2',
    roomName: 'Mental Health Room',
    roomCode: 'MHLTH',
    hours: {
      timezone: 'UTC -08:00 Pacific Time (US & Canada)',
      mode: 'scheduled',
      schedule: defaultSchedule,
      closureMessage: 'Our mental health team is currently unavailable. Please try again during business hours.',
    },
    visibility: 'unlisted',
    patientTypes: ['self-pay', 'insurance'],
    visitOptions: [
      {
        id: 'vo_3',
        name: 'Initial Assessment',
        duration: '60 min',
        type: '1:1',
        slots: 1,
        mode: 'Video',
        visible: true,
        patientTypes: ['self-pay', 'insurance'],
        pricing: {
          'self-pay':  { method: 'specific', amount: '', fallback: '' },
          'insurance': {
            eligible:     { method: 'copay',    amount: '',   fallback: '' },
            not_eligible: { method: 'specific', amount: '',   fallback: '' },
            pending:      { method: 'none',     amount: '',   fallback: '' },
            error:        { method: 'none',     amount: '',   fallback: '' },
          },
        },
        intakeTemplateId: 'it_2',
        notesTemplateId:  null,
      },
      {
        id: 'vo_4',
        name: 'Follow-up Session',
        duration: '45 min',
        type: '1:1',
        slots: 1,
        mode: 'Video',
        visible: true,
        patientTypes: ['self-pay', 'insurance'],
        pricing: {
          'self-pay':  { method: 'none', amount: '', fallback: '' },
          'insurance': {
            eligible:     { method: 'copay', amount: '', fallback: '' },
            not_eligible: { method: 'none',  amount: '', fallback: '' },
            pending:      { method: 'none',  amount: '', fallback: '' },
            error:        { method: 'none',  amount: '', fallback: '' },
          },
        },
        intakeTemplateId: null,
        notesTemplateId:  'nt_1',
      },
    ],
  },
];
