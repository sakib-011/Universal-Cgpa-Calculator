# Universal AI GPA & CGPA Calculator

An interactive, premium, state-of-the-art global CGPA and GPA calculator. Users can select a country via an interactive zoomable world map or search bar. Once a country is selected, the application queries its education levels and top universities. The platform then uses a live Express backend to search the web and scrape the latest official handbooks, grading scales, and tuition waiver/scholarship criteria, dynamically building a custom calculator interface.

It supports four major LLM providers (Google Gemini, Groq Cloud, OpenAI, and Anthropic Claude) with fail-safes and manual offline entries, dynamic semester management, exports (PDF, PNG, CSV), and an interactive feedback system.

---

## 🚀 Key Features

1. **🌍 Interactive Zoomable World Map**:
   - Hover on countries to see flags and names.
   - Click to zoom, zoom out, or select a country to launch the AI discovery flow.
   
2. **🔮 Dynamic AI Policy Discovery**:
   - Queries DuckDuckGo HTML and scrapes the top academic handbook links in real-time.
   - Feeds the live text context to your selected LLM to dynamically generate grading scales, pass marks, formulas, and course templates.

3. **🛠️ Multi-LLM Provider Settings**:
   - Configure keys for **Google Gemini**, **Groq Cloud**, **OpenAI**, and **Anthropic Claude**.
   - Pick your preferred model (e.g. `llama-3.3-70b`, `gemini-2.0-flash`, `gpt-4o-mini`, `claude-3.5-sonnet`) with simple tab controls.
   - Fallback to **Offline Manual Mode** with global scale presets (4.00, 4.33, 5.00, 10.00) when keys are unavailable.

4. **🎓 Tuition Waiver & Scholarship Estimator**:
   - Automatically parses university waiver rules (e.g. 50% tuition waiver for GPA ≥ 3.85).
   - Checks eligibility based on calculated GPA/credits.
   - Includes full manual rules management to add, delete, or override waiver thresholds.

5. **📂 Dynamic Semesters**:
   - Add/remove semesters.
   - Dynamically manage courses, credits, letter grades, percentage marks, and retakes.
   
6. **📥 Premium Exports**:
   - Export results to **PDF** (rendered as clean document sheets), **PNG** (image card), or **CSV** (course tables).

7. **💬 User Feedback System**:
   - Interactive feedback form with emojis and comments, saving entries directly to `server/feedback.json`.

---

## 🛠️ Technology Stack

- **Frontend**: React (v18), TypeScript, Vite, Tailwind CSS v4, Zustand (state), Framer Motion (animations), React Simple Maps, jsPDF, html2canvas, PapaParse.
- **Backend**: Node.js, Express, Axios (scraping), Cheerio (HTML parsing).

---

## 📂 Project Structure

```text
├── server/
│   ├── feedback.json      # Stores user feedback entries
│   ├── package.json       # Backend dependencies (express, cheerio, axios)
│   └── server.js          # Express server with web search and LLM connectors
├── src/
│   ├── components/
│   │   ├── calculator/    # Dynamic calculator, grade table, waiver estimator
│   │   ├── cards/         # Home page floating cards & quotes
│   │   ├── map/           # Zoomable world map
│   │   └── shared/        # Multi-API settings, feedback, theme toggle
│   ├── services/
│   │   ├── exportService.ts # PDF, PNG, CSV exporter logic
│   │   └── geminiService.ts # Unified client routing to backend endpoints
│   ├── stores/
│   │   ├── useCalculatorStore.ts # Core calculator & API state machine
│   │   ├── useHistoryStore.ts    # Saves past calculations locally
│   │   └── useThemeStore.ts      # Dark/Light theme control
│   ├── App.tsx            # Routes mounting (AppLayout, LandingPage, Calculator)
│   └── index.css          # Tailwind configurations & custom gradients
├── package.json           # Root dependencies & concurrent execution scripts
└── vite.config.ts         # Vite configuration with proxy to server (port 5000)
```

---

## ⚡ Setup & Run Instructions

### 1. Prerequisites
- **Node.js**: Make sure Node.js (v18+ recommended) is installed.
- **API Keys**: Get API keys for Gemini, Groq, OpenAI, or Claude.

### 2. Sourcing NVM (If Node.js is managed via NVM)
Sourcing the Node Version Manager:
```bash
# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Select/Install Node.js
nvm install 18
nvm use 18
```

### 3. Installation
Install all dependencies in the root project folder:
```bash
# Install root dependencies
npm install

# Install backend dependencies
npm install --prefix server
```

### 4. Configuration
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Fill in the keys for your preferred providers:
```ini
# Server-side API Keys (Express backend)
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
PORT=5000
```

### 5. Running the Application
Launch both the **Vite frontend** and **Express backend** concurrently:
```bash
npm run dev
```
The app will be available at `http://localhost:5173`. Frontend API calls will automatically proxy to the Express server running on port `5000`.

---

## 👨‍💻 Code Explanations & Rationale

- **Zustand State (`useCalculatorStore.ts`)**: Manages the multi-semester state, active API provider selection, and API keys. Stored in localStorage so they persist across page refreshes.
- **Web Scraping (`server.js`)**: Runs on the server to prevent CORS issues. Fetches search results from DuckDuckGo HTML, strips header/footer tags using Cheerio, fetches actual policy pages, and forwards the cleaned text context to the active LLM.
- **Waiver Estimator (`ScholarshipWaiver.tsx`)**: Compares GPA values against a set of threshold rules. Includes a management mode where users can customize or delete rules to reflect changes in university scholarships.
- **Interactive Map (`WorldMap.tsx`)**: Features a canvas with hover tooltip effects showing flags, zoom keys, and seamless page routing once clicked.
