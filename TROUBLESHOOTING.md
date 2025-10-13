# Troubleshooting Guide

## "Failed to create new organization" Error

This error can occur due to several reasons. Follow these steps to diagnose and fix:

### 1. Check Environment Variables

Create a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**To get these values:**
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key
4. Replace the placeholder values in `.env.local`

### 2. Verify Database Table Exists

Make sure the `organisations` table exists in your Supabase database. Run this SQL in your Supabase SQL editor:

```sql
-- Check if organisations table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'organisations';

-- If table doesn't exist, create it:
CREATE TABLE organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    credits INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Check Row Level Security (RLS)

If RLS is enabled, you might need to create policies:

```sql
-- Enable RLS
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;

-- Create policy for superadmin access
CREATE POLICY "Superadmin can manage organisations" ON organisations
FOR ALL USING (true);
```

### 4. Check Browser Console

1. Open browser developer tools (F12)
2. Go to Console tab
3. Try creating an organization
4. Look for error messages and share them

### 5. Common Issues

**Issue: "relation 'organisations' does not exist"**
- Solution: Create the organisations table (see step 2)

**Issue: "permission denied for table organisations"**
- Solution: Check RLS policies (see step 3)

**Issue: "Invalid API key"**
- Solution: Check environment variables (see step 1)

**Issue: "Network error"**
- Solution: Check internet connection and Supabase project status

### 6. Debug Information

The superadmin page now shows debug information at the top:
- ✓ Set = Environment variable is configured
- ✗ Missing = Environment variable is not set
- Organisations count = Number of organizations loaded

### 7. Test Connection

The page automatically tests the Supabase connection on load. Check the console for:
- "Supabase connection test successful" = Working
- "Supabase connection test failed" = Check environment variables

### 8. Still Having Issues?

1. Check Supabase project status: https://status.supabase.com/
2. Verify your Supabase project is active
3. Check if you have the correct permissions
4. Try creating an organization directly in Supabase dashboard to test

### 9. Contact Support

If the issue persists, provide:
1. Browser console error messages
2. Debug information from the superadmin page
3. Your Supabase project URL (without the key)
4. Steps you've already tried

