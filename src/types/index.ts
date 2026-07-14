// ============================================================
// Global AI GPA & CGPA Calculator — All Type Definitions
// ============================================================

export interface GradeMapping {
  letter: string
  point: number
  marks: string
}

export interface SubjectTemplate {
  name: string
  credit: number
  type?: 'theory' | 'lab' | 'thesis' | 'optional'
}

export interface WaiverRule {
  gpa_threshold: number
  waiver_percentage: number
  details?: string
}

export interface WaiverPolicy {
  has_waiver: boolean
  rules: WaiverRule[]
  details: string
  source_url?: string
}

export interface GradingPolicy {
  country: string
  university: string
  level: string
  grading_scale: string
  credit_system: string
  pass_mark: number
  subjects: SubjectTemplate[]
  grade_mapping: GradeMapping[]
  formula: string
  optional_course: boolean
  retake: boolean
  semester_based: boolean
  verified: boolean
  confidence: number
  source_url?: string
  notes?: string
  waiver_policy?: WaiverPolicy
}

export interface SubjectEntry {
  id: string
  name: string
  credit: number
  marks?: number
  letterGrade?: string
  gradePoint?: number
  type: 'theory' | 'lab' | 'thesis' | 'optional'
  isRetake?: boolean
}

export interface SemesterEntry {
  id: string
  name: string
  subjects: SubjectEntry[]
}

export interface SemesterResult {
  semesterId: string
  semesterName: string
  gpa: number
  credits: number
}

export interface CalculationResult {
  cgpa: number
  gpa: number
  totalCredits: number
  earnedCredits: number
  semesterResults: SemesterResult[]
}

export interface UniversityInfo {
  name: string
  city: string
  type: 'public' | 'private' | 'national' | 'international'
  website?: string
  ranking?: string
}

export interface HistoryEntry {
  id: string
  timestamp: string
  country: string
  countryCode: string
  level: string
  university: string
  result: CalculationResult
  gradingPolicy: GradingPolicy
}
