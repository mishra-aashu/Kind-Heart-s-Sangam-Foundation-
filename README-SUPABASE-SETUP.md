# Supabase Setup Guide for KIND HEART'S

## Overview
This project has been migrated from Google Apps Script to Supabase for better scalability and modern database features.

## Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be set up (this can take a few minutes)

### 2. Run Database Schema
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the SQL script to create the `registrations` table

### 3. Verify Supabase Configuration
The Supabase client is already configured in `supabase-client.js` with your provided credentials:
- **URL**: https://pqvsulbbeuwtlngggkgc.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### 4. Test the Integration
1. Open `index.html` in a web browser
2. Fill out the registration form with test data
3. Submit the form
4. Check your Supabase dashboard to verify the data was inserted into the `registrations` table

## Database Schema

The `registrations` table includes the following fields:
- `id` (UUID, Primary Key)
- `timestamp` (Timestamp with timezone)
- `org_type` (Text)
- `org_name` (Text)
- `contact_person` (Text)
- `phone` (Text)
- `email` (Text)
- `address` (Text)
- `city` (Text)
- `pincode` (Text)
- `pickup_days` (Text)
- `pickup_time` (Text)
- `food_capacity` (Text)
- `food_type` (Text)
- `certificate_link` (Text, optional)
- `status` (Text, defaults to 'Pending Review')
- `created_at` (Timestamp with timezone)
- `updated_at` (Timestamp with timezone)

## Features
- **Row Level Security (RLS)**: Configured to allow public form submissions while protecting data access
- **Automatic Timestamps**: `created_at` and `updated_at` are automatically managed
- **Indexes**: Optimized for common query patterns (email, status, timestamp)
- **Validation**: Form validation remains intact from the original implementation

## Migration Changes Made
1. ✅ Removed Google Apps Script code (`code.gs`)
2. ✅ Updated `app.js` to use Supabase instead of Google Apps Script web app
3. ✅ Created Supabase database schema (`supabase-schema.sql`)
4. ✅ Configured Supabase client with provided credentials

## Next Steps
1. Run the SQL schema in your Supabase project
2. Test the form submission
3. Optionally set up email notifications using Supabase Edge Functions
4. Consider adding user authentication for the dashboard

## Troubleshooting
- If form submissions fail, check the browser console for error messages
- Verify the `registrations` table was created successfully in Supabase
- Ensure your Supabase project is active and the API keys are correct