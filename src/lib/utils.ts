import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatGPA(value: number, scale = 4): string {
  if (isNaN(value) || value < 0) return '0.00'
  return Math.min(value, scale).toFixed(2)
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
}

export function getCountryFlag(code: string): string {
  if (!code || code.length !== 2) return '🌍'
  const pts = code
    .toUpperCase()
    .split('')
    .map((c) => 127397 + c.charCodeAt(0))
  return String.fromCodePoint(...pts)
}

export function parseJsonSafely<T>(text: string): T | null {
  try {
    // Strip markdown fences
    const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()
    return JSON.parse(clean) as T
  } catch {
    // Try to extract first JSON block
    const m = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
    if (m) {
      try { return JSON.parse(m[1]) as T } catch { return null }
    }
    return null
  }
}

export function getCountryCodeFromName(name: string): string {
  const MAP: Record<string, string> = {
    'Afghanistan': 'AF', 'Albania': 'AL', 'Algeria': 'DZ', 'Argentina': 'AR',
    'Australia': 'AU', 'Austria': 'AT', 'Azerbaijan': 'AZ', 'Bangladesh': 'BD',
    'Belgium': 'BE', 'Bolivia': 'BO', 'Brazil': 'BR', 'Bulgaria': 'BG',
    'Cambodia': 'KH', 'Canada': 'CA', 'Chile': 'CL', 'China': 'CN',
    'Colombia': 'CO', 'Croatia': 'HR', 'Czech Republic': 'CZ', 'Denmark': 'DK',
    'Ecuador': 'EC', 'Egypt': 'EG', 'Ethiopia': 'ET', 'Finland': 'FI',
    'France': 'FR', 'Germany': 'DE', 'Ghana': 'GH', 'Greece': 'GR',
    'Guatemala': 'GT', 'Hong Kong': 'HK', 'Hungary': 'HU', 'India': 'IN',
    'Indonesia': 'ID', 'Iran': 'IR', 'Iraq': 'IQ', 'Ireland': 'IE',
    'Israel': 'IL', 'Italy': 'IT', 'Japan': 'JP', 'Jordan': 'JO',
    'Kazakhstan': 'KZ', 'Kenya': 'KE', 'Kuwait': 'KW', 'Lebanon': 'LB',
    'Libya': 'LY', 'Malaysia': 'MY', 'Mexico': 'MX', 'Morocco': 'MA',
    'Myanmar': 'MM', 'Nepal': 'NP', 'Netherlands': 'NL', 'New Zealand': 'NZ',
    'Nigeria': 'NG', 'Norway': 'NO', 'Oman': 'OM', 'Pakistan': 'PK',
    'Palestine': 'PS', 'Panama': 'PA', 'Peru': 'PE', 'Philippines': 'PH',
    'Poland': 'PL', 'Portugal': 'PT', 'Qatar': 'QA', 'Romania': 'RO',
    'Russia': 'RU', 'Saudi Arabia': 'SA', 'Senegal': 'SN', 'Singapore': 'SG',
    'South Africa': 'ZA', 'South Korea': 'KR', 'Spain': 'ES', 'Sri Lanka': 'LK',
    'Sudan': 'SD', 'Sweden': 'SE', 'Switzerland': 'CH', 'Syria': 'SY',
    'Taiwan': 'TW', 'Tanzania': 'TZ', 'Thailand': 'TH', 'Tunisia': 'TN',
    'Turkey': 'TR', 'Uganda': 'UG', 'Ukraine': 'UA',
    'United Arab Emirates': 'AE', 'United Kingdom': 'GB',
    'United States of America': 'US', 'United States': 'US',
    'Uruguay': 'UY', 'Uzbekistan': 'UZ', 'Venezuela': 'VE',
    'Vietnam': 'VN', 'Yemen': 'YE', 'Zimbabwe': 'ZW',
  }
  return MAP[name] ?? name.slice(0, 2).toUpperCase()
}
