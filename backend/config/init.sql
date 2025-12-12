-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS recetas_web CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE recetas_web;

-- =======================
-- TABLA: usuarios
-- =======================
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre_usuario VARCHAR(50) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255) DEFAULT NULL,
  edad INT,
  altura_cm INT,
  peso_kg DECIMAL(5,2),
  actividad ENUM('sedentario', 'ligero', 'moderado', 'intenso', 'muy_intenso'),
  objetivo ENUM('bajar_peso', 'mantener', 'ganar_musculo'),
  genero ENUM('male','female') DEFAULT 'male',
  rol ENUM('usuario', 'admin') DEFAULT 'usuario',
  requiere_cambio_password TINYINT(1) DEFAULT 0,
  calorias_diarias INT DEFAULT NULL,
  proteinas_diarias INT DEFAULT NULL,
  grasas_diarias INT DEFAULT NULL,
  carbohidratos_diarias INT DEFAULT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =======================
-- TABLA: recetas
-- =======================
CREATE TABLE IF NOT EXISTS recetas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT,
  imagen_url VARCHAR(255),
  calorias INT,
  proteinas DECIMAL(5,2),
  carbohidratos DECIMAL(5,2),
  grasas DECIMAL(5,2),
  tiempo_preparacion INT, -- minutos
  fuente ENUM('spoonacular', 'usuario') DEFAULT 'spoonacular',
  id_usuario INT, -- si fue creada por un usuario
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- =======================
-- TABLA: ingredientes
-- =======================
CREATE TABLE IF NOT EXISTS ingredientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL
);

-- =======================
-- TABLA: receta_ingredientes
-- Relación muchos a muchos entre recetas e ingredientes
-- =======================
CREATE TABLE IF NOT EXISTS receta_ingredientes (
  id_receta INT,
  id_ingrediente INT,
  cantidad VARCHAR(50),
  PRIMARY KEY (id_receta, id_ingrediente),
  FOREIGN KEY (id_receta) REFERENCES recetas(id) ON DELETE CASCADE,
  FOREIGN KEY (id_ingrediente) REFERENCES ingredientes(id) ON DELETE CASCADE
);

-- =======================
-- TABLA: receta_pasos
-- Pasos dinámicos de preparación
-- =======================
CREATE TABLE IF NOT EXISTS receta_pasos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_receta INT NOT NULL,
  numero_paso INT NOT NULL,
  descripcion TEXT NOT NULL,
  FOREIGN KEY (id_receta) REFERENCES recetas(id) ON DELETE CASCADE
);

-- =======================
-- Recetas marcadas como favoritas por los usuarios
-- =======================
CREATE TABLE IF NOT EXISTS favoritos (
  id_usuario INT NOT NULL,
  id_receta BIGINT NOT NULL,
  origen ENUM('own', 'spoonacular') DEFAULT 'spoonacular',
  PRIMARY KEY (id_usuario, id_receta, origen),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS menus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  calorias_total INT DEFAULT 0,
  proteinas_total DECIMAL(7,2) DEFAULT 0,
  carbohidratos_total DECIMAL(7,2) DEFAULT 0,
  grasas_total DECIMAL(7,2) DEFAULT 0,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- =======================
DROP TABLE IF EXISTS menu_recetas;
CREATE TABLE menu_recetas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_menu INT NOT NULL,
  receta_id BIGINT NOT NULL,
  origen ENUM('own', 'spoonacular') DEFAULT 'own',
  etiqueta VARCHAR(60) DEFAULT NULL,
  titulo VARCHAR(200) DEFAULT NULL,
  imagen_url VARCHAR(255) DEFAULT NULL,
  calorias INT DEFAULT 0,
  proteinas DECIMAL(7,2) DEFAULT 0,
  carbohidratos DECIMAL(7,2) DEFAULT 0,
  grasas DECIMAL(7,2) DEFAULT 0,
  FOREIGN KEY (id_menu) REFERENCES menus(id) ON DELETE CASCADE
);

-- =======================
-- TABLA: planes_semanales
-- =======================
CREATE TABLE IF NOT EXISTS planes_semanales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- =======================
-- TABLA: plan_menus
-- =======================
CREATE TABLE IF NOT EXISTS plan_menus (
  id_plan INT NOT NULL,
  dia_index TINYINT NOT NULL,
  id_menu INT NOT NULL,
  PRIMARY KEY (id_plan, dia_index),
  FOREIGN KEY (id_plan) REFERENCES planes_semanales(id) ON DELETE CASCADE,
  FOREIGN KEY (id_menu) REFERENCES menus(id) ON DELETE CASCADE
);

-- =======================
-- TABLA: peso_historial
-- =======================
CREATE TABLE IF NOT EXISTS peso_historial (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  peso_kg DECIMAL(5,2),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);


-- =======================
-- CREAR ADMIN POR DEFECTO (contraseña: admin)
-- Aquí la contraseña se guarda como hash bcrypt generado con password_hash()
-- =======================

INSERT INTO usuarios (nombre_usuario, correo, contrasena, rol, requiere_cambio_password)
SELECT 'admin', 'admin@nutrichef.com', '$2y$12$aiIFwuKCyuFJmTwpAvmU4.8rJiHe2GYlpgoSWYHxeoZPW.atjQ.Bi', 'admin', 1
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE correo = 'admin@nutrichef.com'
);

