import { useEffect, useMemo, useRef, useState } from 'react'
import {
  candidates as seedCandidates,
  requirements,
  rubric,
  oralQuestions,
  writtenTask,
  roleTitle,
  roleBrief,
  computeTotal,
  computeRoleEvidence,
  verdict,
  buildCandidateFromResume,
  type Candidate,
  type EvidenceLevel,
} from './data'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

type CandidateWithScores = Candidate & { roleEvidence: number; total: number; verdict: string }

function scored(list: Candidate[]): CandidateWithScores[] {
  return list.map((c) => ({
    ...c,
    roleEvidence: computeRoleEvidence(c.evidence),
    total: computeTotal(c),
    verdict: verdict(computeTotal(c)),
  }))
}

function displayVerdict(c: CandidateWithScores): string {
  return c.assessed ? c.verdict : 'Awaiting assessment'
}

function EvidenceBadge({ level }: { level: EvidenceLevel }) {
  const label = level === 'explicit' ? 'Explicit' : level === 'inferred' ? 'Inferred' : 'Missing'
  const symbol = level === 'explicit' ? '✓' : level === 'inferred' ? '~' : '—'
  return <span className={`evidence-badge ev-${level}`}>{symbol} {label}</span>
}

function VerdictBadge({ text }: { text: string }) {
  const tone =
    text.startsWith('Strong') ? 'vb-green'
    : text.startsWith('Hire') ? 'vb-mint'
    : text.startsWith('Promising') || text.startsWith('Awaiting') ? 'vb-gold'
    : 'vb-red'
  return <span className={`verdict-badge ${tone}`}>{text}</span>
}

function ScoreBar({ label, value, weight }: { label: string; value: number | null; weight: string }) {
  const v = value ?? 0
  return (
    <div className="dim-row">
      <div className="dim-head">
        <span>{label}</span>
        <span className="dim-weight">{weight}</span>
      </div>
      <div className="dim-track">
        <div className="dim-fill" style={{ width: `${v}%` }} />
      </div>
      <b className="dim-value">{value === null ? '—' : value}</b>
    </div>
  )
}

function Sidebar({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (t: string) => void }) {
  return (
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">✳</span><span>talent<span>loop</span></span></div>
      <div className="workspace-switcher"><span className="workspace-dot">N</span><span><b>Northstar Studio</b><small>Design team</small></span><span className="chevron">⌄</span></div>
      <nav>
        <p className="nav-label">Workspace</p>
        {['Overview', 'Candidates', 'Interviews', 'Scorecards'].map((item) => (
          <button key={item} className={activeTab === item ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab(item)}>
            <span className="nav-icon">{item === 'Overview' ? '◫' : item === 'Candidates' ? '♧' : item === 'Interviews' ? '◷' : '▤'}</span>{item}
          </button>
        ))}
        <p className="nav-label secondary-label">Manage</p>
        {['Roles', 'Team settings'].map((item) => (
          <button key={item} className="nav-item"><span className="nav-icon">{item === 'Roles' ? '▱' : '⚙'}</span>{item}</button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="help-row"><span className="help-icon">?</span><span>Help center</span><span className="shortcut">⌘ K</span></div>
        <div className="profile"><div className="avatar small-avatar">AL</div><span><b>Alex Liu</b><small>Recruiting lead</small></span><span className="chevron">⌄</span></div>
      </div>
    </aside>
  )
}

function Overview({ ranked }: { ranked: CandidateWithScores[] }) {
  const avg = Math.round(ranked.reduce((s, c) => s + c.total, 0) / ranked.length)
  const top = ranked[0]
  return (
    <div className="page-wrap">
      <section className="page-heading">
        <div>
          <div className="eyebrow">OPEN ROLE <span className="live-dot" /> Hiring</div>
          <h1>{roleTitle}</h1>
          <p>{ranked.length} candidates · Evaluated against role criteria + assessment rubric</p>
        </div>
        <div className="heading-actions"><button className="primary-button"><span>✦</span> Holistic evaluation ready</button></div>
      </section>

      <div className="stat-row">
        <div className="stat-card"><span>Applications</span><strong>24</strong><small className="up">↑ 18% <em>this week</em></small></div>
        <div className="stat-card"><span>Interviewed</span><strong>{ranked.filter((c) => c.assessed).length}</strong><small>of {ranked.length} shortlisted</small></div>
        <div className="stat-card"><span>Average score</span><strong>{avg}<span className="out-of">/100</span></strong><small>weighted rubric</small></div>
        <div className="stat-card accent-stat"><span>Top candidate</span><strong>{top.name}</strong><small>{top.total} · {displayVerdict(top)}</small></div>
      </div>

      <div className="overview-grid">
        <section className="panel">
          <div className="section-header"><div><h2>Role requirements</h2><p>Must-have vs. preferred — the baseline for resume parsing</p></div></div>
          <div className="req-columns">
            <div className="req-col">
              <span className="req-label">Must-have</span>
              {requirements.filter((r) => r.must).map((r) => <div className="req-item" key={r.id}><span className="req-check must">✓</span>{r.label}</div>)}
            </div>
            <div className="req-col">
              <span className="req-label">Preferred</span>
              {requirements.filter((r) => !r.must).map((r) => <div className="req-item" key={r.id}><span className="req-check pref">○</span>{r.label}</div>)}
            </div>
          </div>
          <p className="panel-note">Resume claims are marked <b>explicit</b>, <b>inferred</b>, or <b>missing</b>. Must-haves weigh 2× preferred in the role-evidence score.</p>
        </section>

        <section className="panel">
          <div className="section-header"><div><h2>Scoring rubric</h2><p>Weights total 100% — applied identically to every candidate</p></div></div>
          <div className="rubric-list">
            {Object.entries(rubric).map(([key, r]) => (
              <div className="rubric-card" key={key}>
                <div className="rubric-card-head"><b>{r.label}</b><span>{Math.round(r.weight * 100)}%</span></div>
                <p>{r.note}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="section-header"><div><h2>Ranked shortlist</h2><p>Holistic score = 40% role evidence · 30% problem solving · 20% communication · 10% collaboration</p></div></div>
        <div className="shortlist">
          {ranked.map((c, i) => (
            <div className={`shortlist-row ${i === 0 ? 'top' : ''}`} key={c.id}>
              <span className="rank">{i + 1}</span>
              <div className={`avatar ${c.accent}`}>{c.initials}</div>
              <div className="shortlist-info"><strong>{c.name}</strong><span>{c.match}</span></div>
              <VerdictBadge text={displayVerdict(c)} />
              <div className="score"><strong>{c.total}</strong><span>/100</span></div>
            </div>
          ))}
        </div>
        {top && (
          <div className="recommendation">
            <span className="recommendation-icon">✦</span>
            <div>
              <strong>Recommendation: {top.name}</strong>
              <p>{top.name} shows the clearest evidence of owning complex product problems end to end, with explicit systems and engineering-collaboration coverage and the strongest assessment answers. Final decision rests with the recruiter after follow-ups.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function CandidatesView({ ranked, selected, onSelect, onAdd }: { ranked: CandidateWithScores[]; selected: CandidateWithScores; onSelect: (id: string) => void; onAdd: () => void }) {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('All stages')
  const visible = ranked.filter((c) => {
    const text = `${c.name} ${roleTitle} ${c.match}`.toLowerCase()
    return text.includes(search.toLowerCase()) && (stageFilter === 'All stages' || c.stage === stageFilter)
  })
  return (
    <div className="page-wrap">
      <section className="page-heading">
        <div>
          <div className="eyebrow">OPEN ROLE <span className="live-dot" /> Hiring</div>
          <h1>{roleTitle}</h1>
          <p>{ranked.length} candidates · Ranked by holistic rubric score</p>
        </div>
        <div className="heading-actions"><button className="secondary-button" onClick={onAdd}>Export shortlist</button><button className="primary-button" onClick={onAdd}><span>+</span> Add candidates</button></div>
      </section>

      <div className="content-grid">
        <section className="candidate-section">
          <div className="section-header">
            <div><h2>Candidate pipeline</h2><p>Ranked by weighted rubric score</p></div>
            <div className="view-controls">
              <input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" aria-label="Search candidates" />
              <select className="filter-button" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
                <option>All stages</option><option>Interviewed</option><option>Ready to interview</option><option>New application</option>
              </select>
            </div>
          </div>
          <div className="candidate-list">
            {visible.map((c) => (
              <button className={selected.id === c.id ? 'candidate-row selected' : 'candidate-row'} key={c.id} onClick={() => onSelect(c.id)}>
                <div className={`avatar ${c.accent}`}>{c.initials}</div>
                <div className="candidate-info"><strong>{c.name}</strong><span>{roleTitle}</span></div>
                <div className="candidate-stage"><span className={`stage-dot ${c.stage === 'Interviewed' ? 'done' : ''}`} />{c.stage}</div>
                <div className="candidate-fit">{c.match}</div>
                <div className="score"><strong>{c.total}</strong><span>/100</span></div>
                <span className="row-arrow">→</span>
              </button>
            ))}
            {visible.length === 0 && <div className="empty-state">No candidates match.</div>}
          </div>
          <p className="panel-note">Scores are computed from resume evidence against the role requirements plus graded assessment answers — not from a recruiter's gut feel. Add a candidate to parse a real resume.</p>
        </section>

        <aside className="detail-panel">
          <div className="detail-header">
            <div><span className="eyebrow">CANDIDATE SCORECARD</span><h2>{selected.name}</h2><p>{roleTitle} · {selected.stage}</p></div>
            <VerdictBadge text={displayVerdict(selected)} />
          </div>
          <div className="profile-summary">
            <div className={`avatar large-avatar ${selected.accent}`}>{selected.initials}</div>
            <div><span className="match-label">HOLISTIC SCORE</span><strong>{selected.total}</strong><span className="out-of">/100</span><span className="match-copy">{selected.match}</span></div>
          </div>

          <div className="brief-section">
            <div className="brief-title"><h3>Resume highlights</h3><span>parsed</span></div>
            {selected.highlights.map((h) => <div className="question" key={h}><span className="question-number">◆</span><p>{h}</p></div>)}
          </div>

          <div className="brief-section">
            <div className="brief-title"><h3>Requirement evidence</h3><span>{selected.roleEvidence}/100</span></div>
            <div className="evidence-table">
              {selected.evidence.map((e) => {
                const req = requirements.find((r) => r.id === e.reqId)!
                return (
                  <div className="evidence-row" key={e.reqId}>
                    <div className="evidence-head"><span>{req.label}</span><EvidenceBadge level={e.level} /></div>
                    <p>{e.note}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="brief-section">
            <div className="brief-title"><h3>Rubric scores</h3><span>weighted</span></div>
            <div className="dim-list">
              <ScoreBar label="Role evidence" value={selected.roleEvidence} weight="40%" />
              <ScoreBar label="Problem solving" value={selected.assessed ? selected.dim.problemSolving : null} weight="30%" />
              <ScoreBar label="Communication" value={selected.assessed ? selected.dim.communication : null} weight="20%" />
              <ScoreBar label="Collaboration" value={selected.assessed ? selected.dim.collaboration : null} weight="10%" />
            </div>
            {!selected.assessed && <p className="pending-note">Assessment pending — run the interview and record answers to complete this scorecard.</p>}
          </div>

          <div className="brief-section">
            <div className="brief-title"><h3>Strengths</h3></div>
            {selected.strengths.map((s) => <div className="strength" key={s}><span>+</span>{s}</div>)}
          </div>
          <div className="brief-section">
            <div className="brief-title"><h3>Concerns</h3></div>
            {selected.concerns.map((s) => <div className="concern" key={s}><span>!</span>{s}</div>)}
          </div>
          <div className="brief-section">
            <div className="brief-title"><h3>Follow-ups</h3></div>
            {selected.followUps.map((s) => <div className="followup" key={s}><span>→</span>{s}</div>)}
          </div>
          <p className="privacy-note">Evaluation is job-related only. A human recruiter makes the final decision.</p>
        </aside>
      </div>
    </div>
  )
}

function localGrade(answer: string): number {
  const words = answer.trim().split(/\s+/).filter(Boolean).length
  const signals = ['decision', 'tradeoff', 'user', 'team', 'impact', 'learned'].filter((s) => answer.toLowerCase().includes(s)).length
  return Math.min(98, Math.max(42, 55 + Math.min(25, words) + signals * 3))
}

function LiveInterview() {
  const [provider, setProvider] = useState('Checking AI provider…')
  const [qIndex, setQIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<null | { score: number; feedback?: string; strengths?: string[]; concerns?: string[]; source: string }>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/api/status`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((s) => setProvider(s.provider === 'openai' ? `OpenAI live · ${s.model}` : 'Demo fallback · deterministic scoring'))
      .catch(() => setProvider('API offline · local fallback'))
  }, [])

  const q = oralQuestions[qIndex]

  const grade = async () => {
    if (!answer.trim()) return
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const response = await fetch(`${API_BASE}/api/interview/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer, roleBrief }),
      })
      if (!response.ok) throw new Error('bad status')
      const data = await response.json()
      if (typeof data.score !== 'number') throw new Error('bad payload')
      setResult({ ...data, source: data.source === 'openai' ? 'Graded by OpenAI' : 'Graded by demo logic' })
    } catch {
      const score = localGrade(answer)
      setResult({ score, feedback: score > 80 ? 'Clear, evidence-led response with strong ownership signals.' : 'Add a specific decision, tradeoff, and measurable outcome.', source: 'Graded locally (API unavailable)' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel">
      <div className="section-header">
        <div><h2>Live AI interview</h2><p>Ask the same questions to any candidate and grade the answer against the rubric</p></div>
        <span className="provider-chip">{provider}</span>
      </div>
      <div className="live-grid">
        <div className="live-q">
          <div className="chip-row">
            {oralQuestions.map((qq, i) => (
              <button key={qq.id} className={i === qIndex ? 'chip active' : 'chip'} onClick={() => { setQIndex(i); setResult(null); setAnswer('') }}>0{i + 1} · {qq.tag}</button>
            ))}
          </div>
          <div className="current-question"><span className="question-tag">{q.tag}</span><h3>{q.text}</h3></div>
          <textarea id="live-answer" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type or paste the candidate’s answer…" />
          <div className="interview-footer"><span>{answer.trim().split(/\s+/).filter(Boolean).length} words</span><button className="score-button" disabled={!answer.trim() || busy} onClick={grade}>{busy ? 'Grading…' : 'Grade answer'} <span>→</span></button></div>
          {error && <p className="recording-error">{error}</p>}
        </div>
        <div className="live-result">
          {result ? (
            <>
              <div className="score-result"><div><span className="eyebrow">ANSWER SCORE</span><strong>{result.score}<small>/100</small></strong></div><div><b>{result.score > 80 ? 'Clear, evidence-led response' : 'More detail needed'}</b><p>{result.feedback}</p></div></div>
              {result.strengths && result.strengths.length > 0 && <div className="ai-lists"><b>Strengths</b>{result.strengths.map((s) => <div className="strength" key={s}><span>+</span>{s}</div>)}</div>}
              {result.concerns && result.concerns.length > 0 && <div className="ai-lists"><b>Concerns</b>{result.concerns.map((s) => <div className="concern" key={s}><span>!</span>{s}</div>)}</div>}
              <p className="source-toast">✦ {result.source}</p>
            </>
          ) : (
            <div className="live-placeholder">
              <span className="eyebrow">SCORING RUBRIC</span>
              {Object.entries(rubric).map(([key, r]) => <div className="rubric-row" key={key}><span>{r.label}</span><b>{Math.round(r.weight * 100)}%</b></div>)}
              <p className="privacy-note">Grades are job-related only. A human recruiter makes the final decision.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function InterviewsView({ ranked }: { ranked: CandidateWithScores[] }) {
  const [selId, setSelId] = useState(ranked[0].id)
  const selected = ranked.find((c) => c.id === selId) ?? ranked[0]
  return (
    <div className="page-wrap">
      <section className="page-heading">
        <div>
          <div className="eyebrow">OPEN ROLE <span className="live-dot" /> Hiring</div>
          <h1>{roleTitle} · Assessment</h1>
          <p>Oral + written assessment, graded against the shared rubric</p>
        </div>
      </section>

      <div className="overview-grid">
        <section className="panel">
          <div className="section-header"><div><h2>Oral questions</h2><p>Open-ended — ask for a concrete example, actions, tradeoffs, and outcome</p></div></div>
          {oralQuestions.map((q, i) => (
            <div className="question-block" key={q.id}>
              <span className="question-number">0{i + 1}</span>
              <div>
                <span className="question-tag">{q.tag} · {q.competency}</span>
                <p className="question-text">{q.text}</p>
                <p className="expected"><b>Strong answer shows:</b> {q.expected}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="panel">
          <div className="section-header"><div><h2>Written assessment</h2><p>{writtenTask.constraints}</p></div></div>
          <div className="question-block">
            <span className="question-number">✎</span>
            <div>
              <span className="question-tag">Structured problem solving · Communication</span>
              <p className="question-text">{writtenTask.prompt}</p>
            </div>
          </div>
          <p className="panel-note">Graded on realistic goals, explicit risks and mitigations, and measurable success criteria.</p>
        </section>
      </div>

      <LiveInterview />

      <section className="panel">
        <div className="section-header">
          <div><h2>Graded responses</h2><p>Same questions and rubric for every candidate</p></div>
          <div className="chip-row">
            {ranked.map((c) => (
              <button key={c.id} className={c.id === selected.id ? 'chip active' : 'chip'} onClick={() => setSelId(c.id)}>
                <span className={`chip-dot ${c.accent}`} />{c.name} <b>{c.total}</b>
              </button>
            ))}
          </div>
        </div>

        <div className="grade-summary">
          <ScoreBar label="Role evidence" value={selected.roleEvidence} weight="40%" />
          <ScoreBar label="Problem solving" value={selected.assessed ? selected.dim.problemSolving : null} weight="30%" />
          <ScoreBar label="Communication" value={selected.assessed ? selected.dim.communication : null} weight="20%" />
          <ScoreBar label="Collaboration" value={selected.assessed ? selected.dim.collaboration : null} weight="10%" />
          <div className="grade-total"><VerdictBadge text={displayVerdict(selected)} /><strong>{selected.total}<span>/100</span></strong></div>
        </div>
        {!selected.assessed && <p className="pending-note">This candidate has not been assessed yet — only resume evidence is scored. Run the live interview above and record the answers.</p>}

        <div className="answer-list">
          {oralQuestions.map((q) => {
            const a = selected.oral.find((o) => o.questionId === q.id)
            return (
              <div className="answer-card" key={q.id}>
                <div className="answer-q"><span className="question-tag">{q.tag}</span><p>{q.text}</p></div>
                {a ? (
                  <>
                    <div className="answer-a"><b>Answer</b><p>{a.answer}</p></div>
                    <div className="answer-note"><b>Grader note</b><p>{a.note}</p></div>
                  </>
                ) : (
                  <div className="answer-a"><b>Answer</b><p className="pending-text">Not yet assessed.</p></div>
                )}
              </div>
            )
          })}
          <div className="answer-card written-card">
            <div className="answer-q"><span className="question-tag">Written assessment</span><p>{writtenTask.prompt}</p></div>
            {selected.written ? (
              <div className="answer-a"><b>Response</b><p>{selected.written}</p></div>
            ) : (
              <div className="answer-a"><b>Response</b><p className="pending-text">Not yet submitted.</p></div>
            )}
          </div>
        </div>
        <p className="privacy-note">Answers were evaluated only against the job-related rubric. A human recruiter makes the final decision.</p>
      </section>
    </div>
  )
}

function ScorecardsView({ ranked }: { ranked: CandidateWithScores[] }) {
  return (
    <div className="page-wrap">
      <section className="page-heading">
        <div>
          <div className="eyebrow">OPEN ROLE <span className="live-dot" /> Hiring</div>
          <h1>{roleTitle} · Scorecards</h1>
          <p>Holistic comparison across resume, criteria satisfaction, and assessment scores</p>
        </div>
      </section>

      <section className="panel">
        <div className="section-header"><div><h2>Scorecard matrix</h2><p>40% role evidence · 30% problem solving · 20% communication · 10% collaboration</p></div></div>
        <div className="table-wrap">
          <table className="scorecard-table">
            <thead>
              <tr><th>#</th><th>Candidate</th><th>Role evidence</th><th>Problem solving</th><th>Communication</th><th>Collaboration</th><th>Total</th><th>Verdict</th></tr>
            </thead>
            <tbody>
              {ranked.map((c, i) => (
                <tr key={c.id} className={i === 0 ? 'top' : ''}>
                  <td className="rank">{i + 1}</td>
                  <td><div className="table-name"><div className={`avatar ${c.accent}`}>{c.initials}</div><span>{c.name}</span></div></td>
                  <td>{c.roleEvidence}</td>
                  <td>{c.assessed ? c.dim.problemSolving : '—'}</td>
                  <td>{c.assessed ? c.dim.communication : '—'}</td>
                  <td>{c.assessed ? c.dim.collaboration : '—'}</td>
                  <td><b className="total-cell">{c.total}</b></td>
                  <td><VerdictBadge text={displayVerdict(c)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="panel-note">Unassessed candidates show a resume-only score until their oral + written answers are graded.</p>
      </section>

      <section className="panel">
        <div className="section-header"><div><h2>Shortlist recommendation</h2><p>Evidence-based, for recruiter review</p></div></div>
        <div className="rec-list">
          {ranked.map((c, i) => (
            <div className="rec-row" key={c.id}>
              <span className="rank">{i + 1}</span>
              <div className="rec-body">
                <div className="rec-head"><strong>{c.name}</strong><VerdictBadge text={displayVerdict(c)} /><span className="rec-score">{c.total}/100</span></div>
                <p>{c.match}. Role evidence {c.roleEvidence}/100 — {c.strengths[0].toLowerCase()}.</p>
                <p className="rec-followup"><b>Follow-up:</b> {c.followUps[0]}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="review-note-card">
          <b>Human review required</b>
          <p>These scores are decision support, not a hiring decision. {ranked[0].name} leads on every rubric dimension, but confirm the leadership follow-up and the two hiring-manager checks before proceeding. The recruiter makes the final call.</p>
        </div>
      </section>
    </div>
  )
}

function AddCandidateModal({ onClose, onAdd }: { onClose: () => void; onAdd: (c: Candidate) => void }) {
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const readFile = async (file?: File) => {
    if (!file) return
    try {
      const t = await file.text()
      setText(t)
      setErr('')
    } catch {
      setErr('Could not read that file — paste the text instead.')
    }
  }

  const submit = () => {
    if (!name.trim()) return setErr('Add the candidate’s name.')
    if (text.trim().length < 40) return setErr('Paste the full resume text (or upload a .txt file).')
    onAdd(buildCandidateFromResume(name, text))
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <div><span className="eyebrow">ADD CANDIDATE</span><h2>New candidate</h2></div>
          <button className="more-button" onClick={onClose}>×</button>
        </div>
        <p className="modal-hint">Paste the resume text (or upload a .txt / .md file). The intake parser marks each requirement explicit / inferred / missing and computes a role-evidence score.</p>
        <label className="answer-label" htmlFor="cand-name">Candidate name</label>
        <input id="cand-name" className="name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Taylor Kim" />
        <label className="answer-label" htmlFor="cand-resume">Resume text</label>
        <textarea id="cand-resume" className="resume-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the resume here…" />
        <input ref={fileRef} className="file-input" type="file" accept=".txt,.md" onChange={(e) => readFile(e.target.files?.[0])} />
        <div className="modal-actions">
          <button className="text-button" onClick={() => fileRef.current?.click()}>↑ Upload .txt / .md</button>
          <div className="modal-actions-right">
            <button className="text-button" onClick={onClose}>Cancel</button>
            <button className="primary-button" onClick={submit}>Add & parse →</button>
          </div>
        </div>
        {err && <p className="recording-error">{err}</p>}
        <p className="privacy-note">PDF / DOCX aren’t parsed in-browser — paste the text instead. Data stays in this session only.</p>
      </div>
    </div>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [candidates, setCandidates] = useState<Candidate[]>(seedCandidates)
  const ranked = useMemo(() => scored(candidates), [candidates])
  const [selectedId, setSelectedId] = useState(ranked[0].id)
  const selected = ranked.find((c) => c.id === selectedId) ?? ranked[0]
  const [showAdd, setShowAdd] = useState(false)

  const addCandidate = (c: Candidate) => {
    setCandidates((prev) => [c, ...prev])
    setSelectedId(c.id)
  }

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Candidates <span>/</span> Product design <span>/</span> {activeTab}</div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Notifications">♢<i /></button>
            <button className="share-button">Share role <span>↗</span></button>
          </div>
        </header>
        {activeTab === 'Overview' && <Overview ranked={ranked} />}
        {activeTab === 'Candidates' && <CandidatesView ranked={ranked} selected={selected} onSelect={setSelectedId} onAdd={() => setShowAdd(true)} />}
        {activeTab === 'Interviews' && <InterviewsView ranked={ranked} />}
        {activeTab === 'Scorecards' && <ScorecardsView ranked={ranked} />}
        {showAdd && <AddCandidateModal onClose={() => setShowAdd(false)} onAdd={addCandidate} />}
      </main>
    </div>
  )
}

export default App
