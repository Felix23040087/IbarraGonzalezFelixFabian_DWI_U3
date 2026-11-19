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

## Pruebas y CI

- `npm test`: pruebas unitarias de validación y servicios (con mocks).
- `npm run test:integration`: pruebas contra el Supabase real; requiere `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`. Crea cuentas temporales confirmadas y las elimina al terminar. No envía correo.
- `npx tsc --noEmit`: verificación TypeScript.
- `npm run build`: compilación de producción.
- GitHub Actions ejecuta las pruebas unitarias, TypeScript y build en cada PR y push a `main`. Para habilitar también las pruebas de integración en Actions, configura los tres secretos anteriores y la variable de repositorio `RUN_SUPABASE_INTEGRATION_TESTS=true`.
- `npm run test:watch`: modo de observación de Vitest.

### Verificación real (18/11/2026)

- Supabase informa que `public.tasks` existe, con RLS habilitado y columnas/restricciones esperadas. La migración aplicada figura como `20261119032533_create_tasks_table` (registro del servicio; la fecha/version es la informada por Supabase).
- Consulta directa a `pg_policy`: están activas `tasks_select_own`, `tasks_insert_own`, `tasks_update_own` y `tasks_delete_own`; todas limitan lectura/escritura a `auth.uid() = user_id` y al rol `authenticated`.
- La ruta de introspección automática de esquema devolvió el error genérico `Error during code execution`; no incluyó detalle interno. No era una migración fallida: la lista de migraciones, tablas y la consulta directa de políticas confirmaron el esquema aplicado. Por tanto, la causa interna concreta del error de introspección no es visible en la respuesta disponible.
- El endpoint público `/auth/v1/settings` respondió 200: registro habilitado, proveedor email habilitado y confirmación por correo requerida (`mailer_autoconfirm=false`). Se comprobó inicio y cierre de sesión con cuentas temporales reales.
- Prueba en la base real con dos usuarios: crear, leer, actualizar y borrar funcionó; el segundo usuario no pudo leer, actualizar ni borrar la tarea del primero, y un intento de insertar con el `user_id` del otro usuario fue rechazado. Las dos cuentas temporales se eliminaron al finalizar.
- El registro con confirmación obligatoria está habilitado, pero no se envió ni se confirmó un correo de registro: la prueba evitó generar correos a usuarios reales. El allowlist no se expone en el endpoint público de Auth; falta confirmar en la configuración Auth que incluya `https://<dominio-de-producción>/auth/callback`.
- En la producción actual, una solicitud de callback con código inválido respondió con redirección 307 a `/login?error=auth`, confirmando que la ruta está publicada y enruta errores. No prueba un ciclo de confirmación exitoso. Este cambio ajusta el formulario en la rama para usar el origen del sitio publicado y deja el proxy de v0 solo para desarrollo; el cambio todavía debe desplegarse para validarlo públicamente.
