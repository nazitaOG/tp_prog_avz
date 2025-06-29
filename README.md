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


Agregué un flag notified en la tabla Banner (por defecto false) para saber cuándo ya le avisamos al usuario que faltan 3 días para que su banner entre en vigencia. La otra opción habría sido usar Bull y Redis para programar jobs retrasados, pero para este proyecto ligero un cron interno es más que suficiente: se configura en un segundo, corre junto a la app y no requiere levantar dependencias extra como Redis.

