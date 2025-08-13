-- Add additional profile fields required by signup
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false;

-- Ensure username is unique when provided
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
  ON public.profiles (username)
  WHERE username IS NOT NULL;

-- Keep updated_at fresh on updates (uses existing helper)
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();