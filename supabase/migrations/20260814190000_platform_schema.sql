-- Supabase migration: platform schema + waitlist
-- Run via Supabase SQL editor or: supabase db push

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Waitlist (existing)
CREATE TABLE IF NOT EXISTS gofoundry_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    tier TEXT,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gofoundry_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON gofoundry_waitlist
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow service role all" ON gofoundry_waitlist
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Platform tables
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

-- RLS: service role only for platform tables (app uses DATABASE_URL with service role)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE heat_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_users" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_problems" ON problems FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_heat" ON heat_submissions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_jobs" ON diagnostic_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public read for problems catalog
CREATE POLICY "anon_read_problems" ON problems FOR SELECT TO anon USING (true);
