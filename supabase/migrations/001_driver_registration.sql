BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_document_type') THEN
    CREATE TYPE public.driver_document_type AS ENUM (
      'transport_operating_license',
      'vehicle_insurance',
      'saaq_registration',
      'mechanical_inspection'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
    CREATE TYPE public.application_status AS ENUM (
      'draft',
      'submitted',
      'under_review',
      'documents_required',
      'approved',
      'rejected',
      'suspended'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
    CREATE TYPE public.document_status AS ENUM (
      'missing',
      'pending',
      'approved',
      'rejected',
      'expired',
      'expiring_soon',
      'urgent',
      'critical'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
    CREATE TYPE public.admin_role AS ENUM (
      'super_admin',
      'admin',
      'reviewer'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  date_of_birth date,
  address text,
  city text,
  province text,
  postal_code text,
  driver_license_number text,
  profile_photo_url text,
  application_status public.application_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  make text,
  model text,
  year integer,
  colour text,
  vin text,
  license_plate text,
  vehicle_type text,
  passenger_capacity integer,
  ownership_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  application_number text NOT NULL UNIQUE,
  status public.application_status NOT NULL DEFAULT 'draft',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.driver_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  document_type public.driver_document_type NOT NULL,
  document_number text,
  file_path text,
  original_filename text,
  mime_type text,
  file_size bigint,
  issue_date date,
  expiry_date date,
  status public.document_status NOT NULL DEFAULT 'missing',
  rejection_reason text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.application_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  old_status public.application_status,
  new_status public.application_status NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role public.admin_role NOT NULL DEFAULT 'reviewer',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.driver_document_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES public.drivers(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.driver_documents(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  reason text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY['drivers','vehicles','applications','driver_documents'])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I_set_updated_at ON public.%I;'
      , tbl || '_set_updated_at', tbl
    );

    EXECUTE format(
      'CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      tbl || '_set_updated_at',
      tbl
    );
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_email ON public.drivers(email);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON public.vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_applications_driver_id ON public.applications(driver_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_documents_driver_id ON public.driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.driver_documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_expiry_date ON public.driver_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_status_history_application_id ON public.application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_driver_id ON public.driver_document_audit_log(driver_id);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_document_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drivers_can_read_own_profile" ON public.drivers;
CREATE POLICY "drivers_can_read_own_profile"
ON public.drivers
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "drivers_can_update_own_profile" ON public.drivers;
CREATE POLICY "drivers_can_update_own_profile"
ON public.drivers
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "drivers_can_insert_own_profile" ON public.drivers;
CREATE POLICY "drivers_can_insert_own_profile"
ON public.drivers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "drivers_can_read_own_vehicles" ON public.vehicles;
CREATE POLICY "drivers_can_read_own_vehicles"
ON public.vehicles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.id = vehicles.driver_id
      AND d.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "drivers_can_manage_own_vehicles" ON public.vehicles;
CREATE POLICY "drivers_can_manage_own_vehicles"
ON public.vehicles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.id = vehicles.driver_id
      AND d.user_id = auth.uid()
  )
);

CREATE POLICY "drivers_can_update_own_vehicles"
ON public.vehicles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.id = vehicles.driver_id
      AND d.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.id = vehicles.driver_id
      AND d.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "drivers_can_read_own_applications" ON public.applications;
CREATE POLICY "drivers_can_read_own_applications"
ON public.applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.id = applications.driver_id
      AND d.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "drivers_can_insert_own_applications" ON public.applications;
CREATE POLICY "drivers_can_insert_own_applications"
ON public.applications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.id = applications.driver_id
      AND d.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "drivers_can_update_own_applications" ON public.applications;
CREATE POLICY "drivers_can_update_own_applications"
ON public.applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.id = applications.driver_id
      AND d.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.id = applications.driver_id
      AND d.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "drivers_can_read_own_documents" ON public.driver_documents;
CREATE POLICY "drivers_can_read_own_documents"
ON public.driver_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.id = driver_documents.driver_id
      AND d.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "drivers_can_manage_own_documents" ON public.driver_documents;
CREATE POLICY "drivers_can_manage_own_documents"
ON public.driver_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.id = driver_documents.driver_id
      AND d.user_id = auth.uid()
  )
);

CREATE POLICY "drivers_can_update_own_documents"
ON public.driver_documents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.id = driver_documents.driver_id
      AND d.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.id = driver_documents.driver_id
      AND d.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "drivers_can_read_own_status_history" ON public.application_status_history;
CREATE POLICY "drivers_can_read_own_status_history"
ON public.application_status_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.drivers d ON d.id = a.driver_id
    WHERE a.id = application_status_history.application_id
      AND d.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "drivers_can_read_own_audit_log" ON public.driver_document_audit_log;
CREATE POLICY "drivers_can_read_own_audit_log"
ON public.driver_document_audit_log
FOR SELECT
USING (
  driver_id IN (
    SELECT d.id
    FROM public.drivers d
    WHERE d.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "admins_can_read_all_drivers" ON public.drivers;
CREATE POLICY "admins_can_read_all_drivers"
ON public.drivers
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "admins_can_read_all_vehicles" ON public.vehicles;
CREATE POLICY "admins_can_read_all_vehicles"
ON public.vehicles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "admins_can_read_all_applications" ON public.applications;
CREATE POLICY "admins_can_read_all_applications"
ON public.applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "admins_can_manage_all_documents" ON public.driver_documents;
CREATE POLICY "admins_can_manage_all_documents"
ON public.driver_documents
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "admins_can_read_all_audit_log" ON public.driver_document_audit_log;
CREATE POLICY "admins_can_read_all_audit_log"
ON public.driver_document_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "admins_can_manage_status_history" ON public.application_status_history;
CREATE POLICY "admins_can_manage_status_history"
ON public.application_status_history
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "admins_can_manage_admin_users" ON public.admin_users;
CREATE POLICY "admins_can_manage_admin_users"
ON public.admin_users
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
      AND au.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
      AND au.role = 'super_admin'
  )
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-documents',
  'driver-documents',
  false,
  10485760,
  ARRAY['application/pdf','image/jpeg','image/png']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "drivers_can_upload_own_documents_in_storage"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'driver-documents'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.id::text = split_part(name, '/', 1)
      AND d.user_id = auth.uid()
  )
);

CREATE POLICY "drivers_can_read_own_documents_in_storage"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'driver-documents'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.id::text = split_part(name, '/', 1)
      AND d.user_id = auth.uid()
  )
);

CREATE POLICY "drivers_can_update_own_documents_in_storage"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'driver-documents'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.id::text = split_part(name, '/', 1)
      AND d.user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'driver-documents'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.id::text = split_part(name, '/', 1)
      AND d.user_id = auth.uid()
  )
);

CREATE POLICY "drivers_can_delete_own_documents_in_storage"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'driver-documents'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.drivers d
    WHERE d.id::text = split_part(name, '/', 1)
      AND d.user_id = auth.uid()
  )
);

CREATE POLICY "admins_can_access_all_driver_documents_in_storage"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'driver-documents'
  AND EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'driver-documents'
  AND EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
  )
);

COMMIT;
