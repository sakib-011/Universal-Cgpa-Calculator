import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import axios from 'axios'
import * as cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'

// Determine folder paths (ES Module compliant)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const FEEDBACK_FILE = path.join(__dirname, 'feedback.json')

// Load environment variables from the root workspace directory
dotenv.config({ path: path.join(__dirname, '../.env') })

// Built-in Groq API Keys list for failover rotation (Loaded from .env)
const BUILTIN_GROQ_KEYS = [
  process.env.VITE_GROQ_API_KEY_1 || process.env.GROQ_API_KEY_1,
  process.env.VITE_GROQ_API_KEY_2 || process.env.GROQ_API_KEY_2,
  process.env.VITE_GROQ_API_KEY_3 || process.env.GROQ_API_KEY_3,
  process.env.VITE_GROQ_API_KEY_4 || process.env.GROQ_API_KEY_4,
  process.env.VITE_GROQ_API_KEY_5 || process.env.GROQ_API_KEY_5,
  process.env.VITE_GROQ_API_KEY_6 || process.env.GROQ_API_KEY_6,
  process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY
].filter(Boolean)

// Configure Nodemailer for feedback email delivery
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '', // Sender Gmail address (configure in .env)
    pass: (process.env.SMTP_PASS || '').replace(/\s+/g, '')  // Sender App Password (configure in .env)
  }
})

const app = express()
const PORT = process.env.PORT || 5000

// Enable Middleware
app.use(cors())
app.use(express.json())

// Helper: Ensure feedback file exists
if (!fs.existsSync(FEEDBACK_FILE)) {
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify([], null, 2))
}

// ── REAL-TIME WEB SCRAPING UTILITIES ───────────────────────────────────

/**
 * Searches DuckDuckGo HTML for top organic search results
 */
async function searchWeb(query) {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    console.log(`[Search] Querying: "${query}"`)
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      },
      timeout: 5000
    })

    const $ = cheerio.load(response.data)
    const results = []

    $('.result').each((i, el) => {
      if (i >= 3) return // Top 3 links are enough
      const title = $(el).find('.result__title').text().trim()
      const link = $(el).find('.result__url').attr('href')
      const snippet = $(el).find('.result__snippet').text().trim()

      if (link) {
        // DDG redirects links through a gateway, parse out clean URL
        const cleanLink = link.startsWith('//duckduckgo.com/y.js') 
          ? decodeURIComponent(link.split('uddg=')[1]?.split('&')[0] || link)
          : link
        results.push({ title, link: cleanLink, snippet })
      }
    })

    return results
  } catch (error) {
    console.error('[Search Error] Failed web search:', error.message)
    return []
  }
}

/**
 * Fetches HTML from a URL and extracts readable text
 */
async function scrapePageText(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      },
      timeout: 3000
    })

    const $ = cheerio.load(response.data)
    
    // Remove scripts, styles, navigation, footer, ads to clean text
    $('script, style, nav, footer, iframe, ads, header').remove()
    
    const text = $('body').text()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000) // limit size to conserve LLM context tokens

    return text
  } catch (error) {
    console.warn(`[Scrape Warning] Could not scrape page: ${url} (${error.message})`)
    return ''
  }
}

/**
 * Searches and scrapes web contents for a university grading and waiver system
 */
async function gatherContext(university, country, level) {
  const query1 = `${university} ${country} ${level} GPA CGPA official grading policy scale`
  const query2 = `${university} tuition waiver scholarship GPA criteria`
  
  const searchResults1 = await searchWeb(query1)
  const searchResults2 = await searchWeb(query2)
  const allResults = [...searchResults1, ...searchResults2]

  if (allResults.length === 0) return 'No live web context found.'

  let context = 'Live Web Search Results & Scraped Content:\n\n'
  for (const res of allResults.slice(0, 3)) {
    context += `Source: ${res.title} (${res.link})\n`
    context += `Summary: ${res.snippet}\n`
    
    const pageText = await scrapePageText(res.link)
    if (pageText) {
      context += `Scraped Context: ${pageText.slice(0, 1000)}...\n`
    }
    context += `\n---------------------------------------------\n\n`
  }

  return context
}

// ── MULTI-LLM API WRAPPERS ──────────────────────────────────────────

/**
 * Google Gemini API Handler
 */
async function queryGemini(prompt, systemInstruction, apiKey, modelName) {
  const model = modelName || 'gemini-2.0-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  
  const response = await axios.post(url, {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemInstruction}\n\nUser Request: ${prompt}` }]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json'
    }
  }, { timeout: 30000 })

  const text = response.data.candidates[0].content.parts[0].text
  return JSON.parse(text)
}

/**
 * Groq API Handler (OpenAI compatible)
 */
async function queryGroq(prompt, systemInstruction, apiKey, modelName) {
  let model = modelName || 'llama-3.3-70b-versatile'
  if (model === 'llama-3.3-70b-specdec') {
    model = 'llama-3.3-70b-versatile'
  }
  const url = 'https://api.groq.com/openai/v1/chat/completions'
  
  const response = await axios.post(url, {
    model,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1
  }, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
    timeout: 30000
  })

  return JSON.parse(response.data.choices[0].message.content)
}

let lastAlertSentTime = 0
async function sendAPIKeyAlertEmail(errorMsg) {
  const now = Date.now()
  if (now - lastAlertSentTime < 10 * 60 * 1000) return
  lastAlertSentTime = now

  const smtpUser = process.env.SMTP_USER || ''
  const smtpPass = process.env.SMTP_PASS || ''

  if (smtpUser && smtpPass) {
    const mailOptions = {
      from: `"GPA Calculator Monitor" <${smtpUser}>`,
      to: 'sakibshourov001@gmail.com',
      subject: `🚨 ALERT: All Groq API Keys Have Failed / Expired`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border-radius: 12px; background-color: #0f172a; color: #f8fafc; border: 1px solid #ef4444;">
          <h2 style="color: #f87171; margin-top: 0;">🚨 API Failover Alert</h2>
          <hr style="border: 0; border-top: 1px solid #ef4444; margin-bottom: 20px;" />
          <p>This is a warning that all configured Groq API keys have failed on your GPA Calculator backend.</p>
          <p><strong>System Status:</strong> Fallback Mode active</p>
          <p><strong>Last Error Message Details:</strong></p>
          <blockquote style="background: #1e293b; padding: 12px 16px; border-left: 4px solid #ef4444; border-radius: 6px; margin: 10px 0; color: #fca5a5;">
            ${errorMsg}
          </blockquote>
          <p>Please update your keys in the Vercel/Render dashboard or local <code>.env</code> file immediately to restore AI functionality.</p>
          <hr style="border: 0; border-top: 1px solid #334155; margin-top: 20px;" />
          <p style="font-size: 10px; color: #64748b;">GPA Calculator Automated System Monitor.</p>
        </div>
      `
    }
    try {
      await transporter.sendMail(mailOptions)
      console.log(`[Alert Email] Alert email sent successfully to sakibshourov001@gmail.com`)
    } catch (mailErr) {
      console.error(`[Alert Email Error] Failed to send alert:`, mailErr.message)
    }
  }
}

async function queryGroqWithFailover(prompt, systemInstruction, modelName) {
  const keys = [...new Set(BUILTIN_GROQ_KEYS.filter(Boolean))]

  let rateLimitResetTime = null
  let lastError = null

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    try {
      console.log(`[Groq Failover] Attempting request using Key ${i + 1}/${keys.length}`)
      const result = await queryGroq(prompt, systemInstruction, key, modelName)
      return result
    } catch (err) {
      console.warn(`[Groq Failover Warning] Key ${i + 1} failed: ${err.message}`)
      lastError = err

      // Check for rate limit error
      if (err.response && err.response.status === 429) {
        const errorMsg = err.response.data?.error?.message || ''
        const match = errorMsg.match(/try again in ([\d\.]+[a-z]+|[\d\.]+\s*[a-z]+)/i)
        if (match) {
          rateLimitResetTime = match[1]
        }
      }
    }
  }

  const finalMsg = lastError ? lastError.message : 'Unknown rate limit/expiry'
  // Proactively dispatch alert email
  sendAPIKeyAlertEmail(finalMsg).catch(() => {})

  if (rateLimitResetTime) {
    throw {
      status: 429,
      message: `All AI keys are currently rate-limited. Please try again in ${rateLimitResetTime}.`,
      resetTime: rateLimitResetTime
    }
  }

  throw new Error(`All configured Groq API keys failed. Last error: ${finalMsg}`)
}

// Helper: Normalize LLM response. Extracts flat arrays from wrapper objects if needed.
function extractArray(result) {
  if (Array.isArray(result)) return result
  if (result && typeof result === 'object') {
    const keys = Object.keys(result)
    for (const k of keys) {
      if (Array.isArray(result[k])) {
        return result[k]
      }
    }
  }
  return result
}

/**
 * OpenAI API Handler
 */
async function queryOpenAI(prompt, systemInstruction, apiKey, modelName) {
  const model = modelName || 'gpt-4o-mini'
  const url = 'https://api.openai.com/v1/chat/completions'
  
  const response = await axios.post(url, {
    model,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1
  }, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
    timeout: 30000
  })

  return JSON.parse(response.data.choices[0].message.content)
}

/**
 * Anthropic Claude API Handler
 */
async function queryClaude(prompt, systemInstruction, apiKey, modelName) {
  const model = modelName || 'claude-3-5-sonnet-20241022'
  const url = 'https://api.anthropic.com/v1/messages'
  
  const response = await axios.post(url, {
    model,
    max_tokens: 4000,
    system: systemInstruction,
    messages: [
      { role: 'user', content: prompt }
    ],
    temperature: 0.1
  }, {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    timeout: 30000
  })

  // Anthropic does not support json response format natively in the same way, 
  // so we parse the response string.
  const text = response.data.content[0].text
  return JSON.parse(text)
}

// ── API ROUTES ────────────────────────────────────────────────────────

/**
 * Route: Extract Levels for a Country
 */
app.post('/api/levels', async (req, res) => {
  const country = req.body.country
  const provider = req.body.provider || 'groq'
  const model = req.body.model || 'llama-3.3-70b-versatile'
  const apiKey = req.body.apiKey

  const systemInstruction = `
You are an expert on global education systems.
LANGUAGE RULE: You MUST respond entirely in English. All text, names, and labels must be in English only.
List ALL education levels where GPA, CGPA, or academic grades are calculated for the country "${country}".
Be specific to this country's actual system (e.g. for Bangladesh: SSC, HSC, Honours, Masters; for USA: High School, Associate, Bachelor, Master, PhD).
Return ONLY a valid JSON array of English strings. No explanation.
Example: ["SSC", "HSC", "Honours", "Masters"]
`

  const prompt = `Provide the education levels for: ${country}`

  try {
    let result
    if (provider === 'groq') {
      result = await queryGroqWithFailover(prompt, systemInstruction, model)
    } else {
      const key = apiKey || process.env[`${provider.toUpperCase()}_API_KEY`]
      if (!key) throw new Error(`API key not provided for ${provider}`)

      if (provider === 'gemini') result = await queryGemini(prompt, systemInstruction, key, model)
      else if (provider === 'openai') result = await queryOpenAI(prompt, systemInstruction, key, model)
      else if (provider === 'anthropic') result = await queryClaude(prompt, systemInstruction, key, model)
      else throw new Error('Unsupported AI provider')
    }

    res.json(extractArray(result))
  } catch (error) {
    console.error('[Error /api/levels]', error.message)
    if (error.status === 429) {
      return res.status(429).json({ error: error.message, resetTime: error.resetTime })
    }
    // Return country-specific levels fallback
    const c = (country || 'Bangladesh').toLowerCase()
    if (c.includes('bangladesh')) {
      res.json(['SSC', 'HSC', 'Honours', 'Masters'])
    } else if (c.includes('united states') || c.includes('usa') || c.includes('america')) {
      res.json(['High School', 'Associate Degree', 'Bachelor Degree', 'Master Degree'])
    } else if (c.includes('india')) {
      res.json(['Secondary (10th)', 'Higher Secondary (12th)', 'Bachelor Engineering', 'Master Degree'])
    } else {
      res.json(['Secondary School', 'Undergraduate', 'Postgraduate'])
    }
  }
})

/**
 * Route: Extract Universities for a Country & Level
 */
app.post('/api/universities', async (req, res) => {
  const country = req.body.country
  const level = req.body.level
  const search = req.body.search || ''
  const provider = req.body.provider || 'groq'
  const model = req.body.model || 'llama-3.3-70b-versatile'
  const apiKey = req.body.apiKey

  // Bypass university selection for school-level boards (SSC, HSC, High School, etc.)
  const lvl = (level || '').toLowerCase()
  if (lvl.includes('ssc') || lvl.includes('hsc') || lvl.includes('school') || lvl.includes('secondary') || lvl.includes('intermediate')) {
    return res.json([
      { name: "Unified Board / National Grading System", city: "National", type: "national", website: "", ranking: "Unified" }
    ])
  }

  const systemInstruction = `
You are an expert on global universities.
LANGUAGE RULE: You MUST respond entirely in English. All institution names, city names, and text must be written in English only. Do not use local scripts (Arabic, Bengali, Chinese, Japanese, Devanagari, etc.).
${search ? `List up to 15 universities/institutions in ${country} matching or highly related to the search query "${search}".` : `List the top 100 universities/institutions in ${country} that offer ${level} programs.`}
Return ONLY a valid JSON array of objects. Format:
[
  { "name": "University of Dhaka", "city": "Dhaka", "type": "public", "website": "https://du.ac.bd", "ranking": "Top 5" }
]
The "type" field must be one of: "public", "private", "national", "international"
`

  const prompt = search 
    ? `List universities matching "${search}" in ${country}`
    : `List the universities offering ${level} programs in ${country}`

  try {
    let result
    if (provider === 'groq') {
      result = await queryGroqWithFailover(prompt, systemInstruction, model)
    } else {
      const key = apiKey || process.env[`${provider.toUpperCase()}_API_KEY`]
      if (!key) throw new Error(`API key not provided for ${provider}`)

      if (provider === 'gemini') result = await queryGemini(prompt, systemInstruction, key, model)
      else if (provider === 'openai') result = await queryOpenAI(prompt, systemInstruction, key, model)
      else if (provider === 'anthropic') result = await queryClaude(prompt, systemInstruction, key, model)
      else throw new Error('Unsupported AI provider')
    }

    res.json(extractArray(result))
  } catch (error) {
    console.error('[Error /api/universities]', error.message)
    if (error.status === 429) {
      return res.status(429).json({ error: error.message, resetTime: error.resetTime })
    }
    // Send country-specific fallback response
    const c = (country || 'Bangladesh').toLowerCase()
    if (c.includes('bangladesh')) {
      res.json([
        { name: "University of Dhaka", city: "Dhaka", type: "public", website: "https://du.ac.bd", ranking: "Top 1" },
        { name: "Bangladesh University of Engineering and Technology (BUET)", city: "Dhaka", type: "public", website: "https://buet.ac.bd", ranking: "Top 2" },
        { name: "North South University", city: "Dhaka", type: "private", website: "https://northsouth.edu", ranking: "Top 3" },
        { name: "National University", city: "Gazipur", type: "public", website: "https://nu.ac.bd", ranking: "Top 10" }
      ])
    } else if (c.includes('united states') || c.includes('usa') || c.includes('america')) {
      res.json([
        { name: "Harvard University", city: "Cambridge", type: "private", website: "https://harvard.edu", ranking: "Top 1" },
        { name: "Stanford University", city: "Stanford", type: "private", website: "https://stanford.edu", ranking: "Top 2" },
        { name: "Massachusetts Institute of Technology (MIT)", city: "Cambridge", type: "private", website: "https://mit.edu", ranking: "Top 3" },
        { name: "University of California, Berkeley", city: "Berkeley", type: "public", website: "https://berkeley.edu", ranking: "Top 4" }
      ])
    } else if (c.includes('india')) {
      res.json([
        { name: "Indian Institute of Technology (IIT) Bombay", city: "Mumbai", type: "public", website: "https://iitb.ac.in", ranking: "Top 1" },
        { name: "Indian Institute of Science (IISc)", city: "Bangalore", type: "public", website: "https://iisc.ac.in", ranking: "Top 2" },
        { name: "University of Delhi", city: "New Delhi", type: "public", website: "https://du.ac.in", ranking: "Top 3" }
      ])
    } else if (c.includes('united kingdom') || c.includes('uk') || c.includes('britain')) {
      res.json([
        { name: "University of Oxford", city: "Oxford", type: "public", website: "https://ox.ac.uk", ranking: "Top 1" },
        { name: "University of Cambridge", city: "Cambridge", type: "public", website: "https://cam.ac.uk", ranking: "Top 2" },
        { name: "Imperial College London", city: "London", type: "public", website: "https://imperial.ac.uk", ranking: "Top 3" }
      ])
    } else {
      res.json([
        { name: `${country || 'State'} National University`, city: "Capital City", type: "public", website: "", ranking: "Top 1" },
        { name: `${country || 'State'} Science & Technology University`, city: "Metropolis", type: "public", website: "", ranking: "Top 2" }
      ])
    }
  }
})

/**
 * Country-specific Fallback Grading Policy generator
 */
function getFallbackPolicy(country, university, level) {
  const c = (country || 'Bangladesh').toLowerCase()
  const univ = university || 'Standard Institution'
  const lvl = (level || 'Undergraduate').toLowerCase()

  // Check if school board level
  const isSchool = lvl.includes('ssc') || lvl.includes('hsc') || lvl.includes('school') || lvl.includes('secondary') || lvl.includes('intermediate') || univ === 'Unified Board / National Grading System'

  if (isSchool) {
    if (c.includes('bangladesh')) {
      return {
        country: "Bangladesh",
        university: "Unified Education Board",
        level: level || "Secondary/Higher Secondary",
        grading_scale: "5.00",
        credit_system: "Grade Point",
        pass_mark: 33,
        subjects: [
          { name: "Bangla", credit: 1, type: "theory" },
          { name: "English", credit: 1, type: "theory" },
          { name: "Mathematics", credit: 1, type: "theory" }
        ],
        grade_mapping: [
          { letter: "A+", point: 5.0, marks: "80-100" },
          { letter: "A", point: 4.0, marks: "70-79" },
          { letter: "A-", point: 3.5, marks: "60-69" },
          { letter: "B", point: 3.0, marks: "50-59" },
          { letter: "C", point: 2.0, marks: "40-49" },
          { letter: "D", point: 1.0, marks: "33-39" },
          { letter: "F", point: 0.0, marks: "0-32" }
        ],
        formula: "Average of all grade points",
        optional_course: false,
        retake: false,
        semester_based: false,
        verified: true,
        confidence: 1.0,
        notes: "Official Bangladesh Education Board grading criteria for SSC and HSC (GPA 5.00 scale). Pass mark is 33%."
      }
    } else if (c.includes('india')) {
      return {
        country: "India",
        university: "CBSE / National Boards",
        level: level || "Secondary School",
        grading_scale: "10.00",
        credit_system: "Grade Point",
        pass_mark: 33,
        subjects: [
          { name: "English Communication", credit: 1, type: "theory" },
          { name: "Mathematics", credit: 1, type: "theory" },
          { name: "Science", credit: 1, type: "theory" }
        ],
        grade_mapping: [
          { letter: "A1", point: 10.0, marks: "91-100" },
          { letter: "A2", point: 9.0, marks: "81-90" },
          { letter: "B1", point: 8.0, marks: "71-80" },
          { letter: "B2", point: 7.0, marks: "61-70" },
          { letter: "C1", point: 6.0, marks: "51-60" },
          { letter: "C2", point: 5.0, marks: "41-50" },
          { letter: "D", point: 4.0, marks: "33-40" },
          { letter: "E", point: 0.0, marks: "0-32" }
        ],
        formula: "CGPA = Average of 5 main subjects",
        optional_course: false,
        retake: false,
        semester_based: false,
        verified: true,
        confidence: 1.0,
        notes: "Indian CBSE Secondary grading criteria. Passing mark is 33%."
      }
    } else {
      // General High School Fallback (GPA 4.00)
      return {
        country: country || "Standard",
        university: "Unified Board / National Grading System",
        level: level || "High School",
        grading_scale: "4.00",
        credit_system: "Credit",
        pass_mark: 60,
        subjects: [
          { name: "English", credit: 1, type: "theory" },
          { name: "Mathematics", credit: 1, type: "theory" }
        ],
        grade_mapping: [
          { letter: "A", point: 4.0, marks: "90-100" },
          { letter: "B", point: 3.0, marks: "80-89" },
          { letter: "C", point: 2.0, marks: "70-79" },
          { letter: "D", point: 1.0, marks: "60-69" },
          { letter: "F", point: 0.0, marks: "0-59" }
        ],
        formula: "GPA = Average of all courses",
        optional_course: false,
        retake: false,
        semester_based: false,
        verified: false,
        confidence: 0.8,
        notes: "Unified secondary education grading scale loaded (Pass Mark: 60%)."
      }
    }
  }

  if (c.includes('south korea') || c.includes('korea')) {
    return {
      country: "South Korea",
      university: univ,
      level: lvl,
      grading_scale: "4.50",
      credit_system: "Credit Hour",
      pass_mark: 80,
      subjects: [
        { name: "Korean Language I", credit: 3, type: "theory" },
        { name: "Introduction to Calculus", credit: 3, type: "theory" },
        { name: "University Physics Lab", credit: 1, type: "lab" }
      ],
      grade_mapping: [
        { letter: "A+", point: 4.5, marks: "95-100" },
        { letter: "A0", point: 4.0, marks: "90-94" },
        { letter: "B+", point: 3.5, marks: "85-89" },
        { letter: "B0", point: 3.0, marks: "80-84" },
        { letter: "F", point: 0.0, marks: "0-79" }
      ],
      formula: "sum(credit*point)/total_credit",
      optional_course: false,
      retake: true,
      semester_based: true,
      verified: false,
      confidence: 0.5,
      notes: "South Korean university grading policy loaded (Pass Mark: 80%). Any mark below 80 is F."
    }
  } else if (c.includes('united states') || c.includes('usa') || c.includes('america')) {
    return {
      country: "United States",
      university: univ,
      level: lvl,
      grading_scale: "4.00",
      credit_system: "Credit Hour",
      pass_mark: 65,
      subjects: [
        { name: "Composition I", credit: 3, type: "theory" },
        { name: "College Algebra", credit: 3, type: "theory" }
      ],
      grade_mapping: [
        { letter: "A", point: 4.0, marks: "93-100" },
        { letter: "A-", point: 3.7, marks: "90-92" },
        { letter: "B+", point: 3.3, marks: "87-89" },
        { letter: "B", point: 3.0, marks: "83-86" },
        { letter: "B-", point: 2.7, marks: "80-82" },
        { letter: "C+", point: 2.3, marks: "77-79" },
        { letter: "C", point: 2.0, marks: "73-76" },
        { letter: "C-", point: 1.7, marks: "70-72" },
        { letter: "D", point: 1.0, marks: "65-69" },
        { letter: "F", point: 0.0, marks: "0-64" }
      ],
      formula: "sum(credit*point)/total_credit",
      optional_course: false,
      retake: true,
      semester_based: true,
      verified: false,
      confidence: 0.5,
      notes: "US standard letter grading policy loaded (Pass Mark: 65%)."
    }
  } else if (c.includes('india')) {
    return {
      country: "India",
      university: univ,
      level: lvl,
      grading_scale: "10.00",
      credit_system: "Credit Hour",
      pass_mark: 40,
      subjects: [
        { name: "Engineering Mathematics I", credit: 4, type: "theory" },
        { name: "Basic Electrical Engineering", credit: 3, type: "theory" }
      ],
      grade_mapping: [
        { letter: "O", point: 10.0, marks: "90-100" },
        { letter: "A+", point: 9.0, marks: "80-89" },
        { letter: "A", point: 8.0, marks: "70-79" },
        { letter: "B+", point: 7.0, marks: "60-69" },
        { letter: "B", point: 6.0, marks: "50-59" },
        { letter: "C", point: 5.0, marks: "45-49" },
        { letter: "P", point: 4.0, marks: "40-44" },
        { letter: "F", point: 0.0, marks: "0-39" }
      ],
      formula: "sum(credit*point)/total_credit",
      optional_course: false,
      retake: true,
      semester_based: true,
      verified: false,
      confidence: 0.5,
      notes: "Indian CGPA 10.00 grading policy loaded (Pass Mark: 40%)."
    }
  } else if (c.includes('united kingdom') || c.includes('uk') || c.includes('britain')) {
    return {
      country: "United Kingdom",
      university: univ,
      level: lvl,
      grading_scale: "4.00",
      credit_system: "ECTS",
      pass_mark: 40,
      subjects: [
        { name: "Introduction to Literature", credit: 15, type: "theory" }
      ],
      grade_mapping: [
        { letter: "First Class", point: 4.0, marks: "70-100" },
        { letter: "Upper Second (2:1)", point: 3.3, marks: "60-69" },
        { letter: "Lower Second (2:2)", point: 3.0, marks: "50-59" },
        { letter: "Third Class", point: 2.0, marks: "40-49" },
        { letter: "Fail (F)", point: 0.0, marks: "0-39" }
      ],
      formula: "sum(credit*point)/total_credit",
      optional_course: false,
      retake: true,
      semester_based: true,
      verified: false,
      confidence: 0.5,
      notes: "UK degree classification policy loaded (Pass Mark: 40%)."
    }
  } else if (c.includes('germany') || c.includes('deutschland')) {
    return {
      country: "Germany",
      university: univ,
      level: lvl,
      grading_scale: "5.00",
      credit_system: "ECTS",
      pass_mark: 50,
      subjects: [
        { name: "Algorithmische Mathematik", credit: 6, type: "theory" },
        { name: "Softwaretechnik", credit: 6, type: "theory" }
      ],
      grade_mapping: [
        { letter: "1.0 (Sehr Gut)", point: 1.0, marks: "95-100" },
        { letter: "1.3 (Sehr Gut)", point: 1.3, marks: "90-94" },
        { letter: "1.7 (Gut)", point: 1.7, marks: "85-89" },
        { letter: "2.0 (Gut)", point: 2.0, marks: "80-84" },
        { letter: "2.3 (Gut)", point: 2.3, marks: "75-79" },
        { letter: "2.7 (Befriedigend)", point: 2.7, marks: "70-74" },
        { letter: "3.0 (Befriedigend)", point: 3.0, marks: "65-69" },
        { letter: "3.3 (Befriedigend)", point: 3.3, marks: "60-64" },
        { letter: "3.7 (Ausreichend)", point: 3.7, marks: "55-59" },
        { letter: "4.0 (Ausreichend)", point: 4.0, marks: "50-54" },
        { letter: "5.0 (Nicht Ausreichend)", point: 5.0, marks: "0-49" }
      ],
      formula: "1 + 3 * (max_mark - mark) / (max_mark - pass_mark) [Modified Bavarian Formula]",
      optional_course: false,
      retake: true,
      semester_based: true,
      verified: false,
      confidence: 0.5,
      notes: "German university grading system loaded (Bavarian Formula applied where 1.0 is best and 4.0 is pass)."
    }
  } else if (c.includes('canada')) {
    return {
      country: "Canada",
      university: univ,
      level: lvl,
      grading_scale: "4.33",
      credit_system: "Credit Hour",
      pass_mark: 50,
      subjects: [
        { name: "English Composition", credit: 3, type: "theory" },
        { name: "Linear Algebra", credit: 3, type: "theory" }
      ],
      grade_mapping: [
        { letter: "A+", point: 4.33, marks: "90-100" },
        { letter: "A", point: 4.0, marks: "85-89" },
        { letter: "A-", point: 3.67, marks: "80-84" },
        { letter: "B+", point: 3.33, marks: "77-79" },
        { letter: "B", point: 3.0, marks: "73-76" },
        { letter: "B-", point: 2.67, marks: "70-72" },
        { letter: "C+", point: 2.33, marks: "67-69" },
        { letter: "C", point: 2.0, marks: "63-66" },
        { letter: "C-", point: 1.67, marks: "60-62" },
        { letter: "D", point: 50, marks: "50-59" },
        { letter: "F", point: 0.0, marks: "0-49" }
      ],
      formula: "sum(credit*point)/total_credit",
      optional_course: false,
      retake: true,
      semester_based: true,
      verified: false,
      confidence: 0.5,
      notes: "Canadian standard 4.33 GPA grading scale loaded (Pass Mark: 50%)."
    }
  } else if (c.includes('australia')) {
    return {
      country: "Australia",
      university: univ,
      level: lvl,
      grading_scale: "7.00",
      credit_system: "EFTSL",
      pass_mark: 50,
      subjects: [
        { name: "Academic Communication", credit: 6, type: "theory" },
        { name: "Quantitative Research", credit: 6, type: "theory" }
      ],
      grade_mapping: [
        { letter: "High Distinction (HD)", point: 7.0, marks: "85-100" },
        { letter: "Distinction (D)", point: 6.0, marks: "75-84" },
        { letter: "Credit (C)", point: 5.0, marks: "65-74" },
        { letter: "Pass (P)", point: 4.0, marks: "50-64" },
        { letter: "Fail (F)", point: 0.0, marks: "0-49" }
      ],
      formula: "sum(credit*point)/total_credit",
      optional_course: false,
      retake: true,
      semester_based: true,
      verified: false,
      confidence: 0.5,
      notes: "Australian national 7.00 GPA grading system loaded (Pass Mark: 50%)."
    }
  } else if (c.includes('japan')) {
    return {
      country: "Japan",
      university: univ,
      level: lvl,
      grading_scale: "4.00",
      credit_system: "Credit",
      pass_mark: 60,
      subjects: [
        { name: "Japanese Studies", credit: 2, type: "theory" },
        { name: "Science Seminars", credit: 2, type: "theory" }
      ],
      grade_mapping: [
        { letter: "S (Shu)", point: 4.0, marks: "90-100" },
        { letter: "A (Yu)", point: 3.0, marks: "80-89" },
        { letter: "B (Ryo)", point: 2.0, marks: "70-79" },
        { letter: "C (Ka)", point: 1.0, marks: "60-69" },
        { letter: "F (Fuka)", point: 0.0, marks: "0-59" }
      ],
      formula: "sum(credit*point)/total_credit",
      optional_course: false,
      retake: true,
      semester_based: true,
      verified: false,
      confidence: 0.5,
      notes: "Japanese university S-A-B-C-F grading system loaded (Pass Mark: 60%)."
    }
  } else {
    // Default Bangladesh/Standard
    return {
      country: country || "Standard",
      university: univ,
      level: lvl,
      grading_scale: "4.00",
      credit_system: "Credit Hour",
      pass_mark: 40,
      subjects: [
        { name: "Core Course 1", credit: 3, type: "theory" },
        { name: "Core Course 2", credit: 3, type: "theory" }
      ],
      grade_mapping: [
        { letter: "A+", point: 4.0, marks: "80-100" },
        { letter: "A", point: 3.75, marks: "75-79" },
        { letter: "A-", point: 3.5, marks: "70-74" },
        { letter: "B+", point: 3.25, marks: "65-69" },
        { letter: "B", point: 3.0, marks: "60-64" },
        { letter: "C+", point: 2.5, marks: "55-59" },
        { letter: "C", point: 2.25, marks: "50-54" },
        { letter: "D", point: 2.0, marks: "40-44" },
        { letter: "F", point: 0.0, marks: "0-39" }
      ],
      formula: "sum(credit*point)/total_credit",
      optional_course: false,
      retake: true,
      semester_based: true,
      verified: false,
      confidence: 0.5,
      notes: "Standard GPA 4.00 grading policy loaded (Pass Mark: 40%)."
    }
  }
}

/**
 * Route: Extract Policy (Grading System & Scholarship Waiver)
 */
app.post('/api/policy', async (req, res) => {
  const university = req.body.university
  const country = req.body.country
  const level = req.body.level
  const provider = req.body.provider || 'groq'
  const model = req.body.model || 'llama-3.3-70b-versatile'
  const apiKey = req.body.apiKey

  try {
    let key = ''
    if (provider !== 'groq') {
      key = apiKey || process.env[`${provider.toUpperCase()}_API_KEY`]
      if (!key) throw new Error(`API key not provided for ${provider}`)
    }

    // 1. Gather web context
    const webContext = await gatherContext(university, country, level)

    // 2. Build system instruction with context
    const systemInstruction = `
You are an academic policy researcher.
LANGUAGE RULE: You MUST respond entirely in English. All field values, notes, and text must be in English only. Do not use any local language scripts (Arabic, Bengali, Chinese, Japanese, etc.).
Find the OFFICIAL grading system and tuition waiver/scholarship policy for "${university}" in ${country} for ${level} programs.
Use the live web search context below to extract the exact grading scales and scholarship details.
If the search context lacks detail, use your general knowledge, but verify that it matches this specific institution's real policies.

---
${webContext}
---

Return ONLY a valid JSON object matching this schema. Do not output markdown codeblocks. Do not include any text before or after the JSON.

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
    { "letter": "C", "point": 2.25, "marks": "50-54" },
    { "letter": "D", "point": 2.0, "marks": "40-44" },
    { "letter": "F", "point": 0.0, "marks": "0-39" }
  ],
  "formula": "sum(credit×point)/total_credit",
  "optional_course": true,
  "retake": true,
  "semester_based": true,
  "verified": true,
  "confidence": 0.95,
  "source_url": "https://university.edu/registrar",
  "notes": "Extracted from official regulations",
  "waiver_policy": {
    "has_waiver": true,
    "rules": [
      { "gpa_threshold": 3.75, "waiver_percentage": 25, "details": "25% tuition fee waiver for GPA 3.75 to 3.84" },
      { "gpa_threshold": 3.85, "waiver_percentage": 50, "details": "50% tuition fee waiver for GPA 3.85 to 3.94" },
      { "gpa_threshold": 3.95, "waiver_percentage": 100, "details": "100% tuition fee waiver for GPA 3.95 to 4.00" }
    ],
    "details": "Tuition fee waiver applies for the subsequent semester based on current semester GPA. Requires minimum load of 12 credits with no D, F, or I grades.",
    "source_url": "https://university.edu/scholarships"
  }
}

Important details:
- Under grade_mapping, the "marks" field must be in "min-max" format.
- Set the correct pass_mark field matching the university's official passing grade mark percentage (e.g., 60, 70, or 80 depending on the country and registrar policy).
- Set verified = false and confidence < 0.6 if you are guessing or cannot find official policies.
- Ensure the waiver_policy reflects the actual criteria of this university. If there is no waiver system, set has_waiver = false, rules = [], details = "No tuition waiver policy found".
`

    const prompt = `Extract the official grading scale and tuition waiver policy for ${university} in ${country} at the ${level} level.`

    let result
    if (provider === 'groq') {
      result = await queryGroqWithFailover(prompt, systemInstruction, model)
    } else {
      if (provider === 'gemini') result = await queryGemini(prompt, systemInstruction, key, model)
      else if (provider === 'openai') result = await queryOpenAI(prompt, systemInstruction, key, model)
      else if (provider === 'anthropic') result = await queryClaude(prompt, systemInstruction, key, model)
      else throw new Error('Unsupported AI provider')
    }

    res.json(result)
  } catch (error) {
    console.error('[Error /api/policy]', error.message)
    if (error.status === 429) {
      return res.status(429).json({ error: error.message, resetTime: error.resetTime })
    }
    // Return country-specific fallback policy
    res.json(getFallbackPolicy(country, university, level))
  }
})

/**
 * Route: Generic AI Proxy — accepts { systemPrompt, userPrompt } and returns AI JSON response.
 * The frontend uses this as its primary (Tier 0) AI endpoint to avoid CORS and key exposure.
 */
app.post('/api/ai', async (req, res) => {
  const { systemPrompt, userPrompt } = req.body
  if (!systemPrompt || !userPrompt) {
    return res.status(400).json({ error: 'systemPrompt and userPrompt are required' })
  }
  try {
    const result = await queryGroqWithFailover(userPrompt, systemPrompt, 'llama-3.3-70b-versatile')
    res.json(result)
  } catch (error) {
    console.error('[Error /api/ai]', error?.message || error)
    if (error && error.status === 429) {
      return res.status(429).json({
        error: error.message || 'Rate limited',
        resetTime: error.resetTime || '30s'
      })
    }
    res.status(500).json({ error: 'AI request failed: ' + (error?.message || 'Unknown error') })
  }
})

/**
 * Route: Save Feedback
 */
app.post('/api/feedback', async (req, res) => {
  const { name, email, rating, comment } = req.body

  if (!rating || !comment) {
    return res.status(400).json({ error: 'Rating and comment are required' })
  }

  try {
    // 1. Save locally to feedback.json (with safe catch for read-only serverless filesystems)
    const newFeedback = {
      id: Date.now().toString(),
      name: name || 'Anonymous Student',
      email: email || '',
      rating,
      comment,
      timestamp: new Date().toISOString()
    }

    try {
      let feedbackList = []
      if (fs.existsSync(FEEDBACK_FILE)) {
        feedbackList = JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf8'))
      }
      feedbackList.push(newFeedback)
      fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedbackList, null, 2))
    } catch (fsErr) {
      console.warn('[Feedback FS Warning] Read-only filesystem, skipped local save:', fsErr.message)
    }
    
    // 2. Send email notification to sakibshourov001@gmail.com
    const smtpUser = process.env.SMTP_USER || ''
    const smtpPass = process.env.SMTP_PASS || ''

    if (smtpUser && smtpPass) {
      const mailOptions = {
        from: `"AI GPA Feedback" <${smtpUser}>`,
        to: 'sakibshourov001@gmail.com',
        subject: `✨ New Feedback Received: Rating ${rating}/5`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border-radius: 12px; background-color: #0f172a; color: #f8fafc; border: 1px solid #334155;">
            <h2 style="color: #c084fc; margin-top: 0;">✨ New Feedback Received!</h2>
            <hr style="border: 0; border-top: 1px solid #334155; margin-bottom: 20px;" />
            <p><strong>Name:</strong> ${name || 'Anonymous Student'}</p>
            <p><strong>Email:</strong> ${email || 'Not provided'}</p>
            <p><strong>Rating:</strong> ${'⭐'.repeat(rating)} (${rating}/5)</p>
            <p><strong>Comment:</strong></p>
            <blockquote style="background: #1e293b; padding: 12px 16px; border-left: 4px solid #8b5cf6; border-radius: 6px; margin: 10px 0;">
              ${comment.replace(/\n/g, '<br />')}
            </blockquote>
            <hr style="border: 0; border-top: 1px solid #334155; margin-top: 20px;" />
            <p style="font-size: 10px; color: #64748b;">Sent automatically by AI GPA Calculator Backend.</p>
          </div>
        `
      }
      try {
        await transporter.sendMail(mailOptions)
        console.log(`[Feedback Email] Sent to sakibshourov001@gmail.com successfully!`)
      } catch (mailErr) {
        console.error(`[Feedback Email Error] Failed to send email:`, mailErr.message)
      }
    } else {
      console.warn(`[Feedback Email Warning] SMTP credentials (SMTP_USER/SMTP_PASS) not configured in .env. Feedback saved to feedback.json, but email was not sent.`)
    }

    res.status(201).json({ message: 'Feedback saved successfully!', data: newFeedback })
  } catch (error) {
    console.error('[Error /api/feedback]', error.message)
    res.status(500).json({ error: 'Failed to process feedback: ' + error.message })
  }
})

/**
 * Route: Get Feedbacks
 */
app.get('/api/feedback', (req, res) => {
  try {
    if (fs.existsSync(FEEDBACK_FILE)) {
      const feedbackList = JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf8'))
      return res.json(feedbackList)
    }
    res.json([])
  } catch (error) {
    res.json([])
  }
})

// Export app for serverless deployments (Vercel)
export default app

// Start server locally only when not in serverless runtime
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 GPA Calculator Backend running at http://localhost:${PORT}`)
  })
}
