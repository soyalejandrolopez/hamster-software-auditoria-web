# Hamster Software Auditoría Web — Monitor & Auditor de Sitios Web

Plataforma moderna, completa y de alto rendimiento construida con **Nuxt 3** y **Hono** para auditar y monitorear cualquier sitio web. Diseñada exclusivamente en **Modo Claro (Light Mode)** con interfaz limpia, tipografía refinada (Plus Jakarta Sans) y componentes reactivos. Permite análisis instantáneo y público sin registro previo.

---

## 🚀 Características Principales

1. **Autenticación Multi-Rol**:
   * **Clientes**: Auto-registro e inicio de sesión seguro con contraseñas hasheadas (bcrypt) y cookies `HttpOnly` JWT.
   * **1 Administrador Global**: Cuenta sembrada automáticamente en el primer arranque para gestión de usuarios, acceso al historial global de la plataforma y métricas avanzadas.
2. **Motor de Auditoría Integral (6 Módulos)**:
   * **🔍 SEO On-Page**: Inspección de `<title>`, `<meta name="description">`, `<link rel="canonical">`, jerarquía de encabezados `<h1>-<h6>`, porcentaje de imágenes sin atributo `alt`, estado de `/robots.txt` y `/sitemap.xml`, viewport responsive, idioma `lang` y **simulador visual de Google SERP**.
   * **⚡ Rendimiento (Performance)**: Medición de TTFB (Time to First Byte), tiempo total de respuesta, compresión activa (`Gzip`, `Brotli`), cabeceras de caché (`Cache-Control`, `ETag`), conteo de recursos (scripts, CSS, imágenes) y soporte opcional para la API de **Google PageSpeed Insights**.
   * **🛡️ Seguridad (Security)**: Protocolo HTTPS, estado y emisor del certificado SSL/TLS, cálculo de días hasta expiración, detección de contenido mixto (`http://` en `https://`) y verificación de cabeceras de protección (`HSTS`, `CSP`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
   * **🌐 Dominio & DNS**: Resolución activa de registros DNS (`A`, `AAAA`, `MX` de correo, `NS` de nombres y `TXT` con validación SPF / DMARC).
   * **💻 Stack Tecnológico**: Detección de CMS (WordPress, Shopify, Webflow, Ghost, Drupal), frameworks frontend (Vue, React, Nuxt, Next.js, Angular), servidores web (Nginx, Apache, Cloudflare, Caddy) y herramientas de analítica (Google Analytics, Hotjar, Meta Pixel).
   * **📈 Historial y Evolución**: Historial cronológico con filtros por dominio y comparativa gráfica de evolución de puntuaciones a lo largo del tiempo.
3. **📋 Plan de Acción Técnico y Priorizado**:
   * Generación algorítmica de recomendaciones clasificadas por severidad (🔴 Crítico, 🟡 Advertencia, 💡 Buena Práctica).
   * Relación estimada de **Impacto** y **Esfuerzo** (identificación de "Quick Wins").
   * Lista de tareas con casillas de verificación para marcar avances y botón para **Imprimir o Descargar** el informe.

---

## 🛠️ Stack Tecnológico

* **Frontend**: [Nuxt 3](https://nuxt.com/) (Vue 3, TypeScript, Tailwind CSS)
* **Backend API**: [Hono](https://hono.dev/) montado en Nitro (`server/api/[...].ts`)
* **Base de Datos & ORM**: SQLite (`better-sqlite3`) con [Drizzle ORM](https://orm.drizzle.team/), preparado para **Cloudflare D1**
* **Iconos & Estilos**: Iconos SVG nítidos y diseño en **Modo Claro**
* **Testing**: [Vitest](https://vitest.dev/) con suite completa de pruebas unitarias e integración

---

## 🔐 Credenciales del Administrador Inicial

Al iniciar la aplicación por primera vez, el sistema crea automáticamente la cuenta de Administrador si aún no existe:

* **Correo**: `admin@monitor.local`
* **Contraseña**: `Admin123!*`
* *(En la pantalla de inicio de sesión existe además un botón de acceso rápido para autocompletar estas credenciales)*.

---

## 📦 Instalación y Puesta en Marcha

### 1. Clonar o acceder al proyecto
```bash
cd monitordesitiosweb
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Variables de entorno
El proyecto incluye un archivo `.env` configurado por defecto. Puedes personalizarlo si lo deseas:
```bash
# JWT Secret
JWT_SECRET="webauditor-super-secret-jwt-key-change-in-production-2026"

# Administrador inicial
ADMIN_EMAIL="admin@monitor.local"
ADMIN_PASSWORD="Admin123!*"
ADMIN_NAME="Administrador Hamster Software"

# Base de datos SQLite local
DATABASE_PATH="./data/webauditor.sqlite"

# Opcional: Clave de Google PageSpeed Insights
PAGESPEED_API_KEY=""
```

### 4. Iniciar en modo desarrollo
```bash
npm run dev
```
Abre tu navegador en `http://localhost:3000`.

### 5. Ejecutar la suite de pruebas
```bash
npm test
# o con vitest directamente:
npx vitest run
```

### 6. Compilar para producción
```bash
npm run build
node .output/server/index.mjs
```

---

## ☁️ Despliegue en Cloudflare Pages

El proyecto incluye soporte nativo y optimizado para **Cloudflare Pages**:

1. Ve a tu panel de **Cloudflare Dashboard** → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Selecciona el repositorio: `soyalejandrolopez/hamster-software-auditoria-web`.
3. Configuración de compilación:
   * **Framework preset**: `None` o `Nuxt.js`
   * **Build command**: `npm run build`
   * **Build output directory**: `dist`
4. **Variables de Entorno (Environment Variables)** en Cloudflare:
   * `NODE_VERSION`: `22`
   * `NITRO_PRESET`: `cloudflare-pages`
   * `JWT_SECRET`: (Tu clave secreta para firmas JWT)
   * `ADMIN_EMAIL`: `admin@monitor.local` (o tu email preferido)
   * `ADMIN_PASSWORD`: (Contraseña segura de administrador)
   * `ADMIN_NAME`: `Administrador Hamster Software`
   * *(Opcional)* `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`: Para base de datos SQLite / LibSQL distribuida en el Edge con persistencia global.
5. Haz clic en **Save and Deploy**. Cloudflare compilará y desplegará la aplicación en su red global Anycast.

---

## 📡 Endpoints de la API (Hono)

### Autenticación (`/api/auth`)
* `POST /api/auth/register` — Registro de nuevos clientes.
* `POST /api/auth/login` — Inicio de sesión (devuelve cookie `auth_token`).
* `POST /api/auth/logout` — Cierre de sesión.
* `GET /api/auth/me` — Datos del usuario autenticado y su rol.

### Auditorías (`/api/audits`)
* `POST /api/audits/scan` — Ejecuta una nueva auditoría web completa (`{ url: string }`).
* `GET /api/audits` — Listado de auditorías (clientes ven las suyas, administradores ven todas).
* `GET /api/audits/:id` — Informe completo, métricas de los 5 módulos y plan de acción.
* `DELETE /api/audits/:id` — Elimina una auditoría.
* `GET /api/audits/history/:domain` — Historial de evolución de un dominio particular.

### Administración (`/api/admin`) *(Requiere rol `admin`)*
* `GET /api/admin/stats` — Estadísticas globales de la plataforma.
* `GET /api/admin/users` — Listado de clientes y número de auditorías realizadas.
* `DELETE /api/admin/users/:id` — Eliminación de usuarios del sistema.
* `GET /api/admin/settings` & `PUT /api/admin/settings` — Configuración de la clave de PageSpeed u otras variables.
