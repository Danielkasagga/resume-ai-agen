# TalentLoop

TalentLoop is a recruiting dashboard that turns a job description and candidate resumes into a fair, objective, end-to-end hiring assessment: resume parsing against role criteria, written + oral assessment questions, a weighted marking rubric, graded candidate scorecards, and a ranked shortlist for recruiter review.

## How the evaluation works

1. **Role requirements** — must-have vs. preferred criteria are defined up front (must-haves weigh 2× preferred).
2. **Resume parsing** — every resume claim is marked `explicit`, `inferred`, or `missing` against each requirement, producing a 0–100 *role evidence* score.
3. **Assessment** — three open-ended oral questions plus one written task, each with a competency tag and the evidence a strong answer must show.
4. **Objective rubric** — a single rubric is applied to every candidate: **Role evidence 40% · Problem solving 30% · Communication 20% · Collaboration 10%**.
5. **Scorecards & shortlist** — per-candidate evidence, dimension scores, strengths, concerns, and follow-ups feed a ranked recommendation. The final decision always stays with a human recruiter.

## Views

- **Overview** — role requirements, the weighted rubric, and the ranked shortlist.
- **Candidates** — the pipeline with search/stage filters and a full per-candidate scorecard (resume highlights, requirement evidence, rubric scores, strengths, concerns, follow-ups).
- **Interviews** — the assessment questions and each candidate's graded oral + written responses.
- **Scorecards** — a side-by-side matrix and the evidence-based shortlist recommendation.

All demo data (role brief, four candidate resumes, answers, and grades) lives in `src/data.ts`; scores are computed deterministically from the evidence table, not hard-coded.

## Run locally

1. Install dependencies:
   npm install
2. Start the app:
   npm run start

This runs both the backend API and the frontend together. The dashboard UI is fully self-contained; the API server (`server/index.mjs`) additionally exposes OpenAI-backed question generation and answer grading when an `OPENAI_API_KEY` is set (otherwise it falls back to deterministic demo logic).

## Available scripts

- `npm run dev` — start the Vite frontend only
- `npm run api` — start the Node API server only
- `npm run build` — typecheck and build for production
- `npm run preview` — preview the built app

## URLs

- Frontend: http://127.0.0.1:5175
- API: http://127.0.0.1:8792
