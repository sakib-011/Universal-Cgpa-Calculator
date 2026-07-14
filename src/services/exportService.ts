import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Papa from 'papaparse'
import type { CalculationResult, GradingPolicy, SubjectEntry, SemesterEntry } from '../types'

export async function exportToPDF(elId: string, filename = 'gpa-result.pdf') {
  const el = document.getElementById(elId)
  if (!el) throw new Error('Element not found')
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#0f0f1a' })
  const img = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const w = pdf.internal.pageSize.getWidth()
  const h = (canvas.height * w) / canvas.width
  pdf.addImage(img, 'PNG', 0, 0, w, h)
  pdf.save(filename)
}

export async function exportToPNG(elId: string, filename = 'gpa-result.png') {
  const el = document.getElementById(elId)
  if (!el) throw new Error('Element not found')
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#0f0f1a' })
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL()
  link.click()
}

export function exportToCSV(
  subjects: SubjectEntry[],
  semesters: SemesterEntry[],
  result: CalculationResult,
  policy: GradingPolicy,
  filename = 'gpa-data.csv'
) {
  const rows: Record<string, string | number>[] = []

  if (policy.semester_based) {
    semesters.forEach((sem) => {
      sem.subjects.forEach((s) => {
        rows.push({
          Semester: sem.name,
          Subject: s.name,
          Credits: s.credit,
          Type: s.type,
          Grade: s.letterGrade ?? '',
          Marks: s.marks ?? '',
          GP: s.gradePoint ?? '',
        })
      })
    })
  } else {
    subjects.forEach((s) => {
      rows.push({
        Subject: s.name,
        Credits: s.credit,
        Type: s.type,
        Grade: s.letterGrade ?? '',
        Marks: s.marks ?? '',
        GP: s.gradePoint ?? '',
      })
    })
  }

  rows.push({})
  rows.push({ Subject: 'CGPA', Credits: result.totalCredits, GP: result.cgpa.toFixed(2) })

  const csv = Papa.unparse(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}
