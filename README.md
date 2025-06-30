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

## Justificacion del cambio en la tabla Banner

Agregué un flag notified en la tabla Banner (por defecto false) para saber cuándo ya le avisamos al usuario que faltan 3 días para que su banner entre en vigencia. La otra opción habría sido usar Bull y Redis para programar jobs retrasados, pero para este proyecto ligero un cron interno es más que suficiente: se configura en un segundo, corre junto a la app y no requiere levantar dependencias extra como Redis.


## Logica de solapacion
Un banner quedará “solapado” con otro en el momento en que sus rangos de publicación compartan al menos un día en común, incluyendo el día de inicio o el de fin. Dicho de otra forma:
Sea A un banner que va de A.start_date a A.end_date


Y B otro banner que va de B.start_date a B.end_date


Se consideraran solapados si A empezó en o antes de que B termine y además A termina en o después de que B comience. En notación:
A.start_date ≤ B.end_date
&& 
A.end_date   ≥ B.start_date

Algunos ejemplos concretos:
Solapados (comparten un día)


A: 1–10 julio


B: 10–20 julio
 → Se solapan porque el 10 de julio pertenece a ambos.


Solapados (rango interno)


A: 5–15 julio


B: 10–12 julio
 → B está completamente dentro de A, claramente hay solapamiento.


No solapados


A: 1–9 julio


B: 10–20 julio
 → No comparten ningún día: A termina el día 9 y B empieza el 10.


Con esta regla no puedan coexistir dos banners en la misma posición que estén activos de forma simultánea, ni siquiera un solo día en común.

