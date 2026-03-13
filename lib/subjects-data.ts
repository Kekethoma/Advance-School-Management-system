export const JSS_SUBJECTS = [
  { id: 'subj_jss_eng', name: 'English Language', code: 'ENG-JSS', isCore: true },
  { id: 'subj_jss_math', name: 'Mathematics', code: 'MATH-JSS', isCore: true },
  { id: 'subj_jss_sci', name: 'Integrated Science', code: 'SCI-JSS', isCore: true },
  { id: 'subj_jss_sst', name: 'Social Studies', code: 'SST-JSS', isCore: true },
  { id: 'subj_jss_rme', name: 'Religious and Moral Education', code: 'RME-JSS', isCore: true },
  { id: 'subj_jss_agric', name: 'Agricultural Science', code: 'AGRIC-JSS', isCore: false },
  { id: 'subj_jss_bst', name: 'Business Studies', code: 'BST-JSS', isCore: false },
  { id: 'subj_jss_comp', name: 'Computer Studies', code: 'COMP-JSS', isCore: false },
  { id: 'subj_jss_arts', name: 'Creative Arts', code: 'ARTS-JSS', isCore: false },
  { id: 'subj_jss_pe', name: 'Physical Education', code: 'PE-JSS', isCore: false },
]

export const SSS_CORE_SUBJECTS = [
  { id: 'subj_sss_eng', name: 'English Language', code: 'ENG-SSS' },
  { id: 'subj_sss_math', name: 'Mathematics', code: 'MATH-SSS' },
]

export const ARTS_SUBJECTS = [
  ...SSS_CORE_SUBJECTS,
  { id: 'subj_arts_lit', name: 'Literature-in-English', code: 'LIT-ARTS' },
  { id: 'subj_arts_pol', name: 'Politics and Governance', code: 'POL-ARTS' },
  { id: 'subj_arts_afr_hist', name: 'African History', code: 'AHIST-ARTS' },
  { id: 'subj_arts_sl_hist', name: 'Sierra Leone History', code: 'SLHIST-ARTS' },
  { id: 'subj_arts_agric', name: 'Agricultural Science', code: 'AGRIC-ARTS' },
  { id: 'subj_arts_rme', name: 'Religious and Moral Education', code: 'RME-ARTS' },
  { id: 'subj_arts_geog', name: 'Geography', code: 'GEOG-ARTS' },
  { id: 'subj_arts_econs', name: 'Economics', code: 'ECON-ARTS' },
  { id: 'subj_arts_french', name: 'French', code: 'FRENCH-ARTS' },
]

export const SCIENCE_SUBJECTS = [
  ...SSS_CORE_SUBJECTS,
  { id: 'subj_sci_chem', name: 'Chemistry', code: 'CHEM-SCI' },
  { id: 'subj_sci_phys', name: 'Physics', code: 'PHYS-SCI' },
  { id: 'subj_sci_bio', name: 'Biology', code: 'BIO-SCI' },
  { id: 'subj_sci_health', name: 'Health Science', code: 'HEALTH-SCI' },
  { id: 'subj_sci_agric', name: 'Agricultural Science', code: 'AGRIC-SCI' },
  { id: 'subj_sci_econs', name: 'Economics', code: 'ECON-SCI' },
  { id: 'subj_sci_fmath', name: 'Further Mathematics', code: 'FMATH-SCI' },
  { id: 'subj_sci_core', name: 'Science Core', code: 'CORE-SCI' },
  { id: 'subj_sci_comp', name: 'Computer Science', code: 'COMP-SCI' },
]

export const COMMERCIAL_SUBJECTS = [
  ...SSS_CORE_SUBJECTS,
  { id: 'subj_comm_facc', name: 'Financial Accounting', code: 'FACC-COMM' },
  { id: 'subj_comm_cacc', name: 'Cost Accounting', code: 'CACC-COMM' },
  { id: 'subj_comm_accfin', name: 'Accounting and Finance', code: 'ACCFIN-COMM' },
  { id: 'subj_comm_becon', name: 'Business Economics', code: 'BECON-COMM' },
  { id: 'subj_comm_bmgt', name: 'Business Management', code: 'BMGT-COMM' },
  { id: 'subj_comm_commerce', name: 'Commerce', code: 'COMMERCE-COMM' },
  { id: 'subj_comm_typing', name: 'Typewriting', code: 'TYPE-COMM' },
  { id: 'subj_comm_office', name: 'Office Practice', code: 'OFFICE-COMM' },
]

export const STUDENT_LEVELS = {
  JSS: ['JSS I', 'JSS II', 'JSS III'],
  SSS: ['SSS I', 'SSS II', 'SSS III'],
}

export const DEPARTMENTS = ['Arts', 'Science', 'Commercial']

export function getSubjectsForStudent(level: string, department?: string) {
  // JSS students get JSS subjects
  if (level.startsWith('JSS')) {
    return JSS_SUBJECTS
  }

  // SSS students get subjects based on their department
  if (level.startsWith('SSS')) {
    switch (department) {
      case 'Arts':
        return ARTS_SUBJECTS
      case 'Science':
        return SCIENCE_SUBJECTS
      case 'Commercial':
        return COMMERCIAL_SUBJECTS
      default:
        return SSS_CORE_SUBJECTS
    }
  }

  return []
}
