-- ═══════════════════════════════════════════════════════════════
-- STEP 1 — DATABASE SCHEMA (Run in Supabase SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- 1A. PROFILES TABLE
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  neural_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'pilot'
    CHECK (role IN ('super_admin', 'gym_owner', 'pilot')),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  gym_id UUID,
  access_level TEXT NOT NULL DEFAULT 'free'
    CHECK (access_level IN ('free', 'pro_os', 'legacy_citizen')),
  active_mode TEXT NOT NULL DEFAULT 'titan'
    CHECK (active_mode IN ('titan', 'zenith')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1B. GYMS TABLE (Created when gym owner registers)
CREATE TABLE gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  gym_name TEXT NOT NULL,
  pilot_code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  member_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1C. TASKS TABLE
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('titan', 'zenith')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'complete')),
  priority INT DEFAULT 1,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1D. TITAN SESSIONS TABLE
CREATE TABLE titan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INT NOT NULL,
  muscles_targeted TEXT[] NOT NULL,
  volume_score INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1E. ZENITH SESSIONS TABLE
CREATE TABLE zenith_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INT NOT NULL,
  focus_score INT DEFAULT 0,
  distraction_count INT DEFAULT 0,
  protocol_used TEXT,
  skill_category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1F. USER XP TABLE
CREATE TABLE user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('titan', 'zenith')),
  xp_points INT DEFAULT 0,
  level INT DEFAULT 1,
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category, mode)
);

-- 1G. USER STREAKS TABLE
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_active_date DATE,
  UNIQUE(user_id, streak_type)
);

-- 1H. LEADERBOARD CACHE TABLE
CREATE TABLE leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  neural_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  category TEXT DEFAULT 'global',
  score INT DEFAULT 0,
  rank INT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mode, category)
);

-- ═══════════════════════════════════════════════════════════════
-- STEP 2 — ROW LEVEL SECURITY POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE titan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE zenith_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- PROFILES: users see/edit only their own
CREATE POLICY "profiles_self" ON profiles
  FOR ALL USING (auth.uid() = id);

-- GYMS: owner manages their gym; pilots can read to validate pilot code
CREATE POLICY "gyms_owner_all" ON gyms
  FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "gyms_read_for_validation" ON gyms
  FOR SELECT USING (true);

-- TASKS, TITAN_SESSIONS, ZENITH_SESSIONS, USER_XP, USER_STREAKS: private
CREATE POLICY "tasks_self" ON tasks
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "titan_self" ON titan_sessions
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "zenith_self" ON zenith_sessions
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "xp_self" ON user_xp
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "streaks_self" ON user_streaks
  FOR ALL USING (auth.uid() = user_id);

-- LEADERBOARD: public read, private write
CREATE POLICY "leaderboard_public_read" ON leaderboard_cache
  FOR SELECT USING (true);
CREATE POLICY "leaderboard_self_write" ON leaderboard_cache
  FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- STEP 3 — DATABASE TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- 3A. AUTO-CREATE PROFILE on new auth user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  elements TEXT[] := ARRAY[
    'OXYGEN','CARBON','NITROGEN','HYDROGEN','NEON',
    'ARGON','XENON','KRYPTON','HELIUM','LITHIUM',
    'TITAN','ZENITH','AETHER','NOVA','NEXUS'
  ];
  random_element TEXT;
  random_digits TEXT;
  generated_neural_id TEXT;
BEGIN
  random_element := elements[1 + floor(random() * array_length(elements,1))::int];
  random_digits := lpad(floor(random() * 100000000)::text, 8, '0');
  generated_neural_id := '@' || random_element || '_' || random_digits;

  INSERT INTO public.profiles (id, neural_id, email, role, is_verified, created_at)
  VALUES (
    NEW.id,
    generated_neural_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'pilot'),
    COALESCE((NEW.raw_user_meta_data->>'is_verified')::boolean, false),
    now()
  );

  IF (NEW.raw_user_meta_data->>'role') = 'gym_owner' THEN
    INSERT INTO public.gyms (owner_id, gym_name, pilot_code)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'gym_name', 'ATHLETICS'),
      COALESCE(NEW.raw_user_meta_data->>'facility_code', 'OXY-' || floor(random() * 1000)::text)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3B. AUTO-GENERATE PILOT CODE when gym owner registers
CREATE OR REPLACE FUNCTION generate_pilot_code()
RETURNS TEXT AS $$
DECLARE
  prefixes TEXT[] := ARRAY['OXY','NEO','ARC','TRX','ZEN','NVX','HEX'];
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    code := prefixes[1 + floor(random() * array_length(prefixes,1))::int]
            || '-'
            || lpad(floor(random() * 1000)::text, 3, '0');
    SELECT EXISTS(SELECT 1 FROM gyms WHERE pilot_code = code) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 3C. AUTO-UPDATE updated_at on profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
