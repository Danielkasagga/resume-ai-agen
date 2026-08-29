# TalentLoop

TalentLoop is a recruiting dashboard for AI-assisted interview workflows. It combines a recruiter-friendly candidate pipeline with AI-generated interview questions and scoring.

## Features

- Candidate pipeline with search and stage filters
- Adjustable role brief for interview relevance
- AI-generated interview questions
- Candidate answer scoring with OpenAI or local demo fallback
- Audio consent and recruiter notes
- Local API backend for interview logic

## Run locally

1. Copy `.env.example` to `.env` and add your OpenAI key if desired.
2. Install dependencies:
   npm install
3. Start the app:
   npm run start

This runs both the backend API and frontend together.

## Available scripts

- `npm run dev` — start the Vite frontend only
- `npm run api` — start the Node API server only
- `npm run build` — build for production
- `npm run preview` — preview the built app

## URLs

- Frontend: http://127.0.0.1:5175
- API: http://127.0.0.1:8792
