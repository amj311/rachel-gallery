--
-- PostgreSQL database dump
--

-- Dumped from database version 15.3 (Debian 15.3-1.pgdg110+1)
-- Dumped by pg_dump version 15.2

-- Started on 2024-08-23 09:53:07 MDT

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
-- TOC entry 5 (class 2615 OID 40960)
-- Name: public; Type: SCHEMA; Schema: -; Owner: gallery_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO gallery_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 106496)
-- Name: Client; Type: TABLE; Schema: public; Owner: gallery_owner
--

CREATE TABLE public."Client" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text
);


ALTER TABLE public."Client" OWNER TO gallery_owner;

--
-- TOC entry 216 (class 1259 OID 40969)
-- Name: Gallery; Type: TABLE; Schema: public; Owner: gallery_owner
--

CREATE TABLE public."Gallery" (
    id text NOT NULL,
    "clientName" text,
    "clientEmail" text,
    name text,
    slug text,
    date timestamp(3) without time zone,
    "isPublished" boolean DEFAULT false NOT NULL,
    "coverStyle" text,
    "coverSettings" jsonb,
    "coverPhotoId" text,
    visibility text DEFAULT 'draft'::text NOT NULL,
    "shareCode" text,
    "shareEmails" text[],
    "shareMode" text,
    "clientCanShare" boolean DEFAULT false NOT NULL,
    "clientId" text
);


ALTER TABLE public."Gallery" OWNER TO gallery_owner;

--
-- TOC entry 217 (class 1259 OID 40977)
-- Name: GallerySection; Type: TABLE; Schema: public; Owner: gallery_owner
--

CREATE TABLE public."GallerySection" (
    id text NOT NULL,
    "galleryId" text NOT NULL,
    name text NOT NULL,
    "order" integer NOT NULL
);


ALTER TABLE public."GallerySection" OWNER TO gallery_owner;

--
-- TOC entry 219 (class 1259 OID 81920)
-- Name: Inquiry; Type: TABLE; Schema: public; Owner: gallery_owner
--

CREATE TABLE public."Inquiry" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    message text NOT NULL,
    phone text,
    occasion text,
    date timestamp(3) without time zone,
    location text,
    "peopleQty" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "readAt" timestamp(3) without time zone
);


ALTER TABLE public."Inquiry" OWNER TO gallery_owner;

--
-- TOC entry 221 (class 1259 OID 106503)
-- Name: Opportunity; Type: TABLE; Schema: public; Owner: gallery_owner
--

CREATE TABLE public."Opportunity" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "contractType" text,
    "contractUrl" text,
    "clientId" text NOT NULL,
    "inquiryId" text,
    "galleryId" text,
    date timestamp(3) without time zone,
    location text,
    occasion text,
    "peopleQty" integer,
    notes text
);


ALTER TABLE public."Opportunity" OWNER TO gallery_owner;

--
-- TOC entry 218 (class 1259 OID 40984)
-- Name: Photo; Type: TABLE; Schema: public; Owner: gallery_owner
--

CREATE TABLE public."Photo" (
    id text NOT NULL,
    filename text NOT NULL,
    "googleFileId" text NOT NULL,
    "googleOwnerEmail" text NOT NULL,
    width integer NOT NULL,
    height integer NOT NULL,
    size integer NOT NULL,
    type text NOT NULL,
    "gallerySectionId" text,
    "order" integer NOT NULL
);


ALTER TABLE public."Photo" OWNER TO gallery_owner;

--
-- TOC entry 215 (class 1259 OID 40961)
-- Name: User; Type: TABLE; Schema: public; Owner: gallery_owner
--

CREATE TABLE public."User" (
    id text NOT NULL,
    auth_id text NOT NULL,
    email text NOT NULL,
    "givenName" text NOT NULL,
    "familyName" text NOT NULL,
    "isAdmin" boolean DEFAULT false
);


ALTER TABLE public."User" OWNER TO gallery_owner;

--
-- TOC entry 3383 (class 0 OID 106496)
-- Dependencies: 220
-- Data for Name: Client; Type: TABLE DATA; Schema: public; Owner: gallery_owner
--

INSERT INTO public."Client" VALUES ('17140421-61ad-464d-ba8f-d58ccf50b7fd', 'Arthur', 'amjudd315@gmail.com', NULL);
INSERT INTO public."Client" VALUES ('f7f0137c-1626-47cd-be0a-bdc598a18d48', '', '', NULL);
INSERT INTO public."Client" VALUES ('fbea13b5-fca0-41b3-a46e-0961fc18e08c', 'Sabrina Hatch', 'sabrinasmith.monat@gmail.com', NULL);


--
-- TOC entry 3379 (class 0 OID 40969)
-- Dependencies: 216
-- Data for Name: Gallery; Type: TABLE DATA; Schema: public; Owner: gallery_owner
--

INSERT INTO public."Gallery" VALUES ('599b514a-0205-400c-8831-44ebf3fe5422', NULL, NULL, 'New Gallery', NULL, NULL, false, 'full', '{"border": false, "textPlacement": "center"}', NULL, 'archived', NULL, '{}', NULL, false, NULL);
INSERT INTO public."Gallery" VALUES ('a1fcf324-2289-4371-9ed1-b9b51d6c119b', NULL, NULL, 'New Gallery', NULL, NULL, false, NULL, NULL, NULL, 'draft', NULL, NULL, NULL, false, NULL);
INSERT INTO public."Gallery" VALUES ('2f061258-1b98-449f-9bea-f23c7cbae9de', NULL, NULL, 'New Gallery', NULL, NULL, false, 'full', '{"border": false, "textPlacement": "center"}', NULL, 'draft', NULL, '{}', NULL, false, NULL);
INSERT INTO public."Gallery" VALUES ('263f037a-5ae6-4bde-b890-9aa3436f40cf', NULL, 'sabrinasmith.monat@gmail.com', 'Hatch Family', 'sabrinahatch-mommy+me', '2024-05-03 06:00:00', false, 'overlay', '{"border": false, "focalPoint": {"x": 24, "y": 0}, "textPlacement": "center"}', '65b0eb2f-1aee-436b-b0ff-dafa35bf7853', 'published', '379455', '{}', 'invite', true, 'fbea13b5-fca0-41b3-a46e-0961fc18e08c');
INSERT INTO public."Gallery" VALUES ('154e1fe2-ba4f-49b5-a9ce-9b4cb7722ffc', NULL, NULL, 'New Gallery', NULL, '2024-05-07 06:00:00', false, 'overlay', '{"border": false, "focalPoint": {"x": 58, "y": 28}, "textPlacement": "center"}', '01e3d089-c576-4f91-baf5-dfa243cd1038', 'draft', NULL, '{}', NULL, false, NULL);
INSERT INTO public."Gallery" VALUES ('a2c2bca5-4f7c-453d-9608-12aaa9641cc8', 'Arthur', 'amjudd315@gmail.com', 'My Test Gallery', 'test-gallery', '2024-05-14 06:00:00', false, 'full', '{"border": true, "focalPoint": {"x": 62, "y": 32}, "textPlacement": "bottom"}', '073f4d48-ce2b-4915-ab33-59860cd2e557', 'public', '033981', '{cheetolick311@gmail.com}', 'code', true, '17140421-61ad-464d-ba8f-d58ccf50b7fd');


--
-- TOC entry 3380 (class 0 OID 40977)
-- Dependencies: 217
-- Data for Name: GallerySection; Type: TABLE DATA; Schema: public; Owner: gallery_owner
--

INSERT INTO public."GallerySection" VALUES ('d94f7a14-61f1-422d-9b35-6f51245007e2', '154e1fe2-ba4f-49b5-a9ce-9b4cb7722ffc', 'Section 1', 0);
INSERT INTO public."GallerySection" VALUES ('f441c148-092e-4ab9-9775-accf9b278d23', 'a1fcf324-2289-4371-9ed1-b9b51d6c119b', 'Section 1', 0);
INSERT INTO public."GallerySection" VALUES ('9b796514-45b9-436f-80aa-b26d3378ab9f', '2f061258-1b98-449f-9bea-f23c7cbae9de', 'Section 1', 0);
INSERT INTO public."GallerySection" VALUES ('f1ed3a4f-4ddb-47d2-82f2-76c5b70faf52', '599b514a-0205-400c-8831-44ebf3fe5422', 'Section 1', 0);
INSERT INTO public."GallerySection" VALUES ('067474f3-5074-47e0-a110-110792e23952', '263f037a-5ae6-4bde-b890-9aa3436f40cf', 'Mommy and Me', 0);
INSERT INTO public."GallerySection" VALUES ('78e0defe-1c10-4650-86fb-8119ea1ccfb2', 'a2c2bca5-4f7c-453d-9608-12aaa9641cc8', 'Maternity', 0);
INSERT INTO public."GallerySection" VALUES ('42108a6a-e0e8-453c-89ca-60b643bb39ab', 'a2c2bca5-4f7c-453d-9608-12aaa9641cc8', 'New Section', 1);


--
-- TOC entry 3382 (class 0 OID 81920)
-- Dependencies: 219
-- Data for Name: Inquiry; Type: TABLE DATA; Schema: public; Owner: gallery_owner
--

INSERT INTO public."Inquiry" VALUES ('655c8452-d12c-4863-ae18-5b0b15987d98', 'Tester Chester', 'amjudd315@gmail.com', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>', '23562456', 'Engagement', '2024-05-31 06:00:00', 'Provo', 2, '2024-05-31 18:54:12.095', '2024-05-31 18:57:15.529');
INSERT INTO public."Inquiry" VALUES ('855c8452-d12c-4863-ae18-5b0b15987d98', 'Tester Chester', 'amjudd315@gmail.com', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>', '23562456', 'Engagement', '2024-05-31 06:00:00', 'Provo', 2, '2024-05-31 18:54:12.095', '2024-05-31 18:57:17.39');
INSERT INTO public."Inquiry" VALUES ('ed3e147a-08d1-4e10-8e77-7697d45c285b', 'dddd', 'amjudd315@gmail.com', '<p>I need pics please.</p>', '', '', NULL, '', NULL, '2024-06-30 18:54:12.095', NULL);
INSERT INTO public."Inquiry" VALUES ('921f99f9-b66d-4e43-bbb2-496b36e5fda2', 'Arthur Tester', 'amjudd315@gmail.com', '<p>Hiiiiiiii 👋 </p><p>&lt;script&gt;alert(''broken'')&lt;/&gt;</p><p><br></p><p>I need to go to bed soon as I can get those numbers and I can get it to the office tomorrow morning to get it done before I leave the office and get the car back to the office and get it done and then I''ll let it be in the car and I will let it go by the end of this day I think it is okay to come over and I can come over the weekend and then coming back to the house. </p><p><br></p><p>Hey man I was just wondering if you could bring 566.</p>', '2084213464', 'Group Photo', '2024-06-12 06:00:00', 'Scottsdale', 15, '2024-06-30 18:54:12.095', NULL);
INSERT INTO public."Inquiry" VALUES ('255c8452-d12c-4863-ae18-5b0b15987d98', 'Tester Chester', 'amjudd315@gmail.com', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>', '23562456', 'Engagement', '2024-05-31 06:00:00', 'Provo', 2, '2024-05-31 18:54:12.095', '2024-05-31 21:55:37.674');
INSERT INTO public."Inquiry" VALUES ('cvhfghhdxf', 'Tester Chester', 'amjudd315@gmail.com', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>', '23562456', 'Engagement', '2024-05-31 06:00:00', 'Provo', 2, '2024-05-31 18:54:12.095', NULL);
INSERT INTO public."Inquiry" VALUES ('555c8452-d12c-4863-ae18-5b0b15987d98', 'Tester Chester With Loooooooooong Name', 'amjudd315@gmail.com', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>', '23562456', 'Engagement', '2024-05-31 06:00:00', 'Provo', 2, '2024-05-31 18:54:12.095', NULL);
INSERT INTO public."Inquiry" VALUES ('455c8452-d12c-4863-ae18-5b0b15987d98', 'Tester Chester', 'amjudd315@gmail.com', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>', '23562456', 'Engagement', '2024-05-31 06:00:00', 'Provo', 2, '2024-05-31 18:54:12.095', NULL);
INSERT INTO public."Inquiry" VALUES ('355c8452-d12c-4863-ae18-5b0b15987d98', 'Tester Chester', 'amjudd315@gmail.com', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>', '23562456', 'Engagement', '2024-05-31 06:00:00', 'Provo', 2, '2024-05-31 18:54:12.095', '2024-05-31 19:16:14.842');
INSERT INTO public."Inquiry" VALUES ('mrtymiri', 'Tester Chester', 'amjudd315@gmail.com', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>', '23562456', 'Engagement', '2024-05-31 06:00:00', 'Provo', 2, '2024-05-31 18:54:12.095', '2024-05-31 22:44:42.233');
INSERT INTO public."Inquiry" VALUES ('qwerqerwtqert', 'Tester Chester', 'amjudd315@gmail.com', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>', '23562456', 'Engagement', '2024-05-31 06:00:00', 'Provo', 2, '2024-05-31 18:54:12.095', '2024-05-31 22:44:40.905');
INSERT INTO public."Inquiry" VALUES ('qerwtqertwe', 'Tester Chester', 'amjudd315@gmail.com', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>', '23562456', 'Engagement', '2024-05-31 06:00:00', 'Provo', 2, '2024-05-31 18:54:12.095', '2024-05-31 18:57:17.39');
INSERT INTO public."Inquiry" VALUES ('rtnyuetyunuut', 'Tester Chester', 'amjudd315@gmail.com', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>', '23562456', 'Engagement', '2024-05-31 06:00:00', 'Provo', 2, '2024-05-31 18:54:12.095', '2024-05-31 18:57:17.39');
INSERT INTO public."Inquiry" VALUES ('bertbywrtybry', 'Tester Chester', 'amjudd315@gmail.com', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>', '23562456', 'Engagement', '2024-05-31 06:00:00', 'Provo', 2, '2024-05-31 18:54:12.095', '2024-05-31 18:57:17.39');
INSERT INTO public."Inquiry" VALUES ('bertyunt', 'Tester Chester', 'amjudd315@gmail.com', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>', '23562456', 'Engagement', '2024-05-31 06:00:00', 'Provo', 2, '2024-05-31 18:54:12.095', '2024-05-31 18:57:17.39');
INSERT INTO public."Inquiry" VALUES ('ntyurtyu', 'Tester Chester', 'amjudd315@gmail.com', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>', '23562456', 'Engagement', '2024-05-31 06:00:00', 'Provo', 2, '2024-05-31 18:54:12.095', '2024-05-31 18:57:17.39');
INSERT INTO public."Inquiry" VALUES ('mrtuimri', 'Tester Chester', 'amjudd315@gmail.com', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>', '23562456', 'Engagement', '2024-05-31 06:00:00', 'Provo', 2, '2024-05-31 18:54:12.095', '2024-05-31 18:57:17.39');
INSERT INTO public."Inquiry" VALUES ('rtyertyeyutyu', 'Tester Chester', 'amjudd315@gmail.com', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>', '23562456', 'Engagement', '2024-05-31 06:00:00', 'Provo', 2, '2024-05-31 18:54:12.095', '2024-05-31 18:57:17.39');
INSERT INTO public."Inquiry" VALUES ('rtyertynertyn', 'Tester Chester', 'amjudd315@gmail.com', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>', '23562456', 'Engagement', '2024-05-31 06:00:00', 'Provo', 2, '2024-05-31 18:54:12.095', '2024-05-31 18:57:17.39');
INSERT INTO public."Inquiry" VALUES ('rmyirmiy', 'Tester Chester', 'amjudd315@gmail.com', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>', '23562456', 'Engagement', '2024-05-31 06:00:00', 'Provo', 2, '2024-05-31 18:54:12.095', '2024-05-31 18:57:17.39');
INSERT INTO public."Inquiry" VALUES ('mruimruyim', 'Tester Chester', 'amjudd315@gmail.com', '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>', '23562456', 'Engagement', '2024-05-31 06:00:00', 'Provo', 2, '2024-05-31 18:54:12.095', '2024-05-31 18:57:17.39');


--
-- TOC entry 3384 (class 0 OID 106503)
-- Dependencies: 221
-- Data for Name: Opportunity; Type: TABLE DATA; Schema: public; Owner: gallery_owner
--

INSERT INTO public."Opportunity" VALUES ('227c9ffd-1aef-4a49-a1b7-86793c8cb071', '2024-06-28 13:47:20.063', NULL, NULL, '17140421-61ad-464d-ba8f-d58ccf50b7fd', 'qwerqerwtqert', NULL, '2024-05-31 06:00:00', 'Provo', 'Engagement', 2, NULL);


--
-- TOC entry 3381 (class 0 OID 40984)
-- Dependencies: 218
-- Data for Name: Photo; Type: TABLE DATA; Schema: public; Owner: gallery_owner
--

INSERT INTO public."Photo" VALUES ('32e418ce-99ae-4fef-8b60-606da181e001', 'IMG_4560.jpg', '17vtrJK33a87L-IqjTvoHjTb72BkYcSwx', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 8034744, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 20);
INSERT INTO public."Photo" VALUES ('eae90cca-6676-471b-bc5b-339fdb90fef8', 'IMG_5690-2.jpg', '1VIv-P06SI-4tmVpy-rHu2-6Typ8HljZK', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 4696, 3131, 2807132, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 21);
INSERT INTO public."Photo" VALUES ('97fd4bd4-6cad-4470-b17d-32106b0cc51a', 'IMG_5690.jpg', '1ZZHPWLgglLm3MRfrdofFWVIBNTV_yIfB', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 4696, 3131, 4530533, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 22);
INSERT INTO public."Photo" VALUES ('e10e080f-d3e7-4f37-8e52-67392bb5a706', 'rfp-logo-removebg.png', '1f7qzEISUTx-3UHzw6tVWgq_LB1oJdTn6', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 300, 300, 96300, 'image/png', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 23);
INSERT INTO public."Photo" VALUES ('5690a32d-da69-443b-9ec7-442d422c29ff', 'IMG_5973.jpg', '1cyYLj7d19NQanmRpqWO3h8hjQwEfkngF', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3321, 4982, 11918268, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 27);
INSERT INTO public."Photo" VALUES ('01e3d089-c576-4f91-baf5-dfa243cd1038', 'headshot_poky_800.png', '1gMjMgrlwAk0Rcyi3oLnug905RH3jknpK', 'amjudd315@gmail.com', 800, 1200, 1128297, 'image/png', 'd94f7a14-61f1-422d-9b35-6f51245007e2', 15);
INSERT INTO public."Photo" VALUES ('f01730b8-5fd4-4ffb-8150-b560b5299486', 'IMG_4555-2.jpg', '1cBi_TbWFHbXPmcVNd9J0CwyFzcneI4xz', 'amjudd315@gmail.com', 2828, 1885, 1587753, 'image/jpeg', 'd94f7a14-61f1-422d-9b35-6f51245007e2', 16);
INSERT INTO public."Photo" VALUES ('8a5c452f-9807-4e32-88bc-1de4e967ad86', 'IMG_5992-2.jpg', '1fvPDNMudiuN80NhvmBM22MIMs--P6wtd', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 2304, 3456, 5771301, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 31);
INSERT INTO public."Photo" VALUES ('929c470f-9ec8-415b-8431-701359a72105', 'IMG_6023.jpg', '1yjNxn064kkyQCnO7FzV4XywB0WtXMJ-i', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3261, 4892, 20025075, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 38);
INSERT INTO public."Photo" VALUES ('8120e0e7-0b2c-4c77-a5ce-27ee83e74b21', 'IMG_6027-2.jpg', '1skQyT25OZRNKmOegGvJ_BVpCZuUnJrSY', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 6864243, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 40);
INSERT INTO public."Photo" VALUES ('861ef887-9c7d-4cec-848e-87f744c0715d', 'IMG_6029.jpg', '1hrcyz3D9_AwqKhJybw8STIKJt5qRuhuG', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 12158411, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 41);
INSERT INTO public."Photo" VALUES ('d252dbf7-613e-4547-9f51-195d586bef77', 'IMG_6051.jpg', '1yjuPAfdeA-UioPR2Rv8BX-9DkhILt6LN', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3351, 5027, 20038271, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 45);
INSERT INTO public."Photo" VALUES ('8967409a-5742-43b4-b110-040f662e995c', 'IMG_6057.jpg', '1fys_7nvgB3dqHff8XCyKafTEVJM8rBJo', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 21844280, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 47);
INSERT INTO public."Photo" VALUES ('d2268a86-99c4-4c26-9717-eed57afe49cd', 'IMG_6057-2.jpg', '1yo3-KYhKS5ZDw03gQocHf3nhMk8agXKf', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 11728859, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 48);
INSERT INTO public."Photo" VALUES ('4cba1bf5-7e17-441d-84c7-b426a6698c36', 'IMG_6107.jpg', '1yB4LBrDoabA5VCxhLWn19AirBm95z1Q3', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 22911602, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 53);
INSERT INTO public."Photo" VALUES ('3eb22314-f1e0-4d4e-b949-2bd81a7a3cce', 'IMG_6107-2.jpg', '1YFcwvigK9dWbCP4G4Vhb5bO2fn_tl45J', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 12136086, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 54);
INSERT INTO public."Photo" VALUES ('1e5290ed-008f-4934-a891-7dbef5005f0b', 'IMG_6180.jpg', '1vlUW6BAVLCk6Byv6stNqXeaWZUT-b8tO', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 24898225, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 55);
INSERT INTO public."Photo" VALUES ('03ab21aa-1ac9-4cbd-a048-c9c35fc54db0', 'IMG_6180-2.jpg', '1Z8nLFJ5hm1rYX6o6KR6BGT8-Xg7wrRLQ', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 12685191, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 56);
INSERT INTO public."Photo" VALUES ('d724ac40-eeec-437f-a1eb-e87f448459b6', 'IMG_6253.jpg', '1dJXImao3MXkayp9WEzMPVIiinCPZ-ox-', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 5184, 3456, 21309842, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 57);
INSERT INTO public."Photo" VALUES ('c401f493-5617-42f8-82b2-7e36b32cbc57', 'IMG_6257.jpg', '1pGt2P2KEu1ahmM6mmB2WhaDtjCtceSrW', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3249, 4874, 16674241, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 61);
INSERT INTO public."Photo" VALUES ('b917c1e1-e7b8-467c-a732-1326610fc6a9', 'IMG_6277.jpg', '1Je2qqVJ765xMdMbKk4wmD2_3edFRcA3A', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 1981, 2972, 7573730, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 63);
INSERT INTO public."Photo" VALUES ('a18bd1ab-15f9-42cd-9488-45817d251c7d', 'IMG_4560 (2).jpg', '1U_0MO6jFqz4tU7LQfIfA3QipoEyrxkX_', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 8034744, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 18);
INSERT INTO public."Photo" VALUES ('0efe551e-4c08-4c2e-b985-b5a531144ac7', 'IMG_4560-2.jpg', '1xZXlhivhlxQOkNg6A20bkNVwPjyfcW1h', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 5686864, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 19);
INSERT INTO public."Photo" VALUES ('a2667775-ca48-4405-8b21-9c89eb411534', 'IMG_5973-2.jpg', '1WtMZz72Jcc-DsY0YXduQDrqb9fdRJFpu', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3321, 4982, 9109104, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 28);
INSERT INTO public."Photo" VALUES ('0144c4d9-4e2a-443d-ad6d-4ac5313c2316', 'IMG_5980.jpg', '1TrMbpF5hQVwPGl39WfIZZM62lF8NKEes', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 4726, 3151, 14548663, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 29);
INSERT INTO public."Photo" VALUES ('dc61faf5-b1af-4e0a-af8f-78d3c6053326', 'IMG_5980-2.jpg', '1HNNi9_OtLIB-HzR27cMZF8deriTs0_8g', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 4726, 3151, 10140997, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 30);
INSERT INTO public."Photo" VALUES ('d28c0bda-84b0-4327-9b3b-caa915f5f972', 'IMG_5992.jpg', '1NbD1uZMbRFVFW1RjpYirSMncfyDTK4wU', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 2304, 3456, 11287109, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 32);
INSERT INTO public."Photo" VALUES ('dada2493-94b0-40ff-8668-0065c6f2899a', 'IMG_6005.jpg', '1sluR4Hfy4yGb34yw2_CCW4g3cQ8j2fvr', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 8729242, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 33);
INSERT INTO public."Photo" VALUES ('c9b6c920-5582-4a8f-b7a9-be491cae6171', 'IMG_6005-2.jpg', '17HMVg9fL0SVeLeWAE_FZMvi_10843R94', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 15904565, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 34);
INSERT INTO public."Photo" VALUES ('a80a3e49-c358-4806-a193-7f2c853014c8', 'IMG_6015.jpg', '1FEE_xKr7wnCLPrbujw5x0eneBP6NffI9', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 10558873, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 35);
INSERT INTO public."Photo" VALUES ('0bb6a722-0e50-4f09-8cfe-440ec39874bd', 'IMG_6015-2.jpg', '17dkp_fIwTw1Wd5vxuYl6J8lVqVWghVfh', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 19361098, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 36);
INSERT INTO public."Photo" VALUES ('fac375a8-b6d4-46ba-a41e-842302b921fd', 'IMG_6023-2.jpg', '1v1uqGmOasBSJDKrSuNDPAasISGgz73rg', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3261, 4892, 10657413, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 37);
INSERT INTO public."Photo" VALUES ('9a6ba663-a868-4e90-9643-74df52d86337', 'IMG_6027.jpg', '1U6ZRSjDL217ZDWRx88esSi5cb0ycmaAF', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 12020820, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 39);
INSERT INTO public."Photo" VALUES ('5e0fe272-7dcf-4dec-8994-d419d87e8138', 'IMG_6029-2.jpg', '1D5DsNY9Txzkj-9IVAciQxSYzVVYv2KaV', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 23042496, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 42);
INSERT INTO public."Photo" VALUES ('518c4172-866b-4a68-9b1c-b9745824bf8f', 'IMG_6046.jpg', '1AJESpJT3QMFIOqrB2yngKTETMoZieAVJ', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 12459948, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 43);
INSERT INTO public."Photo" VALUES ('b3943986-a222-4c86-b61d-5362fc30b648', 'IMG_6046-2.jpg', '1W8EUxxY0mcBkVnkx_40gzB9yiVT4ZPYC', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 24272996, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 44);
INSERT INTO public."Photo" VALUES ('d3fea97a-5179-4195-87a0-d653dcd86d86', 'IMG_6051-2.jpg', '1lPtJTnsScCCxAUG8F5jn3IgNm53PFss-', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3351, 5027, 11061081, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 45);
INSERT INTO public."Photo" VALUES ('a3e36d7e-3198-41d1-a49f-6a02702b8a95', 'IMG_6093.jpg', '1B1gw1Hs-BxzSmaZMDNDcCcmWgdMqDz1N', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 5184, 3456, 11357234, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 48);
INSERT INTO public."Photo" VALUES ('0db371f6-cc12-4069-b413-b9823ab7172e', 'IMG_6093-2.jpg', '1SBqsalpuDQ-xrtMlTdBI7Eu_ECZH_GTw', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 5184, 3456, 21640571, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 50);
INSERT INTO public."Photo" VALUES ('a8ada8c3-85b3-4aa8-917b-70b650e42c2d', 'IMG_6097-2.jpg', '1FZ_T0nUGYoBG2TKpSrvWJKHdcwiUgUc3', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 5184, 3456, 11617533, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 51);
INSERT INTO public."Photo" VALUES ('91af4007-8602-4eed-ac01-3b94b1cd1555', 'IMG_6097.jpg', '1gTbMY3WVf0mbBOoy-z79D7j_jnkqXi2G', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 5184, 3456, 21485491, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 52);
INSERT INTO public."Photo" VALUES ('efd1a6e0-bfe4-4161-9547-286ca7ee7a55', 'IMG_6253-2.jpg', '1xIScjAZB14yFwNFAfJPlv3kmTfBhn97z', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 5184, 3456, 11375445, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 58);
INSERT INTO public."Photo" VALUES ('dc6d6cf1-823f-473c-a29f-13b28b5e3bcb', 'IMG_6277-2.jpg', '1GtXjLoDFLLEh6LKBUQN1dAzzT6eJlZXz', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 1981, 2972, 3898993, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 64);
INSERT INTO public."Photo" VALUES ('9043a8ac-d2d2-4628-895d-728c34ecd6a3', 'IMG_6308.jpg', '1SxVHpEUuVbK1w9S6BZzbdBQnUDN2SCxP', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 20937958, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 65);
INSERT INTO public."Photo" VALUES ('d8c8b537-2482-48ba-8139-2f1675812ffa', 'IMG_6308-2.jpg', '1LcfwYxH_zMAWylreGwdyhDS3TizkA7SW', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 11303443, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 66);
INSERT INTO public."Photo" VALUES ('46f72a11-30eb-4999-8e8d-756c42626317', 'IMG_6354.jpg', '1-xFmE-wbW-SaoLt_ackL1XzeiS7tmM1u', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 22478656, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 67);
INSERT INTO public."Photo" VALUES ('12340a17-8c25-4a3f-9ecc-83ab2e0687ae', 'IMG_6354-2.jpg', '183JomUnVbdm1f9c44wqg86gzyInrhVOY', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 12028065, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 68);
INSERT INTO public."Photo" VALUES ('20ff11e3-375d-45a8-9e40-726688fe2410', 'IMG_6407.jpg', '1-WvopD-j2jKGoq-kReXC1nk78_JGOwmO', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 5184, 3456, 19839249, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 75);
INSERT INTO public."Photo" VALUES ('a1968336-aad5-48ee-9914-8679ed557eaf', 'IMG_6407-2.jpg', '1oVt0LnTDZOyuWdv-uV-ULzmxKFYPS69x', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 5184, 3456, 11645207, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 76);
INSERT INTO public."Photo" VALUES ('1bad5a9a-bd3e-45eb-b76e-7ac2584592f8', 'IMG_6418.jpg', '1rrfPSPnRJV4WIBK_miTG04slPH-RCmQL', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 4648, 3099, 16062625, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 77);
INSERT INTO public."Photo" VALUES ('63d85a07-6a31-465d-8490-5d4682152bd7', 'IMG_6436.jpg', '1gc-cLj30ExyHErlm7SjGNQdOd8Uv5b6o', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 5184, 3456, 20596814, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 80);
INSERT INTO public."Photo" VALUES ('28c964a8-b605-469a-a36c-f6abda3272e3', '7.2-MB.jpg', '1T0M-2cBF6vb-4xeWPjZnpnhiguSqS--K', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 8999, 6478, 7542989, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 5);
INSERT INTO public."Photo" VALUES ('1f02a776-2e81-43d8-bcef-ecc356712f8a', 'IMG_6256.jpg', '1W3ZjkiXBgdi-gLnr1_6MJxNYkUjnMqDa', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 1758, 2637, 5271832, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 59);
INSERT INTO public."Photo" VALUES ('980d451a-fd42-4e77-a567-d3414b9060c2', 'IMG_6256-2.jpg', '1BuH1FQ59xumcEzrZJHeX3PdRNXNXhQw9', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 1758, 2637, 3009714, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 60);
INSERT INTO public."Photo" VALUES ('2b91ea4e-1f31-4de8-bd82-83f8cea95401', 'IMG_6257-2.jpg', '1iTtzhZffwls1vXhJeZEJ-rCtT_CPL4tR', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3249, 4874, 9677419, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 61);
INSERT INTO public."Photo" VALUES ('bdf86c4a-1bff-442c-a05e-b98a1117246f', 'IMG_6355.jpg', '1cwc2yknFN43yMreewgCbFaTwL1p531xR', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 24416578, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 69);
INSERT INTO public."Photo" VALUES ('b1b7f733-daea-482f-ab9c-6c4af9b283cc', 'IMG_6355-2.jpg', '1F-wsNdN-Qm-rdLggTT3hQ_0C_MLNbqc_', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 12325062, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 70);
INSERT INTO public."Photo" VALUES ('15807619-b951-4736-a66c-fcb703fd22f0', 'IMG_6375.jpg', '1lONS8IywqssNJ58yEs_8iP7knSuoz1OY', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 21538017, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 71);
INSERT INTO public."Photo" VALUES ('ac28f476-946f-4585-b0b6-210eb44c54cb', 'IMG_6375-2.jpg', '1UqR2UlP_2AQCpXlMMgmVOzwkrL0DFZ-P', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 11918385, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 72);
INSERT INTO public."Photo" VALUES ('02e61af1-8804-4477-ba81-2ff17c77c161', 'IMG_6401.jpg', '1b7ITTDtz1ugLo3Xiy4EJPSXNVQUYwmUZ', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 5184, 3456, 20219823, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 73);
INSERT INTO public."Photo" VALUES ('93ba85ac-7761-4033-ae4c-43670ad2c496', 'IMG_6401-2.jpg', '1yqfsYyJBXlFHrGjX2Fmht56_CfeKEL74', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 5184, 3456, 11470023, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 74);
INSERT INTO public."Photo" VALUES ('7650e577-0e45-4b51-bcaf-5f6871a7ddce', 'IMG_6418-2.jpg', '12H8VMmqswEMgU6-uH3KZ1ubu6fsdxVM2', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 4648, 3099, 9486847, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 78);
INSERT INTO public."Photo" VALUES ('9fdbe277-e999-403c-ae91-ab65f416dce3', 'IMG_6420-Enhanced-NR.jpg', '1rL5qfk5bBusBQ9WBnt-MxqSzG0-tSp8m', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 2217, 3326, 4305212, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 79);
INSERT INTO public."Photo" VALUES ('65b0eb2f-1aee-436b-b0ff-dafa35bf7853', 'IMG_6436-2.jpg', '1pqRwtp9dMoSGH_U3l06Txi54u_g4x-mT', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 5184, 3456, 11570151, 'image/jpeg', '067474f3-5074-47e0-a110-110792e23952', 81);
INSERT INTO public."Photo" VALUES ('88781910-2131-44fb-bcdc-cce562bca7b7', 'IMG_4560 (1).jpg', '1AEOHPJbDMOSDUC4_gkE5PnoiLjk2D9y8', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 8034744, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 16);
INSERT INTO public."Photo" VALUES ('0dcb7ff3-d8f5-48c1-9183-f5b1012fe098', 'IMG_4560 (3).jpg', '1nUUnZo5cOYXssXoQWZOd9Q54BDAyiJvX', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 800, 1200, 145360, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 17);
INSERT INTO public."Photo" VALUES ('17361885-9bd6-4cc0-acc7-36959b9aa0cb', 'sample-1.jpg', '1oIrgH4LH_LU1sSXQBYYHXISfHbt3mR-P', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 4096, 4096, 1062185, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 25);
INSERT INTO public."Photo" VALUES ('41703daf-f513-4a04-8759-48e82b18d5e0', '20240429_195527.jpg', '1UBFfYl1krF19Y6xYPQ8xEkbMQ8lY4UwZ', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3024, 4032, 4642316, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 26);
INSERT INTO public."Photo" VALUES ('073f4d48-ce2b-4915-ab33-59860cd2e557', 'IMG_4555-2.jpg', '1xDlWdU-pe23D6LWm4-xpvqGv1x93pCTz', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 2828, 1885, 1587753, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 3);
INSERT INTO public."Photo" VALUES ('e80598ac-c0e9-43cf-959f-073ceb58220e', 'IMG_4557 (12).jpg', '1eFfgqfBparNvZJtx1xBMIyl4DxeQOnjH', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 2559, 3839, 3214594, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 12);
INSERT INTO public."Photo" VALUES ('16f6e749-4919-440c-b626-201b368a2afd', 'IMG_4557 (13).jpg', '1bCfym11ggCK4LClY0l4LHVcdONwPWpa2', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 2559, 3839, 3214594, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 13);
INSERT INTO public."Photo" VALUES ('43acee4a-d9d3-4c31-9a51-4dc2e9d26a36', 'IMG_4557-2.jpg', '1LQVnNJN6N_oTVwgeAM3mJvIap6VouTxp', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 2559, 3839, 4411450, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 14);
INSERT INTO public."Photo" VALUES ('6e21a738-db40-40d6-bc3d-a33035c1cebd', 'IMG_4557.jpg', '1xf_boki_FuNLosjoaVolxj82VAp1L9A4', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 2559, 3839, 3214594, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 15);
INSERT INTO public."Photo" VALUES ('06e2500a-3616-4a20-bab4-0c433e7ccd6e', 'rfp-logo.png', '1M2gnFQgQjHiDNgOpglMvLdmjOk1NE3zR', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 500, 500, 214502, 'image/png', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 24);
INSERT INTO public."Photo" VALUES ('3c7dee9e-62b6-4ea6-ba1d-1250491a23f6', 'IMG_4555.jpg', '14CL6XUZwPxdsHybabJvf_jrPWSXZN-cW', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 2828, 1885, 1055782, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 7);
INSERT INTO public."Photo" VALUES ('7134ad8b-7e08-488f-8b7d-9db76af7df2a', 'IMG_4557 (7).jpg', '1xLVxGP1oimF6b9A9h2qM8Hq6Tsgn3r11', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 2559, 3839, 3214594, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 8);
INSERT INTO public."Photo" VALUES ('35931122-29cb-4aa9-b1d7-979176b45e55', 'IMG_4557 (9).jpg', '1n18p_bMxOwdN7H55pvsUXy-P86MBXIj0', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 533, 800, 76034, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 9);
INSERT INTO public."Photo" VALUES ('4ab97584-24ec-4640-812f-547c527e220d', 'IMG_4557 (10).jpg', '1CpwMRkR2vYQnhUlndGWp1AImE5A2U5jc', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 800, 1200, 148428, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 10);
INSERT INTO public."Photo" VALUES ('f334c6c7-2d9c-40a4-a4b0-e17f6dc41800', 'IMG_4557 (11).jpg', '1VoM4xVUNB0AQe-tDA5YYovqDN1bpjgMC', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 800, 1200, 148428, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 11);
INSERT INTO public."Photo" VALUES ('13d001f5-81bd-4a3a-b8e9-ee6035b15793', '7.2-MB.jpg', '1Dfi4J1BHZEZHNeu16oM59SeNGR9J9b1U', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 8999, 6478, 7542989, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 0);
INSERT INTO public."Photo" VALUES ('277eb8c1-4e89-49e6-8c4c-1c5a91b0aea5', 'sample-1.jpg', '1jZ654kSurLsLCdbBWrxKfk6JVymdybaG', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 4096, 4096, 1062185, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 1);
INSERT INTO public."Photo" VALUES ('363d2e5c-5319-4d65-996c-fd9adb32aa82', 'IMG_4555_websize.jpg', '1UF7cRUFAdRhemTsDICWttJWVizAcylgk', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 1600, 1066, 288496, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 6);
INSERT INTO public."Photo" VALUES ('0aa422e5-2c68-4753-9798-0f5fb1b1ea50', 'IMG_4557 (11).jpg', '1ZWVxqeAfChMyu1ZfRpdZuXpB9lUhjg-Q', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 800, 1200, 148428, 'image/jpeg', '42108a6a-e0e8-453c-89ca-60b643bb39ab', 0);
INSERT INTO public."Photo" VALUES ('fbd2d643-1105-4463-8f4b-f5da675ba9f6', 'IMG_4557 (12).jpg', '1EENNXnyG5fSQvS8uP9T__BZKaskbxyhr', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 2559, 3839, 3214594, 'image/jpeg', '42108a6a-e0e8-453c-89ca-60b643bb39ab', 1);
INSERT INTO public."Photo" VALUES ('fa911934-a1fb-4600-9260-fa6fa0bc25b9', 'IMG_4560.jpg', '1zUNr9LbtayLO_UKb0kGnFxw75cZB4XEw', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 8034744, 'image/jpeg', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 2);
INSERT INTO public."Photo" VALUES ('541cf64d-bf1d-4564-8ccf-bd5e1605a607', 'rfp-logo-removebg.png', '1F_IerJHdnf2eO28NRsZhsuEGHQe-LkZN', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 300, 300, 96300, 'image/png', '78e0defe-1c10-4650-86fb-8119ea1ccfb2', 4);
INSERT INTO public."Photo" VALUES ('caee6678-e929-446a-96eb-1071361260a7', 'IMG_4557 (13).jpg', '1HL_RbK76y6GUEvTOmXblAu4logc3pa_J', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 2559, 3839, 3214594, 'image/jpeg', '42108a6a-e0e8-453c-89ca-60b643bb39ab', 2);
INSERT INTO public."Photo" VALUES ('69687194-fe86-46b6-9a31-0bbe9fdf0841', 'IMG_4557-2.jpg', '1KOnCrlpugydyMap4FE9QNQuuzQfYtZF1', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 2559, 3839, 4411450, 'image/jpeg', '42108a6a-e0e8-453c-89ca-60b643bb39ab', 3);
INSERT INTO public."Photo" VALUES ('bca69879-74af-4fee-b222-9c9c4b62fa0f', 'IMG_4560.jpg', '1nYjbzYi4WPkLWvJAoZ_EFnQJaGOFpD7S', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 8034744, 'image/jpeg', '42108a6a-e0e8-453c-89ca-60b643bb39ab', 4);
INSERT INTO public."Photo" VALUES ('ffc71f45-267b-4d0e-8d9f-8045cbe3b475', 'IMG_5690-2.jpg', '18hnlykuwuYJ-Yi9oyvqIs_dQnZCtmzEh', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 4696, 3131, 2807132, 'image/jpeg', '42108a6a-e0e8-453c-89ca-60b643bb39ab', 5);
INSERT INTO public."Photo" VALUES ('4e5da71f-e64a-45ab-93b6-ee86b24d580b', 'IMG_5690.jpg', '1AqZ-NHnt5HFnsFekafiYbIqWTWyb64YV', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 4696, 3131, 4530533, 'image/jpeg', '42108a6a-e0e8-453c-89ca-60b643bb39ab', 6);
INSERT INTO public."Photo" VALUES ('934a6989-a43d-4ebb-b669-9c2bb7cffe3a', 'IMG_4557 (10).jpg', '1wS96So-hfAxWuD9Q846kHVvE2-iYzb5m', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 800, 1200, 148428, 'image/jpeg', '42108a6a-e0e8-453c-89ca-60b643bb39ab', 7);
INSERT INTO public."Photo" VALUES ('5e0415a6-d6e6-495b-aae1-33807821563a', 'IMG_4557 (11).jpg', '1o2Yhqj-J9Kk_jr81pMUj-xW_SyZpItSo', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 800, 1200, 148428, 'image/jpeg', '42108a6a-e0e8-453c-89ca-60b643bb39ab', 8);
INSERT INTO public."Photo" VALUES ('8c2ea304-6663-4e27-8399-3ddebbc1a00b', 'IMG_4557 (12).jpg', '177Z3Qec3pc6mBn80vnm5GZRW01_yqf-R', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 2559, 3839, 3214594, 'image/jpeg', '42108a6a-e0e8-453c-89ca-60b643bb39ab', 9);
INSERT INTO public."Photo" VALUES ('f060fdf9-02d1-4234-bc3e-65e95cf7b432', 'IMG_4557 (13).jpg', '1ChI32hVaHOoIcu_KriBSyhhnq69qGAFm', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 2559, 3839, 3214594, 'image/jpeg', '42108a6a-e0e8-453c-89ca-60b643bb39ab', 10);
INSERT INTO public."Photo" VALUES ('5deb1e09-0986-409f-9731-046269f9d796', 'IMG_4560-2.jpg', '1LHx87N2f2lUMd5Xacqg23TDj5R44-zYG', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 3456, 5184, 5686864, 'image/jpeg', '42108a6a-e0e8-453c-89ca-60b643bb39ab', 11);
INSERT INTO public."Photo" VALUES ('7634d8bf-824f-4085-aaa0-cf4769651e31', 'IMG_5690-2.jpg', '1DK_5GiOiR5fjDjkaaHK3VILWDtBoFbqk', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 4696, 3131, 2807132, 'image/jpeg', '42108a6a-e0e8-453c-89ca-60b643bb39ab', 12);
INSERT INTO public."Photo" VALUES ('b229edfe-78e8-46be-b315-41d5fc434387', 'IMG_5690.jpg', '1h2014Cg0SbpZyjjI4W26Js1N-PgUFvWL', 'firebase-adminsdk-19u64@rachel-gallery.iam.gserviceaccount.com', 4696, 3131, 4530533, 'image/jpeg', '42108a6a-e0e8-453c-89ca-60b643bb39ab', 13);


--
-- TOC entry 3378 (class 0 OID 40961)
-- Dependencies: 215
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: gallery_owner
--

INSERT INTO public."User" VALUES ('6b6c8714-1dc9-4739-95ab-c8fc9fce0230', 'rCUMLKE3Q1SLeHqNmZx7OhguaF02', 'amjudd315@gmail.com', 'Arthur', 'Jud', true);
INSERT INTO public."User" VALUES ('038415cf-50e5-4893-bad9-6e091ad37891', '3h4SDsy9R8TdGwEVDAl3GlxqW0B2', 'cheetolick311@gmail.com', 'Arthur', 'Judd', false);
INSERT INTO public."User" VALUES ('b34a8ff2-2c51-4272-a6f1-2985274ad370', '4QqESCAfoKdZqCZGdmQYDF1C2Yj1', 'deakrach@gmail.com', 'Rachel', 'Judd', true);
INSERT INTO public."User" VALUES ('7779a390-825b-46d6-ae3c-e32ecaecbff4', 'tIh9XHGrzYeUpTtVgEYMF6T7vhi1', 'simplyoliveapps@gmail.com', 'Olive', 'Apps', false);
INSERT INTO public."User" VALUES ('89bcdf75-6df2-4a38-a76d-1d29edb9f781', 'TifvZpIwKLfFh3d4Q5QEE5B0cw03', 'rflorencephoto@gmail.com', 'Rachel', 'Judd', true);
INSERT INTO public."User" VALUES ('8972b158-9ef2-4b74-a373-bbabbf0a9558', 'j81iS46GOITPQsoLl6ByKeWyUAJ2', 'sabrinasmith.monat@gmail.com', 'Sabrina', 'Smith', false);


--
-- TOC entry 3223 (class 2606 OID 106502)
-- Name: Client Client_pkey; Type: CONSTRAINT; Schema: public; Owner: gallery_owner
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_pkey" PRIMARY KEY (id);


--
-- TOC entry 3216 (class 2606 OID 40983)
-- Name: GallerySection GallerySection_pkey; Type: CONSTRAINT; Schema: public; Owner: gallery_owner
--

ALTER TABLE ONLY public."GallerySection"
    ADD CONSTRAINT "GallerySection_pkey" PRIMARY KEY (id);


--
-- TOC entry 3214 (class 2606 OID 40976)
-- Name: Gallery Gallery_pkey; Type: CONSTRAINT; Schema: public; Owner: gallery_owner
--

ALTER TABLE ONLY public."Gallery"
    ADD CONSTRAINT "Gallery_pkey" PRIMARY KEY (id);


--
-- TOC entry 3220 (class 2606 OID 81927)
-- Name: Inquiry Inquiry_pkey; Type: CONSTRAINT; Schema: public; Owner: gallery_owner
--

ALTER TABLE ONLY public."Inquiry"
    ADD CONSTRAINT "Inquiry_pkey" PRIMARY KEY (id);


--
-- TOC entry 3227 (class 2606 OID 106510)
-- Name: Opportunity Opportunity_pkey; Type: CONSTRAINT; Schema: public; Owner: gallery_owner
--

ALTER TABLE ONLY public."Opportunity"
    ADD CONSTRAINT "Opportunity_pkey" PRIMARY KEY (id);


--
-- TOC entry 3218 (class 2606 OID 40990)
-- Name: Photo Photo_pkey; Type: CONSTRAINT; Schema: public; Owner: gallery_owner
--

ALTER TABLE ONLY public."Photo"
    ADD CONSTRAINT "Photo_pkey" PRIMARY KEY (id);


--
-- TOC entry 3211 (class 2606 OID 40968)
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: gallery_owner
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- TOC entry 3221 (class 1259 OID 114688)
-- Name: Client_email_key; Type: INDEX; Schema: public; Owner: gallery_owner
--

CREATE UNIQUE INDEX "Client_email_key" ON public."Client" USING btree (email);


--
-- TOC entry 3212 (class 1259 OID 40992)
-- Name: Gallery_coverPhotoId_key; Type: INDEX; Schema: public; Owner: gallery_owner
--

CREATE UNIQUE INDEX "Gallery_coverPhotoId_key" ON public."Gallery" USING btree ("coverPhotoId");


--
-- TOC entry 3224 (class 1259 OID 106512)
-- Name: Opportunity_galleryId_key; Type: INDEX; Schema: public; Owner: gallery_owner
--

CREATE UNIQUE INDEX "Opportunity_galleryId_key" ON public."Opportunity" USING btree ("galleryId");


--
-- TOC entry 3225 (class 1259 OID 106511)
-- Name: Opportunity_inquiryId_key; Type: INDEX; Schema: public; Owner: gallery_owner
--

CREATE UNIQUE INDEX "Opportunity_inquiryId_key" ON public."Opportunity" USING btree ("inquiryId");


--
-- TOC entry 3209 (class 1259 OID 40991)
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: gallery_owner
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- TOC entry 3230 (class 2606 OID 40998)
-- Name: GallerySection GallerySection_galleryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gallery_owner
--

ALTER TABLE ONLY public."GallerySection"
    ADD CONSTRAINT "GallerySection_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES public."Gallery"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3228 (class 2606 OID 106528)
-- Name: Gallery Gallery_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gallery_owner
--

ALTER TABLE ONLY public."Gallery"
    ADD CONSTRAINT "Gallery_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3229 (class 2606 OID 40993)
-- Name: Gallery Gallery_coverPhotoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gallery_owner
--

ALTER TABLE ONLY public."Gallery"
    ADD CONSTRAINT "Gallery_coverPhotoId_fkey" FOREIGN KEY ("coverPhotoId") REFERENCES public."Photo"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3232 (class 2606 OID 106513)
-- Name: Opportunity Opportunity_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gallery_owner
--

ALTER TABLE ONLY public."Opportunity"
    ADD CONSTRAINT "Opportunity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3233 (class 2606 OID 106523)
-- Name: Opportunity Opportunity_galleryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gallery_owner
--

ALTER TABLE ONLY public."Opportunity"
    ADD CONSTRAINT "Opportunity_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES public."Gallery"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3234 (class 2606 OID 106518)
-- Name: Opportunity Opportunity_inquiryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gallery_owner
--

ALTER TABLE ONLY public."Opportunity"
    ADD CONSTRAINT "Opportunity_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES public."Inquiry"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3231 (class 2606 OID 41003)
-- Name: Photo Photo_gallerySectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gallery_owner
--

ALTER TABLE ONLY public."Photo"
    ADD CONSTRAINT "Photo_gallerySectionId_fkey" FOREIGN KEY ("gallerySectionId") REFERENCES public."GallerySection"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3390 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: gallery_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- TOC entry 2062 (class 826 OID 49153)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- TOC entry 2061 (class 826 OID 49152)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


-- Completed on 2024-08-23 09:53:13 MDT

--
-- PostgreSQL database dump complete
--

