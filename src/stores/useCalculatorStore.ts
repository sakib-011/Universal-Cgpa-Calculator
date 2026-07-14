import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  GradingPolicy, SubjectEntry, SemesterEntry, UniversityInfo, CalculationResult
} from '../types'
import { generateId } from '../lib/utils'

const DEFAULT_POLICY: GradingPolicy = {
  country: 'Bangladesh',
  university: 'Standard Preset',
  level: 'Standard',
  grading_scale: '4.00',
  credit_system: 'Credit Hour',
  pass_mark: 40,
  subjects: [],
  grade_mapping: [
    { letter: 'A+', point: 4.0, marks: '80-100' },
    { letter: 'A', point: 3.75, marks: '75-79' },
    { letter: 'A-', point: 3.5, marks: '70-74' },
    { letter: 'B+', point: 3.25, marks: '65-69' },
    { letter: 'B', point: 3.0, marks: '60-64' },
    { letter: 'B-', point: 2.75, marks: '55-59' },
    { letter: 'C+', point: 2.5, marks: '50-54' },
    { letter: 'C', point: 2.25, marks: '45-49' },
    { letter: 'D', point: 2.0, marks: '40-44' },
    { letter: 'F', point: 0.0, marks: '0-39' }
  ],
  formula: 'sum(credit*point)/total_credit',
  optional_course: false,
  retake: true,
  semester_based: true,
  verified: true,
  confidence: 1.0
}

function makeSubject(name = '', credit = 3): SubjectEntry {
  return { id: generateId(), name, credit, type: 'theory' }
}

function makeSemester(n: number): SemesterEntry {
  return { id: generateId(), name: `Semester ${n}`, subjects: [makeSubject()] }
}

function getGradePoint(marks: number, policy: GradingPolicy): number | undefined {
  for (const g of policy.grade_mapping) {
    const parts = g.marks.split('-').map(Number)
    if (parts.length === 2 && marks >= parts[0] && marks <= parts[1]) return g.point
  }
  return undefined
}

function calcGPA(subjects: SubjectEntry[]): number {
  const valid = subjects.filter((s) => s.gradePoint !== undefined && s.credit > 0)
  if (!valid.length) return 0
  const pts = valid.reduce((a, s) => a + s.credit * (s.gradePoint ?? 0), 0)
  const creds = valid.reduce((a, s) => a + s.credit, 0)
  return creds > 0 ? pts / creds : 0
}

interface CalcStore {
  country: string
  countryCode: string
  setCountry: (name: string, code: string) => void

  level: string
  setLevel: (l: string) => void

  university: UniversityInfo | null
  setUniversity: (u: UniversityInfo | null) => void

  gradingPolicy: GradingPolicy | null
  setGradingPolicy: (p: GradingPolicy) => void

  semesters: SemesterEntry[]
  subjects: SubjectEntry[]
  addSemester: () => void
  removeSemester: (id: string) => void
  updateSemesterName: (id: string, name: string) => void
  addSubject: (semId?: string) => void
  removeSubject: (subjId: string, semId?: string) => void
  updateSubject: (subjId: string, updates: Partial<SubjectEntry>, semId?: string) => void

  result: CalculationResult | null
  calculate: () => void
  reset: () => void
}

export const useCalculatorStore = create<CalcStore>()(
  persist(
    (set, get) => ({
      country: 'Manual Mode',
      countryCode: 'MM',
      setCountry: (name, code) => set({
        country: name, countryCode: code,
        level: '', university: null, gradingPolicy: null, result: null,
        semesters: [makeSemester(1)], subjects: [makeSubject()],
      }),

      level: 'Standard',
      setLevel: (l) => set({ level: l, university: null, gradingPolicy: null, result: null }),

      university: null,
      setUniversity: (u) => set({ university: u, gradingPolicy: null, result: null }),

      gradingPolicy: DEFAULT_POLICY,
      setGradingPolicy: (p) => {
        const initSubjects = p.subjects.length
          ? p.subjects.map((s) => makeSubject(s.name, s.credit))
          : [makeSubject(), makeSubject(), makeSubject()]

        if (p.semester_based) {
          set({
            gradingPolicy: p,
            semesters: [{ id: generateId(), name: 'Semester 1', subjects: initSubjects }],
            subjects: [],
            result: null,
          })
        } else {
          set({ gradingPolicy: p, subjects: initSubjects, semesters: [], result: null })
        }
      },

      semesters: [{ id: generateId(), name: 'Semester 1', subjects: [makeSubject('', 3)] }],
      subjects: [makeSubject('', 3)],

      addSemester: () => set((s) => ({
        semesters: [...s.semesters, makeSemester(s.semesters.length + 1)],
      })),
      removeSemester: (id) => set((s) => ({
        semesters: s.semesters.filter((sem) => sem.id !== id),
      })),
      updateSemesterName: (id, name) => set((s) => ({
        semesters: s.semesters.map((sem) => sem.id === id ? { ...sem, name } : sem),
      })),

      addSubject: (semId) => {
        if (semId) {
          set((s) => ({
            semesters: s.semesters.map((sem) =>
              sem.id === semId ? { ...sem, subjects: [...sem.subjects, makeSubject()] } : sem
            ),
          }))
        } else {
          set((s) => ({ subjects: [...s.subjects, makeSubject()] }))
        }
      },
      removeSubject: (subjId, semId) => {
        if (semId) {
          set((s) => ({
            semesters: s.semesters.map((sem) =>
              sem.id === semId
                ? { ...sem, subjects: sem.subjects.filter((sub) => sub.id !== subjId) }
                : sem
            ),
          }))
        } else {
          set((s) => ({ subjects: s.subjects.filter((sub) => sub.id !== subjId) }))
        }
      },
      updateSubject: (subjId, updates, semId) => {
        const policy = get().gradingPolicy
        let finalUpdates = { ...updates }
        if (updates.marks !== undefined && policy) {
          const gp = getGradePoint(updates.marks, policy)
          const matchGrade = policy.grade_mapping.find((g) => {
            const p = g.marks.split('-').map(Number)
            return updates.marks! >= p[0] && updates.marks! <= p[1]
          })
          finalUpdates = { ...finalUpdates, gradePoint: gp, letterGrade: matchGrade?.letter }
        }
        if (updates.letterGrade !== undefined && policy) {
          const gp = policy.grade_mapping.find((g) => g.letter === updates.letterGrade)?.point
          finalUpdates = { ...finalUpdates, gradePoint: gp }
        }

        if (semId) {
          set((s) => ({
            semesters: s.semesters.map((sem) =>
              sem.id === semId
                ? { ...sem, subjects: sem.subjects.map((sub) => sub.id === subjId ? { ...sub, ...finalUpdates } : sub) }
                : sem
            ),
          }))
        } else {
          set((s) => ({
            subjects: s.subjects.map((sub) => sub.id === subjId ? { ...sub, ...finalUpdates } : sub),
          }))
        }
      },

      result: null,
      calculate: () => {
        const { gradingPolicy, semesters, subjects } = get()
        const scale = parseFloat(gradingPolicy?.grading_scale ?? '4') || 4

        if (gradingPolicy?.semester_based && semesters.length > 0) {
          const semResults = semesters.map((sem) => ({
            semesterId: sem.id,
            semesterName: sem.name,
            gpa: Math.min(calcGPA(sem.subjects), scale),
            credits: sem.subjects.filter((s) => s.gradePoint !== undefined).reduce((a, s) => a + s.credit, 0),
          }))
          const allSubs = semesters.flatMap((s) => s.subjects)
          const cgpa = Math.min(calcGPA(allSubs), scale)
          set({
            result: {
              cgpa,
              gpa: semResults.length > 0 ? semResults[semResults.length - 1].gpa : cgpa,
              totalCredits: allSubs.reduce((a, s) => a + s.credit, 0),
              earnedCredits: allSubs.filter((s) => (s.gradePoint ?? 0) > 0).reduce((a, s) => a + s.credit, 0),
              semesterResults: semResults,
            },
          })
        } else {
          const gpa = Math.min(calcGPA(subjects), scale)
          set({
            result: {
              cgpa: gpa, gpa,
              totalCredits: subjects.reduce((a, s) => a + s.credit, 0),
              earnedCredits: subjects.filter((s) => (s.gradePoint ?? 0) > 0).reduce((a, s) => a + s.credit, 0),
              semesterResults: [],
            },
          })
        }
      },

      reset: () => set({
        country: 'Manual Mode', countryCode: 'MM', level: 'Standard', university: null,
        gradingPolicy: DEFAULT_POLICY, semesters: [{ id: generateId(), name: 'Semester 1', subjects: [makeSubject('', 3)] }], subjects: [makeSubject('', 3)], result: null,
      }),
    }),
    {
      name: 'gpa-calculator',
      partialize: (s) => ({
        country: s.country,
        countryCode: s.countryCode,
        level: s.level,
        semesters: s.semesters,
        subjects: s.subjects,
        gradingPolicy: s.gradingPolicy,
        result: s.result,
      }),
    }
  )
)
