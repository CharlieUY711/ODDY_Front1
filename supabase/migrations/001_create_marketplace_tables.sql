-- =====================================================
-- Migración: Crear tablas para el Marketplace
-- Charlie Marketplace Builder v1.5
-- =====================================================

-- 1. Tabla de Departamentos/Categorías
CREATE TABLE IF NOT EXISTS departamentos_75638143 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#C8C4BE', -- Color del departamento
  icono TEXT, -- Icono opcional
  orden INTEGER DEFAULT 0, -- Orden de visualización
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Vendedores (o usar personas_75638143 con tipo 'vendedor')
-- Por ahora creamos una tabla específica que puede relacionarse con personas
CREATE TABLE IF NOT EXISTS vendedores_75638143 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID, -- Foreign key a personas_75638143 (opcional)
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  rating_promedio NUMERIC(3,2) DEFAULT 0.0, -- Rating promedio (0-5)
  total_ratings INTEGER DEFAULT 0, -- Cantidad de ratings recibidos
  total_ventas INTEGER DEFAULT 0, -- Total de productos vendidos
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Productos Market (productos nuevos)
CREATE TABLE IF NOT EXISTS productos_market_75638143 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC(10,2) NOT NULL,
  precio_original NUMERIC(10,2), -- Precio original (para mostrar descuento)
  departamento_id UUID REFERENCES departamentos_75638143(id),
  departamento_nombre TEXT, -- Cache del nombre del departamento
  imagen_principal TEXT NOT NULL, -- URL de imagen principal
  imagenes JSONB DEFAULT '[]'::jsonb, -- Array de URLs de imágenes
  videos JSONB DEFAULT '[]'::jsonb, -- Array de URLs de videos
  vendedor_id UUID REFERENCES vendedores_75638143(id),
  rating NUMERIC(3,2) DEFAULT 0.0, -- Rating del producto
  rating_count INTEGER DEFAULT 0, -- Cantidad de ratings
  visitas INTEGER DEFAULT 0, -- Contador de visitas
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'vendido', 'agotado')),
  badge TEXT, -- Badge como 'Nuevo', 'Top', etc.
  badge_color TEXT, -- Color del badge
  published_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Productos Second Hand (productos usados)
CREATE TABLE IF NOT EXISTS productos_secondhand_75638143 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC(10,2) NOT NULL,
  precio_original NUMERIC(10,2), -- Precio original (para mostrar descuento)
  departamento_id UUID REFERENCES departamentos_75638143(id),
  departamento_nombre TEXT, -- Cache del nombre del departamento
  imagen_principal TEXT NOT NULL, -- URL de imagen principal
  imagenes JSONB DEFAULT '[]'::jsonb, -- Array de URLs de imágenes
  videos JSONB DEFAULT '[]'::jsonb, -- Array de URLs de videos
  vendedor_id UUID REFERENCES vendedores_75638143(id),
  rating NUMERIC(3,2) DEFAULT 0.0, -- Rating del producto
  rating_count INTEGER DEFAULT 0, -- Cantidad de ratings
  visitas INTEGER DEFAULT 0, -- Contador de visitas
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'vendido', 'agotado')),
  condicion TEXT, -- Condición: 'Muy bueno', 'Bueno', 'Regular', etc.
  published_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de Preguntas sobre Productos
CREATE TABLE IF NOT EXISTS preguntas_productos_75638143 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL, -- Puede ser de market o secondhand
  producto_tipo TEXT NOT NULL CHECK (producto_tipo IN ('market', 'secondhand')),
  pregunta TEXT NOT NULL,
  respuesta TEXT, -- Respuesta del vendedor (opcional)
  usuario_id UUID, -- Usuario que hizo la pregunta
  fecha TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla de Ratings de Vendedores
CREATE TABLE IF NOT EXISTS ratings_vendedores_75638143 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id UUID NOT NULL REFERENCES vendedores_75638143(id),
  usuario_id UUID, -- Usuario que hizo el rating
  rating NUMERIC(3,2) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  comentario TEXT, -- Comentario opcional
  producto_id UUID, -- Producto relacionado (opcional)
  producto_tipo TEXT CHECK (producto_tipo IN ('market', 'secondhand')),
  fecha TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_productos_market_departamento ON productos_market_75638143(departamento_id);
CREATE INDEX IF NOT EXISTS idx_productos_market_vendedor ON productos_market_75638143(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_productos_market_estado ON productos_market_75638143(estado);
CREATE INDEX IF NOT EXISTS idx_productos_sh_departamento ON productos_secondhand_75638143(departamento_id);
CREATE INDEX IF NOT EXISTS idx_productos_sh_vendedor ON productos_secondhand_75638143(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_productos_sh_estado ON productos_secondhand_75638143(estado);
CREATE INDEX IF NOT EXISTS idx_preguntas_producto ON preguntas_productos_75638143(producto_id, producto_tipo);
CREATE INDEX IF NOT EXISTS idx_ratings_vendedor ON ratings_vendedores_75638143(vendedor_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_departamentos_updated_at BEFORE UPDATE ON departamentos_75638143
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendedores_updated_at BEFORE UPDATE ON vendedores_75638143
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_market_updated_at BEFORE UPDATE ON productos_market_75638143
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_sh_updated_at BEFORE UPDATE ON productos_secondhand_75638143
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preguntas_updated_at BEFORE UPDATE ON preguntas_productos_75638143
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings_vendedores_75638143
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar rating del vendedor cuando se agrega un rating
CREATE OR REPLACE FUNCTION update_vendedor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vendedores_75638143
  SET 
    rating_promedio = (
      SELECT AVG(rating)::NUMERIC(3,2)
      FROM ratings_vendedores_75638143
      WHERE vendedor_id = NEW.vendedor_id
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM ratings_vendedores_75638143
      WHERE vendedor_id = NEW.vendedor_id
    )
  WHERE id = NEW.vendedor_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vendedor_rating_trigger
  AFTER INSERT OR UPDATE ON ratings_vendedores_75638143
  FOR EACH ROW EXECUTE FUNCTION update_vendedor_rating();

-- Comentarios en las tablas
COMMENT ON TABLE departamentos_75638143 IS 'Departamentos/Categorías de productos';
COMMENT ON TABLE vendedores_75638143 IS 'Vendedores del marketplace';
COMMENT ON TABLE productos_market_75638143 IS 'Productos nuevos (Market)';
COMMENT ON TABLE productos_secondhand_75638143 IS 'Productos usados (Second Hand)';
COMMENT ON TABLE preguntas_productos_75638143 IS 'Preguntas sobre productos';
COMMENT ON TABLE ratings_vendedores_75638143 IS 'Calificaciones de vendedores';
