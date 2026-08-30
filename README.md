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

## Run locally (development)

1. Install dependencies:
   npm install
2. Start the app:
   npm run start

This runs both the backend API and the frontend together (Vite dev server with hot reload).

## Run in production

Build the frontend and serve it together with the API from a single Node process:

    npm run start:prod   # = npm run build && node server/index.mjs

or, if the build already exists:

    npm run serve

The production server serves the built `dist/` app and the `/api/*` endpoints on one port (`API_PORT`, default **8792**). Visit http://localhost:8792.

### Deploying

- **Single process (recommended):** point any Node host — Render, Railway, Fly.io, Heroku, or a VPS — at the repo with `npm run start:prod` as the start command.
- **Static host:** the frontend is fully static, so you can also deploy `dist/` to Netlify, Vercel, Cloudflare Pages, or GitHub Pages. Run the API separately only if you enable the optional live-AI features.
- **Configuration:** copy `.env.example` to `.env`. Everything works without a key; set `OPENAI_API_KEY` only for optional live AI question generation and grading.

## Making it ready for real candidates

The dashboard ships with four illustrative demo candidates in `src/data.ts`. To use it for real hiring, replace `roleBrief`, `requirements`, `candidates` (resumes, answers, and evidence) in `src/data.ts` with your real job description and candidates — the rubric math and scorecards compute automatically from the evidence you enter.

## Available scripts

- `npm run dev` — start the Vite frontend only
- `npm run api` — start the Node API server only
- `npm run build` — typecheck and build for production (`dist/`)
- `npm run serve` — serve the built app + API in one process
- `npm run start:prod` — build, then serve the app + API
- `npm run preview` — preview the built app with Vite

## URLs

- Frontend (dev): http://127.0.0.1:5175
- Production (frontend + API, single port): http://127.0.0.1:8792
- API (dev): http://127.0.0.1:8792
