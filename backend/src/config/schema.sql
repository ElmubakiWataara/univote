CREATE TABLE IF NOT EXISTS public.admins
(
    id serial NOT NULL,
    username character varying(50) COLLATE pg_catalog."default" NOT NULL,
    password_hash text COLLATE pg_catalog."default" NOT NULL,
    role character varying(20) COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT admins_pkey PRIMARY KEY (id),
    CONSTRAINT admins_username_key UNIQUE (username)
);

CREATE TABLE IF NOT EXISTS public.audit_logs
(
    id serial NOT NULL,
    action character varying(50) COLLATE pg_catalog."default" NOT NULL,
    actor_id integer,
    actor_role character varying(20) COLLATE pg_catalog."default",
    details jsonb,
    ip_address inet,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.candidates
(
    id serial NOT NULL,
    name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    "position" character varying(100) COLLATE pg_catalog."default" NOT NULL,
    bio text COLLATE pg_catalog."default",
    photo_url text COLLATE pg_catalog."default",
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    yes_or_no text COLLATE pg_catalog."default",
    CONSTRAINT candidates_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.election_settings
(
    id serial NOT NULL,
    is_active boolean DEFAULT false,
    updated_by integer,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    title character varying(255) COLLATE pg_catalog."default",
    logo_url text COLLATE pg_catalog."default",
    academic_year character varying(50) COLLATE pg_catalog."default",
    description text COLLATE pg_catalog."default",
    CONSTRAINT election_settings_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.tokens
(
    id serial NOT NULL,
    voter_id integer,
    token_value character varying(64) COLLATE pg_catalog."default" NOT NULL,
    generated_by integer NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tokens_pkey PRIMARY KEY (id),
    CONSTRAINT tokens_token_value_key UNIQUE (token_value)
);

CREATE TABLE IF NOT EXISTS public.voters
(
    id serial NOT NULL,
    student_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    full_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    email character varying(100) COLLATE pg_catalog."default",
    department character varying(50) COLLATE pg_catalog."default",
    has_voted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT voters_pkey PRIMARY KEY (id),
    CONSTRAINT voters_student_id_key UNIQUE (student_id)
);

CREATE TABLE IF NOT EXISTS public.votes
(
    id serial NOT NULL,
    voter_id integer,
    candidate_id integer,
    voted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address inet,
    student_id character varying(20) COLLATE pg_catalog."default",
    full_name character varying(100) COLLATE pg_catalog."default",
    candidate_name character varying(100) COLLATE pg_catalog."default",
    candidate_position character varying(100) COLLATE pg_catalog."default",
    CONSTRAINT votes_pkey PRIMARY KEY (id),
    CONSTRAINT unique_voter_candidate UNIQUE (voter_id, candidate_id)
);

ALTER TABLE IF EXISTS public.election_settings
    ADD CONSTRAINT election_settings_updated_by_fkey FOREIGN KEY (updated_by)
    REFERENCES public.admins (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.tokens
    ADD CONSTRAINT tokens_generated_by_fkey FOREIGN KEY (generated_by)
    REFERENCES public.admins (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.tokens
    ADD CONSTRAINT tokens_voter_id_fkey FOREIGN KEY (voter_id)
    REFERENCES public.voters (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.votes
    ADD CONSTRAINT votes_candidate_id_fkey FOREIGN KEY (candidate_id)
    REFERENCES public.candidates (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;


ALTER TABLE IF EXISTS public.votes
    ADD CONSTRAINT votes_voter_id_fkey FOREIGN KEY (voter_id)
    REFERENCES public.voters (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE SET NULL;

END;