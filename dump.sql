--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Homebrew)
-- Dumped by pg_dump version 14.17 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: compensationtype; Type: TYPE; Schema: public; Owner: avasara_user
--

CREATE TYPE public.compensationtype AS ENUM (
    'FIXED',
    'HOURLY'
);


ALTER TYPE public.compensationtype OWNER TO avasara_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: contributor_skill; Type: TABLE; Schema: public; Owner: avasara_user
--

CREATE TABLE public.contributor_skill (
    user_id integer NOT NULL,
    skill_id integer NOT NULL,
    rating numeric(3,1) NOT NULL,
    num_tasks integer DEFAULT 0,
    total_score double precision DEFAULT 0.0,
    confidence_constant integer DEFAULT 20,
    baseline_rating double precision DEFAULT 2.5,
    CONSTRAINT contributor_skill_rating_check CHECK ((((rating)::double precision >= (1.0)::double precision) AND ((rating)::double precision <= (5.0)::double precision)))
);


ALTER TABLE public.contributor_skill OWNER TO avasara_user;

--
-- Name: peer_evaluations; Type: TABLE; Schema: public; Owner: avasara_user
--

CREATE TABLE public.peer_evaluations (
    id integer NOT NULL,
    task_id integer,
    evaluator_id integer,
    evaluatee_id integer,
    assignment_id integer,
    technical_score double precision,
    collaboration_score double precision,
    innovation_score double precision,
    reliability_score double precision,
    ai_analysis json,
    algorithm_metrics json,
    strengths text,
    areas_for_improvement text,
    additional_comments text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    status character varying
);


ALTER TABLE public.peer_evaluations OWNER TO avasara_user;

--
-- Name: peer_evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: avasara_user
--

CREATE SEQUENCE public.peer_evaluations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.peer_evaluations_id_seq OWNER TO avasara_user;

--
-- Name: peer_evaluations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: avasara_user
--

ALTER SEQUENCE public.peer_evaluations_id_seq OWNED BY public.peer_evaluations.id;


--
-- Name: resources; Type: TABLE; Schema: public; Owner: avasara_user
--

CREATE TABLE public.resources (
    id integer NOT NULL,
    name character varying
);


ALTER TABLE public.resources OWNER TO avasara_user;

--
-- Name: resources_id_seq; Type: SEQUENCE; Schema: public; Owner: avasara_user
--

CREATE SEQUENCE public.resources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.resources_id_seq OWNER TO avasara_user;

--
-- Name: resources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: avasara_user
--

ALTER SEQUENCE public.resources_id_seq OWNED BY public.resources.id;


--
-- Name: review_task_assignments; Type: TABLE; Schema: public; Owner: avasara_user
--

CREATE TABLE public.review_task_assignments (
    id integer NOT NULL,
    review_task_id integer NOT NULL,
    reviewer_id integer NOT NULL,
    status character varying(50) DEFAULT 'assigned'::character varying,
    accept_reject boolean,
    technical_score numeric(3,2),
    collaboration_score numeric(3,2),
    innovation_score numeric(3,2),
    reliability_score numeric(3,2),
    strengths text,
    areas_for_improvement text,
    additional_comments text,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT review_assignments_status_check CHECK (((status)::text = ANY ((ARRAY['assigned'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT review_task_assignments_collaboration_score_check CHECK (((collaboration_score >= (0)::numeric) AND (collaboration_score <= (5)::numeric))),
    CONSTRAINT review_task_assignments_innovation_score_check CHECK (((innovation_score >= (0)::numeric) AND (innovation_score <= (5)::numeric))),
    CONSTRAINT review_task_assignments_reliability_score_check CHECK (((reliability_score >= (0)::numeric) AND (reliability_score <= (5)::numeric))),
    CONSTRAINT review_task_assignments_status_check CHECK (((status)::text = ANY ((ARRAY['assigned'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT review_task_assignments_technical_score_check CHECK (((technical_score >= (0)::numeric) AND (technical_score <= (5)::numeric)))
);


ALTER TABLE public.review_task_assignments OWNER TO avasara_user;

--
-- Name: review_task_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: avasara_user
--

CREATE SEQUENCE public.review_task_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.review_task_assignments_id_seq OWNER TO avasara_user;

--
-- Name: review_task_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: avasara_user
--

ALTER SEQUENCE public.review_task_assignments_id_seq OWNED BY public.review_task_assignments.id;


--
-- Name: review_tasks; Type: TABLE; Schema: public; Owner: avasara_user
--

CREATE TABLE public.review_tasks (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    status character varying(50) DEFAULT 'open'::character varying,
    parent_task_id integer NOT NULL,
    assignment_being_reviewed_id integer NOT NULL,
    skill_requirements jsonb DEFAULT '{}'::jsonb,
    compensation_amount numeric(10,2) DEFAULT 0,
    compensation_type character varying(50) DEFAULT 'cash'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone,
    CONSTRAINT review_tasks_compensation_amount_check CHECK ((compensation_amount >= (0)::numeric)),
    CONSTRAINT review_tasks_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.review_tasks OWNER TO avasara_user;

--
-- Name: review_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: avasara_user
--

CREATE SEQUENCE public.review_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.review_tasks_id_seq OWNER TO avasara_user;

--
-- Name: review_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: avasara_user
--

ALTER SEQUENCE public.review_tasks_id_seq OWNED BY public.review_tasks.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: avasara_user
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    task_id integer,
    assignment_id integer,
    user_id integer,
    reviewer_id integer,
    is_approved boolean NOT NULL,
    feedback text,
    compensation_amount double precision DEFAULT 0.0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.reviews OWNER TO avasara_user;

--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: avasara_user
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reviews_id_seq OWNER TO avasara_user;

--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: avasara_user
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: skills; Type: TABLE; Schema: public; Owner: avasara_user
--

CREATE TABLE public.skills (
    id integer NOT NULL,
    name character varying
);


ALTER TABLE public.skills OWNER TO avasara_user;

--
-- Name: skills_id_seq; Type: SEQUENCE; Schema: public; Owner: avasara_user
--

CREATE SEQUENCE public.skills_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.skills_id_seq OWNER TO avasara_user;

--
-- Name: skills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: avasara_user
--

ALTER SEQUENCE public.skills_id_seq OWNED BY public.skills.id;


--
-- Name: startups; Type: TABLE; Schema: public; Owner: avasara_user
--

CREATE TABLE public.startups (
    id integer NOT NULL,
    user_id integer,
    name character varying,
    description text,
    logo character varying,
    website character varying
);


ALTER TABLE public.startups OWNER TO avasara_user;

--
-- Name: startups_id_seq; Type: SEQUENCE; Schema: public; Owner: avasara_user
--

CREATE SEQUENCE public.startups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.startups_id_seq OWNER TO avasara_user;

--
-- Name: startups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: avasara_user
--

ALTER SEQUENCE public.startups_id_seq OWNED BY public.startups.id;


--
-- Name: task_assignments; Type: TABLE; Schema: public; Owner: avasara_user
--

CREATE TABLE public.task_assignments (
    id integer NOT NULL,
    task_id integer,
    status character varying,
    notes text,
    created_at timestamp without time zone,
    completed_at timestamp without time zone,
    user_id integer,
    assignment_type character varying DEFAULT 'task'::character varying,
    submission_files json,
    submitted_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.task_assignments OWNER TO avasara_user;

--
-- Name: task_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: avasara_user
--

CREATE SEQUENCE public.task_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.task_assignments_id_seq OWNER TO avasara_user;

--
-- Name: task_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: avasara_user
--

ALTER SEQUENCE public.task_assignments_id_seq OWNED BY public.task_assignments.id;


--
-- Name: task_blocks; Type: TABLE; Schema: public; Owner: avasara_user
--

CREATE TABLE public.task_blocks (
    id integer NOT NULL,
    task_id integer NOT NULL,
    user_id integer NOT NULL,
    blocked_until timestamp without time zone NOT NULL,
    reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.task_blocks OWNER TO avasara_user;

--
-- Name: TABLE task_blocks; Type: COMMENT; Schema: public; Owner: avasara_user
--

COMMENT ON TABLE public.task_blocks IS 'Tracks users blocked from undertaking specific tasks due to rejection';


--
-- Name: COLUMN task_blocks.task_id; Type: COMMENT; Schema: public; Owner: avasara_user
--

COMMENT ON COLUMN public.task_blocks.task_id IS 'The task the user is blocked from';


--
-- Name: COLUMN task_blocks.user_id; Type: COMMENT; Schema: public; Owner: avasara_user
--

COMMENT ON COLUMN public.task_blocks.user_id IS 'The user who is blocked';


--
-- Name: COLUMN task_blocks.blocked_until; Type: COMMENT; Schema: public; Owner: avasara_user
--

COMMENT ON COLUMN public.task_blocks.blocked_until IS 'When the block expires';


--
-- Name: COLUMN task_blocks.reason; Type: COMMENT; Schema: public; Owner: avasara_user
--

COMMENT ON COLUMN public.task_blocks.reason IS 'Reason for the block (e.g., majority rejection)';


--
-- Name: task_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: avasara_user
--

CREATE SEQUENCE public.task_blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.task_blocks_id_seq OWNER TO avasara_user;

--
-- Name: task_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: avasara_user
--

ALTER SEQUENCE public.task_blocks_id_seq OWNED BY public.task_blocks.id;


--
-- Name: task_compensations; Type: TABLE; Schema: public; Owner: avasara_user
--

CREATE TABLE public.task_compensations (
    id integer NOT NULL,
    task_id integer,
    compensation_type character varying(50),
    amount_type character varying(50),
    amount double precision,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.task_compensations OWNER TO avasara_user;

--
-- Name: task_compensations_id_seq; Type: SEQUENCE; Schema: public; Owner: avasara_user
--

CREATE SEQUENCE public.task_compensations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.task_compensations_id_seq OWNER TO avasara_user;

--
-- Name: task_compensations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: avasara_user
--

ALTER SEQUENCE public.task_compensations_id_seq OWNED BY public.task_compensations.id;


--
-- Name: task_evaluators; Type: TABLE; Schema: public; Owner: avasara_user
--

CREATE TABLE public.task_evaluators (
    id integer NOT NULL,
    task_id integer,
    evaluator_id integer,
    status character varying(50) DEFAULT 'pending'::character varying,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.task_evaluators OWNER TO avasara_user;

--
-- Name: task_evaluators_id_seq; Type: SEQUENCE; Schema: public; Owner: avasara_user
--

CREATE SEQUENCE public.task_evaluators_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.task_evaluators_id_seq OWNER TO avasara_user;

--
-- Name: task_evaluators_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: avasara_user
--

ALTER SEQUENCE public.task_evaluators_id_seq OWNED BY public.task_evaluators.id;


--
-- Name: task_resource; Type: TABLE; Schema: public; Owner: avasara_user
--

CREATE TABLE public.task_resource (
    task_id integer,
    resource_id integer
);


ALTER TABLE public.task_resource OWNER TO avasara_user;

--
-- Name: task_resources; Type: TABLE; Schema: public; Owner: avasara_user
--

CREATE TABLE public.task_resources (
    task_id integer NOT NULL,
    resource_id integer NOT NULL
);


ALTER TABLE public.task_resources OWNER TO avasara_user;

--
-- Name: task_reviewers; Type: TABLE; Schema: public; Owner: avasara_user
--

CREATE TABLE public.task_reviewers (
    id integer NOT NULL,
    task_id integer,
    user_id integer,
    status character varying,
    rating integer,
    comment character varying,
    reviewed_at timestamp without time zone,
    created_at timestamp without time zone
);


ALTER TABLE public.task_reviewers OWNER TO avasara_user;

--
-- Name: task_reviewers_id_seq; Type: SEQUENCE; Schema: public; Owner: avasara_user
--

CREATE SEQUENCE public.task_reviewers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.task_reviewers_id_seq OWNER TO avasara_user;

--
-- Name: task_reviewers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: avasara_user
--

ALTER SEQUENCE public.task_reviewers_id_seq OWNED BY public.task_reviewers.id;


--
-- Name: task_skills; Type: TABLE; Schema: public; Owner: avasara_user
--

CREATE TABLE public.task_skills (
    task_id integer NOT NULL,
    skill_id integer NOT NULL
);


ALTER TABLE public.task_skills OWNER TO avasara_user;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: avasara_user
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    title character varying,
    description text,
    deadline timestamp without time zone,
    created_at timestamp without time zone,
    status character varying,
    num_reviewers integer DEFAULT 0,
    max_parallel_contributors integer DEFAULT 1,
    contributor_time_limit_hours integer DEFAULT 72,
    category text DEFAULT 'task'::text,
    user_id integer,
    skill_review_requirements json
);


ALTER TABLE public.tasks OWNER TO avasara_user;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: avasara_user
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tasks_id_seq OWNER TO avasara_user;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: avasara_user
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: avasara_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying,
    username character varying,
    hashed_password character varying,
    is_active boolean,
    first_name character varying(100),
    last_name character varying(100),
    bio text,
    portfolio_url character varying(255),
    oauth_provider character varying,
    oauth_id character varying,
    email_verified boolean DEFAULT false,
    email_verification_token character varying,
    email_verification_expires timestamp without time zone,
    email_verification_sent_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO avasara_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: avasara_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO avasara_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: avasara_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: peer_evaluations id; Type: DEFAULT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.peer_evaluations ALTER COLUMN id SET DEFAULT nextval('public.peer_evaluations_id_seq'::regclass);


--
-- Name: resources id; Type: DEFAULT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.resources ALTER COLUMN id SET DEFAULT nextval('public.resources_id_seq'::regclass);


--
-- Name: review_task_assignments id; Type: DEFAULT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.review_task_assignments ALTER COLUMN id SET DEFAULT nextval('public.review_task_assignments_id_seq'::regclass);


--
-- Name: review_tasks id; Type: DEFAULT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.review_tasks ALTER COLUMN id SET DEFAULT nextval('public.review_tasks_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: skills id; Type: DEFAULT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.skills ALTER COLUMN id SET DEFAULT nextval('public.skills_id_seq'::regclass);


--
-- Name: startups id; Type: DEFAULT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.startups ALTER COLUMN id SET DEFAULT nextval('public.startups_id_seq'::regclass);


--
-- Name: task_assignments id; Type: DEFAULT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_assignments ALTER COLUMN id SET DEFAULT nextval('public.task_assignments_id_seq'::regclass);


--
-- Name: task_blocks id; Type: DEFAULT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_blocks ALTER COLUMN id SET DEFAULT nextval('public.task_blocks_id_seq'::regclass);


--
-- Name: task_compensations id; Type: DEFAULT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_compensations ALTER COLUMN id SET DEFAULT nextval('public.task_compensations_id_seq'::regclass);


--
-- Name: task_evaluators id; Type: DEFAULT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_evaluators ALTER COLUMN id SET DEFAULT nextval('public.task_evaluators_id_seq'::regclass);


--
-- Name: task_reviewers id; Type: DEFAULT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_reviewers ALTER COLUMN id SET DEFAULT nextval('public.task_reviewers_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: contributor_skill contributor_skill_pkey; Type: CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.contributor_skill
    ADD CONSTRAINT contributor_skill_pkey PRIMARY KEY (user_id, skill_id);


--
-- Name: peer_evaluations peer_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.peer_evaluations
    ADD CONSTRAINT peer_evaluations_pkey PRIMARY KEY (id);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- Name: review_task_assignments review_assignments_unique_reviewer_task; Type: CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.review_task_assignments
    ADD CONSTRAINT review_assignments_unique_reviewer_task UNIQUE (review_task_id, reviewer_id);


--
-- Name: review_task_assignments review_task_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.review_task_assignments
    ADD CONSTRAINT review_task_assignments_pkey PRIMARY KEY (id);


--
-- Name: review_tasks review_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.review_tasks
    ADD CONSTRAINT review_tasks_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id);


--
-- Name: startups startups_pkey; Type: CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.startups
    ADD CONSTRAINT startups_pkey PRIMARY KEY (id);


--
-- Name: task_assignments task_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_pkey PRIMARY KEY (id);


--
-- Name: task_blocks task_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_blocks
    ADD CONSTRAINT task_blocks_pkey PRIMARY KEY (id);


--
-- Name: task_blocks task_blocks_task_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_blocks
    ADD CONSTRAINT task_blocks_task_id_user_id_key UNIQUE (task_id, user_id);


--
-- Name: task_compensations task_compensations_pkey; Type: CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_compensations
    ADD CONSTRAINT task_compensations_pkey PRIMARY KEY (id);


--
-- Name: task_compensations task_compensations_task_id_compensation_type_amount_type_key; Type: CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_compensations
    ADD CONSTRAINT task_compensations_task_id_compensation_type_amount_type_key UNIQUE (task_id, compensation_type, amount_type);


--
-- Name: task_evaluators task_evaluators_pkey; Type: CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_evaluators
    ADD CONSTRAINT task_evaluators_pkey PRIMARY KEY (id);


--
-- Name: task_evaluators task_evaluators_task_id_evaluator_id_key; Type: CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_evaluators
    ADD CONSTRAINT task_evaluators_task_id_evaluator_id_key UNIQUE (task_id, evaluator_id);


--
-- Name: task_resources task_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_resources
    ADD CONSTRAINT task_resources_pkey PRIMARY KEY (task_id, resource_id);


--
-- Name: task_reviewers task_reviewers_pkey; Type: CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_reviewers
    ADD CONSTRAINT task_reviewers_pkey PRIMARY KEY (id);


--
-- Name: task_skills task_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_skills
    ADD CONSTRAINT task_skills_pkey PRIMARY KEY (task_id, skill_id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_contributor_skill_rating; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX idx_contributor_skill_rating ON public.contributor_skill USING btree (rating);


--
-- Name: idx_contributor_skill_skill_id; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX idx_contributor_skill_skill_id ON public.contributor_skill USING btree (skill_id);


--
-- Name: idx_contributor_skill_user_id; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX idx_contributor_skill_user_id ON public.contributor_skill USING btree (user_id);


--
-- Name: idx_review_assignments_review_task_id; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX idx_review_assignments_review_task_id ON public.review_task_assignments USING btree (review_task_id);


--
-- Name: idx_review_assignments_reviewer_id; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX idx_review_assignments_reviewer_id ON public.review_task_assignments USING btree (reviewer_id);


--
-- Name: idx_review_assignments_status; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX idx_review_assignments_status ON public.review_task_assignments USING btree (status);


--
-- Name: idx_review_tasks_assignment_id; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX idx_review_tasks_assignment_id ON public.review_tasks USING btree (assignment_being_reviewed_id);


--
-- Name: idx_review_tasks_created_at; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX idx_review_tasks_created_at ON public.review_tasks USING btree (created_at);


--
-- Name: idx_review_tasks_parent_task_id; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX idx_review_tasks_parent_task_id ON public.review_tasks USING btree (parent_task_id);


--
-- Name: idx_review_tasks_status; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX idx_review_tasks_status ON public.review_tasks USING btree (status);


--
-- Name: idx_reviews_assignment_id; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX idx_reviews_assignment_id ON public.reviews USING btree (assignment_id);


--
-- Name: idx_reviews_reviewer_id; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX idx_reviews_reviewer_id ON public.reviews USING btree (reviewer_id);


--
-- Name: idx_reviews_task_id; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX idx_reviews_task_id ON public.reviews USING btree (task_id);


--
-- Name: idx_reviews_user_id; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX idx_reviews_user_id ON public.reviews USING btree (user_id);


--
-- Name: idx_task_blocks_blocked_until; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX idx_task_blocks_blocked_until ON public.task_blocks USING btree (blocked_until);


--
-- Name: idx_task_blocks_task_user; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX idx_task_blocks_task_user ON public.task_blocks USING btree (task_id, user_id);


--
-- Name: ix_peer_evaluations_id; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX ix_peer_evaluations_id ON public.peer_evaluations USING btree (id);


--
-- Name: ix_resources_id; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX ix_resources_id ON public.resources USING btree (id);


--
-- Name: ix_resources_name; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE UNIQUE INDEX ix_resources_name ON public.resources USING btree (name);


--
-- Name: ix_skills_id; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX ix_skills_id ON public.skills USING btree (id);


--
-- Name: ix_skills_name; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE UNIQUE INDEX ix_skills_name ON public.skills USING btree (name);


--
-- Name: ix_startups_id; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX ix_startups_id ON public.startups USING btree (id);


--
-- Name: ix_startups_name; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX ix_startups_name ON public.startups USING btree (name);


--
-- Name: ix_task_assignments_id; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX ix_task_assignments_id ON public.task_assignments USING btree (id);


--
-- Name: ix_task_reviewers_id; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX ix_task_reviewers_id ON public.task_reviewers USING btree (id);


--
-- Name: ix_tasks_id; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX ix_tasks_id ON public.tasks USING btree (id);


--
-- Name: ix_tasks_title; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX ix_tasks_title ON public.tasks USING btree (title);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: avasara_user
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: contributor_skill contributor_skill_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.contributor_skill
    ADD CONSTRAINT contributor_skill_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: contributor_skill contributor_skill_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.contributor_skill
    ADD CONSTRAINT contributor_skill_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: peer_evaluations peer_evaluations_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.peer_evaluations
    ADD CONSTRAINT peer_evaluations_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.task_assignments(id);


--
-- Name: peer_evaluations peer_evaluations_evaluatee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.peer_evaluations
    ADD CONSTRAINT peer_evaluations_evaluatee_id_fkey FOREIGN KEY (evaluatee_id) REFERENCES public.users(id);


--
-- Name: peer_evaluations peer_evaluations_evaluator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.peer_evaluations
    ADD CONSTRAINT peer_evaluations_evaluator_id_fkey FOREIGN KEY (evaluator_id) REFERENCES public.users(id);


--
-- Name: peer_evaluations peer_evaluations_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.peer_evaluations
    ADD CONSTRAINT peer_evaluations_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: review_task_assignments review_task_assignments_review_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.review_task_assignments
    ADD CONSTRAINT review_task_assignments_review_task_id_fkey FOREIGN KEY (review_task_id) REFERENCES public.review_tasks(id) ON DELETE CASCADE;


--
-- Name: review_task_assignments review_task_assignments_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.review_task_assignments
    ADD CONSTRAINT review_task_assignments_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: review_tasks review_tasks_assignment_being_reviewed_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.review_tasks
    ADD CONSTRAINT review_tasks_assignment_being_reviewed_id_fkey FOREIGN KEY (assignment_being_reviewed_id) REFERENCES public.task_assignments(id) ON DELETE CASCADE;


--
-- Name: review_tasks review_tasks_parent_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.review_tasks
    ADD CONSTRAINT review_tasks_parent_task_id_fkey FOREIGN KEY (parent_task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.task_assignments(id);


--
-- Name: reviews reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id);


--
-- Name: reviews reviews_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: startups startups_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.startups
    ADD CONSTRAINT startups_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: task_assignments task_assignments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: task_assignments task_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: task_blocks task_blocks_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_blocks
    ADD CONSTRAINT task_blocks_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_blocks task_blocks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_blocks
    ADD CONSTRAINT task_blocks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: task_compensations task_compensations_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_compensations
    ADD CONSTRAINT task_compensations_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: task_evaluators task_evaluators_evaluator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_evaluators
    ADD CONSTRAINT task_evaluators_evaluator_id_fkey FOREIGN KEY (evaluator_id) REFERENCES public.users(id);


--
-- Name: task_evaluators task_evaluators_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_evaluators
    ADD CONSTRAINT task_evaluators_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: task_resource task_resource_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_resource
    ADD CONSTRAINT task_resource_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id);


--
-- Name: task_resource task_resource_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_resource
    ADD CONSTRAINT task_resource_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: task_resources task_resources_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_resources
    ADD CONSTRAINT task_resources_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id);


--
-- Name: task_resources task_resources_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_resources
    ADD CONSTRAINT task_resources_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: task_reviewers task_reviewers_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_reviewers
    ADD CONSTRAINT task_reviewers_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: task_reviewers task_reviewers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_reviewers
    ADD CONSTRAINT task_reviewers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: task_skills task_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_skills
    ADD CONSTRAINT task_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id);


--
-- Name: task_skills task_skills_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.task_skills
    ADD CONSTRAINT task_skills_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- PostgreSQL database dump complete
--

