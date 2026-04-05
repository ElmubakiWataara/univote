-- backend/src/config/schema.sql

-- Admins
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'superadmin')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Voters
CREATE TABLE IF NOT EXISTS voters (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    department VARCHAR(50),
    has_voted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tokens
CREATE TABLE IF NOT EXISTS tokens (
    id SERIAL PRIMARY KEY,
    voter_id INTEGER REFERENCES voters(id) ON DELETE CASCADE,
    token_value VARCHAR(64) UNIQUE NOT NULL,
    generated_by INTEGER REFERENCES admins(id) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Candidates
CREATE TABLE IF NOT EXISTS candidates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    bio TEXT,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Votes
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    voter_id INTEGER REFERENCES voters(id) ON DELETE SET NULL,
    candidate_id INTEGER REFERENCES candidates(id),
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    UNIQUE (voter_id)
);

-- Election Settings
CREATE TABLE IF NOT EXISTS election_settings (
    id SERIAL PRIMARY KEY,
    is_active BOOLEAN DEFAULT FALSE,
    allow_live_results BOOLEAN DEFAULT FALSE,
    updated_by INTEGER REFERENCES admins(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    actor_id INTEGER,
    actor_role VARCHAR(20),
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default election setting if not exists
INSERT INTO election_settings (is_active, allow_live_results)
VALUES (false, false)
ON CONFLICT DO NOTHING;