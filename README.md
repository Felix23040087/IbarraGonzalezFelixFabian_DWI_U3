# TaskFlow — Gestor Inteligente de Tareas

Aplicación full-stack universitaria para gestionar tareas personales y consultar condiciones meteorológicas actuales. Interfaz en español, adaptable a móvil y escritorio.

## Configuración

1. Instala dependencias con `npm install`.
2. Configura las variables indicadas en `.env.example` en el entorno de desarrollo. En v0, Supabase ya está conectado y las variables disponibles se inyectan automáticamente.
3. La tabla `public.tasks` ya fue creada en el proyecto Supabase conectado. El esquema reproducible y las políticas RLS están en `supabase/schema.sql`.
4. Ejecuta `npm run dev` y abre `http://localhost:3000`.

El registro puede requerir confirmación por correo según la configuración de Supabase Auth. Hasta completar esa confirmación, el usuario no obtiene una sesión para acceder al dashboard.

## Arquitectura

- `app/`: rutas App Router, páginas, Route Handlers REST y callback de autenticación.
- `components/`: formularios de autenticación y dashboard.
- `lib/supabase/`: clientes de navegador/servidor con `@supabase/ssr` y actualización de sesión.
- `lib/validation/`: esquemas Zod de entrada.
- `lib/repositories/`: acceso a PostgreSQL mediante el cliente Supabase.
- `lib/services/`: autorización, validación, respuestas y lógica de tareas.
- `supabase/schema.sql`: tabla, restricciones, índices y políticas RLS.

## Tecnologías

Next.js App Router, React, TypeScript, Tailwind CSS v4, Lucide, Supabase PostgreSQL/Auth, `@supabase/ssr`, Zod, Open-Meteo y Vitest.

## API REST

Todas las rutas de tareas requieren sesión autenticada verificada en el servidor mediante `auth.getClaims()`.

| Método | Ruta | Resultado |
|---|---|---|
| GET | `/api/tasks` | Lista las tareas del usuario |
| POST | `/api/tasks` | Crea una tarea; responde 201 |
| GET | `/api/tasks/[id]` | Consulta una tarea propia |
| PATCH | `/api/tasks/[id]` | Actualiza los campos enviados |
| DELETE | `/api/tasks/[id]` | Elimina una tarea propia; responde 204 |
| GET | `/api/weather?city=Saltillo` | Consulta clima actual por ciudad |

Los errores de validación son 400, la falta de sesión 401, tareas no encontradas 404 y errores inesperados 500. Los registros ajenos se devuelven como 404 para no revelar su existencia. El clima acepta Saltillo, Monterrey, Guadalajara o Ciudad de México y consume Open-Meteo desde el servidor.

## Seguridad

- Supabase Auth con email y contraseña y cookies gestionadas por `@supabase/ssr`.
- La identidad se valida en servidor con `getClaims()`; nunca se autoriza con `getSession().user`.
- RLS y filtros explícitos por `user_id` protegen cada operación.
- El servidor valida entradas con Zod y solo expone la clave publicable.
- No se usa `localStorage` ni persistencia simulada.

## Metodología ágil

El trabajo se divide en incrementos: esquema seguro, autenticación y API, experiencia de dashboard, pruebas automatizadas y entrega. Cada incremento se valida antes de avanzar y prioriza historias pequeñas y funcionales.

## Pruebas

- `npm test`: ejecuta las pruebas de validación, operaciones CRUD y acceso sin sesión.
- `npm run test:watch`: modo de observación de Vitest.
