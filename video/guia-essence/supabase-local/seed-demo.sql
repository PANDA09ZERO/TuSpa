-- Datos ficticios para las capturas del video (solo base local de demo).
-- Fechas relativas a hoy en horario de Perú para que la agenda siempre tenga citas.
BEGIN;

INSERT INTO categorias (nombre, descripcion, icono) VALUES
  ('Manicure', 'Cuidado y diseño de uñas de manos', '💅'),
  ('Pedicure', 'Cuidado de pies y uñas', '🦶'),
  ('Faciales', 'Limpieza e hidratación del rostro', '✨'),
  ('Masajes', 'Relajación y bienestar', '💆');

INSERT INTO servicios (nombre, descripcion, categoria, precio, duracion, estado) VALUES
  ('Manicure spa', 'Limpieza, exfoliación, hidratación y esmaltado clásico.', 'Manicure', 45, 60, 'activo'),
  ('Manicure en gel', 'Esmaltado semipermanente con acabado brillante por 3 semanas.', 'Manicure', 60, 75, 'activo'),
  ('Pedicure spa', 'Baño de pies, exfoliación, masaje e hidratación profunda.', 'Pedicure', 55, 60, 'activo'),
  ('Limpieza facial profunda', 'Limpieza, extracción, mascarilla y protector solar.', 'Faciales', 90, 60, 'activo'),
  ('Masaje relajante', 'Masaje de cuerpo completo con aceites esenciales.', 'Masajes', 120, 60, 'activo'),
  ('Masaje descontracturante', 'Trabajo focalizado en espalda, cuello y hombros.', 'Masajes', 100, 45, 'activo'),
  ('Diseño de cejas', 'Perfilado y diseño según tu rostro.', 'Faciales', 30, 30, 'inactivo');

INSERT INTO promociones (nombre, descripcion, descuento, fecha_inicio, fecha_fin, activa) VALUES
  ('Promo Noviembre', '10% de descuento en todos los servicios de manicure.', 10, (now() AT TIME ZONE 'America/Lima')::date - 7, (now() AT TIME ZONE 'America/Lima')::date + 23, true),
  ('Martes de relajo', '15% en masajes todos los martes.', 15, NULL, NULL, true),
  ('Verano 2026', 'Promoción de temporada pasada.', 20, '2026-01-01', '2026-03-31', false);

INSERT INTO clientes (nombre, apellido, telefono, email) VALUES
  ('María', 'López', '987 654 321', 'maria.lopez@ejemplo.pe'),
  ('Lucía', 'Fernández', '912 345 678', 'lucia.fernandez@ejemplo.pe'),
  ('Carmen', 'Rojas', '934 567 890', NULL),
  ('Valeria', 'Gutiérrez', '956 789 012', 'valeria.g@ejemplo.pe'),
  ('Rosa', 'Mendoza', '978 901 234', NULL),
  ('Sofía', 'Castillo', '990 123 456', 'sofia.castillo@ejemplo.pe');

COMMIT;
