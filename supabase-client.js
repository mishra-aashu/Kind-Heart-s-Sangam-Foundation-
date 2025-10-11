import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

/**
 * CRITICAL: ADMIN PERMISSION REQUIRED BEFORE EDITING THIS FILE
 *
 * This file contains Supabase client configuration for KIND HEART'S.
 * It includes sensitive API credentials and database connection settings.
 *
 * ANY CHANGES TO THIS FILE MUST BE APPROVED BY AN ADMINISTRATOR BEFORE IMPLEMENTATION.
 *
 * Contact admin before modifying:
 * - Supabase URL or API keys
 * - Client configuration settings
 * - Database connection parameters
 * - Authentication settings
 *
 * Unauthorized edits may compromise:
 * - Database security and access
 * - API functionality across the application
 * - Data integrity and user privacy
 * - System stability and performance
 */

// Configuration for Kind Heart's Sangam Foundation
// NOTE: In production, move these to secure environment variables

// Supabase configuration - UPDATE THESE VALUES
const supabaseUrl = 'https://pqvsulbbeuwtlngggkgc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxdnN1bGJiZXV3dGxuZ2dna2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTA0NzMsImV4cCI6MjA3NTA4NjQ3M30.PZS_vUoogiKedshNOZAS0sYZT0cUxNM-3CkovLsj6Po';

// For production deployment, you can use environment variables if available
// const supabaseUrl = import.meta?.env?.VITE_SUPABASE_URL || 'https://pqvsulbbeuwtlngggkgc.supabase.co';
// const supabaseKey = import.meta?.env?.VITE_SUPABASE_ANON_KEY || 'your-fallback-key';

// Validate required configuration
if (!supabaseUrl || !supabaseKey) {
    console.error('CRITICAL: Supabase configuration is missing. Please check your configuration.');
    throw new Error('Supabase configuration missing. Application cannot start.');
}

// Create the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✓ Supabase client initialized successfully');

// Attach to window for global access (needed for dashboard.js and other scripts)
window.supabase = supabase;

// Also export for ES6 modules
export default supabase;