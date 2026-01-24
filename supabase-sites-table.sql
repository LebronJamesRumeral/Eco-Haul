-- Create sites table for managing mining sites
CREATE TABLE IF NOT EXISTS public.sites (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sites_status ON public.sites(status);
CREATE INDEX IF NOT EXISTS idx_sites_name ON public.sites(name);

-- Add site columns to payroll_records table
ALTER TABLE public.payroll_records 
ADD COLUMN IF NOT EXISTS site_id BIGINT REFERENCES public.sites(id),
ADD COLUMN IF NOT EXISTS site_name TEXT;

-- Enable Row Level Security
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.sites;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.sites;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.sites;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.sites;

-- Create policies for sites table (adjust based on your auth setup)
CREATE POLICY "Enable read access for all users" ON public.sites
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.sites
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.sites
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.sites
    FOR DELETE USING (true);

-- Insert some sample sites (optional)
INSERT INTO public.sites (name, location, status, description) VALUES
    ('North Mine', 'Sector A, Zone 1', 'Active', 'Primary excavation site'),
    ('South Pit', 'Sector B, Zone 3', 'Active', 'Secondary mining area'),
    ('East Quarry', 'Sector C, Zone 2', 'Active', 'Material processing zone'),
    ('West Processing', 'Sector D, Zone 4', 'Inactive', 'Under maintenance')
ON CONFLICT DO NOTHING;
