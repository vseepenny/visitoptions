import { defaultSchedule } from './initialData';

// ── Clinic-level template library ────────────────────────────

export const initialClinicTemplates = {

  paymentProfiles: [
    {
      id: 'pp_1',
      name: 'Standard Self-Pay',
      type: 'self-pay',
      config: {
        acceptPayments: true,
        processor: 'stripe',
        stripeConnected: false,
        timing: 'before',
        defaultPrice: '50',
        noShowFee: { enabled: false, amount: '25' },
      },
    },
    {
      id: 'pp_2',
      name: 'Enterprise Group Plan',
      type: 'group-covered',
      config: {
        requireGroupId: true,
        requireReferral: false,
        verificationAccess: {
          verified:     { access: 'allow' },
          not_verified: { access: 'block' },
          pending:      { access: 'review' },
          error:        { access: 'review' },
        },
      },
    },
    {
      id: 'pp_3',
      name: 'Standard Insurance',
      type: 'insurance',
      config: {
        eligibilityAccess: {
          eligible:     { access: 'allow' },
          not_eligible: { access: 'block' },
          pending:      { access: 'review' },
          error:        { access: 'review' },
        },
      },
    },
  ],

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
    { id: 'nt_1', name: 'SOAP Note',      content: 'Subjective:\n\nObjective:\n\nAssessment:\n\nPlan:\n' },
    { id: 'nt_2', name: 'Progress Note',  content: 'Progress Note\n\nInterval History:\n\nExam:\n\nImpression:\n\nPlan:\n' },
    { id: 'nt_3', name: 'Blank',          content: '' },
  ],

  visitOptionTemplates: [
    {
      id: 'vt_1',
      name: 'New Patient Consult',
      duration: '30 min',
      type: '1:1',
      slots: 1,
      mode: 'Video',
      defaultIntakeTemplateId: 'it_1',
      defaultNotesTemplateId: 'nt_1',
      defaultPricing: {
        'self-pay':  { method: 'specific', amount: '150', fallback: '' },
        'insurance': {
          eligible:     { method: 'copay',    amount: '',    fallback: '30'  },
          not_eligible: { method: 'specific', amount: '150', fallback: ''   },
          pending:      { method: 'none',     amount: '',    fallback: ''   },
          error:        { method: 'none',     amount: '',    fallback: ''   },
        },
      },
    },
    {
      id: 'vt_2',
      name: 'Urgent Care Visit',
      duration: '15 min',
      type: '1:1',
      slots: 1,
      mode: 'Video',
      defaultIntakeTemplateId: 'it_1',
      defaultNotesTemplateId: 'nt_1',
      defaultPricing: {
        'self-pay': { method: 'specific', amount: '75', fallback: '' },
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
    },
    {
      id: 'vt_3',
      name: 'Follow-Up Visit',
      duration: '15 min',
      type: '1:1',
      slots: 1,
      mode: 'Video',
      defaultIntakeTemplateId: 'it_1',
      defaultNotesTemplateId: 'nt_2',
      defaultPricing: {
        'self-pay': { method: 'specific', amount: '50', fallback: '' },
        'insurance': {
          eligible:     { method: 'copay',    amount: '',   fallback: '20' },
          not_eligible: { method: 'specific', amount: '50', fallback: ''  },
          pending:      { method: 'none',     amount: '',   fallback: ''  },
          error:        { method: 'none',     amount: '',   fallback: ''  },
        },
      },
    },
  ],
};

// ── Room V2 ────────────────────────────────────────────────

export const initialRoomV2 = {
  roomName: "Dr. Provider's Waiting Room 1",
  roomCode: 'GHTNC',
  hours: {
    timezone: 'UTC -08:00 Pacific Time (US & Canada)',
    mode: 'always',
    schedule: defaultSchedule,
    closureMessage: 'Service currently not available. Please check back later.',
  },
  visibility: 'public',
  patientTypes: ['self-pay', 'group-covered', 'insurance'],

  // References to clinic-level templates (replaces inline paymentConfig / roomIntakeFields / roomNotesTemplate)
  visitDefaults: {
    paymentProfileIds: {
      'self-pay':      'pp_1',
      'group-covered': 'pp_2',
      'insurance':     'pp_3',
    },
    intakeTemplateId: 'it_1',
    notesTemplateId:  'nt_1',
  },

  // Each item references a visitOptionTemplate + stores only overrides
  visitOptions: [
    {
      id: 'rvo_1',
      templateId: 'vt_1',
      visible: true,
      patientTypes: ['self-pay', 'insurance'],
      overrides: {},   // fully inherited
    },
    {
      id: 'rvo_2',
      templateId: 'vt_2',
      visible: true,
      patientTypes: ['self-pay', 'group-covered', 'insurance'],
      overrides: {
        // This room charges less for self-pay urgent care
        pricing: {
          'self-pay': { method: 'specific', amount: '100', fallback: '' },
        },
      },
    },
  ],
};

// ── Resolver ────────────────────────────────────────────────

export function resolveVisitOption(rvo, templates) {
  const tmpl = templates.visitOptionTemplates.find(t => t.id === rvo.templateId);
  if (!tmpl) return { ...rvo, overrideCount: 0 };
  const ov = rvo.overrides ?? {};
  const intakeTemplateId = ov.intakeTemplateId ?? tmpl.defaultIntakeTemplateId;
  const notesTemplateId  = ov.notesTemplateId  ?? tmpl.defaultNotesTemplateId;
  const intakeTmpl = templates.intakeTemplates.find(t => t.id === intakeTemplateId);
  const notesTmpl  = templates.notesTemplates.find(t => t.id === notesTemplateId);
  return {
    name:            tmpl.name,
    duration:        ov.duration  ?? tmpl.duration,
    type:            ov.type      ?? tmpl.type,
    slots:           ov.slots     ?? tmpl.slots,
    mode:            ov.mode      ?? tmpl.mode,
    visible:         rvo.visible,
    patientTypes:    rvo.patientTypes,
    pricing:         { ...tmpl.defaultPricing, ...(ov.pricing ?? {}) },
    intakeTemplateId,
    intakeFields:    ov.intakeFields ?? (intakeTmpl?.fields ?? []),
    notesTemplateId,
    notesContent:    ov.notesContent ?? (notesTmpl?.content ?? ''),
    overrideCount:   Object.keys(ov).length,
    templateName:    tmpl.name,
  };
}
