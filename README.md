# 🤖 AI Automated Code Reviewer

An enterprise-grade AI-powered platform that analyzes source code for bugs, security vulnerabilities, performance issues, and coding standard violations. Generates professional audit reports with severity classifications and optimized code suggestions.

---

## ✨ Features

- **AI-Powered Analysis** — Gemini 1.5 Flash (primary) + GPT-4o-mini (fallback) + Demo mode
- **Multi-Language Support** — Python, JavaScript, TypeScript, Java, C++, Go, PHP, Rust, Ruby, C#
- **4 Review Types** — Full Audit, Security, Performance, Code Quality
- **Upload Methods** — Single files, multiple files, ZIP archives, GitHub repository URLs
- **Severity Classification** — Critical / High / Medium / Low with detailed explanations
- **Futuristic UI** — Glassmorphism, neon gradients, Framer Motion animations, dark theme
- **Downloadable Reports** — Professional PDF and JSON audit reports
- **Analytics Dashboard** — Score trends, language distribution, issue metrics
- **JWT Authentication** — Secure login/register with bcrypt password hashing
- **Demo Mode** — Works without API keys using pattern-based analysis

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone & Install

```bash
cd Automated_code

# Install all dependencies
npm run install:all
```

### 2. Configure Environment

Edit the `.env` file in the root:

```env
OPENAI_API_KEY=your_openai_api_key        # Optional - fallback AI
GEMINI_API_KEY=your_gemini_api_key        # Optional - primary AI
MONGODB_URI=mongodb://localhost:27017/ai-code-reviewer
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

> **Note:** The platform works in **Demo Mode** without API keys, using pattern-based analysis. Add real API keys for full AI-powered reviews.

### 3. Get API Keys (Optional but Recommended)

- **Gemini** (Free tier available): https://aistudio.google.com/app/apikey
- **OpenAI**: https://platform.openai.com/api-keys

### 4. Start Development

```bash
# Start both frontend and backend
npm run dev

# Or separately:
npm run server    # Backend on :5000
npm run client    # Frontend on :3000
```

Open http://localhost:3000

---

## 📁 Project Structure

```
Automated_code/
├── .env                          # Environment variables
├── package.json                  # Root scripts
│
├── client/                       # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── context/
│   │   │   └── AuthContext.js    # JWT auth state
│   │   ├── pages/
│   │   │   ├── LandingPage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── DashboardPage.js  # Analytics & stats
│   │   │   ├── UploadPage.js     # File/GitHub upload
│   │   │   ├── ResultsPage.js    # Review results
│   │   │   ├── HistoryPage.js    # Review history
│   │   │   └── SettingsPage.js
│   │   ├── components/
│   │   │   └── Layout.js         # Sidebar navigation
│   │   ├── services/
│   │   │   └── api.js            # Axios instance
│   │   └── styles/
│   │       └── globals.css       # Tailwind + custom styles
│   ├── tailwind.config.js
│   └── package.json
│
└── server/                       # Node.js backend
    ├── index.js                  # Express app entry
    ├── models/
    │   ├── User.js               # User schema
    │   └── Report.js             # Report schema
    ├── controllers/
    │   ├── authController.js
    │   ├── reviewController.js
    │   └── reportController.js
    ├── routes/
    │   ├── auth.js
    │   ├── review.js
    │   └── reports.js
    ├── middleware/
    │   ├── auth.js               # JWT middleware
    │   └── upload.js             # Multer config
    ├── services/
    │   ├── aiService.js          # Gemini + OpenAI integration
    │   ├── fileParser.js         # ZIP/file parsing
    │   ├── githubService.js      # Repo cloning
    │   └── pdfService.js         # PDF generation
    └── package.json
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/review/upload` | Upload files for review |
| POST | `/api/review/github` | Review GitHub repository |
| GET | `/api/review/:id` | Get review report |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/history` | Paginated review history |
| GET | `/api/reports/stats` | Dashboard statistics |
| GET | `/api/reports/:id/pdf` | Download PDF report |
| GET | `/api/reports/:id/json` | Download JSON report |
| DELETE | `/api/reports/:id` | Delete report |

---

## 🚢 Deployment

### Frontend → Vercel
```bash
cd client
npm run build
# Deploy the build/ folder to Vercel
```

### Backend → Render / Railway
1. Set environment variables in the platform dashboard
2. Set build command: `npm install`
3. Set start command: `node index.js`
4. Point `MONGODB_URI` to MongoDB Atlas

### Database → MongoDB Atlas
1. Create free cluster at https://cloud.mongodb.com
2. Get connection string
3. Set `MONGODB_URI` in environment

---

## 🔒 Security Features

- Helmet.js security headers
- Rate limiting (100 req/15min global, 20 reviews/hour)
- JWT authentication with 7-day expiry
- bcrypt password hashing (12 rounds)
- MongoDB sanitization (NoSQL injection prevention)
- Input validation with express-validator
- CORS protection
- File type and size validation
- No hardcoded secrets

---

## 🤖 AI Integration

The platform uses a **cascade approach**:
1. **Gemini 1.5 Flash** (primary — fast, free tier available)
2. **GPT-4o-mini** (fallback — if Gemini fails)
3. **Demo Mode** (pattern-based — no API key needed)

The AI analyzes code for:
- SQL injection, XSS, hardcoded secrets
- Memory leaks, inefficient algorithms
- Code smells, naming violations
- Unused variables, complexity issues
- SOLID principle violations

---

## 📄 License

MIT License — Built for enterprise code quality assurance.
