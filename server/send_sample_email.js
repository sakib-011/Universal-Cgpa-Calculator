import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env') })

const smtpUser = process.env.SMTP_USER || ''
const smtpPass = process.env.SMTP_PASS || ''

if (!smtpUser || !smtpPass) {
  console.error("Error: SMTP_USER or SMTP_PASS not set in .env!")
  process.exit(1)
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: smtpUser,
    pass: smtpPass.replace(/\s+/g, '')
  }
})

const mailOptions = {
  from: `"GPA Calculator Monitor" <${smtpUser}>`,
  to: 'sakibshourov001@gmail.com',
  subject: `🚨 SAMPLE ALERT: Groq API Key Status Verification`,
  html: `
    <div style="font-family: sans-serif; padding: 20px; border-radius: 12px; background-color: #0f172a; color: #f8fafc; border: 1px solid #3b82f6;">
      <h2 style="color: #60a5fa; margin-top: 0;">🔵 API Monitor Verification</h2>
      <hr style="border: 0; border-top: 1px solid #3b82f6; margin-bottom: 20px;" />
      <p>This is a sample alert verification email sent to confirm that your GPA Calculator's email alert system is online and configured correctly.</p>
      <p><strong>System Status:</strong> SMTP Online & Verified</p>
      <p><strong>Configured Sender User:</strong> <code>\${smtpUser}</code></p>
      <p>If you received this email, the mail notifications are fully functional and will alert you if your Groq API keys expire or fail.</p>
      <hr style="border: 0; border-top: 1px solid #334155; margin-top: 20px;" />
      <p style="font-size: 10px; color: #64748b;">GPA Calculator Automated System Monitor.</p>
    </div>
  `
}

try {
  console.log("Attempting to send verification email...")
  await transporter.sendMail(mailOptions)
  console.log("Success! Sample alert email sent to sakibshourov001@gmail.com")
} catch (err) {
  console.error("Failed to send sample alert:", err.message)
}
