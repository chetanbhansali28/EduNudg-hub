-- Core tenancy: profiles, brands, centers, memberships, domain_mappings

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  phone_e164 text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.profiles_touch_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_touch
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_touch_updated();

CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  status public.brand_status NOT NULL DEFAULT 'draft',
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  deleted_at timestamptz
);

CREATE TRIGGER brands_audit
  BEFORE INSERT OR UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.franchise_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  status public.center_status NOT NULL DEFAULT 'pending',
  address_line1 text,
  city text,
  region text,
  country text DEFAULT 'IN',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  deleted_at timestamptz,
  UNIQUE (brand_id, slug)
);

CREATE INDEX idx_centers_brand_status ON public.franchise_centers (brand_id, status) WHERE deleted_at IS NULL;

CREATE TRIGGER franchise_centers_audit
  BEFORE INSERT OR UPDATE ON public.franchise_centers
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope_type public.scope_type NOT NULL,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  role_key text NOT NULL,
  status public.membership_status NOT NULL DEFAULT 'invited',
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT memberships_scope_check CHECK (
    (scope_type = 'platform' AND brand_id IS NULL AND center_id IS NULL)
    OR (scope_type = 'brand' AND brand_id IS NOT NULL AND center_id IS NULL)
    OR (scope_type = 'center' AND brand_id IS NOT NULL AND center_id IS NOT NULL)
  )
);

CREATE INDEX idx_memberships_user ON public.memberships (user_id, status);

CREATE TRIGGER memberships_audit
  BEFORE INSERT OR UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

CREATE TABLE public.domain_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  center_id uuid REFERENCES public.franchise_centers(id) ON DELETE CASCADE,
  hostname text NOT NULL UNIQUE,
  portal_type public.portal_type NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  ssl_status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TRIGGER domain_mappings_audit
  BEFORE INSERT OR UPDATE ON public.domain_mappings
  FOR EACH ROW EXECUTE FUNCTION public.set_row_audit();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchise_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY domain_mappings_select ON public.domain_mappings FOR SELECT TO anon, authenticated
  USING (true);
