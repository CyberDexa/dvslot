-- Fix RLS Policies for DVSlot Database
-- Run this in your Supabase SQL Editor to fix the user profile creation issue

-- Add missing INSERT policy for user_profiles table
CREATE POLICY "Users can insert own profile" ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Also ensure we have all necessary policies for user_alerts table
-- (this replaces the old alerts table structure)

-- Check if user_alerts table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_alerts') THEN
        CREATE TABLE public.user_alerts (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
            test_center_id UUID REFERENCES public.test_centers(id) ON DELETE CASCADE,
            postcode TEXT,
            radius INTEGER DEFAULT 25,
            date_from DATE,
            date_until DATE,
            status TEXT DEFAULT 'active',
            alert_frequency INTEGER DEFAULT 15,
            last_checked_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Enable RLS on user_alerts
        ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies for user_alerts
        CREATE POLICY "Users can view own alerts" ON public.user_alerts FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own alerts" ON public.user_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own alerts" ON public.user_alerts FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own alerts" ON public.user_alerts FOR DELETE USING (auth.uid() = user_id);
        
        -- Create indexes
        CREATE INDEX idx_user_alerts_user_id ON public.user_alerts(user_id);
        CREATE INDEX idx_user_alerts_test_center_id ON public.user_alerts(test_center_id);
        CREATE INDEX idx_user_alerts_status ON public.user_alerts(status);
    END IF;
END $$;

-- Verify our policies are working
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('user_profiles', 'user_alerts', 'alerts')
ORDER BY tablename, policyname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies fixed!';
    RAISE NOTICE '🔐 User profiles can now be created during sign-up';
    RAISE NOTICE '📝 User alerts table ready for alert management';
END $$;
