-- =====================================================
-- Migración: Datos de prueba
-- Charlie Marketplace Builder v1.5
-- =====================================================

-- ── DEPARTAMENTOS ──────────────────────────────────────────────────────
INSERT INTO departamentos_75638143 (nombre, color, orden, activo) VALUES
  ('Celulares', '#F5DEB3', 1, true),
  ('Electro', '#DDA0DD', 2, true),
  ('Hogar', '#FFDAB9', 3, true),
  ('Mascotas', '#FA8072', 4, true),
  ('Moda', '#FFB6C1', 5, true),
  ('Deporte', '#D8BFD8', 6, true),
  ('Almacén', '#FFF8DC', 7, true),
  ('Motos', '#AFEEEE', 8, true),
  ('Limpieza', '#FFE4E1', 9, true),
  ('Salud', '#B0E0E6', 10, true),
  ('Ferretería', '#F0FFF0', 11, true),
  ('Librería', '#FFFDD0', 12, true),
  ('Bebés', '#E0B0FF', 13, true),
  ('Gaming', '#E6E6FA', 14, true),
  ('Jardín', '#FF7F50', 15, true),
  ('Autos', '#DDA0DD', 16, true),
  ('Belleza', '#FFB6C1', 17, true),
  ('Delivery', '#FFDAB9', 18, true)
ON CONFLICT (nombre) DO NOTHING;

-- ── VENDEDORES ──────────────────────────────────────────────────────────
INSERT INTO vendedores_75638143 (nombre, email, telefono, rating_promedio, total_ratings, activo) VALUES
  ('Oddy Market', 'ventas@oddymarket.com', '+598 99 123 456', 4.8, 150, true),
  ('TechStore Uruguay', 'contacto@techstore.uy', '+598 98 234 567', 4.6, 89, true),
  ('Casa Hogar', 'info@casahogar.uy', '+598 97 345 678', 4.7, 120, true),
  ('PetShop Premium', 'ventas@petshop.uy', '+598 96 456 789', 4.9, 67, true),
  ('Moda Urbana', 'contacto@modaurbana.uy', '+598 95 567 890', 4.5, 45, true)
ON CONFLICT DO NOTHING;

-- Obtener IDs de departamentos y vendedores para usar en productos
DO $$
DECLARE
  dept_celulares_id UUID;
  dept_electro_id UUID;
  dept_hogar_id UUID;
  dept_mascotas_id UUID;
  dept_moda_id UUID;
  dept_deporte_id UUID;
  vendedor_oddy_id UUID;
  vendedor_tech_id UUID;
  vendedor_hogar_id UUID;
  vendedor_pet_id UUID;
  vendedor_moda_id UUID;
BEGIN
  -- Obtener IDs de departamentos
  SELECT id INTO dept_celulares_id FROM departamentos_75638143 WHERE nombre = 'Celulares' LIMIT 1;
  SELECT id INTO dept_electro_id FROM departamentos_75638143 WHERE nombre = 'Electro' LIMIT 1;
  SELECT id INTO dept_hogar_id FROM departamentos_75638143 WHERE nombre = 'Hogar' LIMIT 1;
  SELECT id INTO dept_mascotas_id FROM departamentos_75638143 WHERE nombre = 'Mascotas' LIMIT 1;
  SELECT id INTO dept_moda_id FROM departamentos_75638143 WHERE nombre = 'Moda' LIMIT 1;
  SELECT id INTO dept_deporte_id FROM departamentos_75638143 WHERE nombre = 'Deporte' LIMIT 1;
  
  -- Obtener IDs de vendedores
  SELECT id INTO vendedor_oddy_id FROM vendedores_75638143 WHERE nombre = 'Oddy Market' LIMIT 1;
  SELECT id INTO vendedor_tech_id FROM vendedores_75638143 WHERE nombre = 'TechStore Uruguay' LIMIT 1;
  SELECT id INTO vendedor_hogar_id FROM vendedores_75638143 WHERE nombre = 'Casa Hogar' LIMIT 1;
  SELECT id INTO vendedor_pet_id FROM vendedores_75638143 WHERE nombre = 'PetShop Premium' LIMIT 1;
  SELECT id INTO vendedor_moda_id FROM vendedores_75638143 WHERE nombre = 'Moda Urbana' LIMIT 1;

  -- ── PRODUCTOS MARKET ─────────────────────────────────────────────────
  INSERT INTO productos_market_75638143 (
    nombre, descripcion, precio, precio_original, departamento_id, departamento_nombre,
    imagen_principal, imagenes, videos, vendedor_id, rating, rating_count, visitas,
    estado, badge, badge_color, published_date
  ) VALUES
    (
      'Funda iPhone 15 silicona premium',
      'Silicona líquida premium, compatible con carga inalámbrica. Protección para bordes y cámara. Disponible en 8 colores.',
      472, 590, dept_celulares_id, 'Celulares',
      'https://images.unsplash.com/photo-1574682592200-948fd815c4f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      '[]'::jsonb,
      '[]'::jsonb,
      vendedor_oddy_id, 4.3, 89, 0,
      'activo', '-20%', '', NOW() - INTERVAL '5 days'
    ),
    (
      'Auriculares TWS noise cancel',
      'Cancelación activa de ruido con 3 modos. 8hs + 22hs con estuche. Resistencia IPX4, driver 13mm, aptX.',
      1890, NULL, dept_electro_id, 'Electro',
      'https://images.unsplash.com/photo-1762553159827-7a5d2167b55d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      '[]'::jsonb,
      '["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"]'::jsonb,
      vendedor_tech_id, 4.7, 203, 0,
      'activo', 'Nuevo', 'cy', NOW() - INTERVAL '2 days'
    ),
    (
      'Set organizadores cocina x6',
      'Set 6 piezas: 3 rectangular + 2 cuadrado + 1 redondo. Tapa hermética, BPA free, apto microondas y lavavajillas.',
      890, NULL, dept_hogar_id, 'Hogar',
      'https://images.unsplash.com/photo-1768875845344-5663fa9acf15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      '[]'::jsonb,
      '[]'::jsonb,
      vendedor_hogar_id, 4.1, 56, 0,
      'activo', NULL, '', NOW() - INTERVAL '7 days'
    ),
    (
      'Cama premium mascotas talle L',
      'Relleno memory foam ortopédico, funda extraíble lavable. Para mascotas hasta 25kg. Antideslizante.',
      1290, NULL, dept_mascotas_id, 'Mascotas',
      'https://images.unsplash.com/photo-1749703174207-257698ceb352?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      '[]'::jsonb,
      '[]'::jsonb,
      vendedor_pet_id, 4.8, 142, 0,
      'activo', 'Top', 'cy', NOW() - INTERVAL '3 days'
    ),
    (
      'Smart TV 43" 4K Android TV',
      'Panel VA 4K UHD, Android TV 11, Chromecast built-in, HDMI 2.1 ×3, USB ×2, WiFi 5GHz, 60Hz, HDR10.',
      18500, 22000, dept_electro_id, 'Electro',
      'https://images.unsplash.com/photo-1730909352933-614f1673ac21?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      '[]'::jsonb,
      '[]'::jsonb,
      vendedor_tech_id, 4.5, 317, 0,
      'activo', '-16%', '', NOW() - INTERVAL '10 days'
    ),
    (
      'Zapatillas running urbanas',
      'Upper mesh transpirable, suela EVA amortiguada doble densidad, refuerzo talón. Talles 36-45. Unisex.',
      2890, NULL, dept_moda_id, 'Moda',
      'https://images.unsplash.com/photo-1761942028138-794f1d151e59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      '[]'::jsonb,
      '[]'::jsonb,
      vendedor_moda_id, 4.4, 78, 0,
      'activo', 'Nuevo', 'cy', NOW() - INTERVAL '4 days'
    )
  ON CONFLICT DO NOTHING;

  -- ── PRODUCTOS SECOND HAND ────────────────────────────────────────────
  INSERT INTO productos_secondhand_75638143 (
    nombre, descripcion, precio, precio_original, departamento_id, departamento_nombre,
    imagen_principal, imagenes, videos, vendedor_id, rating, rating_count, visitas,
    estado, condicion, published_date
  ) VALUES
    (
      'iPhone 13 128GB',
      'Batería 91% (verificado). Sin rayones en pantalla ni cuerpo. Con caja original, cargador y funda.',
      11500, 18000, dept_celulares_id, 'Celulares',
      'https://images.unsplash.com/photo-1635425730507-26c324aadbc5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      '[]'::jsonb,
      '["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"]'::jsonb,
      vendedor_oddy_id, 4.8, 12, 0,
      'activo', 'Muy bueno', NOW() - INTERVAL '6 days'
    ),
    (
      'MacBook Air M1 8GB',
      'Sin uso visible. Batería 45 ciclos. Caja original, cargador MagSafe. macOS Sonoma actualizado.',
      28000, 42000, dept_electro_id, 'Electro',
      'https://images.unsplash.com/photo-1574529395396-21637c4cf5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      '[]'::jsonb,
      '[]'::jsonb,
      vendedor_tech_id, 5.0, 8, 0,
      'activo', 'Excelente', NOW() - INTERVAL '8 days'
    ),
    (
      'Bicicleta mtb Rod 29',
      'Frenos hidráulicos Shimano, 21 velocidades. Neumáticos Kenda nuevos. Cuadro aluminio.',
      8500, 14000, dept_deporte_id, 'Deporte',
      'https://images.unsplash.com/photo-1571081790807-6933479d240f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      '[]'::jsonb,
      '[]'::jsonb,
      vendedor_oddy_id, 4.2, 5, 0,
      'activo', 'Bueno', NOW() - INTERVAL '10 days'
    ),
    (
      'Sony WH-1000XM4',
      'Estuche y cable originales. ANC funcionando perfectamente. Batería 95% de capacidad.',
      4200, 7500, dept_electro_id, 'Electro',
      'https://images.unsplash.com/photo-1764557159396-419b85356035?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      '[]'::jsonb,
      '[]'::jsonb,
      vendedor_tech_id, 4.9, 15, 0,
      'activo', 'Muy bueno', NOW() - INTERVAL '9 days'
    ),
    (
      'Pesas ajustables 20kg set',
      'Set completo: barra + 10 discos goma (1.25–5kg). Marcas de uso normales. Funcional al 100%.',
      3800, 6200, dept_deporte_id, 'Deporte',
      'https://images.unsplash.com/photo-1710746904729-f3ad9f682bb9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      '[]'::jsonb,
      '[]'::jsonb,
      vendedor_oddy_id, 4.3, 7, 0,
      'activo', 'Bueno', NOW() - INTERVAL '11 days'
    ),
    (
      'Sillón reclinable cuero eco',
      'Motor eléctrico silencioso, 3 posiciones. Cuero eco sin grietas. Un año de uso. Retiro mdeo.',
      6900, 12000, dept_hogar_id, 'Hogar',
      'https://images.unsplash.com/photo-1528045535275-50e5d46dbae8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
      '[]'::jsonb,
      '[]'::jsonb,
      vendedor_hogar_id, 4.7, 9, 0,
      'activo', 'Muy bueno', NOW() - INTERVAL '12 days'
    )
  ON CONFLICT DO NOTHING;

END $$;
