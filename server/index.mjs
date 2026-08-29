import { createServer } from 'node:http'
import dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config({ path: new URL('../.env', import.meta.url) })
const port = Number(process.env.API_PORT || 8787)
const rubric = { roleEvidence: 40, problemSolving: 30, communication: 20, collaboration: 10 }
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

function json(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' })
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
    input: `Grade this interview answer only against the job-related rubric below. Ignore protected characteristics and do not make an automatic hiring decision. Return only JSON with score (0-100), feedback, strengths array, and concerns array.\n\nRubric: Role evidence 40%, problem solving 30%, communication 20%, collaboration 10%.\nRole brief:\n${roleBrief}\nAnswer:\n${answer}`,
  })
  return { ...parseModelJson(response.output_text), rubric, source: 'openai' }
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return json(response, 204, {})
  const path = new URL(request.url || '/', 'http://localhost').pathname
  if (request.method === 'GET' && path === '/api/status') return json(response, 200, { provider: openai ? 'openai' : 'local-fallback', model: openai ? (process.env.OPENAI_MODEL || 'gpt-4.1-mini') : 'deterministic demo logic' })
  if (request.method !== 'POST') return json(response, 404, { error: 'Use POST /api/interview/questions or /api/interview/score.' })
  let body = ''
  for await (const chunk of request) body += chunk
  try {
    const data = JSON.parse(body)
    if (path === '/api/interview/questions') return json(response, 200, await generateQuestions(data.roleBrief, data.resumeText))
    if (path === '/api/interview/score') return json(response, 200, await gradeAnswer(data.answer, data.roleBrief))
    return json(response, 404, { error: 'Route not found.' })
  } catch (error) {
    const message = error instanceof SyntaxError ? 'Request body must be valid JSON.' : 'AI provider request failed. Check the API key, model access, and billing status.'
    return json(response, error instanceof SyntaxError ? 400 : 502, { error: message })
  }
})

server.listen(port, '0.0.0.0', () => console.log(`TalentLoop API listening on http://0.0.0.0:${port}`))
