import { useEffect, useRef, useState } from 'react'

type Candidate = {
  id: number
  name: string
  role: string
  initials: string
  accent: string
  score: number
  stage: string
  time: string
  match: string
}

const candidates: Candidate[] = [
  { id: 1, name: 'Maya Chen', role: 'Senior Product Designer', initials: 'MC', accent: 'coral', score: 94, stage: 'Interviewed', time: 'Today, 10:42 AM', match: 'Strong craft + systems thinking' },
  { id: 2, name: 'Jordan Ellis', role: 'Senior Product Designer', initials: 'JE', accent: 'gold', score: 88, stage: 'Interviewed', time: 'Yesterday, 4:18 PM', match: 'Excellent product intuition' },
  { id: 3, name: 'Ari Patel', role: 'Senior Product Designer', initials: 'AP', accent: 'blue', score: 81, stage: 'Ready to interview', time: 'Yesterday, 1:06 PM', match: 'Strong visual execution' },
  { id: 4, name: 'Sofia Rodriguez', role: 'Senior Product Designer', initials: 'SR', accent: 'green', score: 76, stage: 'New application', time: 'Mon, 9:14 AM', match: 'Good domain experience' },
]

const questions = [
  { tag: 'Craft', text: 'Walk me through a product decision you changed your mind about. What changed it?' },
  { tag: 'Systems', text: 'How do you create a design system that stays useful as a product grows?' },
  { tag: 'Collaboration', text: 'Tell me about a time you brought engineering into the design process early.' },
]

const defaultRoleBrief = 'We are looking for a senior product designer who can lead complex, user-centered work from discovery through launch. Strong systems thinking, product judgment, and close collaboration with engineering are essential.'
const API_PORT = Number(import.meta.env.VITE_API_PORT || 8792)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:${API_PORT}`

function App() {
  const [activeTab, setActiveTab] = useState('Candidates')
  const [selectedId, setSelectedId] = useState(1)
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [recording, setRecording] = useState(false)
  const [answer, setAnswer] = useState('')
  const [answerScore, setAnswerScore] = useState<number | null>(null)
  const [recordingError, setRecordingError] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [roleBrief, setRoleBrief] = useState(defaultRoleBrief)
  const [briefOpen, setBriefOpen] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState(questions)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('All stages')
  const [consent, setConsent] = useState(false)
  const [notes, setNotes] = useState('')
  const [aiMode, setAiMode] = useState('Checking AI...')
  const [resultSource, setResultSource] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? candidates[0]
  const visibleCandidates = candidates.filter((candidate) => {
    const text = `${candidate.name} ${candidate.role} ${candidate.match}`.toLowerCase()
    return text.includes(search.toLowerCase()) && (stageFilter === 'All stages' || candidate.stage === stageFilter)
  })

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/status`).then(async (response) => {
      if (response.ok) return response.json()
      throw new Error('status endpoint unavailable')
    }).then((status) => setAiMode(status.provider === 'openai' ? `OpenAI live · ${status.model}` : 'Demo fallback · no API key')).catch(() => fetch(`${API_BASE_URL}/api/interview/questions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roleBrief: 'status check' }) }).then((response) => { if (!response.ok) throw new Error('api unavailable'); setAiMode('API online · restart API to detect provider') }).catch(() => setAiMode('API offline · local fallback')))
  }, [])

  const handleResume = (file?: File) => {
    if (!file) return
    setUploaded(true)
  }

  const scoreAnswer = async () => {
    setAiBusy(true)
    setAiError('')
    const answerLength = answer.trim().split(/\s+/).filter(Boolean).length
    const signalCount = ['decision', 'tradeoff', 'user', 'team', 'impact', 'learned'].filter((signal) => answer.toLowerCase().includes(signal)).length
    try {
      const response = await fetch(`${API_BASE_URL}/api/interview/score`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answer, roleBrief }) })
      if (!response.ok) throw new Error('AI scoring request failed')
      const result = await response.json()
      if (typeof result.score !== 'number') throw new Error('AI scoring response was invalid')
      setAnswerScore(result.score)
      setResultSource(result.source === 'openai' ? 'Graded by OpenAI' : 'Graded by local demo logic')
    } catch {
      setAnswerScore(Math.min(98, Math.max(42, 55 + Math.min(25, answerLength) + signalCount * 3)))
      setResultSource('Graded by local demo logic')
      setAiError('AI grading was unavailable, so local demo scoring was used.')
    } finally {
      setAiBusy(false)
    }
  }

  const toggleRecording = async () => {
    setRecordingError('')
    if (recording && mediaRecorder.current) {
      mediaRecorder.current.stop()
      setRecording(false)
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setRecordingError('Microphone access is not supported in this browser.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunks.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (event) => audioChunks.current.push(event.data)
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        setAudioUrl(URL.createObjectURL(new Blob(audioChunks.current, { type: 'audio/webm' })))
      }
      mediaRecorder.current = recorder
      recorder.start()
      setRecording(true)
    } catch {
      setRecordingError('Microphone permission was not granted. You can still paste a transcript below.')
    }
  }

  const regenerateQuestions = async () => {
    setAiBusy(true)
    setAiError('')
    const brief = roleBrief.toLowerCase()
    const nextQuestions = [
      { tag: 'Role fit', text: `What is the strongest example from your experience that demonstrates ${brief.includes('user') ? 'user-centered product thinking' : 'your ability to lead this role'}?` },
      { tag: brief.includes('system') ? 'Systems' : 'Execution', text: brief.includes('system') ? 'Tell me about a system or process you created that helped a product scale.' : 'Walk me through how you take a complex problem from ambiguity to a shipped outcome.' },
      { tag: 'Collaboration', text: brief.includes('engineering') ? 'How do you bring engineering partners into decisions early while protecting the quality of the experience?' : 'Tell me about a difficult stakeholder conversation and how you moved the work forward.' },
    ]
    try {
      const response = await fetch(`${API_BASE_URL}/api/interview/questions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roleBrief }) })
      if (!response.ok) throw new Error('AI questions request failed')
      const result = await response.json()
      if (!Array.isArray(result.questions) || result.questions.length === 0) throw new Error('AI questions response was invalid')
      setGeneratedQuestions(result.questions)
      setResultSource(result.source === 'openai' ? 'Questions generated by OpenAI' : 'Questions generated by local demo logic')
    } catch {
      setGeneratedQuestions(nextQuestions)
      setResultSource('Questions generated by local demo logic')
      setAiError('AI questions were unavailable, so local demo questions were used.')
    }
    setAiBusy(false)
    setBriefOpen(false)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">✳</span><span>talent<span>loop</span></span></div>
        <div className="workspace-switcher"><span className="workspace-dot">N</span><span><b>Northstar Studio</b><small>Design team</small></span><span className="chevron">⌄</span></div>
        <nav>
          <p className="nav-label">Workspace</p>
          {['Overview', 'Candidates', 'Interviews', 'Scorecards'].map((item) => <button key={item} className={activeTab === item ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab(item)}><span className="nav-icon">{item === 'Overview' ? '◫' : item === 'Candidates' ? '♧' : item === 'Interviews' ? '◷' : '▤'}</span>{item}{item === 'Candidates' && <span className="nav-count">24</span>}</button>)}
          <p className="nav-label secondary-label">Manage</p>
          {['Roles', 'Team settings'].map((item) => <button key={item} className="nav-item"><span className="nav-icon">{item === 'Roles' ? '▱' : '⚙'}</span>{item}</button>)}
        </nav>
        <div className="sidebar-bottom"><div className="help-row"><span className="help-icon">?</span><span>Help center</span><span className="shortcut">⌘ K</span></div><div className="profile"><div className="avatar small-avatar">AL</div><span><b>Alex Liu</b><small>Recruiting lead</small></span><span className="chevron">⌄</span></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumb">Candidates <span>/</span> Product design</div><div className="top-actions"><button className="icon-button" aria-label="Notifications">♢<i /></button><button className="share-button">Share role <span>↗</span></button></div></header>
        <div className="page-wrap">
          <section className="page-heading"><div><div className="eyebrow">OPEN ROLE <span className="live-dot" /> Hiring</div><h1>Senior Product Designer</h1><p>24 candidates · Updated 12 minutes ago</p></div><div className="heading-actions"><button className="secondary-button" onClick={() => setBriefOpen(true)}>Edit role brief</button><input ref={fileInput} className="file-input" type="file" accept=".pdf,.doc,.docx" onChange={(event) => handleResume(event.target.files?.[0])} /><button className="primary-button" onClick={() => fileInput.current?.click()}><span>+</span> Add candidates</button></div></section>
            <p>Current AI Provider Mode: {aiMode}</p>
          {briefOpen && <div className="role-brief"><div><span className="eyebrow">ROLE BRIEF</span><h2>What should the AI look for?</h2><p>Use clear skills and responsibilities to make every question relevant.</p></div><textarea aria-label="Role brief" value={roleBrief} onChange={(event) => setRoleBrief(event.target.value)} /><div className="brief-actions"><button className="text-button" onClick={() => setBriefOpen(false)}>Cancel</button><button className="primary-button" onClick={regenerateQuestions}>Regenerate questions <span>→</span></button></div></div>}
          <div className="stat-row"><div className="stat-card"><span>Applications</span><strong>24</strong><small className="up">↑ 18% <em>this week</em></small></div><div className="stat-card"><span>Interviewed</span><strong>8</strong><small>of 24 candidates</small></div><div className="stat-card"><span>Average score</span><strong>84<span className="out-of">/100</span></strong><small className="up">↑ 6 pts <em>vs. last role</em></small></div><div className="stat-card accent-stat"><span>Top candidate</span><strong>Maya Chen</strong><small>94 score · Strong hire</small></div></div>
          {uploaded && <div className="upload-toast"><span>✓</span> Resume received. AI intake will extract experience, skills, and role signals.</div>}
          <div className="review-bar"><label className="consent-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />Audio consent confirmed</label><label className="notes-inline" htmlFor="notes">Recruiter note</label><input id="notes" className="notes-input" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Private note about this hiring round..." /></div>
          {resultSource && <div className="source-toast">✦ {resultSource}</div>}
          {aiError && <div className="ai-error">{aiError}</div>}
          <div className="content-grid">
            <section className="candidate-section"><div className="section-header"><div><h2>Candidate pipeline</h2><p>Ranked by interview score and role fit</p></div><div className="view-controls"><input className="search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" aria-label="Search candidates" /><select className="filter-button" value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}><option>All stages</option><option>Interviewed</option><option>Ready to interview</option><option>New application</option></select><button className="filter-button">Newest <span>⌄</span></button></div></div><div className="candidate-list">{visibleCandidates.map((candidate) => <button className={selected.id === candidate.id ? 'candidate-row selected' : 'candidate-row'} key={candidate.id} onClick={() => { setSelectedId(candidate.id); setInterviewStarted(false) }}><div className={`avatar ${candidate.accent}`}>{candidate.initials}</div><div className="candidate-info"><strong>{candidate.name}</strong><span>{candidate.role}</span></div><div className="candidate-stage"><span className={`stage-dot ${candidate.stage === 'Interviewed' ? 'done' : ''}`} />{candidate.stage}</div><div className="candidate-fit">{candidate.match}</div><div className="score"><strong>{candidate.score}</strong><span>/100</span></div><span className="row-arrow">→</span></button>)}{visibleCandidates.length === 0 && <div className="empty-state">No candidates match.</div>}</div><button className="load-more">Show 20 more candidates <span>↓</span></button></section>
            <aside className="detail-panel">{!interviewStarted ? <><div className="detail-header"><div><span className="eyebrow">AI INTERVIEW BRIEF</span><h2>{selected.name}</h2><p>{selected.role}</p></div><button className="more-button">•••</button></div><div className="profile-summary"><div className={`avatar large-avatar ${selected.accent}`}>{selected.initials}</div><div><span className="match-label">ROLE MATCH</span><strong>{selected.score}%</strong><span className="match-copy">{selected.match}</span></div></div>{selected.id === 1 && <div className="recommendation"><span className="recommendation-icon">✦</span><div><strong>Strong hire signal</strong><p>Maya shows the clearest evidence of owning complex product problems end to end.</p></div></div>}<div className="brief-section"><div className="brief-title"><h3>Targeted questions</h3><span>3 questions</span></div>{generatedQuestions.map((question, index) => <div className="question" key={question.tag}><span className="question-number">0{index + 1}</span><div><span className="question-tag">{question.tag}</span><p>{question.text}</p></div></div>)}</div><div className="rubric"><div className="brief-title"><h3>Scoring rubric</h3><span>100 pts</span></div><div className="rubric-row"><span>Role evidence</span><b>40%</b></div><div className="rubric-row"><span>Problem solving</span><b>30%</b></div><div className="rubric-row"><span>Communication</span><b>20%</b></div><div className="rubric-row"><span>Collaboration</span><b>10%</b></div></div><button className="primary-button interview-button" onClick={() => setInterviewStarted(true)}><span>◉</span>Start AI interview<span className="button-arrow">→</span></button><p className="privacy-note">Candidate answers are recorded and scored against the role rubric.</p></> : <div className="interview-view"><div className="detail-header"><div><span className="eyebrow">LIVE AI INTERVIEW</span><h2>{selected.name}</h2><p>Question 1 of 3 · {generatedQuestions[0].tag}</p></div><button className="more-button" onClick={() => setInterviewStarted(false)}>×</button></div><div className="recording-card"><div className={recording ? 'pulse recording' : 'pulse'} /><div><strong>{recording ? 'Listening for an answer' : 'Ready when you are'}</strong><p>{recording ? 'Speak naturally. The transcript will appear below.' : 'The candidate can answer by voice or text.'}</p></div><button className={recording ? 'record-button active' : 'record-button'} onClick={toggleRecording}>{recording ? '■ Stop' : '● Record'}</button></div>{recordingError && <p className="recording-error">{recordingError}</p>}{audioUrl && <audio className="audio-preview" controls src={audioUrl} />}<div className="current-question"><span className="question-tag">{generatedQuestions[0].tag}</span><h3>{generatedQuestions[0].text}</h3></div><label className="answer-label" htmlFor="answer">Answer transcript</label><textarea id="answer" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type a transcript or paste an answer here..." /><div className="interview-footer"><span>{answer.trim().split(/\s+/).filter(Boolean).length} words</span><button className="score-button" disabled={!answer.trim()} onClick={scoreAnswer}>Score answer <span>→</span></button></div>{answerScore !== null && <div className="score-result"><div><span className="eyebrow">AI ANSWER SCORE</span><strong>{answerScore}<small>/100</small></strong></div><div><b>{answerScore > 80 ? 'Clear, evidence-led response' : 'More detail needed'}</b><p>{answerScore > 80 ? 'Strong signals across ownership, collaboration, and impact.' : 'Add a specific decision, tradeoff, and measurable outcome.'}</p></div></div>}<p className="review-note">AI suggestions support a structured review. A human recruiter makes the final decision.</p></div>}</aside>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
