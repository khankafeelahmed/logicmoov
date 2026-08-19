ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS login_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_drivers_login_id_unique
  ON public.drivers (login_id)
  WHERE login_id IS NOT NULL;

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

DROP POLICY IF EXISTS "admins_can_read_all_documents" ON public.driver_documents;
CREATE POLICY "admins_can_read_all_documents"
  ON public.driver_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admins_can_update_all_documents" ON public.driver_documents;
CREATE POLICY "admins_can_update_all_documents"
  ON public.driver_documents
  FOR UPDATE
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
