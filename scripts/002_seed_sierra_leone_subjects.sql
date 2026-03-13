-- Seed Sierra Leone curriculum subjects

-- JSS Subjects (BECE Curriculum)
INSERT INTO subjects (id, name, code, department, level_group, is_core) VALUES
('subj_jss_eng', 'English Language', 'ENG-JSS', 'JSS', 'JSS', true),
('subj_jss_math', 'Mathematics', 'MATH-JSS', 'JSS', 'JSS', true),
('subj_jss_sci', 'Integrated Science', 'SCI-JSS', 'JSS', 'JSS', true),
('subj_jss_sst', 'Social Studies', 'SST-JSS', 'JSS', 'JSS', true),
('subj_jss_rme', 'Religious and Moral Education', 'RME-JSS', 'JSS', 'JSS', true),
('subj_jss_agric', 'Agricultural Science', 'AGRIC-JSS', 'JSS', 'JSS', false),
('subj_jss_bst', 'Business Studies', 'BST-JSS', 'JSS', 'JSS', false),
('subj_jss_comp', 'Computer Studies', 'COMP-JSS', 'JSS', 'JSS', false),
('subj_jss_arts', 'Creative Arts', 'ARTS-JSS', 'JSS', 'JSS', false),
('subj_jss_pe', 'Physical Education', 'PE-JSS', 'JSS', 'JSS', false)
ON CONFLICT (code) DO NOTHING;

-- SSS Core Subjects (All Departments)
INSERT INTO subjects (id, name, code, department, level_group, is_core) VALUES
('subj_sss_eng', 'English Language', 'ENG-SSS', 'General', 'SSS', true),
('subj_sss_math', 'Mathematics', 'MATH-SSS', 'General', 'SSS', true)
ON CONFLICT (code) DO NOTHING;

-- SSS Arts Subjects
INSERT INTO subjects (id, name, code, department, level_group, is_core) VALUES
('subj_arts_lit', 'Literature-in-English', 'LIT-ARTS', 'Arts', 'SSS', false),
('subj_arts_pol', 'Politics and Governance', 'POL-ARTS', 'Arts', 'SSS', false),
('subj_arts_afr_hist', 'African History', 'AHIST-ARTS', 'Arts', 'SSS', false),
('subj_arts_sl_hist', 'Sierra Leone History', 'SLHIST-ARTS', 'Arts', 'SSS', false),
('subj_arts_agric', 'Agricultural Science', 'AGRIC-ARTS', 'Arts', 'SSS', false),
('subj_arts_rme', 'Religious and Moral Education', 'RME-ARTS', 'Arts', 'SSS', false),
('subj_arts_geog', 'Geography', 'GEOG-ARTS', 'Arts', 'SSS', false),
('subj_arts_econs', 'Economics', 'ECON-ARTS', 'Arts', 'SSS', false),
('subj_arts_french', 'French', 'FRENCH-ARTS', 'Arts', 'SSS', false)
ON CONFLICT (code) DO NOTHING;

-- SSS Science Subjects
INSERT INTO subjects (id, name, code, department, level_group, is_core) VALUES
('subj_sci_chem', 'Chemistry', 'CHEM-SCI', 'Science', 'SSS', false),
('subj_sci_phys', 'Physics', 'PHYS-SCI', 'Science', 'SSS', false),
('subj_sci_bio', 'Biology', 'BIO-SCI', 'Science', 'SSS', false),
('subj_sci_health', 'Health Science', 'HEALTH-SCI', 'Science', 'SSS', false),
('subj_sci_agric', 'Agricultural Science', 'AGRIC-SCI', 'Science', 'SSS', false),
('subj_sci_econs', 'Economics', 'ECON-SCI', 'Science', 'SSS', false),
('subj_sci_fmath', 'Further Mathematics', 'FMATH-SCI', 'Science', 'SSS', false),
('subj_sci_core', 'Science Core', 'CORE-SCI', 'Science', 'SSS', false),
('subj_sci_comp', 'Computer Science', 'COMP-SCI', 'Science', 'SSS', false)
ON CONFLICT (code) DO NOTHING;

-- SSS Commercial Subjects
INSERT INTO subjects (id, name, code, department, level_group, is_core) VALUES
('subj_comm_facc', 'Financial Accounting', 'FACC-COMM', 'Commercial', 'SSS', false),
('subj_comm_cacc', 'Cost Accounting', 'CACC-COMM', 'Commercial', 'SSS', false),
('subj_comm_accfin', 'Accounting and Finance', 'ACCFIN-COMM', 'Commercial', 'SSS', false),
('subj_comm_becon', 'Business Economics', 'BECON-COMM', 'Commercial', 'SSS', false),
('subj_comm_bmgt', 'Business Management', 'BMGT-COMM', 'Commercial', 'SSS', false),
('subj_comm_commerce', 'Commerce', 'COMMERCE-COMM', 'Commercial', 'SSS', false),
('subj_comm_typing', 'Typewriting', 'TYPE-COMM', 'Commercial', 'SSS', false),
('subj_comm_office', 'Office Practice', 'OFFICE-COMM', 'Commercial', 'SSS', false)
ON CONFLICT (code) DO NOTHING;
