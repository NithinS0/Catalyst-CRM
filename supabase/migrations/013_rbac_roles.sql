-- Migration to update roles and provision default Super Admin

-- 1. Update existing role values
UPDATE public.profiles
SET role = 'company_admin'
WHERE role = 'admin';

UPDATE public.profiles
SET role = 'marketing_manager'
WHERE role = 'member';

-- 2. Add function to check user role easily from security definer context
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Provision Default Super Admin Auth User
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'f0000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'superadmin@catalyst.crm',
  -- bcrypt hash for 'password123'
  '$2a$10$7zB9iJ.g.gE4W8z1L7M/P.W6g8H7fC.zXG7V0mD1zZ9sO4.3b7D2q',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Super Admin"}',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- 4. Create Super Admin Profile (linked to default Acme CRM company c1111111-1111-1111-1111-111111111111)
INSERT INTO public.profiles (id, name, email, role, company_id)
VALUES (
  'f0000000-0000-0000-0000-000000000000',
  'Super Admin',
  'superadmin@catalyst.crm',
  'super_admin',
  'c1111111-1111-1111-1111-111111111111'
) ON CONFLICT (id) DO NOTHING;
