-- First, create the extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE public.schools (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  school_name TEXT NOT NULL,
  center_number TEXT UNIQUE NOT NULL,
  school_email TEXT UNIQUE,
  region TEXT,
  district TEXT,
  school_badge_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  nin TEXT UNIQUE,
  email TEXT UNIQUE,
  role TEXT,
  contact_1 TEXT,
  qualifications TEXT,
  profile_photo_url TEXT,
  documents_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.registrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_category TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for schools table
CREATE POLICY "Allow users to see their own school"
ON public.schools FOR SELECT
USING ((SELECT school_id FROM public.profiles WHERE id = auth.uid()) = id);

CREATE POLICY "Allow new school creation"
ON public.schools FOR INSERT
WITH CHECK (true);

-- Create policies for profiles table
CREATE POLICY "Allow users to manage their own profile"
ON public.profiles FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow new user signup"
ON public.profiles FOR INSERT
WITH CHECK (true);

-- Create policies for registrations table
CREATE POLICY "Users can view their own registrations"
ON public.registrations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create registrations"
ON public.registrations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations"
ON public.registrations FOR UPDATE
USING (auth.uid() = user_id);

-- Set up storage buckets and policies
-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('school_badges', 'school_badges', true),
  ('profile_photos', 'profile_photos', true),
  ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Allow public viewing of school badges"
ON storage.objects FOR SELECT
USING ( bucket_id = 'school_badges' );

CREATE POLICY "Allow authenticated users to upload school badges"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'school_badges' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow public viewing of profile photos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profile_photos' );

CREATE POLICY "Allow authenticated users to upload profile photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile_photos'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow public viewing of documents"
ON storage.objects FOR SELECT
USING ( bucket_id = 'documents' );

CREATE POLICY "Allow authenticated users to upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
);