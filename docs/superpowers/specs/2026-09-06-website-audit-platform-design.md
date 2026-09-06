# Especificación Técnica: Monitor y Auditor de Sitios Web (Nuxt 3 + Hono)

**Fecha**: 2026-09-06  
**Estado**: Validado con el usuario  
**Stack**: Nuxt 3, Vue 3, Hono, Drizzle ORM, SQLite / Cloudflare D1, Tailwind CSS, TypeScript

---

## 1. Resumen Ejecutivo
Construcción de una plataforma moderna e integral de auditoría de sitios web que permite a clientes y administradores ingresar la URL de cualquier portal web para evaluar exhaustivamente su **SEO**, **Rendimiento**, **Seguridad**, **Dominio**, **Tecnologías** e **Historial**, concluyendo con un **Plan de Acción** técnico y priorizado. La interfaz está concebida bajo una estética exclusiva en **Modo Claro (Light Mode)** de alto contraste y refinamiento visual.

---

## 2. Objetivos y Alcance
### Objetivos Principales:
* Permitir el registro e inicio de sesión de clientes, así como el acceso de un Administrador único con capacidades de gestión global.
* Motor de análisis autónomo en Hono que no depende obligatoriamente de servicios externos para auditar SEO, rendimiento (tiempos reales, TTFB, compresión), seguridad (SSL, cabeceras HTTP), DNS y stack tecnológico.
* Soporte opcional para conectar la API de Google PageSpeed Insights si se configura una API key en el panel de administración.
* Generar de forma algorítmica un Plan de Acción clasificado por severidad (Crítico, Advertencia, Mejora) con impacto estimado, dificultad y pasos detallados de resolución.
* Almacenamiento y consulta de historial de auditorías con cálculo de tendencias evolutivas por dominio.
* Arquitectura basada en Drizzle ORM sobre SQLite local, 100% compatible con Cloudflare D1 para despliegues serverless / edge.

---

## 3. Arquitectura del Sistema

```
+-------------------------------------------------------------------------------+
|                             NUXT 3 (Frontend SSR/SPA)                         |
|  - Modo Claro (Light Mode) con Tailwind CSS & Iconos Lucide                   |
|  - Vistas: Landing, Login/Register, Dashboard (Cliente & Admin), Detalle, Historial|
|  - Componibles: useAuth(), useAudit()                                         |
+-------------------------------------------------------------------------------+
                                      |
                           Llamadas locales a /api/*
                                      v
+-------------------------------------------------------------------------------+
|                    HONO (Montado en server/api/[...].ts)                      |
|  - Middleware: JWT en Cookie HttpOnly, CORS, RoleGuard (Admin/Client)         |
|  - Rutas: /api/auth/*, /api/audits/*, /api/admin/*                            |
+-------------------------------------------------------------------------------+
           |                                                      |
           v                                                      v
+--------------------------+                         +--------------------------+
|    MOTOR DE AUDITORÍA    |                         |       DRIZZLE ORM        |
| - seoAuditor             |                         | - SQLite / Cloudflare D1 |
| - performanceAuditor     |                         | - Tablas: users, audits, |
| - securityAuditor        |                         |   audit_details,         |
| - domainAuditor          |                         |   system_settings        |
| - techAuditor            |                         +--------------------------+
| - actionPlanGenerator    |
+--------------------------+
```

---

## 4. Esquema de Base de Datos (Drizzle ORM)

### 4.1 Tabla `users`
* `id` (TEXT, PK): Identificador único (UUID).
* `name` (TEXT): Nombre completo del usuario.
* `email` (TEXT, UNIQUE): Correo electrónico.
* `password_hash` (TEXT): Hash bcrypt de la contraseña.
* `role` (TEXT): Rol del usuario (`'admin'` o `'client'`).
* `created_at` (INTEGER): Timestamp de creación.
* `updated_at` (INTEGER): Timestamp de actualización.

### 4.2 Tabla `audits`
* `id` (TEXT, PK): Identificador de la auditoría.
* `user_id` (TEXT, FK -> `users.id` con `ON DELETE CASCADE`): Propietario de la auditoría.
* `url` (TEXT): URL completa analizada.
* `domain` (TEXT): Dominio normalizado (ej. `sitio.com`).
* `overall_score` (INTEGER): Puntuación global ponderada (0-100).
* `seo_score` (INTEGER): Puntuación SEO (0-100).
* `performance_score` (INTEGER): Puntuación Rendimiento (0-100).
* `security_score` (INTEGER): Puntuación Seguridad (0-100).
* `domain_score` (INTEGER): Puntuación Dominio (0-100).
* `created_at` (INTEGER): Timestamp de ejecución.

### 4.3 Tabla `audit_details`
* `id` (TEXT, PK)
* `audit_id` (TEXT, UNIQUE, FK -> `audits.id` con `ON DELETE CASCADE`): Relación 1:1.
* `seo_data` (TEXT/JSON): Metadatos, etiquetas Open Graph, estructura H1-H6, robots.txt, sitemap, imágenes sin `alt`.
* `performance_data` (TEXT/JSON): TTFB, tiempo de descarga, compresión (Gzip/Brotli), cabeceras de caché, conteo/peso de assets y datos opcionales de PageSpeed.
* `security_data` (TEXT/JSON): Certificado SSL (emisor, vigencia, días restantes), cabeceras HTTP de seguridad (HSTS, CSP, X-Frame-Options, etc.), contenido mixto.
* `domain_data` (TEXT/JSON): Registros DNS (A, AAAA, MX, NS, TXT) e información de resolución.
* `tech_data` (TEXT/JSON): Lista de tecnologías detectadas (CMS, frameworks, servidores, CDN, analítica).
* `action_plan` (TEXT/JSON): Array de recomendaciones generadas con severidad, impacto, esfuerzo y pasos de solución.

### 4.4 Tabla `system_settings`
* `key` (TEXT, PK): Clave de configuración (ej. `pagespeed_api_key`).
* `value` (TEXT): Valor almacenado.

---

## 5. Arquitectura de la API Hono

La aplicación Hono se ejecuta directamente en el entorno de servidor Nitro de Nuxt en `server/api/[...].ts`.

### 5.1 Endpoints de Autenticación (`/api/auth`)
* `POST /api/auth/register`: Valida datos del cliente, verifica unicidad del email, genera hash bcrypt, guarda usuario con rol `'client'` y emite cookie de sesión `auth_token`.
* `POST /api/auth/login`: Valida credenciales, emite cookie `auth_token` con firma JWT.
* `POST /api/auth/logout`: Elimina la cookie de sesión.
* `GET /api/auth/me`: Retorna los datos del usuario autenticado y su rol.
* **Auto-seed de Administrador**: Si la tabla `users` no contiene ningún usuario con `role = 'admin'`, se crea de inmediato la cuenta de administrador con credenciales de configuración inicial (ej. `admin@monitor.local` / `Admin123!*`).

### 5.2 Endpoints de Auditorías (`/api/audits`)
* `POST /api/audits/scan`: Recibe `{ url: string }`. Dispara en paralelo las auditorías de SEO, rendimiento, seguridad, DNS y tecnologías; calcula las puntuaciones y el plan de acción, lo guarda en la base de datos y lo devuelve al cliente.
* `GET /api/audits`: Retorna listado de auditorías. Filtra por `user_id` para clientes; para administradores retorna todas las auditorías con datos del usuario creador.
* `GET /api/audits/:id`: Retorna la información completa de la auditoría y sus detalles asociados.
* `DELETE /api/audits/:id`: Permite al cliente eliminar sus propias auditorías o al administrador eliminar cualquiera.
* `GET /api/audits/history/:domain`: Retorna la evolución temporal de puntuaciones para un dominio particular.

### 5.3 Endpoints de Administración (`/api/admin`)
* `GET /api/admin/stats`: Métricas globales del sistema (total de usuarios, auditorías realizadas, promedios de puntuación, dominios frecuentes).
* `GET /api/admin/users`: Listado de clientes registrados con fecha y cantidad de auditorías.
* `DELETE /api/admin/users/:id`: Eliminación de clientes y sus auditorías asociadas.
* `GET /api/admin/settings`: Obtención de configuraciones globales.
* `PUT /api/admin/settings`: Actualización de la clave de Google PageSpeed Insights u otras variables del sistema.

---

## 6. Motor de Auditoría y Generación del Plan de Acción

### 6.1 Submódulos de Auditoría
1. **`seoAuditor`**:
   * Descarga el HTML vía HTTP GET y parsea el DOM.
   * Evalúa:
     * `<title>`: Existencia y tamaño ideal (30 - 65 caracteres).
     * `<meta name="description">`: Existencia y tamaño ideal (120 - 160 caracteres).
     * `<link rel="canonical">`: Presencia y formato válido.
     * Estructura de encabezados: Presencia de un único `<h1>`, existencia de `<h2>` y `<h3>`.
     * Atributos `alt` en imágenes: Porcentaje de imágenes con texto alternativo descriptivo.
     * Open Graph / Twitter Cards: `og:title`, `og:image`, `og:description`.
     * Archivos especiales: Solicitud HEAD a `/robots.txt` y `/sitemap.xml`.
     * Responsive & i18n: `<meta name="viewport">` y atributo `<html lang="...">`.
   * Puntuación: 0 a 100 basada en pesos por ítem.

2. **`performanceAuditor`**:
   * Métricas de red directas:
     * TTFB (Time to First Byte): <200ms = excelente, 200-600ms = moderado, >600ms = deficiente.
     * Tiempo de respuesta DNS y duración total de descarga.
     * Compresión de transferencia: Detecta encabezado `Content-Encoding` (`gzip`, `br`, `zstd`).
     * Cabeceras de caché: Verifica presencia de `Cache-Control` y `ETag`.
     * Análisis de peso y recursos: Conteo de scripts externos, hojas de estilo e imágenes incrustadas.
     * Si la clave de Google PageSpeed está configurada, consulta la API v5 de PageSpeed para obtener métricas Lighthouse complementarias.
   * Puntuación: 0 a 100 basada en tiempos y optimizaciones de recursos.

3. **`securityAuditor`**:
   * Validación de protocolo: Redirección automática de `http://` hacia `https://`.
   * Certificado SSL/TLS: Conexión vía TLS socket para extraer emisor, fecha de expiración y días de validez restantes.
   * Cabeceras HTTP de protección:
     * `Strict-Transport-Security` (HSTS)
     * `Content-Security-Policy` (CSP)
     * `X-Frame-Options` (Prevención de Clickjacking)
     * `X-Content-Type-Options` (Prevención de MIME sniffing)
     * `Referrer-Policy`
     * `Permissions-Policy`
   * Detección de contenido mixto: Detección de recursos no seguros (`http://`) en páginas `https://`.
   * Puntuación: 0 a 100 basada en cumplimiento de directivas de seguridad.

4. **`domainAuditor`**:
   * Resolución de registros DNS mediante `dns.promises`:
     * Registros `A` y `AAAA` (Resolución de host).
     * Registros `MX` (Enrutamiento de correo).
     * Registros `NS` (Servidores de nombres redundantes).
     * Registros `TXT` (Validación de registros SPF / DMARC).
   * Puntuación: 0 a 100 calculada según la completitud y redundancia de la configuración DNS.

5. **`techAuditor`**:
   * Motor de análisis de firmas tecnológicas:
     * Cabeceras HTTP (`Server`, `X-Powered-By`, `via`).
     * Metadatos HTML (`<meta name="generator">`).
     * Scripts y patrones URL (`wp-content`, `shopify`, `cdn.tailwindcss.com`, `gtag`, `next`, `nuxt`, `react`, `vue`, etc.).
   * Categorías detectadas: CMS, Frameworks Frontend, Servidor Web, Analítica y CDN/Hosting.

### 6.2 Generación del Plan de Acción
El módulo `actionPlanGenerator.ts` consolida todos los hallazgos en recomendaciones procesables:
* Cada recomendación contiene:
  * `id`: Identificador único del problema.
  * `category`: `'seo' | 'performance' | 'security' | 'domain' | 'tech'`.
  * `severity`: `'critical'` (rojo), `'warning'` (amarillo), `'info'` (azul/verde).
  * `title`: Título claro y directo (ej. *"Activar cabecera Strict-Transport-Security (HSTS)"*).
  * `description`: Explicación del impacto que tiene en el sitio.
  * `impact`: `'high' | 'medium' | 'low'`.
  * `effort`: `'low' | 'medium' | 'high'`.
  * `steps`: Lista numerada de acciones concretas para corregirlo.
* **Puntuación Global Ponderada**:
  $$\text{Score} = (\text{SEO} \times 0.30) + (\text{Rendimiento} \times 0.25) + (\text{Seguridad} \times 0.25) + (\text{Dominio} \times 0.20)$$

---

## 7. Diseño Frontend en Modo Claro (Light Mode)

### 7.1 Estilo Visual
* **Fondo**: Blancos puros (`#ffffff`) combinados con superficies en `slate-50` (`#f8fafc`) y `slate-100` (`#f1f5f9`).
* **Texto**: Contraste alto con `slate-900` (`#0f172a`) para títulos y `slate-600` (`#475569`) para textos descriptivos.
* **Acentos**:
  * Azul real (`#2563eb`) para botones primarios y enlaces destacados.
  * Verde esmeralda (`#10b981`) para puntuaciones altas (90-100) y comprobaciones exitosas.
  * Ámbar cálido (`#f59e0b`) para advertencias (50-89).
  * Rojo carmín (`#ef4444`) para errores críticos y puntuaciones bajas (<50).
* **Componentes**: Tarjetas con bordes sutiles `border-slate-200`, sombras ligeras `shadow-sm`, badges redondeados y medidores circulares de puntuación en SVG.

### 7.2 Vistas del Sistema
1. **`/` (Landing Page)**: Presentación de la herramienta, beneficios, métricas destacadas y llamadas a la acción para iniciar sesión o registrarse.
2. **`/login` & `/register`**: Formularios limpios y centrados, con validación reactiva y manejo de errores visible.
3. **`/dashboard`**:
   * **Barra de Entrada de URL**: Input destacado con botón de acción y feedback visual de progreso durante el escaneo.
   * **Vista Cliente**:
     * Tarjetas de resumen (auditorías realizadas, promedio global).
     * Tabla interactiva de auditorías recientes con enlaces directos a los informes y eliminación.
   * **Vista Administrador**:
     * Tarjetas KPI del sistema (total de usuarios registrados, auditorías totales en el sistema, promedio global).
     * Pestaña de gestión de usuarios (listado, auditorías realizadas por cada cliente, eliminación).
     * Pestaña de historial global (todas las auditorías del sistema).
     * Pestaña de configuración (Gestión de API Key de PageSpeed).
4. **`/audits/:id` (Informe Completo)**:
   * Cabecera con URL analizada, dominio, fecha, medidor circular SVG de puntuación global (0-100) y botón para imprimir/exportar el Plan de Acción.
   * Pestañas temáticas:
     1. **Resumen**: Puntuaciones en tarjetas con barras de progreso para SEO, Rendimiento, Seguridad y Dominio.
     2. **SEO**: Vista previa simulada en Google SERP, jerarquía de encabezados y estado de sitemap/robots.
     3. **Rendimiento**: Medidores de TTFB, duración de carga, tamaño total y compresión.
     4. **Seguridad**: Semáforo SSL, días restantes de expiración y lista de cabeceras de seguridad.
     5. **Dominio**: Tabla de registros DNS interactiva con botón para copiar.
     6. **Tecnología**: Insignias visuales organizadas por categoría tecnológica.
     7. **Plan de Acción**: Lista de verificación interactiva de tareas con etiquetas de impacto y esfuerzo, más botón de exportar.
5. **`/audits/history/:domain`**: Gráfico comparativo de la evolución de las puntuaciones en el tiempo para ese dominio.

---

## 8. Estrategia de Pruebas y Validación
* **Pruebas de Base de Datos y Modelos**: Validar inserción de usuarios, unicidad de emails, roles y relaciones de auditorías en cascada.
* **Pruebas de la API Hono**:
  * Autenticación: Registro de clientes, login con credenciales válidas/inválidas, cookie de sesión y protección de rutas `requireAuth` y `requireAdmin`.
  * Auditorías: Validación de URLs, manejo de URLs inaccesibles o con timeout, cálculo consistente de puntuaciones y generación del plan de acción.
* **Pruebas de Interfaz (Nuxt)**:
  * Renderizado correcto del Modo Claro.
  * Flujo completo de registro, inicio de sesión, auditoría de un sitio web, visualización de pestañas y exportación del plan de acción.
  * Verificación de permisos: Confirmar que un cliente no pueda acceder a las rutas ni acciones del administrador.

---

## 9. Despliegue y Variables de Entorno
* `DATABASE_URL`: Ruta local a SQLite (ej. `./data/monitor.sqlite`) o binding de Cloudflare D1.
* `JWT_SECRET`: Clave secreta para la firma y verificación de tokens de sesión.
* `ADMIN_EMAIL` / `ADMIN_PASSWORD`: Credenciales para el auto-semillado de la cuenta de administrador única.
* `PAGESPEED_API_KEY`: Clave opcional para Google PageSpeed Insights.
