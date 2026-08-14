-- GoFoundry Platform Schema (PostgreSQL)
-- Run: psql $DATABASE_URL -f db/migrations/001_platform_schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'cohort')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS problems (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    track_id VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    algorithmic_specs JSONB NOT NULL DEFAULT '{}',
    runtime_invariants JSONB NOT NULL DEFAULT '{}',
    starter_code TEXT NOT NULL,
    solution_code TEXT NOT NULL,
    test_suite_code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS heat_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    problem_id VARCHAR(100) REFERENCES problems(id) ON DELETE CASCADE,
    hear_notes JSONB NOT NULL DEFAULT '{}',
    etch_diagram_json JSONB NOT NULL DEFAULT '{}',
    anchor_invariants JSONB NOT NULL DEFAULT '{}',
    temper_code TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'passed', 'failed', 'race_detected', 'alloc_violation', 'leak_detected')),
    bench_ns_per_op BIGINT,
    bench_allocs_per_op INT,
    bench_bytes_per_op BIGINT,
    diagnostic_events JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diagnostic_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    problem_id VARCHAR(100) REFERENCES problems(id) ON DELETE SET NULL,
    code TEXT NOT NULL,
    modes TEXT[] NOT NULL DEFAULT ARRAY['correctness'],
    status VARCHAR(20) NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'running', 'completed', 'failed')),
    events JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_heat_submissions_user ON heat_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_heat_submissions_problem ON heat_submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_jobs_status ON diagnostic_jobs(status);
