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
    user_id integer,
    skill_id integer,
    rating double precision,
    CONSTRAINT contributor_skill_rating_check CHECK (((rating >= (1)::double precision) AND (rating <= (5)::double precision)))
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
    user_id integer
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
    portfolio_url character varying(255)
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
-- Data for Name: contributor_skill; Type: TABLE DATA; Schema: public; Owner: avasara_user
--

COPY public.contributor_skill (user_id, skill_id, rating) FROM stdin;
123	1	1
123	2	1
125	2	\N
125	3	\N
125	4	\N
\.


--
-- Data for Name: peer_evaluations; Type: TABLE DATA; Schema: public; Owner: avasara_user
--

COPY public.peer_evaluations (id, task_id, evaluator_id, evaluatee_id, assignment_id, technical_score, collaboration_score, innovation_score, reliability_score, ai_analysis, algorithm_metrics, strengths, areas_for_improvement, additional_comments, created_at, updated_at, status) FROM stdin;
\.


--
-- Data for Name: resources; Type: TABLE DATA; Schema: public; Owner: avasara_user
--

COPY public.resources (id, name) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: avasara_user
--

COPY public.reviews (id, task_id, assignment_id, user_id, reviewer_id, is_approved, feedback, compensation_amount, created_at) FROM stdin;
1	67	77	124	124	t	Task accepted and completed successfully.	0	2025-06-27 13:49:10.214605
2	67	78	126	126	t	Task accepted and completed successfully.	0	2025-06-27 21:26:48.896357
\.


--
-- Data for Name: skills; Type: TABLE DATA; Schema: public; Owner: avasara_user
--

COPY public.skills (id, name) FROM stdin;
1	full stack developer
2	Python
3	Java
4	annotation
5	photo editing
\.


--
-- Data for Name: startups; Type: TABLE DATA; Schema: public; Owner: avasara_user
--

COPY public.startups (id, user_id, name, description, logo, website) FROM stdin;
\.


--
-- Data for Name: task_assignments; Type: TABLE DATA; Schema: public; Owner: avasara_user
--

COPY public.task_assignments (id, task_id, status, notes, created_at, completed_at, user_id, assignment_type, submission_files, submitted_at, updated_at) FROM stdin;
48	53	submitted_for_review	Task submitted for review	\N	\N	123	task	\N	\N	\N
49	53	submitted_for_review	Task submitted for review	\N	\N	124	task	\N	\N	\N
50	56	submitted_for_review	Task submitted for review	\N	\N	123	task	\N	\N	\N
51	56	submitted_for_review	Task submitted for review	\N	\N	124	task	\N	\N	\N
52	57	submitted_for_review	Task submitted for review	\N	\N	123	task	\N	\N	\N
53	58	submitted_for_review	testing\r\n	\N	\N	123	task	\N	\N	\N
54	58	submitted_for_review	review submission	\N	\N	124	review	\N	\N	\N
55	58	submitted_for_review	review submission	\N	\N	124	task	\N	\N	\N
56	59	reviewed	testing review modal	\N	\N	123	task	\N	\N	\N
57	59	reviewed	Task being reviewed	\N	\N	124	review	\N	\N	\N
58	60	submitted_for_review	i did it	\N	\N	123	task	\N	\N	\N
59	60	reviewed	Task being reviewed	\N	\N	124	review	\N	\N	\N
60	60	reviewed	Task being reviewed	\N	\N	125	review	\N	\N	\N
61	61	submitted_for_review	ok, here we go	\N	\N	123	task	\N	\N	\N
62	61	reviewed	Task being reviewed	\N	\N	125	review	\N	\N	\N
63	62	submitted_for_review	done it, thala for a reason	\N	\N	123	task	\N	\N	\N
64	62	reviewed	Task being reviewed	\N	\N	124	review	\N	\N	\N
66	62	in_progress	Task being reviewed	\N	\N	125	review	\N	\N	\N
67	63	submitted_for_review	Nenunna	\N	\N	123	task	\N	\N	\N
68	63	in_progress	Task being reviewed	\N	\N	125	review	\N	\N	\N
69	64	submitted_for_review	ok	\N	\N	123	task	\N	\N	\N
70	64	reviewed	Task being reviewed	\N	\N	125	review	\N	\N	\N
71	64	reviewed	Task being reviewed	\N	\N	124	review	\N	\N	\N
72	65	submitted_for_review	work done	\N	\N	124	contributor	\N	\N	\N
73	65	reviewed	Task being reviewed	\N	\N	123	review	\N	\N	\N
74	65	reviewed	Task being reviewed	\N	\N	125	review	\N	\N	\N
75	66	submitted_for_review	This is what happened	\N	\N	123	task	\N	\N	\N
76	67	submitted_for_review	https://docs.google.com/document/d/1Yg3c8JNK7Lr5Ivmprhrp0NEJg5xc-JkdcxBk8KBj8X0/edit?usp=sharing	\N	\N	125	contributor	\N	\N	\N
77	67	reviewed	Task being reviewed	\N	\N	124	review	\N	\N	2025-06-27 13:49:10.210299
78	67	reviewed	Task being reviewed	\N	\N	126	review	\N	\N	2025-06-27 21:26:48.887289
\.


--
-- Data for Name: task_compensations; Type: TABLE DATA; Schema: public; Owner: avasara_user
--

COPY public.task_compensations (id, task_id, compensation_type, amount_type, amount, created_at) FROM stdin;
3	56	cash	task	0	2025-06-16 03:21:59.423538
4	56	cash	review	0	2025-06-16 03:21:59.423543
1	\N	cash	task	1000	2025-06-16 00:57:26.857717
2	\N	cash	review	200	2025-06-16 00:57:26.857721
5	57	cash	task	10	2025-06-16 16:03:31.216027
6	57	cash	review	5	2025-06-16 16:03:31.21603
7	58	cash	task	0	2025-06-16 16:05:59.391916
8	58	cash	review	0	2025-06-16 16:05:59.391921
9	59	cash	task	0	2025-06-16 20:29:20.190825
10	59	cash	review	0	2025-06-16 20:29:20.190829
11	60	cash	task	0	2025-06-20 16:44:40.87699
12	60	cash	review	0	2025-06-20 16:44:40.876994
13	61	cash	task	0	2025-06-20 18:12:32.89451
14	61	cash	review	0	2025-06-20 18:12:32.894523
15	62	cash	task	0	2025-06-20 19:12:54.655151
16	62	cash	review	0	2025-06-20 19:12:54.655156
17	63	cash	task	0	2025-06-20 19:38:27.881366
18	63	cash	review	0	2025-06-20 19:38:27.88137
19	64	cash	task	0	2025-06-21 02:16:37.188935
20	64	cash	review	0	2025-06-21 02:16:37.188943
21	65	cash	task	1000	2025-06-21 04:22:22.713257
22	65	cash	review	200	2025-06-21 04:22:22.713261
23	66	cash	task	0	2025-06-21 19:09:48.960935
24	66	cash	review	0	2025-06-21 19:09:48.960937
25	67	cash	task	200	2025-06-23 18:15:42.768973
26	67	cash	review	100	2025-06-23 18:15:42.768976
\.


--
-- Data for Name: task_evaluators; Type: TABLE DATA; Schema: public; Owner: avasara_user
--

COPY public.task_evaluators (id, task_id, evaluator_id, status, assigned_at) FROM stdin;
\.


--
-- Data for Name: task_resource; Type: TABLE DATA; Schema: public; Owner: avasara_user
--

COPY public.task_resource (task_id, resource_id) FROM stdin;
\.


--
-- Data for Name: task_resources; Type: TABLE DATA; Schema: public; Owner: avasara_user
--

COPY public.task_resources (task_id, resource_id) FROM stdin;
\.


--
-- Data for Name: task_reviewers; Type: TABLE DATA; Schema: public; Owner: avasara_user
--

COPY public.task_reviewers (id, task_id, user_id, status, rating, comment, reviewed_at, created_at) FROM stdin;
\.


--
-- Data for Name: task_skills; Type: TABLE DATA; Schema: public; Owner: avasara_user
--

COPY public.task_skills (task_id, skill_id) FROM stdin;
53	2
56	1
57	3
58	4
59	2
60	5
61	4
62	4
63	1
64	3
65	2
65	3
66	4
67	4
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: avasara_user
--

COPY public.tasks (id, title, description, deadline, created_at, status, num_reviewers, max_parallel_contributors, contributor_time_limit_hours, category, user_id) FROM stdin;
60	Untitled Task 5	No description provided	\N	2025-06-20 16:44:40.855458	submitted_for_review	\N	\N	\N	task	123
61	Untitled Task 6	No description provided	\N	2025-06-20 18:12:32.84827	submitted_for_review	\N	\N	\N	task	123
62	Untitled Task 7	No description provided	\N	2025-06-20 19:12:54.614734	submitted_for_review	\N	\N	\N	task	123
63	Untitled Task 8	No description provided	\N	2025-06-20 19:38:27.847641	submitted_for_review	\N	\N	\N	task	123
64	Untitled Task 9	No description provided	\N	2025-06-21 02:16:37.166284	completed	2	\N	\N	task	123
65	Untitled Task 123	this is a task	\N	2025-06-21 04:22:22.67914	completed	2	\N	\N	task	124
53	ABCD	ABCD	2025-06-16 20:00:00	2025-06-15 07:30:23.201691	submitted_for_review	\N	\N	\N	task	123
56	Untitled Task	No description provided	\N	2025-06-16 03:21:59.400518	submitted_for_review	\N	\N	\N	task	123
66	Untitled Task 12	No description provided	\N	2025-06-21 19:09:48.931064	submitted_for_review	2	\N	\N	task	123
57	Untitled Task 2	No description provided	\N	2025-06-16 16:03:31.183111	submitted_for_review	\N	\N	\N	task	123
58	Untitled Task 3	No description provided	\N	2025-06-16 16:05:59.344705	submitted_for_review	\N	\N	\N	task	123
59	Untitled Task 4	No description provided	\N	2025-06-16 20:29:20.1588	submitted_for_review	\N	\N	\N	task	123
67	Annotate the tasks	https://docs.google.com/document/d/1HuzeoQTXfsCDdwsGMFHNx1wXJAWTLhwCB3BozwvIKy0/edit?usp=sharing\n Annotate the images in the above drive link\n\n\n\n	\N	2025-06-23 18:15:42.741623	completed	2	\N	\N	task	123
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: avasara_user
--

COPY public.users (id, email, username, hashed_password, is_active, first_name, last_name, bio, portfolio_url) FROM stdin;
123	sairohith2012@gmail.com	rohith	$2b$12$1Iy5b7/H1D32aE8.YwrxCuOp81LKSlz9UdpfXoZC.cAnfE.nge6e6	t	Sairohith	Yanamala	I am just a developer standing infront of another developers asking for work	
124	syanamala@umass.edu	salmonraj	$2b$12$E3HumdoLvr1caCQQkruu4uejMDnOG5nw7aIttc7eeJl6xOESPg9xe	t	\N	\N	\N	\N
125	roro@gmail.com	roronoa	$2b$12$aT.FSOhVoKSuXBICVs58RO.Y9w/BoRY8Ukms3EEZYlmQNd9EqoAZ2	t	\N	\N	\N	\N
126	tester@gmail.com	tester	$2b$12$RYtBguzXpQ7mtR51RG7PA..kokb/HHq1SEjl8TAg1VMVeohE9mgfa	t	\N	\N	\N	\N
\.


--
-- Name: peer_evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: avasara_user
--

SELECT pg_catalog.setval('public.peer_evaluations_id_seq', 4, true);


--
-- Name: resources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: avasara_user
--

SELECT pg_catalog.setval('public.resources_id_seq', 1, false);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: avasara_user
--

SELECT pg_catalog.setval('public.reviews_id_seq', 2, true);


--
-- Name: skills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: avasara_user
--

SELECT pg_catalog.setval('public.skills_id_seq', 5, true);


--
-- Name: startups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: avasara_user
--

SELECT pg_catalog.setval('public.startups_id_seq', 23, true);


--
-- Name: task_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: avasara_user
--

SELECT pg_catalog.setval('public.task_assignments_id_seq', 78, true);


--
-- Name: task_compensations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: avasara_user
--

SELECT pg_catalog.setval('public.task_compensations_id_seq', 26, true);


--
-- Name: task_evaluators_id_seq; Type: SEQUENCE SET; Schema: public; Owner: avasara_user
--

SELECT pg_catalog.setval('public.task_evaluators_id_seq', 1, false);


--
-- Name: task_reviewers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: avasara_user
--

SELECT pg_catalog.setval('public.task_reviewers_id_seq', 1, false);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: avasara_user
--

SELECT pg_catalog.setval('public.tasks_id_seq', 67, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: avasara_user
--

SELECT pg_catalog.setval('public.users_id_seq', 126, true);


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
    ADD CONSTRAINT contributor_skill_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id);


--
-- Name: contributor_skill contributor_skill_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: avasara_user
--

ALTER TABLE ONLY public.contributor_skill
    ADD CONSTRAINT contributor_skill_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


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

