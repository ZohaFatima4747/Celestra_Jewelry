# Implementation Plan: Supabase Migration

## Overview

Incremental migration from Express.js + MongoDB to Supabase. Each task is self-contained and can be executed without breaking the running application. The backend is removed only after all frontend features are migrated.

## Tasks

- [ ] 1. Install Supabase JS client and configure environment variables
  - Run `npm install @supabase/supabase-js` in both `frontend/` and `dashboard/client/`
  - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `frontend/.env` and `dashboard/client/.env`
  - Add the same keys to `.env.example` files in both apps
  - _Requirements: 1.1, 1.4_

- [ ] 2. Create Supabase client singleton
  - [ ] 2.1 Create `frontend/src/utils/supabaseClient.js` — initialise with env vars, throw on missing vars, export singleton
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ]* 2.2 Write unit test for supabaseClient — throws when env vars missing, returns client when present
    - Test the error thrown when `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is undefined
    - _Requirements: 1.3_
  - [ ] 2.3 Create `dashboard/client/src/utils/supabaseClient.js`