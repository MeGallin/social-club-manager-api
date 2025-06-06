Certainly! Here's the revised **BE-3** ticket, tailored for Supabase, formatted in markdown, and including a dedicated **How to Test in Postman** section.

---

````markdown
## [BE-3] Supabase User Profile Schema & Sync

### Goal

Implement a `public.profiles` table in Supabase to store extended user information, linked to the built-in `auth.users` table. This setup allows for storing additional user data (e.g., full name, avatar URL) while leveraging Supabase's authentication system.

---

### Acceptance Criteria

- A `public.profiles` table is created with a primary key reference to `auth.users.id`.
- The table includes fields: `full_name`, `avatar_url`, and `created_at`.
- A trigger function is established to automatically insert a new profile row upon user registration.
- Row Level Security (RLS) policies are configured to:
  - Allow users to read their own profile data.
  - Allow users to insert and update their own profile data.
- The setup is tested via Postman to ensure proper functionality.

---

### Tasks

1. **Create `public.profiles` Table**

   Execute the following SQL in the Supabase SQL editor:

   ```sql
   create table public.profiles (
     id uuid not null references auth.users on delete cascade,
     full_name text,
     avatar_url text,
     created_at timestamp with time zone default timezone('utc'::text, now()),
     primary key (id)
   );

   alter table public.profiles enable row level security;
   ```
````

2. **Set Up Trigger Function for Profile Creation**

   Create a function that inserts a new profile row when a user registers:

   ```sql
   create or replace function public.handle_new_user()
   returns trigger as $$
   begin
     insert into public.profiles (id, full_name, avatar_url)
     values (
       new.id,
       new.raw_user_meta_data ->> 'full_name',
       new.raw_user_meta_data ->> 'avatar_url'
     );
     return new;
   end;
   $$ language plpgsql security definer;
   ```

   Then, create a trigger to invoke this function:

   ```sql
   create trigger on_auth_user_created
   after insert on auth.users
   for each row execute procedure public.handle_new_user();
   ```

3. **Configure Row Level Security (RLS) Policies**

   Set up RLS policies to control access to the `profiles` table:

   ```sql
   -- Allow users to select their own profile
   create policy "Allow individual read access" on public.profiles
   for select using (auth.uid() = id);

   -- Allow users to insert their own profile
   create policy "Allow individual insert access" on public.profiles
   for insert with check (auth.uid() = id);

   -- Allow users to update their own profile
   create policy "Allow individual update access" on public.profiles
   for update using (auth.uid() = id);
   ```

4. **Test the Setup via Postman**

   - **Sign Up a New User:**

     - **Method:** POST
     - **URL:** `https://<your-project>.supabase.co/auth/v1/signup`
     - **Headers:**

       - `apikey`: Your Supabase anon or service role key
       - `Content-Type`: `application/json`

     - **Body:**

       ```json
       {
         "email": "newuser@example.com",
         "password": "securePassword123",
         "options": {
           "data": {
             "full_name": "New User",
             "avatar_url": "https://example.com/avatar.png"
           }
         }
       }
       ```

   - **Verify Profile Creation:**

     - **Method:** GET
     - **URL:** `https://<your-project>.supabase.co/rest/v1/profiles?id=eq.<user-id>`
     - **Headers:**

       - `apikey`: Your Supabase anon or service role key
       - `Authorization`: `Bearer <access_token>`
       - `Content-Type`: `application/json`

     Replace `<user-id>` with the UUID of the newly created user and `<access_token>` with the JWT obtained upon signup.

---

### References

- Supabase: Managing User Data
- Supabase: Auth Users
- Supabase: Row Level Security

---

**Completion Criteria:**

- The `public.profiles` table is successfully created and linked to `auth.users`.
- Trigger function and RLS policies are implemented and functioning as intended.
- Manual testing via Postman confirms that profiles are created upon user registration and that access controls are enforced.

```



```
