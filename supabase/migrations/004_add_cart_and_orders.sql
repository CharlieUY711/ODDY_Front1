-- =====================================================
-- Migración: Carrito y Órdenes
-- Charlie Marketplace Builder v1.5
-- =====================================================

-- 1. Tabla de Carrito
CREATE TABLE IF NOT EXISTS carrito_75638143 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID, -- Usuario autenticado (opcional, puede ser null para carritos de invitados)
  sesion_id TEXT, -- ID de sesión para carritos de invitados
  producto_id UUID NOT NULL, -- ID del producto
  producto_tipo TEXT NOT NULL CHECK (producto_tipo IN ('market', 'secondhand')),
  cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL, -- Precio al momento de agregar al carrito
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, producto_id, producto_tipo), -- Un usuario solo puede tener un item por producto
  UNIQUE(sesion_id, producto_id, producto_tipo) -- Una sesión solo puede tener un item por producto
);

-- 2. Tabla de Órdenes
CREATE TABLE IF NOT EXISTS ordenes_75638143 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_orden TEXT UNIQUE NOT NULL, -- Número de orden único (ej: ORD-2025-001234)
  usuario_id UUID, -- Usuario que hizo la orden (opcional para invitados)
  sesion_id TEXT, -- ID de sesión para órdenes de invitados
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'en_proceso', 'enviada', 'entregada', 'cancelada')),
  subtotal NUMERIC(10,2) NOT NULL,
  impuestos NUMERIC(10,2) DEFAULT 0,
  envio NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  metodo_pago TEXT, -- 'tarjeta', 'transferencia', 'efectivo', etc.
  estado_pago TEXT DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'pagado', 'reembolsado', 'fallido')),
  -- Información de envío
  nombre_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  direccion TEXT,
  ciudad TEXT,
  codigo_postal TEXT,
  pais TEXT DEFAULT 'Uruguay',
  notas TEXT, -- Notas adicionales del cliente
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Items de Orden
CREATE TABLE IF NOT EXISTS orden_items_75638143 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID NOT NULL REFERENCES ordenes_75638143(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL,
  producto_tipo TEXT NOT NULL CHECK (producto_tipo IN ('market', 'secondhand')),
  nombre_producto TEXT NOT NULL, -- Cache del nombre del producto
  imagen_producto TEXT, -- Cache de la imagen del producto
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL, -- Precio al momento de la compra
  subtotal NUMERIC(10,2) NOT NULL, -- cantidad * precio_unitario
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_carrito_usuario ON carrito_75638143(usuario_id);
CREATE INDEX IF NOT EXISTS idx_carrito_sesion ON carrito_75638143(sesion_id);
CREATE INDEX IF NOT EXISTS idx_carrito_producto ON carrito_75638143(producto_id, producto_tipo);
CREATE INDEX IF NOT EXISTS idx_ordenes_usuario ON ordenes_75638143(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_sesion ON ordenes_75638143(sesion_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes_75638143(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_numero ON ordenes_75638143(numero_orden);
CREATE INDEX IF NOT EXISTS idx_orden_items_orden ON orden_items_75638143(orden_id);
CREATE INDEX IF NOT EXISTS idx_orden_items_producto ON orden_items_75638143(producto_id, producto_tipo);

-- Triggers para updated_at
CREATE TRIGGER update_carrito_updated_at BEFORE UPDATE ON carrito_75638143
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ordenes_updated_at BEFORE UPDATE ON ordenes_75638143
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para generar número de orden único
CREATE OR REPLACE FUNCTION generar_numero_orden()
RETURNS TEXT AS $$
DECLARE
  nuevo_numero TEXT;
  existe BOOLEAN;
BEGIN
  LOOP
    -- Formato: ORD-YYYY-NNNNNN (ej: ORD-2025-001234)
    nuevo_numero := 'ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                    LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    
    SELECT EXISTS(SELECT 1 FROM ordenes_75638143 WHERE numero_orden = nuevo_numero) INTO existe;
    
    EXIT WHEN NOT existe;
  END LOOP;
  
  RETURN nuevo_numero;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar número de orden automáticamente
CREATE OR REPLACE FUNCTION asignar_numero_orden()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_orden IS NULL OR NEW.numero_orden = '' THEN
    NEW.numero_orden := generar_numero_orden();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER asignar_numero_orden_trigger
  BEFORE INSERT ON ordenes_75638143
  FOR EACH ROW
  EXECUTE FUNCTION asignar_numero_orden();

-- Habilitar RLS
ALTER TABLE carrito_75638143 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_75638143 ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_items_75638143 ENABLE ROW LEVEL SECURITY;

-- ── POLÍTICAS PARA CARRITO ───────────────────────────────────────────────
-- Los usuarios pueden ver y gestionar su propio carrito
CREATE POLICY "Carrito - usuario propio"
  ON carrito_75638143
  FOR ALL
  USING (
    (usuario_id IS NOT NULL AND usuario_id = auth.uid()) OR
    (sesion_id IS NOT NULL AND sesion_id = current_setting('app.sesion_id', true))
  );

-- Service role puede hacer todo
CREATE POLICY "Carrito - service role"
  ON carrito_75638143
  FOR ALL
  USING (auth.role() = 'service_role');

-- ── POLÍTICAS PARA ÓRDENES ────────────────────────────────────────────────
-- Los usuarios pueden ver sus propias órdenes
CREATE POLICY "Órdenes - usuario propio"
  ON ordenes_75638143
  FOR SELECT
  USING (
    (usuario_id IS NOT NULL AND usuario_id = auth.uid()) OR
    (sesion_id IS NOT NULL AND sesion_id = current_setting('app.sesion_id', true))
  );

-- Los usuarios pueden crear órdenes
CREATE POLICY "Órdenes - crear"
  ON ordenes_75638143
  FOR INSERT
  WITH CHECK (
    (usuario_id IS NULL OR usuario_id = auth.uid()) OR
    (sesion_id IS NOT NULL)
  );

-- Service role puede hacer todo
CREATE POLICY "Órdenes - service role"
  ON ordenes_75638143
  FOR ALL
  USING (auth.role() = 'service_role');

-- ── POLÍTICAS PARA ITEMS DE ORDEN ─────────────────────────────────────────
-- Los usuarios pueden ver items de sus órdenes
CREATE POLICY "Items orden - usuario propio"
  ON orden_items_75638143
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ordenes_75638143 o
      WHERE o.id = orden_items_75638143.orden_id
      AND (
        (o.usuario_id IS NOT NULL AND o.usuario_id = auth.uid()) OR
        (o.sesion_id IS NOT NULL AND o.sesion_id = current_setting('app.sesion_id', true))
      )
    )
  );

-- Los usuarios pueden crear items cuando crean una orden
CREATE POLICY "Items orden - crear"
  ON orden_items_75638143
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ordenes_75638143 o
      WHERE o.id = orden_items_75638143.orden_id
      AND (
        (o.usuario_id IS NULL OR o.usuario_id = auth.uid()) OR
        (o.sesion_id IS NOT NULL)
      )
    )
  );

-- Service role puede hacer todo
CREATE POLICY "Items orden - service role"
  ON orden_items_75638143
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comentarios en las tablas
COMMENT ON TABLE carrito_75638143 IS 'Carrito de compras de usuarios';
COMMENT ON TABLE ordenes_75638143 IS 'Órdenes de compra';
COMMENT ON TABLE orden_items_75638143 IS 'Items individuales de cada orden';
