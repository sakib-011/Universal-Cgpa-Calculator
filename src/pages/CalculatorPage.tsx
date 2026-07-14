import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { useThemeStore } from '../stores/useThemeStore'
import { useCalculatorStore } from '../stores/useCalculatorStore'
import { useHistoryStore } from '../stores/useHistoryStore'
import { useQuery } from '@tanstack/react-query'
import { DynamicCalculator } from '../components/calculator/DynamicCalculator'
import { ResultCard } from '../components/calculator/ResultCard'
import { GradeTable } from '../components/calculator/GradeTable'
import type { GradingPolicy, GradeMapping } from '../types'
import { generateId, getCountryFlag, getCountryCodeFromName } from '../lib/utils'
import toast from 'react-hot-toast'

const PRESETS = [
  {
    id: 'bd',
    name: '🇧🇩 Bangladesh (4.00)',
    scale: '4.00',
    passMark: 40,
    grades: [
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
    ]
  },
  {
    id: 'us',
    name: '🇺🇸 US Standard (4.00)',
    scale: '4.00',
    passMark: 65,
    grades: [
      { letter: 'A', point: 4.0, marks: '93-100' },
      { letter: 'A-', point: 3.7, marks: '90-92' },
      { letter: 'B+', point: 3.3, marks: '87-89' },
      { letter: 'B', point: 3.0, marks: '83-86' },
      { letter: 'B-', point: 2.7, marks: '80-82' },
      { letter: 'C+', point: 2.3, marks: '77-79' },
      { letter: 'C', point: 2.0, marks: '73-76' },
      { letter: 'C-', point: 1.7, marks: '70-72' },
      { letter: 'D', point: 1.0, marks: '60-69' },
      { letter: 'F', point: 0.0, marks: '0-59' }
    ]
  },
  {
    id: 'ects',
    name: '🇪🇺 ECTS Europe (5.00)',
    scale: '5.00',
    passMark: 50,
    grades: [
      { letter: 'A', point: 5.0, marks: '90-100' },
      { letter: 'B', point: 4.5, marks: '80-89' },
      { letter: 'C', point: 4.0, marks: '70-79' },
      { letter: 'D', point: 3.5, marks: '60-69' },
      { letter: 'E', point: 3.0, marks: '50-59' },
      { letter: 'F', point: 0.0, marks: '0-49' }
    ]
  },
  {
    id: 'in',
    name: '🇮🇳 India Standard (10.00)',
    scale: '10.00',
    passMark: 40,
    grades: [
      { letter: 'O', point: 10.0, marks: '90-100' },
      { letter: 'A+', point: 9.0, marks: '80-89' },
      { letter: 'A', point: 8.0, marks: '70-79' },
      { letter: 'B+', point: 7.0, marks: '60-69' },
      { letter: 'B', point: 6.0, marks: '50-59' },
      { letter: 'C', point: 5.0, marks: '45-49' },
      { letter: 'P', point: 4.0, marks: '40-44' },
      { letter: 'F', point: 0.0, marks: '0-39' }
    ]
  }
]

export const ALL_COUNTRIES = [
  { name: 'Afghanistan', code: 'AF' }, { name: 'Albania', code: 'AL' }, { name: 'Algeria', code: 'DZ' },
  { name: 'Argentina', code: 'AR' }, { name: 'Australia', code: 'AU' }, { name: 'Austria', code: 'AT' },
  { name: 'Azerbaijan', code: 'AZ' }, { name: 'Bangladesh', code: 'BD' }, { name: 'Belgium', code: 'BE' },
  { name: 'Bolivia', code: 'BO' }, { name: 'Brazil', code: 'BR' }, { name: 'Bulgaria', code: 'BG' },
  { name: 'Cambodia', code: 'KH' }, { name: 'Canada', code: 'CA' }, { name: 'Chile', code: 'CL' },
  { name: 'China', code: 'CN' }, { name: 'Colombia', code: 'CO' }, { name: 'Croatia', code: 'HR' },
  { name: 'Czech Republic', code: 'CZ' }, { name: 'Denmark', code: 'DK' }, { name: 'Ecuador', code: 'EC' },
  { name: 'Egypt', code: 'EG' }, { name: 'Ethiopia', code: 'ET' }, { name: 'Finland', code: 'FI' },
  { name: 'France', code: 'FR' }, { name: 'Germany', code: 'DE' }, { name: 'Ghana', code: 'GH' },
  { name: 'Greece', code: 'GR' }, { name: 'Guatemala', code: 'GT' }, { name: 'Hong Kong', code: 'HK' },
  { name: 'Hungary', code: 'HU' }, { name: 'India', code: 'IN' }, { name: 'Indonesia', code: 'ID' },
  { name: 'Iran', code: 'IR' }, { name: 'Iraq', code: 'IQ' }, { name: 'Ireland', code: 'IE' },
  { name: 'Israel', code: 'IL' }, { name: 'Italy', code: 'IT' }, { name: 'Japan', code: 'JP' },
  { name: 'Jordan', code: 'JO' }, { name: 'Kazakhstan', code: 'KZ' }, { name: 'Kenya', code: 'KE' },
  { name: 'Kuwait', code: 'KW' }, { name: 'Lebanon', code: 'LB' }, { name: 'Libya', code: 'LY' },
  { name: 'Malaysia', code: 'MY' }, { name: 'Mexico', code: 'MX' }, { name: 'Morocco', code: 'MA' },
  { name: 'Myanmar', code: 'MM' }, { name: 'Nepal', code: 'NP' }, { name: 'Netherlands', code: 'NL' },
  { name: 'New Zealand', code: 'NZ' }, { name: 'Nigeria', code: 'NG' }, { name: 'Norway', code: 'NO' },
  { name: 'Oman', code: 'OM' }, { name: 'Pakistan', code: 'PK' }, { name: 'Palestine', code: 'PS' },
  { name: 'Panama', code: 'PA' }, { name: 'Peru', code: 'PE' }, { name: 'Philippines', code: 'PH' },
  { name: 'Poland', code: 'PL' }, { name: 'Portugal', code: 'PT' }, { name: 'Qatar', code: 'QA' },
  { name: 'Romania', code: 'RO' }, { name: 'Russia', code: 'RU' }, { name: 'Saudi Arabia', code: 'SA' },
  { name: 'Senegal', code: 'SN' }, { name: 'Singapore', code: 'SG' }, { name: 'South Africa', code: 'ZA' },
  { name: 'South Korea', code: 'KR' }, { name: 'Spain', code: 'ES' }, { name: 'Sri Lanka', code: 'LK' },
  { name: 'Sudan', code: 'SD' }, { name: 'Sweden', code: 'SE' }, { name: 'Switzerland', code: 'CH' },
  { name: 'Syria', code: 'SY' }, { name: 'Taiwan', code: 'TW' }, { name: 'Tanzania', code: 'TZ' },
  { name: 'Thailand', code: 'TH' }, { name: 'Tunisia', code: 'TN' }, { name: 'Turkey', code: 'TR' },
  { name: 'Uganda', code: 'UG' }, { name: 'Ukraine', code: 'UA' }, { name: 'United Arab Emirates', code: 'AE' },
  { name: 'United Kingdom', code: 'GB' }, { name: 'United States', code: 'US' }, { name: 'Uruguay', code: 'UY' },
  { name: 'Uzbekistan', code: 'UZ' }, { name: 'Venezuela', code: 'VE' }, { name: 'Vietnam', code: 'VN' },
  { name: 'Yemen', code: 'YE' }, { name: 'Zimbabwe', code: 'ZW' }
]

const POPULAR_COUNTRIES = [
  { name: 'Bangladesh', code: 'BD' },
  { name: 'United States', code: 'US' },
  { name: 'India', code: 'IN' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'Canada', code: 'CA' },
  { name: 'Germany', code: 'DE' },
  { name: 'Japan', code: 'JP' },
  { name: 'Australia', code: 'AU' }
]

export function CalculatorPage() {
  const navigate = useNavigate()
  const { country: paramCountry } = useParams()
  const { isDark } = useThemeStore()
  
  const {
    country, countryCode, level, university, gradingPolicy, result,
    setCountry, setLevel, setUniversity, setGradingPolicy, calculate, reset
  } = useCalculatorStore()
  
  const { add: addHistory } = useHistoryStore()

  const [calcMode, setCalcMode] = useState<'ai' | 'manual'>(country === 'Manual Mode' ? 'manual' : 'ai')
  const [activePreset, setActivePreset] = useState('bd')
  const [scale, setScale] = useState(gradingPolicy?.grading_scale || '4.00')
  const [passMark, setPassMark] = useState(gradingPolicy?.pass_mark || 40)
  const [semesterBased, setSemesterBased] = useState(gradingPolicy?.semester_based ?? true)
  const [retake, setRetake] = useState(gradingPolicy?.retake ?? true)
  const [gradeMapping, setGradeMapping] = useState<GradeMapping[]>(
    gradingPolicy?.grade_mapping || PRESETS[0].grades
  )
  const [showConfig, setShowConfig] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  
  const [countryQuery, setCountryQuery] = useState('')
  const [uniQuery, setUniQuery] = useState('')
  const [debouncedUniQuery, setDebouncedUniQuery] = useState('')

  // Debounce search query to prevent constant refetching
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedUniQuery(uniQuery)
    }, 500)
    return () => clearTimeout(handler)
  }, [uniQuery])

  useEffect(() => {
    if (paramCountry) {
      const name = decodeURIComponent(paramCountry)
      if (name !== country) {
        const code = getCountryCodeFromName(name)
        setCountry(name, code)
      }
      setCalcMode(name === 'Manual Mode' ? 'manual' : 'ai')
    }
  }, [paramCountry])

  // --- MULTI-API FALLBACK SYSTEM (Server Proxy → OpenRouter → Groq 1 → Groq 2 → Gemini) ---
  const callAIWithFallback = async (systemPrompt: string, userPrompt: string) => {
    const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    const groqKey1 = import.meta.env.VITE_GROQ_API_KEY_1;
    const groqKey2 = import.meta.env.VITE_GROQ_API_KEY_2;
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

    // Helper: OpenRouter API Call (Forever Free Model)
    const fetchOpenRouter = async (apiKey: string) => {
      const combinedPrompt = `${systemPrompt}\n\nCRITICAL INSTRUCTION: You MUST return ONLY valid JSON. Do not include markdown formatting like \`\`\`json or text outside the JSON block.\n\nUser Request: ${userPrompt}`;
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.href, 
          "X-Title": "Universal AI CGPA Calculator"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3-8b-instruct:free",
          messages: [
            { role: "user", content: combinedPrompt }
          ]
        })
      });
      if (!res.ok) throw new Error(`OpenRouter HTTP Error: ${res.status}`);
      const data = await res.json();
      const textResponse = data.choices[0].message.content;
      const cleanJson = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    };

    // Helper: Groq API Call
    const fetchGroq = async (apiKey: string) => {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant", 
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error?.message || "";
        const timeMatch = errMsg.match(/try again in ([\d\.]+)s/i);
        const actualResetTime = timeMatch ? `${timeMatch[1]}s` : "30s";
        throw { status: res.status, message: errMsg, resetTime: actualResetTime };
      }
      const data = await res.json();
      return JSON.parse(data.choices[0].message.content);
    };

    // Helper: Gemini API Call
    const fetchGemini = async (apiKey: string) => {
      const combinedPrompt = `${systemPrompt}\n\nUser Request: ${userPrompt}\n\nCRITICAL INSTRUCTION: You MUST return ONLY valid JSON. Do not include markdown formatting like \`\`\`json or backticks.`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: combinedPrompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      if (!res.ok) throw new Error(`Gemini HTTP Error: ${res.status}`);
      const data = await res.json();
      const textResponse = data.candidates[0].content.parts[0].text;
      const cleanJson = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    };

    // ── TIER 0: Server-side proxy (best — no CORS, rotates all keys internally) ──
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt, userPrompt })
      });
      if (res.ok) {
        return await res.json();
      }
      if (res.status === 429) {
        const errData = await res.json().catch(() => ({}));
        throw { status: 429, message: errData.error || 'Server rate limited', resetTime: errData.resetTime || '30s', errorId: Date.now() };
      }
      throw new Error(`Server proxy returned ${res.status}`);
    } catch (serverError: any) {
      if (serverError?.status === 429) throw serverError;
      console.warn("Server proxy unavailable, using client-side APIs...", serverError?.message);
    }

    // ── Client-side fallback cascade ──
    let lastError: any = null;
    if (openRouterKey) {
      try { return await fetchOpenRouter(openRouterKey); } 
      catch (e: any) { console.warn("OpenRouter failed:", e?.message || e); lastError = e; }
    }
    if (groqKey1) {
      try { return await fetchGroq(groqKey1); } 
      catch (e: any) { console.warn("Groq Key 1 failed:", e?.message || e); lastError = e; }
    }
    if (groqKey2) {
      try { return await fetchGroq(groqKey2); } 
      catch (e: any) { console.warn("Groq Key 2 failed:", e?.message || e); lastError = e; }
    }
    if (geminiKey) {
      try { return await fetchGemini(geminiKey); } 
      catch (e: any) { console.error("Gemini failed:", e?.message || e); lastError = e; }
    }

    const resetTime = lastError?.resetTime || '30s';
    throw { status: 429, message: "All AI APIs are currently rate-limited.", resetTime, errorId: Date.now() };
  };

  // 1. Education Levels Scraper
  const levelsQ = useQuery({
    queryKey: ['levels', country],
    queryFn: async () => {
      try {
        const res = await fetch('/api/levels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ country })
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) return data;
        }
        if (res.status === 429) {
          const errData = await res.json().catch(() => ({}));
          throw { status: 429, message: errData.error || 'Rate limited', resetTime: errData.resetTime || '30s', errorId: Date.now() };
        }
      } catch (serverErr: any) {
        if (serverErr?.status === 429) throw serverErr;
        console.warn('[levels] Server route unavailable, using direct AI...', serverErr?.message);
      }

      const systemPrompt = `You are an expert on global education systems.
LANGUAGE RULE: You MUST respond entirely in English. All text must be in English only.
List ALL education levels where GPA, CGPA, or academic grades are calculated for this country. Return ONLY a valid JSON object: { "levels": ["Level 1", "Level 2", ...] }`;
      const result = await callAIWithFallback(systemPrompt, `Country: ${country}`);
      return result.levels || [];
    },
    enabled: !!country && country !== 'Manual Mode' && calcMode === 'ai',
    retry: false
  });

  // Automatically select Honours/Bachelor or first available education level when country is selected
  useEffect(() => {
    if (levelsQ.data && levelsQ.data.length > 0 && !level) {
      const defaultLvl = levelsQ.data.find((l: string) => {
        const low = l.toLowerCase();
        return low.includes('honour') || low.includes('bachelor') || low.includes('undergrad') || low.includes('degree') || low.includes('university');
      }) || levelsQ.data[0];
      setLevel(defaultLvl);
    }
  }, [levelsQ.data, level, setLevel])

  // 2. Universities/Institutions/Boards List Scraper
  const universitiesQ = useQuery({
    queryKey: ['universities', country, level, debouncedUniQuery],
    queryFn: async () => {
      try {
        const res = await fetch('/api/universities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ country, level, search: debouncedUniQuery })
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) return data;
        }
        if (res.status === 429) {
          const errData = await res.json().catch(() => ({}));
          throw { status: 429, message: errData.error || 'Rate limited', resetTime: errData.resetTime || '30s', errorId: Date.now() };
        }
      } catch (serverErr: any) {
        if (serverErr?.status === 429) throw serverErr;
        console.warn('[universities] Server route unavailable, using direct AI...', serverErr?.message);
      }

      const lvl = level.toLowerCase();
      const isSchoolLevel = lvl.includes('ssc') || lvl.includes('hsc') || lvl.includes('school') || lvl.includes('secondary') || lvl.includes('intermediate') || lvl.includes('high school') || lvl.includes('board') || lvl.includes('madrasha');
      if (isSchoolLevel) {
        return [{ name: "Unified Board / National Grading System", city: "National", type: "national", ranking: "Unified" }];
      }

      const institutionLabel = lvl.includes('college') ? 'colleges' : lvl.includes('diploma') || lvl.includes('polytechnic') ? 'polytechnic institutes' : 'universities';
      const systemPrompt = `You are a strict academic database.
LANGUAGE RULE: You MUST respond entirely in English. All institution names, city names, and text must be in English only. Do not use local language scripts (Arabic, Bengali, Chinese, etc.).
${debouncedUniQuery ? `List up to 15 universities/institutions in ${country} matching or highly related to the search query "${debouncedUniQuery}".` : `Return a JSON object with the top 100 real ${institutionLabel} for the requested country and level.`} Format: { "universities": [{ "name": "...", "city": "...", "type": "public", "ranking": "..." }] }. CRITICAL: Return only real institution names.`;
      const result = await callAIWithFallback(systemPrompt, debouncedUniQuery ? `List universities matching "${debouncedUniQuery}" in ${country}` : `Country: ${country}, Level: ${level}`);
      return result.universities || result.institutions || result.colleges || [];
    },
    enabled: !!country && country !== 'Manual Mode' && !!level && calcMode === 'ai',
    retry: false
  });

  // 3. Official Grading Policy Scraper (with waiver_policy)
  const policyQ = useQuery({
    queryKey: ['policy', country, level, university?.name],
    queryFn: async () => {
      try {
        const res = await fetch('/api/policy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ country, level, university: university?.name })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.grade_mapping) return data;
        }
        if (res.status === 429) {
          const errData = await res.json().catch(() => ({}));
          throw { status: 429, message: errData.error || 'Rate limited', resetTime: errData.resetTime || '30s', errorId: Date.now() };
        }
      } catch (serverErr: any) {
        if (serverErr?.status === 429) throw serverErr;
        console.warn('[policy] Server route unavailable, using direct AI...', serverErr?.message);
      }

      const systemPrompt = `You are a grading policy API.
LANGUAGE RULE: You MUST respond entirely in English. All field values, course names, notes, and details must be in English only. Do not use any local language scripts (Arabic, Bengali, Chinese, Japanese, etc.).
Return the official grading policy for this institution in JSON format. MUST include waiver_policy: { "has_waiver": boolean, "rules": [{ "gpa_threshold": number, "waiver_percentage": number, "details": string }], "details": string }.`;
      return await callAIWithFallback(systemPrompt, `Country: ${country}, Level: ${level}, Institution: ${university?.name}`);
    },
    enabled: !!country && country !== 'Manual Mode' && !!level && !!university && calcMode === 'ai',
    retry: false
  });

  // Rate limit Timer Logic
  useEffect(() => {
    const err = (levelsQ.error || universitiesQ.error || policyQ.error) as any
    if (err && err.status === 429 && err.resetTime) {
      const secs = getResetTimeSecs(err.resetTime)
      setSecondsLeft(secs)
    }
  }, [levelsQ.error, universitiesQ.error, policyQ.error])

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 0.1) {
          clearInterval(timer);
          return 0; 
        }
        return parseFloat((prev - 0.1).toFixed(1));
      });
    }, 100);
    
    return () => clearInterval(timer);
  }, [secondsLeft]);

  useEffect(() => {
    if (policyQ.data && calcMode === 'ai') {
      setGradingPolicy(policyQ.data as GradingPolicy)
      toast.success(`Official grading policy for ${university?.name} loaded!`)
    }
  }, [policyQ.data, calcMode])

  useEffect(() => {
    if (universitiesQ.data && universitiesQ.data.length === 1 && !university) {
      setUniversity(universitiesQ.data[0])
    }
  }, [universitiesQ.data, university])

  const getResetTimeSecs = (timeStr: string): number => {
    if (!timeStr) return 25 // Default fallback
    const minutesMatch = timeStr.match(/(\d+)\s*m/i)
    const secondsMatch = timeStr.match(/([\d\.]+)\s*s/i)
    let total = 0
    if (minutesMatch) total += parseInt(minutesMatch[1]) * 60
    if (secondsMatch) total += parseFloat(secondsMatch[1])
    return total > 0 ? total : 25
  }

  const handlePresetSelect = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId)
    if (!preset) return
    setActivePreset(presetId)
    setScale(preset.scale)
    setPassMark(preset.passMark)
    setGradeMapping(preset.grades)
    
    setGradingPolicy({
      country: preset.name,
      university: 'Standard Preset',
      level: 'Standard',
      grading_scale: preset.scale,
      credit_system: 'Credit Hour',
      pass_mark: preset.passMark,
      subjects: [],
      grade_mapping: preset.grades,
      formula: 'sum(credit*point)/total_credit',
      optional_course: false,
      retake,
      semester_based: semesterBased,
      verified: true,
      confidence: 1.0
    })
    toast.success(`${preset.name} loaded successfully!`)
  }

  const applyCustomSettings = () => {
    setGradingPolicy({
      country: 'Custom Format',
      university: 'Custom Scale',
      level: 'Custom',
      grading_scale: scale,
      credit_system: 'Credit Hour',
      pass_mark: passMark,
      subjects: [],
      grade_mapping: gradeMapping,
      formula: 'sum(credit*point)/total_credit',
      optional_course: false,
      retake,
      semester_based: semesterBased,
      verified: false,
      confidence: 0.5
    })
    toast.success('Custom grading settings applied!')
  }

  useEffect(() => {
    if (result && gradingPolicy) {
      addHistory({
        id: generateId(),
        timestamp: new Date().toISOString(),
        country: calcMode === 'ai' ? country : 'Manual Mode',
        countryCode: calcMode === 'ai' ? countryCode : 'MM',
        level: calcMode === 'ai' ? level : 'Standard',
        university: gradingPolicy.university,
        result,
        gradingPolicy
      })
    }
  }, [result])

  const handleModeSwitch = (mode: 'ai' | 'manual') => {
    setCalcMode(mode)
    reset()
    setSecondsLeft(null)
    setCountryQuery('')
    setUniQuery('')
    if (mode === 'manual') {
      setCountry('Manual Mode', 'MM')
    }
  }

  const textColor = isDark ? 'text-white' : 'text-slate-900'
  const cardBg = isDark ? 'bg-white/4 border-white/8 shadow-2xl shadow-black/30' : 'bg-white border-slate-200 shadow-xl shadow-slate-100'
  const inputBg = isDark ? 'bg-white/5 border-white/8 text-white focus:border-violet-500/40' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-violet-400'

  const renderRateLimitCard = (refetchFn: () => void) => (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center space-y-4">
      <div className="text-4xl animate-bounce">⏳</div>
      <h3 className="font-extrabold text-sm text-red-400">All AI Scrapers Rate Limited</h3>
      <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
        All 4 API quotas have been exhausted. Services will automatically restore in:
      </p>
      <p className="text-3xl font-black text-violet-400 tracking-wider">
        {secondsLeft !== null && secondsLeft > 0 ? `${secondsLeft.toFixed(1)}s` : 'restoring...'}
      </p>
      <button
        onClick={() => {
          setSecondsLeft(null)
          refetchFn()
        }}
        disabled={secondsLeft !== null && secondsLeft > 0}
        className="px-6 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white shadow-md shadow-violet-500/20 transition-all"
      >
        Retry Scraper
      </button>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => { reset(); navigate('/') }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all ${
              isDark ? 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          >
            <i className="fa-solid fa-arrow-left"></i> Back to Home
          </motion.button>
          <div>
            <h1 className={`font-black text-xl leading-tight ${textColor}`}>GPA/CGPA Calculator</h1>
            <p className="text-xs text-slate-500">Calculate using AI scrapers or manual presets</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className={`flex rounded-2xl p-1 gap-1 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
          <button
            onClick={() => handleModeSwitch('ai')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              calcMode === 'ai' ? 'bg-violet-600 text-white shadow-md' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-wand-magic-sparkles text-[10px]"></i> AI Auto-Scraper
          </button>
          <button
            onClick={() => handleModeSwitch('manual')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              calcMode === 'manual' ? 'bg-violet-600 text-white shadow-md' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fa-solid fa-calculator text-[10px]"></i> Standard / Manual Mode
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {calcMode === 'manual' ? (
          <motion.div key="manual-view" className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className={`rounded-3xl border p-6 space-y-6 ${cardBg}`}>
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-bolt text-violet-400"></i> Select Quick Preset Scale
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handlePresetSelect(p.id)}
                      className={`py-3.5 px-4 rounded-2xl border text-xs font-bold transition-all text-center ${
                        activePreset === p.id
                          ? 'bg-violet-600 text-white border-violet-500 shadow-lg'
                          : isDark ? 'bg-white/3 border-white/5 text-slate-300 hover:bg-white/6' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="flex items-center gap-1.5 text-xs font-bold text-violet-400 hover:text-violet-300"
                >
                  <i className={`fa-solid ${showConfig ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                  {showConfig ? 'Hide Custom Rules' : 'Customize Grading Scale Rules'}
                </button>

                {showConfig && (
                  <div className="space-y-4 pt-4">
                    <div className="grid sm:grid-cols-4 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-400 block font-bold mb-1">Grading Scale</label>
                        <select
                          value={scale}
                          onChange={(e) => setScale(e.target.value)}
                          className={`w-full px-3 py-2 text-xs rounded-xl outline-none border ${inputBg}`}
                        >
                          <option value="4.00">4.00 Scale</option>
                          <option value="5.00">5.00 Scale</option>
                          <option value="10.00">10.00 Scale</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block font-bold mb-1">Pass Mark (%)</label>
                        <input
                          type="number"
                          value={passMark}
                          onChange={(e) => setPassMark(parseInt(e.target.value) || 0)}
                          className={`w-full px-3 py-2 text-xs rounded-xl outline-none border ${inputBg}`}
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id="sem-based"
                          checked={semesterBased}
                          onChange={(e) => setSemesterBased(e.target.checked)}
                          className="w-4 h-4 accent-violet-600"
                        />
                        <label htmlFor="sem-based" className="text-xs font-semibold text-slate-300">Semester Based</label>
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id="retake-allowed"
                          checked={retake}
                          onChange={(e) => setRetake(e.target.checked)}
                          className="w-4 h-4 accent-violet-600"
                        />
                        <label htmlFor="retake-allowed" className="text-xs font-semibold text-slate-300">Retakes Allowed</label>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {gradeMapping.map((g, i) => (
                          <div key={i} className="flex gap-2 items-center bg-white/5 border border-white/5 rounded-xl p-2">
                            <input
                              type="text"
                              value={g.letter}
                              onChange={(e) => {
                                const next = [...gradeMapping]; next[i].letter = e.target.value; setGradeMapping(next)
                              }}
                              className={`w-14 text-center px-1 py-1 text-xs rounded-lg ${inputBg}`}
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={g.point}
                              onChange={(e) => {
                                const next = [...gradeMapping]; next[i].point = parseFloat(e.target.value) || 0; setGradeMapping(next)
                              }}
                              className={`w-16 text-center px-1 py-1 text-xs rounded-lg ${inputBg}`}
                            />
                            <input
                              type="text"
                              value={g.marks}
                              onChange={(e) => {
                                const next = [...gradeMapping]; next[i].marks = e.target.value; setGradeMapping(next)
                              }}
                              className={`flex-1 text-center px-1 py-1 text-xs rounded-lg ${inputBg}`}
                            />
                            <button onClick={() => setGradeMapping(gradeMapping.filter((_, idx) => idx !== i))} className="text-red-500 p-1">
                              <i className="fa-solid fa-trash-can text-xs"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button onClick={() => setGradeMapping([...gradeMapping, { letter: '', point: 0, marks: '' }])} className="px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-300">
                          + Add Rule
                        </button>
                        <button onClick={applyCustomSettings} className="px-5 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold">
                          Apply Settings
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div key="calc-sheet" className="grid md:grid-cols-3 gap-6 items-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className={`md:col-span-1 rounded-3xl border p-5 space-y-4 ${cardBg}`}>
                    <h3 className="font-black text-sm text-slate-400">Grade Mapping Policy</h3>
                    {gradingPolicy && <GradeTable gradeMapping={gradingPolicy.grade_mapping} gradingScale={gradingPolicy.grading_scale} passMark={gradingPolicy.pass_mark} />}
                  </div>
                  <div className={`md:col-span-2 rounded-3xl border p-5 ${cardBg}`}>
                    <DynamicCalculator onCalculate={calculate} />
                  </div>
                </motion.div>
              ) : (
                <motion.div key="calc-result" className="max-w-2xl mx-auto">
                  <ResultCard result={result} onReset={reset} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div key="ai-view" className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {(!country || country === 'Manual Mode') && (
              <div className={`rounded-3xl border p-6 space-y-6 max-w-xl mx-auto ${cardBg}`}>
                <div className="space-y-2 text-center">
                  <h2 className={`text-lg font-black ${textColor}`}>Pick a Country</h2>
                  <p className="text-xs text-slate-500">AI will research grading systems and universities in this country</p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={countryQuery}
                    onChange={(e) => setCountryQuery(e.target.value)}
                    placeholder="Type country name..."
                    className={`flex-1 px-4 py-2.5 text-xs rounded-xl outline-none border ${inputBg}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && countryQuery.trim()) {
                        reset(); // FIX: Reset state before calling API
                        setCountry(countryQuery, getCountryCodeFromName(countryQuery));
                      }
                    }}
                  />
                  <button onClick={() => {
                    if (countryQuery.trim()) {
                      reset(); // FIX: Reset state before calling API
                      setCountry(countryQuery, getCountryCodeFromName(countryQuery));
                    }
                  }} className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold">
                    Search
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {POPULAR_COUNTRIES.map((c) => (
                    <button key={c.code} onClick={() => {
                      reset(); // FIX: Reset state before calling API
                      setCountry(c.name, c.code);
                    }} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border ${isDark ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <span>{getCountryFlag(c.code)}</span> {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {country && country !== 'Manual Mode' && (
              <>
                <motion.div className={`rounded-3xl border p-5 flex items-center justify-between gap-4 ${cardBg}`} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{getCountryFlag(countryCode)}</span>
                    <div>
                      <h2 className={`text-lg font-black ${textColor}`}>{country}</h2>
                      <p className="text-xs text-slate-500">AI Auto-Scraper handles university data structures</p>
                    </div>
                  </div>
                  <button onClick={reset} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                    Change Country
                  </button>
                </motion.div>

                <div className="space-y-6">
                  {!gradingPolicy ? (
                    <div className="grid md:grid-cols-2 gap-6 items-start">
                      <div className={`rounded-3xl border p-5 ${cardBg}`}>
                        {levelsQ.isLoading ? (
                          <div className="flex items-center gap-3 py-4"><i className="fa-solid fa-spinner animate-spin text-violet-400"></i><p className="text-xs font-bold text-slate-400">Scraping Levels...</p></div>
                        ) : levelsQ.error ? (
                          renderRateLimitCard(() => levelsQ.refetch())
                        ) : (
                          <div className="space-y-3">
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Select Education Level</label>
                            <div className="flex flex-col gap-2">
                              {levelsQ.data?.map((l: string) => (
                                <button
                                  key={l}
                                  onClick={() => { setLevel(l); setUniversity(null); setUniQuery('') }}
                                  className={`w-full py-3 px-4 rounded-xl border text-xs font-bold text-left ${level === l ? 'bg-violet-600 text-white' : isDark ? 'bg-white/3' : 'bg-slate-50'}`}
                                >
                                  {l}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {level && (
                        <div className={`rounded-3xl border p-5 ${cardBg}`}>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Select University / Institution</label>
                              {universitiesQ.isFetching && (
                                <span className="flex items-center gap-1 text-[9px] text-violet-400 font-bold animate-pulse">
                                  <i className="fa-solid fa-circle-notch animate-spin"></i> AI Searching...
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              value={uniQuery}
                              onChange={(e) => setUniQuery(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && uniQuery.trim()) {
                                  setUniversity({ name: uniQuery.trim(), city: country, type: 'private', ranking: 'N/A' })
                                  setUniQuery('')
                                }
                              }}
                              placeholder="Search or type any university name..."
                              className={`w-full px-3 py-2 text-xs rounded-xl border ${inputBg}`}
                            />
                            <div className="max-h-56 overflow-y-auto space-y-1.5 pt-1.5">
                              {universitiesQ.isLoading ? (
                                <div className="flex items-center gap-3 py-4"><i className="fa-solid fa-spinner animate-spin text-violet-400"></i><p className="text-xs font-bold text-slate-400">Scraping Institutions...</p></div>
                              ) : universitiesQ.error ? (
                                renderRateLimitCard(() => universitiesQ.refetch())
                              ) : (
                                (() => {
                                  const listToDisplay = universitiesQ.data || [];
                                  const exactMatch = listToDisplay.some((u: any) =>
                                    u.name.toLowerCase() === uniQuery.trim().toLowerCase()
                                  );
                                  return (
                                    <>
                                      {uniQuery.trim() && listToDisplay.length === 0 && !universitiesQ.isFetching && (
                                        <button
                                          onClick={() => {
                                            setUniversity({ name: uniQuery.trim(), city: country, type: 'private', ranking: 'N/A' })
                                            setUniQuery('')
                                          }}
                                          className="w-full p-3 rounded-xl border border-dashed border-violet-500/40 bg-violet-500/10 text-xs text-left hover:bg-violet-500/20 transition-all"
                                        >
                                          <p className="font-black text-violet-400 flex items-center gap-1.5">
                                            <i className="fa-solid fa-wand-magic-sparkles text-[10px]"></i>
                                            Use &quot;{uniQuery.trim()}&quot;
                                          </p>
                                          <p className="text-[9px] text-slate-400 mt-0.5">AI will fetch the grading policy for this institution</p>
                                        </button>
                                      )}

                                      {listToDisplay.map((u: any) => (
                                        <button
                                          key={u.name}
                                          onClick={() => setUniversity(u)}
                                          className={`w-full p-2.5 rounded-xl border text-xs text-left ${university?.name === u.name ? 'bg-violet-600 text-white' : isDark ? 'bg-white/3' : 'bg-slate-50'}`}
                                        >
                                          <p className="font-bold">{u.name}</p>
                                          <p className="text-[9px] text-slate-400 mt-0.5">{u.city} · Ranking: {u.ranking || 'N/A'}</p>
                                        </button>
                                      ))}

                                      {uniQuery.trim() && listToDisplay.length > 0 && !exactMatch && (
                                        <button
                                          onClick={() => {
                                            setUniversity({ name: uniQuery.trim(), city: country, type: 'private', ranking: 'N/A' })
                                            setUniQuery('')
                                          }}
                                          className={`w-full p-2.5 rounded-xl border border-dashed border-violet-500/30 text-xs text-left hover:bg-violet-500/10 transition-all ${isDark ? 'bg-white/2' : 'bg-violet-50'}`}
                                        >
                                          <p className="font-bold text-violet-400 flex items-center gap-1.5">
                                            <i className="fa-solid fa-plus text-[9px]"></i>
                                            Use &quot;{uniQuery.trim()}&quot; instead
                                          </p>
                                          <p className="text-[9px] text-slate-500 mt-0.5">Press Enter or click to use this custom institution</p>
                                        </button>
                                      )}
                                    </>
                                  )
                                })()
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <AnimatePresence mode="wait">
                      {!result ? (
                        <motion.div key="calc-sheet" className="grid md:grid-cols-3 gap-6 items-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <div className={`md:col-span-1 rounded-3xl border p-5 space-y-4 ${cardBg}`}>
                            
                            {/* ── Validation Header ── */}
                            <div className="space-y-3">
                              {/* Status badge */}
                              <div className="flex items-center justify-between">
                                {gradingPolicy.verified ? (
                                  <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                                    <i className="fa-solid fa-circle-check text-[9px]"></i> AI Verified Policy
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                                    <i className="fa-solid fa-triangle-exclamation text-[9px]"></i> AI Estimated
                                  </span>
                                )}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  (gradingPolicy.confidence || 0) >= 0.8 
                                    ? 'text-emerald-400 bg-emerald-500/10' 
                                    : (gradingPolicy.confidence || 0) >= 0.5 
                                    ? 'text-amber-400 bg-amber-500/10'
                                    : 'text-red-400 bg-red-500/10'
                                }`}>
                                  {Math.round((gradingPolicy.confidence || 0.5) * 100)}% confidence
                                </span>
                              </div>

                              {/* Confidence bar */}
                              <div className={`w-full h-1.5 rounded-full ${isDark ? 'bg-white/8' : 'bg-slate-200'}`}>
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    (gradingPolicy.confidence || 0) >= 0.8 ? 'bg-emerald-500' 
                                    : (gradingPolicy.confidence || 0) >= 0.5 ? 'bg-amber-500' 
                                    : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.round((gradingPolicy.confidence || 0.5) * 100)}%` }}
                                />
                              </div>

                              {/* Institution info */}
                              <div className={`text-[10px] px-3 py-2 rounded-xl border space-y-0.5 ${isDark ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                                <p className={`font-black text-xs ${isDark ? 'text-white' : 'text-slate-800'}`}>{gradingPolicy.university}</p>
                                <p className="text-slate-500">{gradingPolicy.level} · {gradingPolicy.country}</p>
                                <p className="text-slate-500">Scale: <strong className="text-violet-400">{gradingPolicy.grading_scale}</strong> · Pass: <strong className="text-violet-400">{gradingPolicy.pass_mark}%</strong></p>
                              </div>
                            </div>

                            {/* ── Grade Table ── */}
                            <GradeTable gradeMapping={gradingPolicy.grade_mapping} gradingScale={gradingPolicy.grading_scale} passMark={gradingPolicy.pass_mark} />

                            {/* ── Notes ── */}
                            {gradingPolicy.notes && (
                              <p className={`text-[10px] leading-relaxed p-3 rounded-xl border ${isDark ? 'text-slate-300 bg-black/10 border-white/5' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                                <i className="fa-solid fa-circle-info text-violet-400 mr-1"></i>
                                {gradingPolicy.notes}
                              </p>
                            )}

                            {/* ── Validation Actions ── */}
                            <div className="space-y-2 pt-1">
                              {/* Source URL if available */}
                              {gradingPolicy.source_url && (
                                <a
                                  href={gradingPolicy.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors"
                                >
                                  <i className="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                                  View Official Source
                                </a>
                              )}

                              {/* Verify on Google */}
                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(`${gradingPolicy.university} official grading policy GPA ${gradingPolicy.level}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-[10px] font-bold border transition-all hover:border-violet-500/40 ${isDark ? 'bg-white/3 border-white/8 text-slate-300 hover:bg-white/6' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                              >
                                <i className="fa-brands fa-google text-[10px]"></i>
                                Verify on Google
                              </a>

                              {/* Reload policy button */}
                              <button
                                onClick={() => { setGradingPolicy(null as any); policyQ.refetch() }}
                                className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-[10px] font-bold border transition-all hover:border-violet-500/40 ${isDark ? 'bg-white/3 border-white/8 text-slate-300 hover:bg-white/6' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                              >
                                <i className="fa-solid fa-rotate-right text-[10px]"></i>
                                Re-fetch Policy
                              </button>
                            </div>
                          </div>

                          <div className={`md:col-span-2 rounded-3xl border p-5 ${cardBg}`}>
                            <DynamicCalculator onCalculate={calculate} />
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="calc-result" className="max-w-2xl mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <ResultCard result={result} onReset={reset} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}

                  {university && !gradingPolicy && policyQ.isLoading && (
                    <div className={`rounded-3xl border p-6 text-center ${cardBg}`}>
                      <div className="flex flex-col items-center gap-3 py-6">
                        <i className="fa-solid fa-circle-notch animate-spin text-2xl text-violet-500"></i>
                        <p className="text-xs text-slate-400">Extracting official handbook rules from AI models...</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}