import { defaultSchedule, defaultPaymentConfig } from './initialData';

// ── Clinic-level config ────────────────────────────────────
// One per clinic. Payment config is set once here (not per-room).
// Intake & notes templates are reusable across all rooms.

export const initialClinic = {

  patientTypes: ['self-pay', 'group-covered', 'insurance'],

  // ── Patient-facing landing page (clinic front door) ──
  landingPage: {
    displayName: 'VSee Health Clinic',
    tagline: 'Care from anywhere',
    welcome: 'Welcome! Choose a waiting room below to see a provider. Most visits start within minutes.',
    brandColor: '#0D875C',
    supportEmail: 'support@vseehealth.com',
    supportPhone: '(650) 555-0142',
    showHours: true,
    showRooms: true,
  },

  specialties: [
    { id: 'sp_1', name: 'General Practice' },
    { id: 'sp_2', name: 'Mental Health' },
    { id: 'sp_3', name: 'Dermatology' },
    { id: 'sp_4', name: 'Pediatrics' },
    { id: 'sp_5', name: 'Cardiology' },
  ],

  paymentConfig: defaultPaymentConfig,

  defaultNotesTemplateId: 'nt_1',

  // ── Form library (reusable across workflows) ──
  formLibrary: [
    {
      id: 'form_1',
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
      id: 'form_2',
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
    {
      id: 'form_3',
      name: 'Consent Form',
      fields: [
        { id: 'consent_agree', label: 'I agree to the terms of service', required: true, enabled: true, type: 'checkbox' },
      ],
    },
    {
      id: 'form_4',
      name: 'Insurance Verification',
      fields: [
        { id: 'insurance_provider', label: 'Insurance Provider', required: true,  enabled: true },
        { id: 'member_id',          label: 'Member ID',          required: true,  enabled: true },
        { id: 'group_number',       label: 'Group Number',       required: false, enabled: true },
      ],
    },
    {
      id: 'form_5',
      name: 'PHQ-9 Assessment',
      fields: [
        { id: 'phq_1', label: 'Little interest or pleasure in doing things',          required: true, enabled: true, type: 'scale' },
        { id: 'phq_2', label: 'Feeling down, depressed, or hopeless',                 required: true, enabled: true, type: 'scale' },
        { id: 'phq_3', label: 'Trouble falling or staying asleep, or sleeping too much', required: true, enabled: true, type: 'scale' },
        { id: 'phq_notes', label: 'Additional notes', required: false, enabled: true, type: 'textarea' },
      ],
    },
    {
      id: 'form_6',
      name: 'Group ID Verification',
      fields: [
        { id: 'group_name',  label: 'Group / Employer Name', required: true,  enabled: true },
        { id: 'group_id',    label: 'Group ID',              required: true,  enabled: true },
        { id: 'member_name', label: 'Member Name',           required: true,  enabled: true },
      ],
    },
  ],

  notesTemplates: [
    { id: 'nt_1', name: 'SOAP Note', content: 'Subjective:\n\nObjective:\n\nAssessment:\n\nPlan:\n', sections: [
      { id: 'nt1_s1', type: 'heading', value: 'Subjective:' },
      { id: 'nt1_s2', type: 'text',    value: '' },
      { id: 'nt1_s3', type: 'heading', value: 'Objective:' },
      { id: 'nt1_s4', type: 'text',    value: '' },
      { id: 'nt1_s5', type: 'heading', value: 'Assessment:' },
      { id: 'nt1_s6', type: 'text',    value: '' },
      { id: 'nt1_s7', type: 'heading', value: 'Plan:' },
      { id: 'nt1_s8', type: 'text',    value: '' },
      { id: 'nt1_s9', type: 'date',    value: 'Follow-up date' },
    ]},
    { id: 'nt_2', name: 'Progress Note', content: 'Progress Note\n\nInterval History:\n\nExam:\n\nImpression:\n\nPlan:\n', sections: [
      { id: 'nt2_s1', type: 'heading',  value: 'Progress Note' },
      { id: 'nt2_s2', type: 'heading',  value: 'Interval History:' },
      { id: 'nt2_s3', type: 'text',     value: '' },
      { id: 'nt2_s4', type: 'scale',    value: 'Symptom severity' },
      { id: 'nt2_s5', type: 'divider',  value: '' },
      { id: 'nt2_s6', type: 'heading',  value: 'Exam:' },
      { id: 'nt2_s7', type: 'text',     value: '' },
      { id: 'nt2_s8', type: 'checkbox', value: 'Reviewed current medications' },
      { id: 'nt2_s9', type: 'heading',  value: 'Impression:' },
      { id: 'nt2_s10', type: 'text',    value: '' },
      { id: 'nt2_s11', type: 'heading', value: 'Plan:' },
      { id: 'nt2_s12', type: 'text',    value: '' },
    ]},
    { id: 'nt_3', name: 'Blank', content: '' },
  ],

  // ── Default patient workflow ──
  // visit_selection step marks where the patient picks a visit option.
  // Steps before it are pre-visit; steps after follow the selected visit.
  defaultWorkflow: {
    id: 'wf_default',
    name: 'Default Intake Flow',
    steps: [
      { id: 'ws_login', type: 'login', label: 'Login' },
      { id: 'ws_dep',   type: 'dependant_list', label: 'Dependant List' },
      { id: 'ws_0',     type: 'visit_selection', label: 'Consultation' },
      { id: 'ws_1',     type: 'scheduling', label: 'Calendar Picker' },
      { id: 'ws_2',     type: 'form', label: 'Intake Form', formId: '_intake_form' },
      { id: 'ws_3', type: 'conditional', label: 'By Patient Type', conditionType: 'patient_type', branches: [
        { id: 'wb_1', label: 'Self-Pay', condition: 'self-pay', steps: [
          { id: 'ws_3a', type: 'payment', label: 'Payment Options' },
        ]},
        { id: 'wb_2', label: 'Insurance', condition: 'insurance', steps: [
          { id: 'ws_3b', type: 'form', label: 'Insurance Form', formId: '_insurance_form' },
          { id: 'ws_3c', type: 'payment', label: 'Payment Options' },
        ]},
        { id: 'wb_3', label: 'Group-Covered', condition: 'group-covered', steps: [
          { id: 'ws_3d', type: 'form', label: 'Group ID Verification', formId: 'form_6', required: true },
        ]},
      ]},
      { id: 'ws_4',     type: 'form', label: 'Pharmacy', formId: '_pharmacy' },
      { id: 'ws_5',     type: 'form', label: 'Emergency Contact', formId: '_emergency_contact' },
      { id: 'ws_6',     type: 'test_device', label: 'Test Device' },
      { id: 'ws_7',     type: 'setup_session', label: 'Setup Session' },
      { id: 'ws_8',     type: 'confirmation', label: 'Confirmation' },
    ],
  },
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
    landingPage: null, // inherits the clinic welcome
    visitOptions: [
      {
        id: 'vo_1',
        name: 'New Patient Consult',
        duration: '30 min',
        type: '1:1',
        slots: 1,
        mode: ['Video'],
        visible: true,
        patientTypes: ['self-pay', 'insurance'],
        specialties: ['sp_1', 'sp_2', 'sp_3', 'sp_4', 'sp_5'],
        pricing: {
          'self-pay':  { method: 'specific', amount: '150', fallback: '' },
          'insurance': {
            eligible:     { method: 'copay',    amount: '',    fallback: '30' },
            not_eligible: { method: 'specific', amount: '150', fallback: ''  },
            pending:      { method: 'none',     amount: '',    fallback: ''  },
            error:        { method: 'none',     amount: '',    fallback: ''  },
          },
        },
        notesTemplateId:  null,
        workflowOverride: null, // null = use clinic default workflow
      },
      {
        id: 'vo_2',
        name: 'Urgent Care Visit',
        duration: '15 min',
        type: '1:1',
        slots: 1,
        mode: ['Video'],
        visible: true,
        patientTypes: ['self-pay', 'group-covered', 'insurance'],
        specialties: ['sp_1', 'sp_2', 'sp_3', 'sp_4', 'sp_5'],
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
        notesTemplateId:  'nt_2',
        workflowOverride: null,
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
    landingPage: {
      heading: 'Mental Health & Wellness',
      message: 'You are in a private, confidential space. Choose the session type that fits — your provider will meet you shortly.',
      showVisitOptions: true,
      showHours: true,
    },
    visitOptions: [
      {
        id: 'vo_3',
        name: 'Initial Assessment',
        duration: '60 min',
        type: '1:1',
        slots: 1,
        mode: ['Video'],
        visible: true,
        patientTypes: ['self-pay', 'insurance'],
        specialties: ['sp_1', 'sp_2', 'sp_3', 'sp_4', 'sp_5'],
        pricing: {
          'self-pay':  { method: 'specific', amount: '', fallback: '' },
          'insurance': {
            eligible:     { method: 'copay',    amount: '',   fallback: '' },
            not_eligible: { method: 'specific', amount: '',   fallback: '' },
            pending:      { method: 'none',     amount: '',   fallback: '' },
            error:        { method: 'none',     amount: '',   fallback: '' },
          },
        },
        notesTemplateId:  null,
        workflowOverride: {
          id: 'wf_mh_initial',
          name: 'Mental Health Initial Assessment',
          steps: [
            { id: 'mh_1', type: 'scheduling', label: 'Calendar Picker' },
            { id: 'mh_2', type: 'form', label: 'Intake Form', formId: '_intake_form' },
            { id: 'mh_3', type: 'form', label: 'Mental Health Intake', formId: 'form_2', required: true },
            { id: 'mh_4', type: 'form', label: 'PHQ-9 Assessment', formId: 'form_5', required: true },
            { id: 'mh_5', type: 'form', label: 'Emergency Contact', formId: '_emergency_contact' },
            { id: 'mh_6', type: 'form', label: 'Pharmacy', formId: '_pharmacy' },
            { id: 'mh_7', type: 'payment', label: 'Payment Options' },
            { id: 'mh_8', type: 'test_device', label: 'Test Device' },
            { id: 'mh_9', type: 'setup_session', label: 'Setup Session' },
            { id: 'mh_10', type: 'confirmation', label: 'Confirmation' },
          ],
        },
      },
      {
        id: 'vo_4',
        name: 'Follow-up Session',
        duration: '45 min',
        type: '1:1',
        slots: 1,
        mode: ['Video'],
        visible: true,
        patientTypes: ['self-pay', 'insurance'],
        specialties: ['sp_1', 'sp_2', 'sp_3', 'sp_4', 'sp_5'],
        pricing: {
          'self-pay':  { method: 'none', amount: '', fallback: '' },
          'insurance': {
            eligible:     { method: 'copay', amount: '', fallback: '' },
            not_eligible: { method: 'none',  amount: '', fallback: '' },
            pending:      { method: 'none',  amount: '', fallback: '' },
            error:        { method: 'none',  amount: '', fallback: '' },
          },
        },
        notesTemplateId:  'nt_1',
        workflowOverride: null,
      },
    ],
  },
];
