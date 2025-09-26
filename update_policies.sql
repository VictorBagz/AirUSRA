-- First, drop existing policies for schools
DROP POLICY IF EXISTS "Allow users to see their own school" ON public.schools;
DROP POLICY IF EXISTS "Allow new school creation" ON public.schools;

-- Create new, more permissive policies for schools
CREATE POLICY "Allow users to see all schools"
ON public.schools FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated users to create schools"
ON public.schools FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their school"
ON public.schools FOR UPDATE
USING ((SELECT school_id FROM public.profiles WHERE id = auth.uid()) = id);

-- Create players table with relaxed policies
CREATE TABLE IF NOT EXISTS public.players (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female')) NOT NULL,
    age_category TEXT CHECK (age_category IN ('U15', 'U17', 'U20')) NOT NULL,
    position TEXT,
    photo_url TEXT,
    student_id TEXT,
    school_id UUID REFERENCES public.schools(id) NOT NULL,
    medical_info TEXT,
    guardian_name TEXT,
    guardian_contact TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Enable RLS but with relaxed policies
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.players;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.players;
DROP POLICY IF EXISTS "Enable update for school members" ON public.players;
DROP POLICY IF EXISTS "Enable delete for school members" ON public.players;

-- Create very relaxed policies

-- 1. READ: Anyone authenticated can read any player's data
CREATE POLICY "Enable read access for all users"
ON public.players
FOR SELECT
USING (auth.role() = 'authenticated');

-- 2. INSERT: Any authenticated user can add players
CREATE POLICY "Enable insert for authenticated users"
ON public.players
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 3. UPDATE: School members can update their players (minimal restriction)
CREATE POLICY "Enable update for school members"
ON public.players
FOR UPDATE
USING (
    -- Only check if the user belongs to any school
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND school_id IS NOT NULL
    )
);

-- 4. DELETE: School members can delete their players (minimal restriction)
CREATE POLICY "Enable delete for school members"
ON public.players
FOR DELETE
USING (
    -- Only check if the user belongs to any school
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND school_id IS NOT NULL
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS players_school_id_idx ON public.players(school_id);
CREATE INDEX IF NOT EXISTS players_age_category_idx ON public.players(age_category);
CREATE INDEX IF NOT EXISTS players_gender_idx ON public.players(gender);