import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config({ path: new URL('../.env', import.meta.url) })

const port = Number(process.env.API_PORT || 8792)
const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const rubric = { roleEvidence: 40, problemSolving: 30, communication: 20, collaboration: 10 }
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

function json(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  })
  response.end(JSON.stringify(body))
}

function makeQuestions(roleBrief, resumeText = '') {
  const context = `${roleBrief} ${resumeText}`.toLowerCase()
  return [
    { tag: 'Role fit', text: `What is the strongest example from your experience that demonstrates ${context.includes('user') ? 'user-centered product thinking' : 'your ability to lead this role'}?` },
    { tag: context.includes('system') ? 'Systems' : 'Execution', text: context.includes('system') ? 'Tell me about a system or process you created that helped a product scale.' : 'Walk me through how you take a complex problem from ambiguity to a shipped outcome.' },
    { tag: 'Collaboration', text: context.includes('engineering') ? 'How do you bring engineering partners into decisions early while protecting the quality of the experience?' : 'Tell me about a difficult stakeholder conversation and how you moved the work forward.' },
  ]
}

function parseModelJson(text) {
  const cleanText = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(cleanText)
}

async function generateQuestions(roleBrief, resumeText = '') {
  if (!openai) return { questions: makeQuestions(roleBrief, resumeText), source: 'local-fallback' }
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    input: `Create exactly three fair, job-related interview questions from this role brief and resume. Do not infer or use protected characteristics. Return only JSON with a questions array containing tag and text fields.\n\nRole brief:\n${roleBrief}\n\nResume:\n${resumeText}`,
  })
  return { ...parseModelJson(response.output_text), source: 'openai' }
}

function scoreAnswer(answer = '') {
  const words = answer.trim().split(/\s+/).filter(Boolean).length
  const signals = ['decision', 'tradeoff', 'user', 'team', 'impact', 'learned'].filter((signal) => answer.toLowerCase().includes(signal)).length
  const score = Math.min(98, Math.max(42, 55 + Math.min(25, words) + signals * 3))
  return { score, rubric, feedback: score > 80 ? 'Clear, evidence-led response with strong ownership signals.' : 'Add a specific decision, tradeoff, and measurable outcome.' }
}

async function gradeAnswer(answer, roleBrief) {
  if (!openai) return { ...scoreAnswer(answer), source: 'local-fallback' }
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    input: `Grade this interview answer only against the job-related rubric below. Ignore protected characteristics and do not make an automatic hiring decision. Return only JSON with score (0-100), feedback, strengths array, and concerns array.\n\nRubric: Role evidence 40%, problem solving 30%, communication 20%, collaboration 10%.\\nRole brief:\n${roleBrief}\nAnswer:\n${answer}`,
  })
  return { ...parseModelJson(response.output_text), rubric, source: 'openai' }
}

// Serves the built frontend (dist/) with an SPA fallback to index.html.
async function serveStatic(request, response) {
  if (!existsSync(distDir)) {
    return json(response, 404, { error: 'No production build found. Run `npm run build` first.' })
  }
  let pathname
  try {
    pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname)
  } catch {
    return json(response, 400, { error: 'Malformed request path.' })
  }
  let filePath = normalize(join(distDir, pathname))
  if (!filePath.startsWith(distDir)) {
    return json(response, 403, { error: 'Forbidden.' })
  }
  try {
    const info = await stat(filePath)
    if (info.isDirectory()) filePath = join(filePath, 'index.html')
  } catch {
    filePath = join(distDir, 'index.html')
  }
  try {
    const content = await readFile(filePath)
    response.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' })
    response.end(content)
  } catch {
    json(response, 404, { error: 'Not found.' })
  }
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return json(response, 204, {})
  const path = new URL(request.url || '/', 'http://localhost').pathname

  if (request.method === 'GET' && path === '/api/status') {
    return json(response, 200, {
      provider: openai ? 'openai' : 'local-fallback',
      model: openai ? (process.env.OPENAI_MODEL || 'gpt-4.1-mini') : 'deterministic demo logic',
    })
  }

  if (path === '/api/interview/questions' || path === '/api/interview/score') {
    if (request.method !== 'POST') {
      return json(response, 405, { error: 'Use POST /api/interview/questions or /api/interview/score.' })
    }
    let body = ''
    for await (const chunk of request) body += chunk
    try {
      const data = JSON.parse(body)
      if (path === '/api/interview/questions') return json(response, 200, await generateQuestions(data.roleBrief, data.resumeText))
      return json(response, 200, await gradeAnswer(data.answer, data.roleBrief))
    } catch (error) {
      const message = error instanceof SyntaxError ? 'Request body must be valid JSON.' : 'AI provider request failed. Check the API key, model access, and billing status.'
      return json(response, error instanceof SyntaxError ? 400 : 502, { error: message })
    }
  }

  if (request.method === 'GET') return serveStatic(request, response)
  return json(response, 404, { error: 'Not found.' })
})

server.listen(port, '0.0.0.0', () => console.log(`TalentLoop listening on http://0.0.0.0:${port} (frontend + API)`))
