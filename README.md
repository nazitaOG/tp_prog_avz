<div align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  <h1>TP Banners</h1>
  <p><strong>Sistema de Gestión de Banners con NestJS</strong></p>
</div>

---

## Requisitos Previos

- Node.js (versión 16 o superior)
- Docker y Docker Compose
- pnpm (recomendado) o npm

## Instalación y Configuración

### 1. Instalar Dependencias

```bash
pnpm install
```

### 2. Configurar Variables de Entorno

# Copiar el archivo de configuración

# Editar las variables según tu configuración



### 3. Iniciar Base de Datos

```bash
# Levantar PostgreSQL con Docker
docker-compose up -d
```

### 4. Configurar Base de Datos

```bash
# Ejecutar migraciones
npx prisma migrate dev --name init

# Poblar la base de datos con datos de ejemplo
npx prisma db seed
```

### 5. Iniciar Aplicación

```bash
# Modo desarrollo
pnpm run start:dev

# Modo producción
pnpm run start:prod
```