/*
# Fix Function Security Issues

## Summary
Addresses four security advisories flagged by Supabase:

1. Mutable search_path on `handle_new_user`
2. Mutable search_path on `update_updated_at`
3. `anon` role can invoke `handle_new_user` via REST RPC
4. `authenticated` role can invoke `handle_new_user` via REST RPC

## Changes

### Functions Modified
- `public.handle_new_user` — adds `SET search_path = ''` and uses fully-qualified
  table name (`public.profiles`) to prevent search_path injection attacks.
- `public.update_updated_at` — adds `SET search_path = ''` to prevent the same class
  of vulnerability.

### Permissions Changed
- REVOKE EXECUTE on `handle_new_user` from PUBLIC, anon, and authenticated roles.
  This function is only ever called by the `on_auth_user_created` trigger (which runs
  as the function owner), so no role should be able to invoke it directly via the
  REST API (`/rest/v1/rpc/handle_new_user`).

## Security Notes
- `SET search_path = ''` forces all name resolution to be explicit, preventing an
  attacker from injecting a malicious schema earlier in the search path.
- Revoking direct EXECUTE does NOT affect the trigger — triggers run as the function
  owner regardless of role-level EXECUTE grants.
*/

-- Fix handle_new_user: lock down search_path and use fully-qualified names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Revoke direct invocation from all roles — trigger still works (runs as owner)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- Fix update_updated_at: lock down search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
