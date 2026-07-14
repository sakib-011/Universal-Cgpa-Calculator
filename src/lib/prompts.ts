// ============================================================
// Gemini AI Prompt Templates
// ============================================================

export const EDUCATION_LEVELS_PROMPT = (country: string) => `
You are an expert on global education systems.

For the country "${country}", list ALL education levels where GPA, CGPA, or academic grades are calculated.
Include primary, secondary, diploma, undergraduate, postgraduate, and professional levels.
Be specific to this country's actual system (e.g. for Bangladesh: SSC, HSC, Honours, Masters; for USA: High School, Associate, Bachelor, Master, PhD).

Return ONLY a valid JSON array of strings. No explanation, no markdown.
Example: ["SSC", "HSC", "Honours", "Masters", "PhD"]
`

export const UNIVERSITIES_PROMPT = (country: string, level: string) => `
You are an expert on global universities.

List the top 25 universities/institutions in ${country} that offer ${level} programs.
Include both public and private, mix of well-known and regional universities.

Return ONLY a valid JSON array. No explanation, no markdown.
Format:
[
  { "name": "University of Dhaka", "city": "Dhaka", "type": "public", "website": "https://du.ac.bd", "ranking": "Top 5" }
]

The "type" field must be one of: "public", "private", "national", "international"
`

export const GRADING_POLICY_PROMPT = (university: string, country: string, level: string) => `
You are an academic policy researcher.

Find the OFFICIAL grading system for "${university}" in ${country} for ${level} programs.
Search for: official grading policy, academic regulations, student handbook, registrar documentation.

NEVER invent grading rules. Base your answer only on what you know about this university's official policies.

Return ONLY a valid JSON object. No explanation, no markdown.

{
  "country": "${country}",
  "university": "${university}",
  "level": "${level}",
  "grading_scale": "4.00",
  "credit_system": "Credit Hour",
  "pass_mark": 40,
  "subjects": [
    { "name": "Course 1", "credit": 3, "type": "theory" },
    { "name": "Lab 1", "credit": 1.5, "type": "lab" }
  ],
  "grade_mapping": [
    { "letter": "A+", "point": 4.0, "marks": "80-100" },
    { "letter": "A", "point": 3.75, "marks": "75-79" },
    { "letter": "A-", "point": 3.5, "marks": "70-74" },
    { "letter": "B+", "point": 3.25, "marks": "65-69" },
    { "letter": "B", "point": 3.0, "marks": "60-64" },
    { "letter": "B-", "point": 2.75, "marks": "55-59" },
    { "letter": "C+", "point": 2.5, "marks": "50-54" },
    { "letter": "C", "point": 2.25, "marks": "45-49" },
    { "letter": "D", "point": 2.0, "marks": "40-44" },
    { "letter": "F", "point": 0.0, "marks": "0-39" }
  ],
  "formula": "sum(credit×point)/total_credit",
  "optional_course": true,
  "retake": true,
  "semester_based": true,
  "verified": true,
  "confidence": 0.9,
  "source_url": "https://university.edu/academics/grading",
  "notes": "Based on official academic regulations 2024"
}

Set "verified": false and "confidence" < 0.6 if you cannot find official information.
Set "confidence" between 0.0 and 1.0 based on certainty level.
The grade_mapping MUST reflect this specific university's actual grading scale.
`
