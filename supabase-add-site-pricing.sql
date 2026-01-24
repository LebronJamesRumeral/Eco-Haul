-- Add pricing columns to sites table
ALTER TABLE sites
ADD COLUMN IF NOT EXISTS price_per_unit NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS unit_type VARCHAR(10) DEFAULT 'CBM';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status);

-- Update any existing sites with default values if they have NULLs
UPDATE sites 
SET price_per_unit = COALESCE(price_per_unit, 0),
    unit_type = COALESCE(unit_type, 'CBM')
WHERE price_per_unit IS NULL OR unit_type IS NULL;
