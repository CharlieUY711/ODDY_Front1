-- =====================================================
-- Migración: Seguridad y RLS (Row Level Security)
-- Charlie Marketplace Builder v1.5
-- =====================================================

-- Habilitar RLS en todas las tablas del marketplace
ALTER TABLE departamentos_75638143 ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendedores_75638143 ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_market_75638143 ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_secondhand_75638143 ENABLE ROW LEVEL SECURITY;
ALTER TABLE preguntas_productos_75638143 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings_vendedores_75638143 ENABLE ROW LEVEL SECURITY;

-- ── POLÍTICAS PARA DEPARTAMENTOS ──────────────────────────────────────
-- Cualquiera puede leer departamentos activos
CREATE POLICY "Departamentos públicos - lectura"
  ON departamentos_75638143
  FOR SELECT
  USING (activo = true);

-- Solo service_role puede insertar/actualizar/eliminar
CREATE POLICY "Departamentos - solo admin"
  ON departamentos_75638143
  FOR ALL
  USING (auth.role() = 'service_role');

-- ── POLÍTICAS PARA VENDEDORES ──────────────────────────────────────────
-- Cualquiera puede leer vendedores activos
CREATE POLICY "Vendedores públicos - lectura"
  ON vendedores_75638143
  FOR SELECT
  USING (activo = true);

-- Solo service_role puede insertar/actualizar/eliminar
CREATE POLICY "Vendedores - solo admin"
  ON vendedores_75638143
  FOR ALL
  USING (auth.role() = 'service_role');

-- ── POLÍTICAS PARA PRODUCTOS MARKET ────────────────────────────────────
-- Cualquiera puede leer productos activos
CREATE POLICY "Productos Market públicos - lectura"
  ON productos_market_75638143
  FOR SELECT
  USING (estado = 'activo');

-- Solo service_role puede insertar/actualizar/eliminar
CREATE POLICY "Productos Market - solo admin"
  ON productos_market_75638143
  FOR ALL
  USING (auth.role() = 'service_role');

-- ── POLÍTICAS PARA PRODUCTOS SECOND HAND ───────────────────────────────
-- Cualquiera puede leer productos activos
CREATE POLICY "Productos SH públicos - lectura"
  ON productos_secondhand_75638143
  FOR SELECT
  USING (estado = 'activo');

-- Solo service_role puede insertar/actualizar/eliminar
CREATE POLICY "Productos SH - solo admin"
  ON productos_secondhand_75638143
  FOR ALL
  USING (auth.role() = 'service_role');

-- ── POLÍTICAS PARA PREGUNTAS ───────────────────────────────────────────
-- Cualquiera puede leer preguntas
CREATE POLICY "Preguntas públicas - lectura"
  ON preguntas_productos_75638143
  FOR SELECT
  USING (true);

-- Cualquiera puede crear preguntas (pero validaremos en la función)
CREATE POLICY "Preguntas públicas - creación"
  ON preguntas_productos_75638143
  FOR INSERT
  WITH CHECK (true);

-- Solo service_role puede actualizar/eliminar
CREATE POLICY "Preguntas - solo admin"
  ON preguntas_productos_75638143
  FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Preguntas - solo admin delete"
  ON preguntas_productos_75638143
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ── POLÍTICAS PARA RATINGS ─────────────────────────────────────────────
-- Cualquiera puede leer ratings
CREATE POLICY "Ratings públicos - lectura"
  ON ratings_vendedores_75638143
  FOR SELECT
  USING (true);

-- Cualquiera puede crear ratings (pero validaremos en la función)
CREATE POLICY "Ratings públicos - creación"
  ON ratings_vendedores_75638143
  FOR INSERT
  WITH CHECK (true);

-- Solo service_role puede actualizar/eliminar
CREATE POLICY "Ratings - solo admin"
  ON ratings_vendedores_75638143
  FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Ratings - solo admin delete"
  ON ratings_vendedores_75638143
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ── ÍNDICES ADICIONALES PARA SEGURIDAD Y PERFORMANCE ────────────────────
CREATE INDEX IF NOT EXISTS idx_productos_market_estado_activo 
  ON productos_market_75638143(estado) WHERE estado = 'activo';

CREATE INDEX IF NOT EXISTS idx_productos_sh_estado_activo 
  ON productos_secondhand_75638143(estado) WHERE estado = 'activo';

CREATE INDEX IF NOT EXISTS idx_departamentos_activo 
  ON departamentos_75638143(activo) WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_vendedores_activo 
  ON vendedores_75638143(activo) WHERE activo = true;

-- ── FUNCIONES DE VALIDACIÓN ─────────────────────────────────────────────

-- Función para validar que un rating esté en rango válido
CREATE OR REPLACE FUNCTION validate_rating(rating_value NUMERIC)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN rating_value >= 0 AND rating_value <= 5;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para validar que un precio sea positivo
CREATE OR REPLACE FUNCTION validate_precio(precio_value NUMERIC)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN precio_value > 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── CONSTRAINTS ADICIONALES ─────────────────────────────────────────────

-- Asegurar que el precio sea positivo
ALTER TABLE productos_market_75638143
  ADD CONSTRAINT check_precio_positivo 
  CHECK (precio > 0);

ALTER TABLE productos_secondhand_75638143
  ADD CONSTRAINT check_precio_positivo 
  CHECK (precio > 0);

-- Asegurar que el rating esté en rango válido
ALTER TABLE productos_market_75638143
  ADD CONSTRAINT check_rating_valido 
  CHECK (rating >= 0 AND rating <= 5);

ALTER TABLE productos_secondhand_75638143
  ADD CONSTRAINT check_rating_valido 
  CHECK (rating >= 0 AND rating <= 5);

-- Asegurar que precio_original sea mayor o igual a precio (si existe)
ALTER TABLE productos_market_75638143
  ADD CONSTRAINT check_precio_original_valido 
  CHECK (precio_original IS NULL OR precio_original >= precio);

ALTER TABLE productos_secondhand_75638143
  ADD CONSTRAINT check_precio_original_valido 
  CHECK (precio_original IS NULL OR precio_original >= precio);

-- ── TRIGGERS DE AUDITORÍA ───────────────────────────────────────────────

-- Tabla de auditoría (opcional, para tracking de cambios)
CREATE TABLE IF NOT EXISTS audit_log_75638143 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_record 
  ON audit_log_75638143(table_name, record_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at 
  ON audit_log_75638143(created_at DESC);

-- Función para registrar cambios en auditoría
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log_75638143 (table_name, record_id, action, old_data)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::jsonb);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log_75638143 (table_name, record_id, action, old_data, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log_75638143 (table_name, record_id, action, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW)::jsonb);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de auditoría a tablas críticas
CREATE TRIGGER audit_productos_market
  AFTER INSERT OR UPDATE OR DELETE ON productos_market_75638143
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_productos_sh
  AFTER INSERT OR UPDATE OR DELETE ON productos_secondhand_75638143
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ── COMENTARIOS ────────────────────────────────────────────────────────
COMMENT ON POLICY "Departamentos públicos - lectura" ON departamentos_75638143 IS 'Permite lectura pública de departamentos activos';
COMMENT ON POLICY "Productos Market públicos - lectura" ON productos_market_75638143 IS 'Permite lectura pública de productos activos';
COMMENT ON POLICY "Productos SH públicos - lectura" ON productos_secondhand_75638143 IS 'Permite lectura pública de productos activos';
COMMENT ON TABLE audit_log_75638143 IS 'Registro de auditoría para cambios en tablas críticas';
