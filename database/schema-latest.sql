--
-- PostgreSQL database dump
--

\restrict FobAh0DFL3aM9CxbU3ZAzCAiOFoTA7h7F7aOFQIbEtTHUDBD83vCy1YGrxMZbhb

-- Dumped from database version 15.15
-- Dumped by pg_dump version 16.10 (Homebrew)

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
-- Name: goodhive; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA goodhive;


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: add_email_to_wallet_account(integer, text); Type: FUNCTION; Schema: goodhive; Owner: -
--

CREATE FUNCTION goodhive.add_email_to_wallet_account(user_id integer, new_email text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if email already exists for another user
    IF EXISTS (
        SELECT 1 FROM goodhive.users 
        WHERE LOWER(email) = LOWER(new_email) 
        AND userid != user_id
        AND (is_deleted IS NULL OR is_deleted = FALSE)
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Update user with email
    UPDATE goodhive.users
    SET 
        email = new_email,
        auth_method = CASE 
            WHEN wallet_address IS NOT NULL THEN 'hybrid'
            ELSE 'email'
        END,
        email_verified = FALSE,
        updated_at = NOW()
    WHERE userid = user_id;
    
    RETURN TRUE;
END;
$$;


--
-- Name: FUNCTION add_email_to_wallet_account(user_id integer, new_email text); Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON FUNCTION goodhive.add_email_to_wallet_account(user_id integer, new_email text) IS 'Adds email to a wallet-only account, converting it to hybrid auth';


--
-- Name: check_otp_rate_limit(text); Type: FUNCTION; Schema: goodhive; Owner: -
--

CREATE FUNCTION goodhive.check_otp_rate_limit(user_email text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    otp_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO otp_count
    FROM goodhive.user_otp_verifications
    WHERE LOWER(email) = LOWER(user_email)
    AND created_at > NOW() - INTERVAL '1 hour';
    
    RETURN otp_count < 3; -- Allow max 3 OTPs per hour
END;
$$;


--
-- Name: cleanup_expired_otps(); Type: FUNCTION; Schema: goodhive; Owner: -
--

CREATE FUNCTION goodhive.cleanup_expired_otps() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM goodhive.user_otp_verifications
    WHERE expires_at < NOW();
END;
$$;


--
-- Name: find_duplicate_accounts(text, text); Type: FUNCTION; Schema: goodhive; Owner: -
--

CREATE FUNCTION goodhive.find_duplicate_accounts(check_email text, check_wallet_address text) RETURNS TABLE(userid integer, email text, wallet_address text, auth_method text, created_at timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT u.userid, u.email, u.wallet_address, u.auth_method, u.created_at
    FROM goodhive.users u
    WHERE (
        (check_email IS NOT NULL AND LOWER(u.email) = LOWER(check_email))
        OR 
        (check_wallet_address IS NOT NULL AND LOWER(u.wallet_address) = LOWER(check_wallet_address))
        OR
        (check_wallet_address IS NOT NULL AND LOWER(check_wallet_address) = ANY(
            SELECT LOWER(unnest(u.merged_wallet_addresses))
        ))
    )
    ORDER BY u.created_at ASC;
END;
$$;


--
-- Name: FUNCTION find_duplicate_accounts(check_email text, check_wallet_address text); Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON FUNCTION goodhive.find_duplicate_accounts(check_email text, check_wallet_address text) IS 'Finds all accounts matching given email or wallet address';


--
-- Name: find_user_account(text, text); Type: FUNCTION; Schema: goodhive; Owner: -
--

CREATE FUNCTION goodhive.find_user_account(input_email text DEFAULT NULL::text, input_wallet_address text DEFAULT NULL::text) RETURNS TABLE(userid integer, email text, wallet_address text, auth_method text, merged_wallet_addresses text[], is_primary boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- First check by exact wallet match
    IF input_wallet_address IS NOT NULL THEN
        RETURN QUERY
        SELECT u.userid, u.email, u.wallet_address, u.auth_method, 
               u.merged_wallet_addresses, TRUE as is_primary
        FROM goodhive.users u
        WHERE LOWER(u.wallet_address) = LOWER(input_wallet_address)
          AND (u.is_deleted IS NULL OR u.is_deleted = FALSE)
        LIMIT 1;
        
        -- If found, return
        IF FOUND THEN
            RETURN;
        END IF;
        
        -- Check in merged wallets
        RETURN QUERY
        SELECT u.userid, u.email, u.wallet_address, u.auth_method,
               u.merged_wallet_addresses, TRUE as is_primary
        FROM goodhive.users u
        WHERE LOWER(input_wallet_address) = ANY(
            SELECT LOWER(unnest(u.merged_wallet_addresses))
        )
        AND (u.is_deleted IS NULL OR u.is_deleted = FALSE)
        LIMIT 1;
        
        IF FOUND THEN
            RETURN;
        END IF;
    END IF;
    
    -- Check by email
    IF input_email IS NOT NULL THEN
        RETURN QUERY
        SELECT u.userid, u.email, u.wallet_address, u.auth_method,
               u.merged_wallet_addresses, TRUE as is_primary
        FROM goodhive.users u
        WHERE LOWER(u.email) = LOWER(input_email)
          AND (u.is_deleted IS NULL OR u.is_deleted = FALSE)
        LIMIT 1;
    END IF;
END;
$$;


--
-- Name: FUNCTION find_user_account(input_email text, input_wallet_address text); Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON FUNCTION goodhive.find_user_account(input_email text, input_wallet_address text) IS 'Finds user account by email or wallet, including merged accounts';


--
-- Name: find_user_by_wallet(text); Type: FUNCTION; Schema: goodhive; Owner: -
--

CREATE FUNCTION goodhive.find_user_by_wallet(input_wallet_address text) RETURNS TABLE(userid integer, email text, wallet_address text, thirdweb_wallet_address text, wallet_type text, auth_method text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check external wallet
    RETURN QUERY
    SELECT u.userid, u.email, u.wallet_address, u.thirdweb_wallet_address, 
           u.wallet_type, u.auth_method
    FROM goodhive.users u
    WHERE LOWER(u.wallet_address) = LOWER(input_wallet_address)
      AND (u.is_deleted IS NULL OR u.is_deleted = FALSE);
    
    IF FOUND THEN
        RETURN;
    END IF;
    
    -- Check thirdweb wallet
    RETURN QUERY
    SELECT u.userid, u.email, u.wallet_address, u.thirdweb_wallet_address,
           u.wallet_type, u.auth_method
    FROM goodhive.users u
    WHERE LOWER(u.thirdweb_wallet_address) = LOWER(input_wallet_address)
      AND (u.is_deleted IS NULL OR u.is_deleted = FALSE);
    
    IF FOUND THEN
        RETURN;
    END IF;
    
    -- Check merged wallets
    RETURN QUERY
    SELECT u.userid, u.email, u.wallet_address, u.thirdweb_wallet_address,
           u.wallet_type, u.auth_method
    FROM goodhive.users u
    WHERE LOWER(input_wallet_address) = ANY(
        SELECT LOWER(unnest(u.merged_wallet_addresses))
    )
    AND (u.is_deleted IS NULL OR u.is_deleted = FALSE);
END;
$$;


--
-- Name: FUNCTION find_user_by_wallet(input_wallet_address text); Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON FUNCTION goodhive.find_user_by_wallet(input_wallet_address text) IS 'Finds user by any type of wallet address';


--
-- Name: merge_user_accounts(integer, integer); Type: FUNCTION; Schema: goodhive; Owner: -
--

CREATE FUNCTION goodhive.merge_user_accounts(primary_user_id integer, secondary_user_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    secondary_wallet TEXT;
    secondary_email TEXT;
    secondary_merged_wallets TEXT[];
    secondary_merged_ids INTEGER[];
BEGIN
    -- Get secondary account details
    SELECT wallet_address, email, merged_wallet_addresses, merged_from_user_ids
    INTO secondary_wallet, secondary_email, secondary_merged_wallets, secondary_merged_ids
    FROM goodhive.users
    WHERE userid = secondary_user_id;
    
    -- Update primary account with merged data
    UPDATE goodhive.users
    SET 
        merged_wallet_addresses = array_cat(
            merged_wallet_addresses,
            array_append(COALESCE(secondary_merged_wallets, '{}'), secondary_wallet)
        ),
        merged_from_user_ids = array_cat(
            merged_from_user_ids,
            array_append(COALESCE(secondary_merged_ids, '{}'), secondary_user_id)
        ),
        email = COALESCE(email, secondary_email),
        auth_method = CASE 
            WHEN email IS NOT NULL AND wallet_address IS NOT NULL THEN 'hybrid'
            WHEN email IS NOT NULL THEN 'email'
            ELSE 'wallet'
        END
    WHERE userid = primary_user_id;
    
    -- Mark secondary account as merged (soft delete)
    UPDATE goodhive.users
    SET 
        is_deleted = TRUE,
        deleted_at = NOW(),
        email = email || '_merged_' || secondary_user_id::TEXT,
        wallet_address = wallet_address || '_merged_' || secondary_user_id::TEXT
    WHERE userid = secondary_user_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;


--
-- Name: FUNCTION merge_user_accounts(primary_user_id integer, secondary_user_id integer); Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON FUNCTION goodhive.merge_user_accounts(primary_user_id integer, secondary_user_id integer) IS 'Merges secondary account into primary account, preserving all wallet addresses';


--
-- Name: update_user_wallet(integer, text, boolean); Type: FUNCTION; Schema: goodhive; Owner: -
--

CREATE FUNCTION goodhive.update_user_wallet(user_id integer, new_wallet_address text, is_thirdweb_wallet boolean) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF is_thirdweb_wallet THEN
        -- Update thirdweb wallet
        UPDATE goodhive.users
        SET 
            thirdweb_wallet_address = new_wallet_address,
            wallet_type = CASE
                WHEN wallet_address IS NOT NULL THEN 'both'
                ELSE 'in-app'
            END,
            updated_at = NOW()
        WHERE userid = user_id;
    ELSE
        -- Update external wallet
        UPDATE goodhive.users
        SET 
            wallet_address = new_wallet_address,
            wallet_type = CASE
                WHEN thirdweb_wallet_address IS NOT NULL THEN 'both'
                ELSE 'external'
            END,
            updated_at = NOW()
        WHERE userid = user_id;
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;


--
-- Name: FUNCTION update_user_wallet(user_id integer, new_wallet_address text, is_thirdweb_wallet boolean); Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON FUNCTION goodhive.update_user_wallet(user_id integer, new_wallet_address text, is_thirdweb_wallet boolean) IS 'Updates user wallet address based on type';


--
-- Name: ensure_unique_talents(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_unique_talents() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Remove duplicates in the talents array
  NEW.talents := ARRAY(SELECT DISTINCT unnest(NEW.talents));
  RETURN NEW;
END;
$$;


--
-- Name: generate_12_digit_block_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_12_digit_block_id() RETURNS bigint
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_id BIGINT;
BEGIN
    LOOP
        new_id := floor(100000000000 + random() * 899999999999)::BIGINT; -- 12-digit number
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM goodhive.job_offers WHERE block_id = new_id
        );
    END LOOP;
    RETURN new_id;
END;
$$;


--
-- Name: generate_block_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_block_id() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  b BYTEA;
BEGIN
  b := gen_random_bytes(16);
  NEW.block_id := (
    get_byte(b, 0)::numeric * 2^120 +
    get_byte(b, 1)::numeric * 2^112 +
    get_byte(b, 2)::numeric * 2^104 +
    get_byte(b, 3)::numeric * 2^96 +
    get_byte(b, 4)::numeric * 2^88 +
    get_byte(b, 5)::numeric * 2^80 +
    get_byte(b, 6)::numeric * 2^72 +
    get_byte(b, 7)::numeric * 2^64 +
    get_byte(b, 8)::numeric * 2^56 +
    get_byte(b, 9)::numeric * 2^48 +
    get_byte(b, 10)::numeric * 2^40 +
    get_byte(b, 11)::numeric * 2^32 +
    get_byte(b, 12)::numeric * 2^24 +
    get_byte(b, 13)::numeric * 2^16 +
    get_byte(b, 14)::numeric * 2^8 +
    get_byte(b, 15)::numeric
  );
  RETURN NEW;
END;
$$;


--
-- Name: generate_unique_uint128(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_unique_uint128() RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_id numeric;
BEGIN
    LOOP
        new_id := (floor(random() * 9223372036854775807)::numeric * 9223372036854775808) 
                  + floor(random() * 9223372036854775807);
        IF NOT EXISTS (SELECT 1 FROM goodhive.job_offers WHERE block_id = new_id) THEN
            RETURN new_id;
        END IF;
    END LOOP;
END;
$$;


--
-- Name: set_block_id_if_null(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_block_id_if_null() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.block_id IS NULL THEN
        NEW.block_id := generate_12_digit_block_id();
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: set_random_block_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_random_block_id() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.block_id := FLOOR(100000000000 + RANDOM() * 899999999999)::NUMERIC;
  RETURN NEW;
END;
$$;


--
-- Name: validate_or_generate_block_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_or_generate_block_id() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    max_uint128 numeric := 340282366920938463463374607431768211455;
BEGIN
    IF NEW.block_id IS NULL OR NEW.block_id < 0 OR NEW.block_id > max_uint128 THEN
        NEW.block_id := generate_unique_uint128();
    END IF;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.users (
    id integer NOT NULL,
    email character varying(255),
    passwordhash character varying(255),
    userid uuid DEFAULT gen_random_uuid(),
    talent_status character varying(10) DEFAULT 'pending'::character varying,
    mentor_status character varying(10) DEFAULT 'pending'::character varying,
    recruiter_status character varying(10) DEFAULT 'pending'::character varying,
    wallet_address character varying(255),
    last_active timestamp with time zone DEFAULT now(),
    referred_by character varying(255),
    approved_roles jsonb[],
    first_name text,
    last_name text,
    thirdweb_smart_account_address character varying(255),
    auth_method character varying(50),
    merged_wallet_addresses text[] DEFAULT '{}'::text[],
    merged_from_user_ids integer[] DEFAULT '{}'::integer[],
    email_verified boolean DEFAULT false,
    email_verification_token text,
    email_verification_sent_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    deleted_at timestamp without time zone,
    thirdweb_wallet_address text,
    wallet_type text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_mentor_status CHECK (((mentor_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text]))),
    CONSTRAINT check_recruiter_status CHECK (((recruiter_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text]))),
    CONSTRAINT check_talent_status CHECK (((talent_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text]))),
    CONSTRAINT email_or_wallet_required CHECK (((email IS NOT NULL) OR (wallet_address IS NOT NULL))),
    CONSTRAINT users_wallet_type_check CHECK ((wallet_type = ANY (ARRAY['external'::text, 'in-app'::text, 'both'::text])))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON TABLE goodhive.users IS 'User accounts with cleaned up schema - removed legacy Okto and unused columns';


--
-- Name: COLUMN users.wallet_address; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON COLUMN goodhive.users.wallet_address IS 'External wallet address (MetaMask, WalletConnect, etc.)';


--
-- Name: COLUMN users.auth_method; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON COLUMN goodhive.users.auth_method IS 'Authentication method: email, wallet, or hybrid';


--
-- Name: COLUMN users.email_verified; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON COLUMN goodhive.users.email_verified IS 'Whether the user has verified their email address';


--
-- Name: COLUMN users.thirdweb_wallet_address; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON COLUMN goodhive.users.thirdweb_wallet_address IS 'Wallet address from Thirdweb in-app wallet (social/email logins)';


--
-- Name: COLUMN users.wallet_type; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON COLUMN goodhive.users.wallet_type IS 'Type of wallet: external, in-app, or both';


--
-- Name: active_users; Type: VIEW; Schema: goodhive; Owner: -
--

CREATE VIEW goodhive.active_users AS
 SELECT users.id,
    users.email,
    users.passwordhash,
    users.userid,
    users.talent_status,
    users.mentor_status,
    users.recruiter_status,
    users.wallet_address,
    users.last_active,
    users.referred_by,
    users.approved_roles,
    users.first_name,
    users.last_name,
    users.thirdweb_smart_account_address,
    users.auth_method,
    users.merged_wallet_addresses,
    users.merged_from_user_ids,
    users.email_verified,
    users.email_verification_token,
    users.email_verification_sent_at,
    users.is_deleted,
    users.deleted_at,
    users.thirdweb_wallet_address,
    users.wallet_type
   FROM goodhive.users
  WHERE ((users.is_deleted IS NULL) OR (users.is_deleted = false));


--
-- Name: admin; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.admin (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_id_seq; Type: SEQUENCE; Schema: goodhive; Owner: -
--

CREATE SEQUENCE goodhive.admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_id_seq; Type: SEQUENCE OWNED BY; Schema: goodhive; Owner: -
--

ALTER SEQUENCE goodhive.admin_id_seq OWNED BY goodhive.admin.id;


--
-- Name: companies; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.companies (
    headline character varying(5000),
    user_id uuid NOT NULL,
    designation character varying(500),
    address character varying(100),
    country character varying(100),
    city character varying(100),
    phone_country_code character varying(10),
    phone_number character varying(20),
    email character varying(255),
    telegram character varying(255),
    image_url character varying(255),
    linkedin character varying(255),
    github character varying(255),
    stackoverflow character varying(255),
    twitter character varying(255),
    portfolio character varying(255),
    status character varying(50),
    wallet_address character varying(255),
    approved boolean DEFAULT false,
    inreview boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: environment_info; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.environment_info (
    id integer NOT NULL,
    environment character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE environment_info; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON TABLE goodhive.environment_info IS 'Identifies this database as containing test/dummy data for development';


--
-- Name: environment_info_id_seq; Type: SEQUENCE; Schema: goodhive; Owner: -
--

CREATE SEQUENCE goodhive.environment_info_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: environment_info_id_seq; Type: SEQUENCE OWNED BY; Schema: goodhive; Owner: -
--

ALTER SEQUENCE goodhive.environment_info_id_seq OWNED BY goodhive.environment_info.id;


--
-- Name: github_candidates; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.github_candidates (
    id integer NOT NULL,
    github_username character varying(255) NOT NULL,
    github_id bigint,
    avatar_url text,
    html_url text,
    name character varying(255),
    email character varying(255),
    bio text,
    location character varying(255),
    company character varying(255),
    blog_url character varying(500),
    twitter_username character varying(255),
    followers integer DEFAULT 0,
    following integer DEFAULT 0,
    public_repos integer DEFAULT 0,
    public_gists integer DEFAULT 0,
    github_created_at timestamp without time zone,
    github_updated_at timestamp without time zone,
    activity_score numeric(3,2) DEFAULT 0,
    quality_score numeric(3,2) DEFAULT 0,
    engagement_score numeric(3,2) DEFAULT 0,
    web3_relevance_score numeric(3,2) DEFAULT 0,
    final_score numeric(3,2) DEFAULT 0,
    languages jsonb,
    top_repos jsonb,
    topics jsonb,
    contacted boolean DEFAULT false,
    contacted_at timestamp without time zone,
    response_status character varying(50),
    notes text,
    scraped_at timestamp without time zone DEFAULT now(),
    last_updated timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE github_candidates; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON TABLE goodhive.github_candidates IS 'GitHub developer profiles for Web3 talent recruitment';


--
-- Name: github_candidates_id_seq; Type: SEQUENCE; Schema: goodhive; Owner: -
--

CREATE SEQUENCE goodhive.github_candidates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: github_candidates_id_seq; Type: SEQUENCE OWNED BY; Schema: goodhive; Owner: -
--

ALTER SEQUENCE goodhive.github_candidates_id_seq OWNED BY goodhive.github_candidates.id;


--
-- Name: job_offers; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.job_offers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(100) NOT NULL,
    type_engagement character varying(255) NOT NULL,
    description character varying(5000),
    duration character varying(100),
    budget character varying(100),
    chain character varying(100),
    currency character varying(255),
    skills character varying(500),
    city character varying(255),
    country character varying(255),
    company_name character varying(255),
    image_url character varying(255),
    job_type character varying(255),
    project_type character varying(255),
    talent character varying(255),
    recruiter character varying(255),
    mentor character varying(255),
    wallet_address character varying(255),
    posted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    job_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    in_saving_stage boolean DEFAULT true,
    block_id numeric(39,0),
    published boolean DEFAULT false,
    escrow_amount boolean DEFAULT false
);


--
-- Name: job_offers_job_id_seq; Type: SEQUENCE; Schema: goodhive; Owner: -
--

CREATE SEQUENCE goodhive.job_offers_job_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: job_offers_job_id_seq; Type: SEQUENCE OWNED BY; Schema: goodhive; Owner: -
--

ALTER SEQUENCE goodhive.job_offers_job_id_seq OWNED BY goodhive.job_offers.job_id;


--
-- Name: job_sections; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.job_sections (
    id integer NOT NULL,
    job_id uuid NOT NULL,
    heading character varying(255) NOT NULL,
    content text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: job_sections_id_seq; Type: SEQUENCE; Schema: goodhive; Owner: -
--

CREATE SEQUENCE goodhive.job_sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: job_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: goodhive; Owner: -
--

ALTER SEQUENCE goodhive.job_sections_id_seq OWNED BY goodhive.job_sections.id;


--
-- Name: otps; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.otps (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    otp character varying(6) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE otps; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON TABLE goodhive.otps IS 'Stores one-time passwords for email authentication';


--
-- Name: otps_id_seq; Type: SEQUENCE; Schema: goodhive; Owner: -
--

CREATE SEQUENCE goodhive.otps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: otps_id_seq; Type: SEQUENCE OWNED BY; Schema: goodhive; Owner: -
--

ALTER SEQUENCE goodhive.otps_id_seq OWNED BY goodhive.otps.id;


--
-- Name: referrals; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.referrals (
    user_id uuid NOT NULL,
    referral_code character varying(6) NOT NULL,
    talents text[],
    companies text[],
    approved_talents text[],
    approved_companies text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: talents; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.talents (
    id integer NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    title character varying(1000000),
    description character varying(1000000),
    country character varying(100),
    city character varying(100),
    phone_country_code character varying(10),
    phone_number character varying(20),
    email character varying(255),
    telegram character varying(255),
    currency character varying(100),
    rate character varying(20),
    min_rate numeric(10,2),
    max_rate numeric(10,2),
    about_work character varying(1000000),
    skills character varying(1000000),
    image_url character varying(255),
    website character varying(100),
    cv_url character varying(255),
    linkedin character varying(255),
    github character varying(255),
    stackoverflow character varying(255),
    portfolio character varying(255),
    freelance_only boolean,
    remote_only boolean,
    talent boolean,
    mentor boolean,
    recruiter boolean,
    hide_contact_details boolean,
    referrer character varying(255),
    availability boolean,
    twitter character varying(255),
    last_active timestamp with time zone DEFAULT now(),
    user_id uuid,
    approved boolean DEFAULT false,
    inreview boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: talents_id_seq; Type: SEQUENCE; Schema: goodhive; Owner: -
--

CREATE SEQUENCE goodhive.talents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: talents_id_seq; Type: SEQUENCE OWNED BY; Schema: goodhive; Owner: -
--

ALTER SEQUENCE goodhive.talents_id_seq OWNED BY goodhive.talents.id;


--
-- Name: user_otp_verifications; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.user_otp_verifications (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    wallet_address character varying(255) NOT NULL,
    otp_code character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    attempts integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    last_attempt_at timestamp without time zone
);


--
-- Name: TABLE user_otp_verifications; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON TABLE goodhive.user_otp_verifications IS 'Stores OTP codes for email verification during social login';


--
-- Name: COLUMN user_otp_verifications.otp_code; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON COLUMN goodhive.user_otp_verifications.otp_code IS 'SHA256 hashed OTP code for security';


--
-- Name: COLUMN user_otp_verifications.attempts; Type: COMMENT; Schema: goodhive; Owner: -
--

COMMENT ON COLUMN goodhive.user_otp_verifications.attempts IS 'Number of failed verification attempts';


--
-- Name: user_otp_verifications_id_seq; Type: SEQUENCE; Schema: goodhive; Owner: -
--

CREATE SEQUENCE goodhive.user_otp_verifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_otp_verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: goodhive; Owner: -
--

ALTER SEQUENCE goodhive.user_otp_verifications_id_seq OWNED BY goodhive.user_otp_verifications.id;


--
-- Name: user_wallet_history; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.user_wallet_history (
    id bigint NOT NULL,
    user_id character varying(255) NOT NULL,
    wallet_address character varying(255) NOT NULL,
    wallet_type character varying(50),
    action character varying(20) NOT NULL,
    auth_provider character varying(50),
    session_id character varying(255),
    ip_address character varying(45),
    user_agent text,
    device_info json,
    location_info json,
    metadata json,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: user_wallet_history_id_seq; Type: SEQUENCE; Schema: goodhive; Owner: -
--

CREATE SEQUENCE goodhive.user_wallet_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_wallet_history_id_seq; Type: SEQUENCE OWNED BY; Schema: goodhive; Owner: -
--

ALTER SEQUENCE goodhive.user_wallet_history_id_seq OWNED BY goodhive.user_wallet_history.id;


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: goodhive; Owner: -
--

CREATE SEQUENCE goodhive.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: goodhive; Owner: -
--

ALTER SEQUENCE goodhive.users_id_seq OWNED BY goodhive.users.id;


--
-- Name: wallet_migrations; Type: TABLE; Schema: goodhive; Owner: -
--

CREATE TABLE goodhive.wallet_migrations (
    id bigint NOT NULL,
    user_id character varying(255) NOT NULL,
    okto_wallet_address character varying(255),
    thirdweb_wallet_address character varying(255),
    smart_account_address character varying(255),
    migration_status character varying(20) DEFAULT 'pending'::character varying,
    migration_type character varying(50),
    error_message text,
    error_stack text,
    retry_count integer DEFAULT 0,
    metadata json,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: wallet_migrations_id_seq; Type: SEQUENCE; Schema: goodhive; Owner: -
--

CREATE SEQUENCE goodhive.wallet_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wallet_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: goodhive; Owner: -
--

ALTER SEQUENCE goodhive.wallet_migrations_id_seq OWNED BY goodhive.wallet_migrations.id;


--
-- Name: job_offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_offers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(100) NOT NULL,
    type_engagement character varying(255) NOT NULL,
    description character varying(5000),
    duration character varying(100),
    budget character varying(100),
    chain character varying(100),
    currency character varying(255),
    skills character varying(500),
    city character varying(255),
    country character varying(255),
    company_name character varying(255),
    image_url character varying(255),
    job_type character varying(255),
    project_type character varying(255),
    talent character varying(255),
    recruiter character varying(255),
    mentor character varying(255),
    wallet_address character varying(255),
    escrow_amount character varying(255),
    posted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    wallet_address character varying(255) NOT NULL,
    referral_code character varying(6) NOT NULL,
    talents text[],
    companies text[],
    approved_talents text[],
    approved_companies text[]
);


--
-- Name: your_new_table_name; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.your_new_table_name (
    wallet_address character varying(255) NOT NULL,
    referral_code character varying(6) NOT NULL,
    talents jsonb,
    companies jsonb,
    approved_talents jsonb,
    approved_companies jsonb
);


--
-- Name: your_table_name; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.your_table_name (
    user_id uuid NOT NULL,
    wallet_address character varying(255) NOT NULL,
    referral_code character varying(6) NOT NULL,
    talents text[],
    companies text[],
    approved_talents text[],
    approved_companies text[]
);


--
-- Name: admin id; Type: DEFAULT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.admin ALTER COLUMN id SET DEFAULT nextval('goodhive.admin_id_seq'::regclass);


--
-- Name: environment_info id; Type: DEFAULT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.environment_info ALTER COLUMN id SET DEFAULT nextval('goodhive.environment_info_id_seq'::regclass);


--
-- Name: github_candidates id; Type: DEFAULT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.github_candidates ALTER COLUMN id SET DEFAULT nextval('goodhive.github_candidates_id_seq'::regclass);


--
-- Name: job_offers job_id; Type: DEFAULT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.job_offers ALTER COLUMN job_id SET DEFAULT nextval('goodhive.job_offers_job_id_seq'::regclass);


--
-- Name: job_sections id; Type: DEFAULT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.job_sections ALTER COLUMN id SET DEFAULT nextval('goodhive.job_sections_id_seq'::regclass);


--
-- Name: otps id; Type: DEFAULT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.otps ALTER COLUMN id SET DEFAULT nextval('goodhive.otps_id_seq'::regclass);


--
-- Name: talents id; Type: DEFAULT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.talents ALTER COLUMN id SET DEFAULT nextval('goodhive.talents_id_seq'::regclass);


--
-- Name: user_otp_verifications id; Type: DEFAULT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.user_otp_verifications ALTER COLUMN id SET DEFAULT nextval('goodhive.user_otp_verifications_id_seq'::regclass);


--
-- Name: user_wallet_history id; Type: DEFAULT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.user_wallet_history ALTER COLUMN id SET DEFAULT nextval('goodhive.user_wallet_history_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.users ALTER COLUMN id SET DEFAULT nextval('goodhive.users_id_seq'::regclass);


--
-- Name: wallet_migrations id; Type: DEFAULT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.wallet_migrations ALTER COLUMN id SET DEFAULT nextval('goodhive.wallet_migrations_id_seq'::regclass);


--
-- Name: admin admin_email_key; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.admin
    ADD CONSTRAINT admin_email_key UNIQUE (email);


--
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (id);


--
-- Name: job_offers block_id_unique; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.job_offers
    ADD CONSTRAINT block_id_unique UNIQUE (block_id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (user_id);


--
-- Name: environment_info environment_info_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.environment_info
    ADD CONSTRAINT environment_info_pkey PRIMARY KEY (id);


--
-- Name: github_candidates github_candidates_github_id_key; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.github_candidates
    ADD CONSTRAINT github_candidates_github_id_key UNIQUE (github_id);


--
-- Name: github_candidates github_candidates_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.github_candidates
    ADD CONSTRAINT github_candidates_pkey PRIMARY KEY (id);


--
-- Name: github_candidates github_username_unique; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.github_candidates
    ADD CONSTRAINT github_username_unique UNIQUE (github_username);


--
-- Name: job_offers job_offers_job_id_key; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.job_offers
    ADD CONSTRAINT job_offers_job_id_key UNIQUE (job_id);


--
-- Name: job_offers job_offers_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.job_offers
    ADD CONSTRAINT job_offers_pkey PRIMARY KEY (id);


--
-- Name: job_sections job_sections_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.job_sections
    ADD CONSTRAINT job_sections_pkey PRIMARY KEY (id);


--
-- Name: otps otps_email_key; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.otps
    ADD CONSTRAINT otps_email_key UNIQUE (email);


--
-- Name: otps otps_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.otps
    ADD CONSTRAINT otps_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (user_id);


--
-- Name: talents talents_email_key; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.talents
    ADD CONSTRAINT talents_email_key UNIQUE (email);


--
-- Name: talents talents_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.talents
    ADD CONSTRAINT talents_pkey PRIMARY KEY (id);


--
-- Name: user_otp_verifications unique_email_otp; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.user_otp_verifications
    ADD CONSTRAINT unique_email_otp UNIQUE (email);


--
-- Name: talents unique_user_id; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.talents
    ADD CONSTRAINT unique_user_id UNIQUE (user_id);


--
-- Name: user_otp_verifications user_otp_verifications_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.user_otp_verifications
    ADD CONSTRAINT user_otp_verifications_pkey PRIMARY KEY (id);


--
-- Name: user_wallet_history user_wallet_history_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.user_wallet_history
    ADD CONSTRAINT user_wallet_history_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_userid_key; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.users
    ADD CONSTRAINT users_userid_key UNIQUE (userid);


--
-- Name: wallet_migrations wallet_migrations_pkey; Type: CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.wallet_migrations
    ADD CONSTRAINT wallet_migrations_pkey PRIMARY KEY (id);


--
-- Name: job_offers job_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_offers
    ADD CONSTRAINT job_offers_pkey PRIMARY KEY (id);


--
-- Name: your_table_name your_table_name_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.your_table_name
    ADD CONSTRAINT your_table_name_pkey PRIMARY KEY (user_id);


--
-- Name: idx_admins_created_at; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_admins_created_at ON goodhive.admin USING btree (created_at DESC);


--
-- Name: idx_companies_approved; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_companies_approved ON goodhive.companies USING btree (approved);


--
-- Name: idx_companies_created_at; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_companies_created_at ON goodhive.companies USING btree (created_at DESC);


--
-- Name: idx_companies_in_review; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_companies_in_review ON goodhive.companies USING btree (inreview);


--
-- Name: idx_contacted; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_contacted ON goodhive.github_candidates USING btree (contacted);


--
-- Name: idx_final_score; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_final_score ON goodhive.github_candidates USING btree (final_score DESC);


--
-- Name: idx_github_username; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_github_username ON goodhive.github_candidates USING btree (github_username);


--
-- Name: idx_job_sections_job_id; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_job_sections_job_id ON goodhive.job_sections USING btree (job_id);


--
-- Name: idx_job_sections_sort_order; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_job_sections_sort_order ON goodhive.job_sections USING btree (job_id, sort_order);


--
-- Name: idx_jobs_created_at; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_jobs_created_at ON goodhive.job_offers USING btree (created_at DESC);


--
-- Name: idx_jobs_published; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_jobs_published ON goodhive.job_offers USING btree (published);


--
-- Name: idx_otp_email; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_otp_email ON goodhive.user_otp_verifications USING btree (lower((email)::text));


--
-- Name: idx_otp_expires; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_otp_expires ON goodhive.user_otp_verifications USING btree (expires_at);


--
-- Name: idx_otp_wallet; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_otp_wallet ON goodhive.user_otp_verifications USING btree (lower((wallet_address)::text));


--
-- Name: idx_otps_email; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_otps_email ON goodhive.otps USING btree (email);


--
-- Name: idx_scraped_at; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_scraped_at ON goodhive.github_candidates USING btree (scraped_at DESC);


--
-- Name: idx_talents_approved; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_talents_approved ON goodhive.talents USING btree (approved);


--
-- Name: idx_talents_created_at; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_talents_created_at ON goodhive.talents USING btree (created_at DESC);


--
-- Name: idx_talents_in_review; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_talents_in_review ON goodhive.talents USING btree (inreview);


--
-- Name: idx_users_auth_method; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_users_auth_method ON goodhive.users USING btree (auth_method);


--
-- Name: idx_users_created_at; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_users_created_at ON goodhive.users USING btree (created_at DESC);


--
-- Name: idx_users_email_lower; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_users_email_lower ON goodhive.users USING btree (lower((email)::text));


--
-- Name: idx_users_merged_wallets; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_users_merged_wallets ON goodhive.users USING gin (merged_wallet_addresses);


--
-- Name: idx_users_smart_account; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_users_smart_account ON goodhive.users USING btree (thirdweb_smart_account_address);


--
-- Name: idx_users_thirdweb_wallet; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_users_thirdweb_wallet ON goodhive.users USING btree (lower(thirdweb_wallet_address));


--
-- Name: idx_users_wallet_address_lower; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE UNIQUE INDEX idx_users_wallet_address_lower ON goodhive.users USING btree (lower((wallet_address)::text)) WHERE (wallet_address IS NOT NULL);


--
-- Name: idx_wallet_history_user_action; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_wallet_history_user_action ON goodhive.user_wallet_history USING btree (user_id, action);


--
-- Name: idx_wallet_history_wallet; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_wallet_history_wallet ON goodhive.user_wallet_history USING btree (wallet_address);


--
-- Name: idx_wallet_migrations_date; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_wallet_migrations_date ON goodhive.wallet_migrations USING btree (created_at);


--
-- Name: idx_wallet_migrations_user; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_wallet_migrations_user ON goodhive.wallet_migrations USING btree (user_id, migration_status);


--
-- Name: idx_web3_relevance; Type: INDEX; Schema: goodhive; Owner: -
--

CREATE INDEX idx_web3_relevance ON goodhive.github_candidates USING btree (web3_relevance_score DESC);


--
-- Name: job_offers auto_generate_block_id; Type: TRIGGER; Schema: goodhive; Owner: -
--

CREATE TRIGGER auto_generate_block_id BEFORE INSERT ON goodhive.job_offers FOR EACH ROW EXECUTE FUNCTION public.set_block_id_if_null();


--
-- Name: job_offers trg_set_block_id; Type: TRIGGER; Schema: goodhive; Owner: -
--

CREATE TRIGGER trg_set_block_id BEFORE INSERT ON goodhive.job_offers FOR EACH ROW WHEN ((new.block_id IS NULL)) EXECUTE FUNCTION public.set_random_block_id();


--
-- Name: job_offers trg_validate_block_id; Type: TRIGGER; Schema: goodhive; Owner: -
--

CREATE TRIGGER trg_validate_block_id BEFORE INSERT OR UPDATE ON goodhive.job_offers FOR EACH ROW EXECUTE FUNCTION public.validate_or_generate_block_id();


--
-- Name: referrals unique_talents_trigger; Type: TRIGGER; Schema: goodhive; Owner: -
--

CREATE TRIGGER unique_talents_trigger BEFORE INSERT OR UPDATE ON goodhive.referrals FOR EACH ROW EXECUTE FUNCTION public.ensure_unique_talents();


--
-- Name: talents fk_user_talents; Type: FK CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.talents
    ADD CONSTRAINT fk_user_talents FOREIGN KEY (user_id) REFERENCES goodhive.users(userid) ON DELETE CASCADE;


--
-- Name: job_sections job_sections_job_id_fkey; Type: FK CONSTRAINT; Schema: goodhive; Owner: -
--

ALTER TABLE ONLY goodhive.job_sections
    ADD CONSTRAINT job_sections_job_id_fkey FOREIGN KEY (job_id) REFERENCES goodhive.job_offers(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict FobAh0DFL3aM9CxbU3ZAzCAiOFoTA7h7F7aOFQIbEtTHUDBD83vCy1YGrxMZbhb
