-- full_schema_setup.sql
-- AI Image Judge Platform - Complete Single-Execution Setup Script
-- Run this in the Supabase Dashboard SQL Editor or via postgres connection to initialize the database.

-- 1. Initial Schema
\ir migrations/00001_initial_schema.sql

-- 2. RLS Policies
\ir policies/00001_rls_policies.sql

-- 3. Seed Scoring Versions
\ir seed/00001_seed_scoring_versions.sql

