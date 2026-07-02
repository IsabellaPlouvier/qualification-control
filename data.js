// ─── CONFIGURATION ────────────────────────────────────────────────────────
const DATA = {
  alertWindowDays: 90,

  categoryLabels: {
    personal:  'Personal',
    employment:'Employment',
    training:  'Training',
    health:    'Health',
    customer:  'Customer Specific',
    hmh:       'HMH'
  },
  categoryIcons: {
    personal:  '📄',
    employment:'📋',
    training:  '🎓',
    health:    '🏥',
    customer:  '🤝',
    hmh:       '🏢'
  },

  renewalStatuses: [
    { id: 'not_requested',       label: 'Not Requested' },
    { id: 'requested_hr',        label: 'Requested from HR/HSSE' },
    { id: 'scheduled',           label: 'Scheduled' },
    { id: 'waiting_certificate', label: 'Awaiting Certificate' },
    { id: 'renewed',             label: 'Renewed' }
  ],

  sispatValues: [
    { id: 'constellation', label: 'Constellation', color: 'purple' },
    { id: 'foresea',       label: 'Foresea',       color: 'blue'   },
    { id: 'hmh',           label: 'HMH',           color: 'teal'   },
    { id: 'inactive',      label: 'Inactive',      color: 'gray'   }
  ],

  // Groups — "hmh" is a special area: no employees, only HMH documents row
  groups: [
    { id: 'transactional',       name: 'Transactional',        regime: 'offshore' },
    { id: 'csa',                 name: 'CSA',                  regime: 'offshore' },
    { id: 'overhaul',            name: 'Overhaul',             regime: 'onshore'  },
    { id: 'engineering_projects',name: 'Engineering/Projects', regime: 'onshore'  },
    { id: 'expats',              name: 'Expats',               regime: 'offshore' },
    { id: 'hmh',                 name: 'HMH',                  regime: 'onshore', isHmhArea: true }
  ],

  requirements: [
    // Personal
    { id: 'ficha_registro',          name: 'Employment Record',               shortName: 'Record',     category: 'personal',   hasExpiry: false, alertDays: 0,  order: 0 },
    { id: 'ctp',                     name: 'Work Card (CTP)',                 shortName: 'CTP',        category: 'personal',   hasExpiry: false, alertDays: 0,  order: 1 },
    { id: 'passaporte',              name: 'Passport',                        shortName: 'Passport',   category: 'personal',   hasExpiry: true,  alertDays: 90, order: 2 },
    { id: 'crea',                    name: 'CREA Clearance',                  shortName: 'CREA',       category: 'personal',   hasExpiry: true,  alertDays: 60, order: 3, perPersonValidity: true },
    // Employment
    { id: 'contrato_trabalho',       name: 'Employment Contract',            shortName: 'Contract',   category: 'employment', hasExpiry: false, alertDays: 0,  order: 4 },
    // Training (HSSE)
    { id: 'nr35',                    name: 'NR-35 Working at Height',         shortName: 'NR-35',      category: 'training',   hasExpiry: true,  alertDays: 90, order: 5 },
    { id: 'nr12',                    name: 'NR-12 Machine Safety',            shortName: 'NR-12',      category: 'training',   hasExpiry: true,  alertDays: 90, order: 6 },
    { id: 'nr10',                    name: 'NR-10 Electrical Safety',         shortName: 'NR-10',      category: 'training',   hasExpiry: true,  alertDays: 90, order: 7 },
    { id: 'nr33',                    name: 'NR-33 Confined Space',            shortName: 'NR-33',      category: 'training',   hasExpiry: true,  alertDays: 90, order: 8 },
    { id: 'huet',                    name: 'HUET / OPITO',                    shortName: 'HUET',       category: 'training',   hasExpiry: true,  alertDays: 90, order: 9 },
    { id: 'hse_offshore',            name: 'Basic Offshore HSE',              shortName: 'HSE Off.',   category: 'training',   hasExpiry: true,  alertDays: 90, order: 10 },
    { id: 'cbsp',                    name: 'CBSP / Lifesaving',               shortName: 'CBSP',       category: 'training',   hasExpiry: true,  alertDays: 90, order: 11 },
    { id: 'constellation_training',  name: 'Constellation Training',          shortName: 'Constell.',  category: 'training',   hasExpiry: true,  alertDays: 60, order: 12 },
    // Health
    { id: 'aso_periodico',           name: 'Periodic Medical Exam (ASO)',     shortName: 'ASO',        category: 'health',     hasExpiry: true,  alertDays: 90, order: 13 },
    { id: 'aso_offshore',            name: 'ASO Offshore',                    shortName: 'ASO Off.',   category: 'health',     hasExpiry: true,  alertDays: 90, order: 14 },
    // Customer Specific
    { id: 'rnm',                     name: 'RNM (Business Rules)',            shortName: 'RNM',        category: 'customer',   hasExpiry: false, alertDays: 0,  order: 15 },
    { id: 'regras_ouro',             name: 'Golden Rules',                    shortName: 'G.Rules',    category: 'customer',   hasExpiry: false, alertDays: 0,  order: 16 },
    { id: 'declaracao_cbsp',         name: 'CBSP Declaration',                shortName: 'CBSP Decl.', category: 'customer',   hasExpiry: false, alertDays: 0,  order: 17 }
  ],

  // Which requirements are visible per area (null = all non-hmh reqs)
  // Key = group id, value = array of requirement ids (null means use default = all reqs for that category)
  groupRequirements: {
    transactional:        null,
    csa:                  null,
    overhaul:             null,
    engineering_projects: null,
    expats:               null,
    hmh:                  []   // populated by hmh-category requirements only
  },

  employees: [
    {
      id: 1, name: 'Adriano Barbosa Pimentel', group: 'transactional', discipline: 'ele', regime: 'offshore', country: 'BR', active: true,
      cpfPassport: '156.253.517-08', email: 'Adriano.Pimentel@hmhw.com', funcao: 'Field Service Electronics Engineer',
      sispat: 'constellation', idSispat: '70732310', birthDate: '1996-02-22', hiringDate: '2022-07-18', rg: '25.497.977-6',
      requirements: {
        ficha_registro: { status: 'ok' }, contrato_trabalho: { status: 'ok' }, ctp: { status: 'ok' },
        passaporte: { status: 'ok', expiry: '2028-03-10' },
        crea: { status: 'ok', expiry: '2026-12-01' },
        nr35: { status: 'ok', expiry: '2027-01-15' }, nr10: { status: 'ok', expiry: '2026-11-20' },
        huet: { status: 'ok', expiry: '2026-12-05' }, hse_offshore: { status: 'ok', expiry: '2027-02-10' },
        cbsp: { status: 'ok', expiry: '2026-10-30' },
        constellation_training: { status: 'ok', expiry: '2026-09-15' },
        aso_periodico: { status: 'ok', expiry: '2027-03-01' }, aso_offshore: { status: 'ok', expiry: '2027-03-01' },
        rnm: { status: 'ok' }, regras_ouro: { status: 'ok' }, declaracao_cbsp: { status: 'ok' }
      }
    },
    {
      id: 2, name: 'Felipe Matias Leite de Oliveira', group: 'transactional', discipline: 'ele', regime: 'offshore', country: 'BR', active: true,
      cpfPassport: '115.265.157-92', email: 'Felipe.Matias@hmhw.com', funcao: 'Field Service Electronics Engineer',
      sispat: 'foresea', idSispat: '42261877', birthDate: '1987-10-07', hiringDate: '2013-04-01', rg: '12.369.423-4',
      requirements: {
        ficha_registro: { status: 'ok' }, contrato_trabalho: { status: 'ok' }, ctp: { status: 'ok' },
        passaporte: { status: 'ok', expiry: '2027-06-20' },
        crea: { status: 'ok', expiry: '2026-07-10' },
        nr35: { status: 'ok', expiry: '2026-11-08' }, nr10: { status: 'ok', expiry: '2026-10-15' },
        huet: { status: 'ok', expiry: '2026-05-01' }, hse_offshore: { status: 'ok', expiry: '2027-01-20' },
        cbsp: { status: 'ok', expiry: '2027-04-12' },
        aso_periodico: { status: 'ok', expiry: '2026-12-10' }, aso_offshore: { status: 'ok', expiry: '2026-12-10' },
        rnm: { status: 'partial' }, regras_ouro: { status: 'ok' }
      }
    },
    {
      id: 3, name: 'João Paulo Oliveira Vilela', group: 'transactional', discipline: 'ele', regime: 'offshore', country: 'BR', active: true,
      cpfPassport: '065.258.706-23', email: 'Joao.Paulo.Vilela@hmhw.com', funcao: 'Field Service Electronics Engineer',
      sispat: 'foresea', idSispat: '49459692', birthDate: '1984-09-08', hiringDate: '2014-03-10', rg: 'MG-13.927.434',
      requirements: {
        ficha_registro: { status: 'ok' }, contrato_trabalho: { status: 'ok' }, ctp: { status: 'ok' },
        passaporte: { status: 'ok', expiry: '2029-01-05' },
        nr35: { status: 'ok', expiry: '2027-03-22' }, nr33: { status: 'ok', expiry: '2026-09-10' },
        huet: { status: 'ok', expiry: '2026-10-18' }, hse_offshore: { status: 'ok', expiry: '2026-11-30' },
        cbsp: { status: 'ok', expiry: '2026-08-14' },
        aso_periodico: { status: 'ok', expiry: '2027-01-20' }, aso_offshore: { status: 'ok', expiry: '2027-01-20' },
        rnm: { status: 'ok' }, regras_ouro: { status: 'ok' }
      }
    },
    {
      id: 4, name: 'Jose Geraldo Leite Junior', group: 'transactional', discipline: 'mec', regime: 'offshore', country: 'BR', active: true,
      cpfPassport: '294.063.538-22', email: 'Jose.Junior@hmhw.com', funcao: 'Field Service Mechanical Engineer',
      sispat: 'foresea', idSispat: '45466483', birthDate: '1981-04-29', hiringDate: '2010-06-07', rg: '30.382.187-5',
      requirements: {
        ficha_registro: { status: 'ok' }, contrato_trabalho: { status: 'ok' }, ctp: { status: 'ok' },
        passaporte: { status: 'ok', expiry: '2027-11-22' },
        crea: { status: 'ok', expiry: '2026-12-15' },
        nr35: { status: 'ok', expiry: '2026-04-30', renewal: 'requested_hr' }, nr12: { status: 'ok', expiry: '2026-09-05' },
        huet: { status: 'ok', expiry: '2026-10-01' }, hse_offshore: { status: 'ok', expiry: '2027-02-28' },
        cbsp: { status: 'ok', expiry: '2026-11-17' },
        aso_periodico: { status: 'ok', expiry: '2026-12-01' }, aso_offshore: { status: 'ok', expiry: '2026-12-01' },
        rnm: { status: 'ok' }, regras_ouro: { status: 'missing' }
      }
    },
    {
      id: 5, name: 'Lucas Goncalves Maciel', group: 'transactional', discipline: 'ele', regime: 'offshore', country: 'BR', active: true,
      cpfPassport: '096.757.766-76', email: 'Lucas.Maciel@hmhw.com', funcao: 'Field Service Electronics Engineer',
      sispat: 'hmh', idSispat: '47440696', birthDate: '1990-04-24', hiringDate: '2014-03-10', rg: 'MG-14.434.495',
      requirements: {
        ficha_registro: { status: 'ok' }, contrato_trabalho: { status: 'ok' }, ctp: { status: 'ok' },
        passaporte: { status: 'ok', expiry: '2028-07-19' },
        nr35: { status: 'ok', expiry: '2027-04-10' }, nr10: { status: 'ok', expiry: '2027-01-08' },
        huet: { status: 'ok', expiry: '2026-08-22', renewal: 'scheduled', scheduledDate: '2026-07-15' },
        hse_offshore: { status: 'ok', expiry: '2027-03-14' }, cbsp: { status: 'ok', expiry: '2026-12-08' },
        aso_periodico: { status: 'ok', expiry: '2027-02-15' }, aso_offshore: { status: 'ok', expiry: '2027-02-15' },
        rnm: { status: 'ok' }, regras_ouro: { status: 'ok' }, declaracao_cbsp: { status: 'ok' }
      }
    },
    {
      id: 6, name: 'Diego Gabriel Silva da Rocha', group: 'transactional', discipline: 'ele', regime: 'offshore', country: 'BR', active: true,
      cpfPassport: '150.202.467-51', email: 'Diego.Rocha@hmhw.com', funcao: 'Field Service Electronics Technician',
      sispat: 'constellation', idSispat: '71939274', birthDate: '1994-11-13', hiringDate: '2024-02-05', rg: '27.853.680-0',
      requirements: {
        ficha_registro: { status: 'ok' }, contrato_trabalho: { status: 'ok' }, ctp: { status: 'ok' },
        passaporte: { status: 'ok', expiry: '2030-05-20' },
        nr35: { status: 'ok', expiry: '2027-06-01' }, nr10: { status: 'ok', expiry: '2027-06-01' },
        huet: { status: 'ok', expiry: '2027-02-10' }, hse_offshore: { status: 'ok', expiry: '2027-02-10' },
        cbsp: { status: 'ok', expiry: '2027-05-15' },
        constellation_training: { status: 'ok', expiry: '2026-08-01', renewal: 'waiting_certificate' },
        aso_periodico: { status: 'ok', expiry: '2027-08-20' }, aso_offshore: { status: 'ok', expiry: '2027-08-20' },
        rnm: { status: 'ok' }, regras_ouro: { status: 'ok' }, declaracao_cbsp: { status: 'partial' }
      }
    },
    {
      id: 7, name: 'Antoine Dubois', group: 'expats', discipline: 'mec', regime: 'offshore', country: 'FR', active: true,
      cpfPassport: 'FR-AB123456', email: 'Antoine.Dubois@hmhw.com', funcao: 'Field Service Engineer',
      sispat: 'constellation', idSispat: '68201045', birthDate: '1985-03-14', hiringDate: '2019-09-01', rg: '',
      requirements: {
        passaporte: { status: 'ok', expiry: '2028-11-30' },
        nr35: { status: 'ok', expiry: '2026-12-10' },
        huet: { status: 'ok', expiry: '2026-09-25' }, hse_offshore: { status: 'ok', expiry: '2027-01-05' },
        cbsp: { status: 'ok', expiry: '2026-10-12' },
        constellation_training: { status: 'ok', expiry: '2026-09-20' },
        aso_offshore: { status: 'ok', expiry: '2027-04-08' },
        rnm: { status: 'ok' }, regras_ouro: { status: 'ok' }
      }
    },
    {
      id: 8, name: 'Rodney Smith', group: 'expats', discipline: 'ele', regime: 'offshore', country: 'US', active: true,
      cpfPassport: 'US-RS987654', email: 'Rodney.Smith@hmhw.com', funcao: 'Field Service Engineer',
      sispat: 'foresea', idSispat: '55318802', birthDate: '1979-07-22', hiringDate: '2017-03-15', rg: '',
      requirements: {
        passaporte: { status: 'ok', expiry: '2027-04-18' },
        nr35: { status: 'ok', expiry: '2026-08-05', renewal: 'not_requested' },
        huet: { status: 'ok', expiry: '2027-01-20' }, hse_offshore: { status: 'ok', expiry: '2027-01-20' },
        cbsp: { status: 'ok', expiry: '2026-11-30' },
        constellation_training: { status: 'ok', expiry: '2026-12-01' },
        aso_offshore: { status: 'ok', expiry: '2026-10-15' },
        rnm: { status: 'ok' }, regras_ouro: { status: 'ok' }
      }
    },
    {
      id: 9, name: 'Carlos Eduardo Fonseca', group: 'csa', discipline: 'mec', regime: 'onshore', country: 'BR', active: true,
      cpfPassport: '322.541.980-11', email: 'Carlos.Fonseca@hmhw.com', funcao: 'Field Service Coordinator',
      sispat: 'hmh', idSispat: '61005530', birthDate: '1980-05-12', hiringDate: '2008-11-03', rg: '18.774.320-1',
      requirements: {
        ficha_registro: { status: 'ok' }, contrato_trabalho: { status: 'ok' }, ctp: { status: 'ok' },
        crea: { status: 'ok', expiry: '2027-01-10' },
        nr12: { status: 'ok', expiry: '2026-10-20' },
        aso_periodico: { status: 'ok', expiry: '2026-08-12', renewal: 'requested_hr' },
        rnm: { status: 'missing' }, regras_ouro: { status: 'ok' }
      }
    },
    {
      id: 10, name: 'Marcelo Augusto Ribeiro', group: 'overhaul', discipline: 'mec', regime: 'onshore', country: 'BR', active: true,
      cpfPassport: '441.882.074-33', email: 'Marcelo.Ribeiro@hmhw.com', funcao: 'Overhaul Technician',
      sispat: 'hmh', idSispat: '59872014', birthDate: '1988-09-30', hiringDate: '2015-02-16', rg: '33.291.057-8',
      requirements: {
        ficha_registro: { status: 'ok' }, contrato_trabalho: { status: 'ok' }, ctp: { status: 'ok' },
        nr35: { status: 'ok', expiry: '2027-05-20' }, nr12: { status: 'ok', expiry: '2026-09-14' },
        nr33: { status: 'ok', expiry: '2027-02-28' },
        aso_periodico: { status: 'ok', expiry: '2027-06-10' },
        rnm: { status: 'ok' }
      }
    },
    {
      id: 11, name: 'Justin Goodwin', group: 'expats', discipline: 'mec', regime: 'offshore', country: 'GB', active: true,
      cpfPassport: 'GB-JG741852', email: 'Justin.Goodwin@hmhw.com', funcao: 'Field Service Engineer',
      sispat: 'constellation', idSispat: '72510038', birthDate: '1983-12-01', hiringDate: '2020-06-10', rg: '',
      requirements: {
        passaporte: { status: 'ok', expiry: '2029-08-14' },
        nr35: { status: 'ok', expiry: '2027-01-30' },
        huet: { status: 'ok', expiry: '2027-03-15' }, hse_offshore: { status: 'ok', expiry: '2027-03-15' },
        cbsp: { status: 'ok', expiry: '2026-11-05' },
        constellation_training: { status: 'ok', expiry: '2026-07-20', renewal: 'not_requested' },
        aso_offshore: { status: 'ok', expiry: '2027-05-22' },
        rnm: { status: 'partial' }, regras_ouro: { status: 'ok' }
      }
    },
    {
      id: 12, name: 'Patricia Oliveira Santos', group: 'engineering_projects', discipline: 'ele', regime: 'onshore', country: 'BR', active: true,
      cpfPassport: '588.130.492-77', email: 'Patricia.Santos@hmhw.com', funcao: 'Engenheira de Projetos',
      sispat: 'hmh', idSispat: '63490217', birthDate: '1992-04-18', hiringDate: '2018-08-20', rg: 'SP-44.012.887',
      requirements: {
        ficha_registro: { status: 'ok' }, contrato_trabalho: { status: 'ok' }, ctp: { status: 'ok' },
        crea: { status: 'ok', expiry: '2026-11-30' },
        nr10: { status: 'ok', expiry: '2027-04-05' },
        aso_periodico: { status: 'ok', expiry: '2027-02-01' },
        rnm: { status: 'ok' }
      }
    }
  ],

  // HMH company documents — used in the HMH area table (single "General Documents" row)
  hmhDocuments: [
    { id: 'hmh1', name: 'HMH Brazil Operating License', category: 'hmh', hasExpiry: true, expiry: '2027-12-31', alertDays: 90, obs: 'Renew with ANP' },
    { id: 'hmh2', name: 'ISO 9001 Certificate',         category: 'hmh', hasExpiry: true, expiry: '2026-09-15', alertDays: 60, obs: 'Audit scheduled for August' },
    { id: 'hmh3', name: 'Business Operating Permit',    category: 'hmh', hasExpiry: true, expiry: '2026-12-31', alertDays: 90, obs: '' },
    { id: 'hmh4', name: 'Active Petrobras Contract',    category: 'hmh', hasExpiry: true, expiry: '2028-06-30', alertDays: 180, obs: 'Master contract' },
    { id: 'hmh5', name: 'Civil Liability Insurance',    category: 'hmh', hasExpiry: true, expiry: '2026-07-31', alertDays: 60, obs: 'Renewal in progress' }
  ],

  // HMH "General Documents" row — stores statuses for each hmhDocument as if it were an employee row
  hmhGeneralRow: {
    hmh1: { status: 'ok', expiry: '2027-12-31' },
    hmh2: { status: 'ok', expiry: '2026-09-15' },
    hmh3: { status: 'ok', expiry: '2026-12-31' },
    hmh4: { status: 'ok', expiry: '2028-06-30' },
    hmh5: { status: 'ok', expiry: '2026-07-31' }
  },

  drakeRequisitions: [
    {
      id: 'req1', name: 'GOLD - REQ 10178', client: 'Constellation',
      employees: [1, 2, 5, 6, 7, 11],
      requiredDocs: ['passaporte', 'nr35', 'huet', 'hse_offshore', 'cbsp', 'constellation_training', 'aso_offshore', 'rnm', 'regras_ouro', 'declaracao_cbsp'],
      hmhDocs: [],
      pendingUpdates: [
        { id: 'pu1', empId: 11, reqId: 'constellation_training', prevExpiry: null, newExpiry: '2026-07-20', addedAt: '2026-06-10', checkedAt: null, comment: '' },
        { id: 'pu3', empId: 6,  reqId: 'constellation_training', prevExpiry: null, newExpiry: '2026-08-01', addedAt: '2026-06-15', checkedAt: null, comment: '' }
      ],
      history: [
        { id: 'h1', empId: 5, reqId: 'huet', prevExpiry: null, newExpiry: '2026-08-22', addedAt: '2026-05-01', checkedAt: '2026-05-20', comment: '' },
        { id: 'h2', empId: 1, reqId: 'cbsp', prevExpiry: null, newExpiry: '2026-10-30', addedAt: '2026-05-01', checkedAt: '2026-05-20', comment: '' }
      ]
    },
    {
      id: 'req2', name: 'LONE - REQ 10404', client: 'Foresea',
      employees: [3, 4, 8],
      requiredDocs: ['passaporte', 'nr35', 'nr12', 'huet', 'hse_offshore', 'cbsp', 'aso_offshore', 'rnm', 'regras_ouro'],
      hmhDocs: [],
      pendingUpdates: [],
      history: [
        { id: 'h3', empId: 3, reqId: 'cbsp',  prevExpiry: null, newExpiry: '2026-08-14', addedAt: '2026-04-10', checkedAt: '2026-05-10', comment: '' },
        { id: 'h4', empId: 4, reqId: 'nr35',  prevExpiry: null, newExpiry: '2026-04-30', addedAt: '2026-04-10', checkedAt: '2026-05-10', comment: '' }
      ]
    },
    {
      id: 'req3', name: 'LONE - REQ 10180', client: 'Constellation',
      employees: [7, 11, 1, 5],
      requiredDocs: ['passaporte', 'nr35', 'huet', 'hse_offshore', 'cbsp', 'constellation_training', 'aso_offshore', 'rnm'],
      hmhDocs: [],
      pendingUpdates: [
        { id: 'pu4', empId: 7,  reqId: 'constellation_training', prevExpiry: null, newExpiry: '2026-09-20', addedAt: '2026-06-18', checkedAt: null, comment: '' },
        { id: 'pu5', empId: 11, reqId: 'constellation_training', prevExpiry: null, newExpiry: '2026-07-20', addedAt: '2026-06-10', checkedAt: null, comment: '' }
      ],
      history: []
    }
  ],

  personnelColumns: [
    { id: 'nome',        label: 'Name',          type: 'text',  protected: true },
    { id: 'area',        label: 'Area',          type: 'text'  },
    { id: 'cpfPassport', label: 'CPF / Passport',type: 'text'  },
    { id: 'email',       label: 'Email',         type: 'text'  },
    { id: 'funcao',      label: 'Position',      type: 'text'  },
    { id: 'sispat',      label: 'Sispat Status', type: 'sispat'},
    { id: 'idSispat',    label: 'Sispat ID',     type: 'text'  },
    { id: 'birthDate',   label: 'Date of Birth', type: 'date'  },
    { id: 'hiringDate',  label: 'Hire Date',     type: 'date'  },
    { id: 'rg',          label: 'RG',            type: 'text'  }
  ],

  nextId: 13
};
