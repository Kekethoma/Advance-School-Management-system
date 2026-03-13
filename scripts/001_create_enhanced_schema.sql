-- Create comprehensive database schema for Sierra Leone curriculum

-- Schools table (enhanced)
CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('private', 'government', 'government-assisted')),
  location TEXT NOT NULL,
  address TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  principal_name TEXT NOT NULL,
  principal_id TEXT UNIQUE NOT NULL,
  principal_password TEXT NOT NULL,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending'))
);

-- Students table (with Sierra Leone curriculum support)
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  password TEXT NOT NULL,
  student_id TEXT UNIQUE NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('JSS I', 'JSS II', 'JSS III', 'SSS I', 'SSS II', 'SSS III')),
  department TEXT CHECK (department IN ('Arts', 'Science', 'Commercial', NULL)),
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teachers table (with department and class assignments)
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  password TEXT NOT NULL,
  teacher_id TEXT UNIQUE NOT NULL,
  department TEXT CHECK (department IN ('Arts', 'Science', 'Commercial', 'General')),
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table (Sierra Leone curriculum)
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  department TEXT CHECK (department IN ('Arts', 'Science', 'Commercial', 'JSS', 'General')),
  level_group TEXT CHECK (level_group IN ('JSS', 'SSS', 'Both')),
  description TEXT,
  is_core BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student subjects assignment
CREATE TABLE IF NOT EXISTS student_subjects (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, subject_id)
);

-- Teacher assignments (subjects and classes)
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id TEXT PRIMARY KEY,
  teacher_id TEXT REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  class_level TEXT NOT NULL CHECK (class_level IN ('JSS I', 'JSS II', 'JSS III', 'SSS I', 'SSS II', 'SSS III')),
  department TEXT CHECK (department IN ('Arts', 'Science', 'Commercial', NULL)),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(teacher_id, subject_id, class_level, department)
);

-- Materials (with permission checks)
CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id TEXT REFERENCES teachers(id) ON DELETE CASCADE,
  class_level TEXT NOT NULL,
  department TEXT,
  file_url TEXT,
  file_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP
);

-- Grades (with permission checks)
CREATE TABLE IF NOT EXISTS grades (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id TEXT REFERENCES teachers(id) ON DELETE CASCADE,
  assessment_type TEXT CHECK (assessment_type IN ('exam', 'quiz', 'assignment', 'project', 'midterm', 'final')),
  score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  letter_grade TEXT,
  comments TEXT,
  semester TEXT,
  academic_year TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  posted_by TEXT NOT NULL,
  posted_by_role TEXT CHECK (posted_by_role IN ('principal', 'teacher')),
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Complaints
CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  submitted_by TEXT NOT NULL,
  submitted_by_role TEXT CHECK (submitted_by_role IN ('student', 'teacher')),
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

-- Acceptance letters
CREATE TABLE IF NOT EXISTS acceptance_letters (
  id TEXT PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_role TEXT CHECK (recipient_role IN ('student', 'teacher')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_level ON students(level);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);
CREATE INDEX IF NOT EXISTS idx_teachers_school ON teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_subjects_student ON student_subjects(student_id);
CREATE INDEX IF NOT EXISTS idx_materials_subject ON materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_teacher ON materials(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject ON grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_teacher ON grades(teacher_id);
