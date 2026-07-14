import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEST_PORT = 5999
const BASE_URL = `http://localhost:${TEST_PORT}`
let serverProcess = null

// Helper for colored console logs
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  bold: "\x1b[1m"
}

function logSuccess(name) {
  console.log(`${colors.green}✓ PASS:${colors.reset} ${name}`)
}

function logFail(name, err) {
  console.log(`${colors.red}✗ FAIL:${colors.reset} ${name}`)
  console.log(`       Reason: ${err.message || err}`)
}

async function runTests() {
  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`)
  console.log(`${colors.bold}${colors.cyan}         GPA CALCULATOR INTEGRATION TEST SUITE       ${colors.reset}`)
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`)

  let failedTests = 0

  // Test 1: Check Environment variables
  try {
    console.log(`${colors.bold}Test 1: Verifying Server Configurations...${colors.reset}`)
    const envPath = path.join(__dirname, '.env')
    if (!fs.existsSync(envPath)) {
      throw new Error(".env file not found in root workspace directory!")
    }
    logSuccess("Workspace configurations (.env) verified.")
  } catch (err) {
    failedTests++
    logFail("Verifying Server Configurations", err)
  }

  // Test 2: Feedback Save & Forwarding
  try {
    console.log(`\n${colors.bold}Test 2: Verifying Feedback Endpoint (/api/feedback)...${colors.reset}`)
    const payload = {
      name: "Automation Tester",
      email: "test@example.com",
      rating: 5,
      comment: "This is an automated test verifying the feedback emailing feature."
    }
    const response = await fetch(`${BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    if (response.status === 201) {
      logSuccess("Feedback saved successfully (SMTP logs printed on server console).")
    } else {
      const data = await response.json().catch(() => ({}))
      throw new Error(`Expected status 201, got ${response.status}. Msg: ${JSON.stringify(data)}`)
    }
  } catch (err) {
    failedTests++
    logFail("Verifying Feedback Endpoint (/api/feedback)", err)
  }

  // Test 3: AI Levels Endpoint
  try {
    console.log(`\n${colors.bold}Test 3: Verifying AI Education Levels extraction (/api/levels)...${colors.reset}`)
    const payload = {
      country: "Bangladesh",
      provider: "groq",
      model: "llama-3.3-70b-versatile"
    }
    const response = await fetch(`${BASE_URL}/api/levels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    const data = await response.json()
    if (response.status === 200 && Array.isArray(data)) {
      logSuccess(`Levels fetched successfully: [${data.join(', ')}]`)
    } else {
      throw new Error(`Expected array of levels, got status ${response.status}: ${JSON.stringify(data)}`)
    }
  } catch (err) {
    failedTests++
    logFail("Verifying AI Education Levels extraction (/api/levels)", err)
  }

  // Test 4: AI Universities Endpoint
  try {
    console.log(`\n${colors.bold}Test 4: Verifying AI University extraction (/api/universities)...${colors.reset}`)
    const payload = {
      country: "Bangladesh",
      level: "Honours",
      provider: "groq",
      model: "llama-3.3-70b-versatile"
    }
    const response = await fetch(`${BASE_URL}/api/universities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    const data = await response.json()
    if (response.status === 200 && Array.isArray(data) && data.length > 0) {
      logSuccess(`Universities fetched successfully: Found ${data.length} institutions.`)
      console.log(`       Sample: ${data[0].name} (${data[0].city})`)
    } else {
      throw new Error(`Expected array of universities, got status ${response.status}: ${JSON.stringify(data)}`)
    }
  } catch (err) {
    failedTests++
    logFail("Verifying AI University extraction (/api/universities)", err)
  }

  // Test 5: AI Policy extraction
  try {
    console.log(`\n${colors.bold}Test 5: Verifying AI Grading Policy & Tuition Waiver (/api/policy)...${colors.reset}`)
    const payload = {
      university: "University of Dhaka",
      country: "Bangladesh",
      level: "Honours",
      provider: "groq",
      model: "llama-3.3-70b-versatile"
    }
    const response = await fetch(`${BASE_URL}/api/policy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    const data = await response.json()
    if (response.status === 200 && data.grading_scale && data.grade_mapping) {
      logSuccess(`Policy fetched successfully. Scale: ${data.grading_scale}, Pass Mark: ${data.pass_mark}%`)
      console.log(`       Waiver Policy: ${data.waiver_policy?.has_waiver ? 'Active' : 'Not Found'}`)
    } else {
      throw new Error(`Expected valid policy object, got status ${response.status}: ${JSON.stringify(data)}`)
    }
  } catch (err) {
    failedTests++
    logFail("Verifying AI Grading Policy & Tuition Waiver (/api/policy)", err)
  }

  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`)
  if (failedTests === 0) {
    console.log(`${colors.bold}${colors.green}🎉 ALL TESTS COMPLETED SUCCESSFULLY! YOUR BACKEND IS 100% PERFECT!${colors.reset}`)
  } else {
    console.log(`${colors.bold}${colors.red}⚠️  TEST RUN COMPLETED WITH ${failedTests} FAILURE(S).${colors.reset}`)
  }
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`)

  cleanupAndExit(failedTests > 0 ? 1 : 0)
}

function cleanupAndExit(code) {
  if (serverProcess) {
    console.log("Stopping background test server...")
    serverProcess.kill('SIGTERM')
  }
  process.exit(code)
}

// Start the server process and wait for ready output
console.log("Launching server process...")
serverProcess = spawn('node', ['server/server.js'], {
  env: { ...process.env, PORT: TEST_PORT.toString() }
})

let serverReady = false
serverProcess.stdout.on('data', (data) => {
  const output = data.toString()
  if (output.includes('running at http://localhost') && !serverReady) {
    serverReady = true
    console.log("Server is online! Starting tests...")
    runTests()
  }
})

serverProcess.stderr.on('data', (data) => {
  console.error(`[Server Error] ${data.toString().trim()}`)
})

serverProcess.on('close', (code) => {
  if (!serverReady) {
    console.error(`Server process exited prematurely with code ${code}`)
    process.exit(1)
  }
})

// Fail-safe timeout
setTimeout(() => {
  if (!serverReady) {
    console.error("Timeout: Server did not start within 10 seconds.")
    cleanupAndExit(1)
  }
}, 10000)
