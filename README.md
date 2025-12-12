# Nutrichef

Nutrichef es una aplicación web para planificar y hacer seguimiento de tu alimentación. Puedes explorar recetas de Spoonacular, crear y editar tus propios platos, guardar favoritos, organizar menús diarios y semanales, y consultar tu progreso nutricional (peso y objetivos de macros) desde un panel claro y sencillo.

## Requisitos

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/)

## Instalación y puesta en marcha

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/CesarExpositoOvalle/NutriChef.git
   cd TFC
   ```

2. **(Opcional) Configura tu clave de Spoonacular**
   - Abre `docker-compose.yml` y sustituye el valor de `SPOONACULAR_API_KEY` por tu clave personal.
   - Si lo prefieres, puedes crear un archivo `.env` y referenciar la variable en `docker-compose.yml`.

3. **Arranca los servicios con Docker Compose**
   ```bash
   docker compose up --build
   ```
   Esto levantará:
   - **MySQL** (datos persistentes en el volumen `mysql_data`).
   - **Backend PHP** en `http://localhost:8000` (conexión a la base de datos y endpoints de la app).
   - **Frontend React (Vite)** en `http://localhost:5173`.
   - **phpMyAdmin** en `http://localhost:8080` para inspeccionar la base de datos.

4. **Accede a la aplicación**
   - Abre `http://localhost:5173` para usar Nutrichef.
   - Las credenciales por defecto para MySQL están definidas en `docker-compose.yml` (`root` / `root`), cambialas al iniciar sesion por primera vez.

## Datos iniciales

   La base de datos se inicializa automáticamente la primera vez que se levanta el entorno. Como parte del proceso de inicialización se crea un usuario con privilegios administrativos:
   
   - **Usuario administrador:** admin
   - **Correo:** admin@nutrichef.com
   - **Contraseña:** admin , cambiala al iniciar sesion por primera vez.
   
   Los administradores tienen acceso a las herramientas de gestión interna de la plataforma, incluyendo administración y control de usuarios.


## Estructura del proyecto

- `frontend/`: aplicación React construida con Vite.
- `backend/`: API PHP que conecta con MySQL y sirve los datos de la aplicación.
- `docker-compose.yml`: orquestación de los servicios (frontend, backend, base de datos y phpMyAdmin).

## Scripts útiles

- Detener y eliminar contenedores (manteniendo datos de MySQL):
  ```bash
  docker compose down
  ```
- Detener y limpiar contenedores, imágenes y el volumen de datos:
  ```bash
  docker compose down -v --rmi local
  ```

## Notas adicionales

- La base de datos se inicializa con el script `backend/config/init.sql` la primera vez que se levanta MySQL.
- El frontend consume la API usando la variable `VITE_API_URL` (definida en `docker-compose.yml`). Cambia este valor si despliegas el backend en otra URL.
- Si prefieres ejecutar el frontend fuera de Docker para desarrollo rápido:
  ```bash
  cd frontend
  npm install
  npm run dev -- --host
  ```
  Asegúrate de apuntar `VITE_API_URL` al backend que estés usando.
