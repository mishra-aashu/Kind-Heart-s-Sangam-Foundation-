-- URGENT DATABASE MIGRATION SCRIPT
-- Add missing columns to make the donation form work
-- Run this script in your Supabase SQL editor IMMEDIATELY

-- Add all missing columns that the JavaScript is trying to use
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS donor_type TEXT,
ADD COLUMN IF NOT EXISTS anonymous BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS organization TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS donation_categories TEXT[],
ADD COLUMN IF NOT EXISTS preferred_pickup_date DATE,
ADD COLUMN IF NOT EXISTS preferred_pickup_time TEXT,
ADD COLUMN IF NOT EXISTS money JSONB,
ADD COLUMN IF NOT EXISTS clothes JSONB,
ADD COLUMN IF NOT EXISTS food JSONB,
ADD COLUMN IF NOT EXISTS other JSONB,
ADD COLUMN IF NOT EXISTS files TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verify the table now has all required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'registrations'
ORDER BY ordinal_position;

-- Test with sample data to ensure it works
INSERT INTO public.registrations (
    type, status, donor_type, anonymous, name, organization, phone, email,
    address, city, state, pincode, donation_categories, preferred_pickup_date, preferred_pickup_time,
    files, notes, money, clothes, food, other
) VALUES (
    'donor', 'Pending Review', 'Individual', false, 'Test Donor', NULL,
    '9876543210', 'test@example.com', '123 Test Street',
    'Aurangabad', 'Maharashtra', '431001', ARRAY['money'], '2024-01-15', '10:00 AM - 12:00 PM',
    NULL, 'Test donation',
    '{"amount": "1000", "currency": "INR", "paymentMethod": "UPI"}',
    NULL, NULL, NULL
);

-- Show success message
SELECT '✅ Database migration completed! All columns added successfully.' as result;

-- Optional: Clean up test data
-- DELETE FROM public.registrations WHERE email = 'test@example.com';