## [BE-6] Club Model & Supabase Table Schema

### Goal

Define and implement a `public.clubs` table in Supabase to store core club data.  
Ensure the schema includes all necessary fields for MVP, supports extensibility, and links to the club creator (user).  
Prepare the table for CRUD operations and secure access.

---

### Acceptance Criteria

- `public.clubs` table is created in Supabase.
- Table includes at minimum:
  - `id` (UUID, PK)
  - `name` (string, required, unique per creator)
  - `type` (string, e.g., sports, scouts, hobby)
  - `description` (string, optional)
  - `logo_url` (string, optional)
  - `creator_id` (UUID, FK to `auth.users.id`)
  - `enabled_modules` (string[]/JSONB, default: null)
  - `created_at` (timestamp, default: now)
- Row Level Security (RLS) policies:
  - Only club creator can update/delete their club
  - Clubs are publicly readable by all authenticated users (for listing/joining)
- SQL scripts, RLS policy, and table documentation are included.
- Tested with Supabase dashboard and Postman.

---

### Tasks

1. **Define Table Schema**

   In Supabase SQL Editor, run:

   ```sql
   create table public.clubs (
     id uuid primary key default gen_random_uuid(),
     name text not null,
     type text not null,
     description text,
     logo_url text,
     creator_id uuid references auth.users(id) on delete set null,
     enabled_modules jsonb,
     created_at timestamp with time zone default timezone('utc'::text, now())
   );

   -- Unique club name per creator (optional, recommended)
   create unique index unique_club_name_per_creator
     on public.clubs (creator_id, lower(name));

   alter table public.clubs enable row level security;
   ```
