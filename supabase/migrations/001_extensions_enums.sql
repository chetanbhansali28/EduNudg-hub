-- Extensions and enums

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE public.portal_type AS ENUM (
  'platform', 'brand', 'center', 'learn', 'parents'
);

CREATE TYPE public.scope_type AS ENUM ('platform', 'brand', 'center');

CREATE TYPE public.membership_status AS ENUM ('invited', 'active', 'suspended', 'revoked');

CREATE TYPE public.brand_status AS ENUM ('draft', 'active', 'suspended', 'archived');

CREATE TYPE public.center_status AS ENUM ('pending', 'active', 'suspended', 'closed');

CREATE TYPE public.curriculum_status AS ENUM ('draft', 'published', 'archived');

CREATE TYPE public.enrollment_status AS ENUM ('active', 'completed', 'transferred', 'withdrawn');

CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'lost', 'converted');

CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled');

CREATE TYPE public.royalty_type AS ENUM ('fixed', 'percentage', 'per_student', 'per_level', 'hybrid');

CREATE TYPE public.auth_provider AS ENUM ('google', 'facebook', 'whatsapp', 'passkey', 'email', 'magic_link');

CREATE TYPE public.transfer_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
