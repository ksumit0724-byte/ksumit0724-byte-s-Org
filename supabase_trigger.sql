-- Run this SQL in Supabase SQL Editor to update the handle_new_user trigger
-- This handles Neural ID auto-generation and Role assignment correctly.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  elements TEXT[] := ARRAY[
    'OXYGEN','CARBON','NITROGEN','NEON',
    'ARGON','XENON','TITAN','ZENITH',
    'AETHER','NOVA','NEXUS','HELIUM'
  ];
  random_element TEXT;
  random_digits TEXT;
  user_role TEXT;
  final_neural_id TEXT;
  gym_name_prefix TEXT;
  pilot_code_prefix TEXT;
BEGIN
  random_element := elements[
    1 + floor(random() * 
    array_length(elements,1))::int
  ];
  random_digits := lpad(
    floor(random() * 100000000)::text,
    8, '0'
  );
  
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'individual'
  );
  
  -- Map old roles to new valid roles
  IF user_role NOT IN (
    'individual','pilot',
    'gym_owner','super_admin'
  ) THEN
    user_role := 'individual';
  END IF;

  -- Generate Neural ID based on role
  IF user_role = 'individual' THEN
    final_neural_id := '@' || random_element || '_' || random_digits;
  ELSIF user_role = 'pilot' THEN
    pilot_code_prefix := COALESCE(NEW.raw_user_meta_data->>'facility_code', 'PILOT');
    final_neural_id := '@' || random_element || '_' || pilot_code_prefix || '_' || lpad(floor(random() * 10000)::text, 4, '0');
  ELSIF user_role = 'gym_owner' THEN
    gym_name_prefix := COALESCE(NEW.raw_user_meta_data->>'gym_name', 'FITNESS');
    gym_name_prefix := regexp_replace(upper(gym_name_prefix), '[^A-Z]', 'A', 'g');
    final_neural_id := '@TITAN_' || substring(gym_name_prefix from 1 for 7) || '_' || lpad(floor(random() * 10000)::text, 4, '0');
  ELSE
    final_neural_id := '@' || random_element || '_ADMIN_' || random_digits;
  END IF;

  INSERT INTO public.profiles (
    id, neural_id, email, 
    role, is_verified, created_at
  )
  VALUES (
    NEW.id,
    final_neural_id,
    NEW.email,
    user_role,
    CASE 
      WHEN user_role = 'individual' 
      THEN true
      WHEN user_role = 'pilot' 
      THEN true
      ELSE false
    END,
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
