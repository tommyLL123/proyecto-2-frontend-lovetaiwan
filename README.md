# Sellio — Frontend Web

Panel administrativo (React + TypeScript + Vite) para el backend Sellio
(Spring Boot). Cubre los puntos 3 y 4 de la rubrica del Proyecto 2 de CS2031 DBP:
consumo de API con axios centralizado, arquitectura React modular, rutas
protegidas por rol, estados de carga/error, validaciones, UI/UX responsive y
paginacion + busqueda (aplicada en el cliente, ver nota abajo).

## Stack

- React 18 + TypeScript + Vite
- React Router 6 (rutas protegidas, lazy loading, query params)
- Axios (cliente HTTP centralizado con interceptores)
- lucide-react (iconos)
- CSS plano con sistema de diseño propio (sin framework, ver `src/styles/global.css`)

## Como ejecutar en local
```bash
npm install
npm run dev
```
## Cuentas y roles

El registro permite elegir entre `USER` y `ADMIN`. Varias funciones del backend
requieren rol `ADMIN` (gestionar productos/categorias, ver inventario, ver
todas las ventas/compras, gestionar usuarios). El frontend oculta esas acciones
para usuarios `USER` y protege esas rutas en el cliente, pero la autorizacion
real ocurre en el backend (`@PreAuthorize`).

## Limitaciones conocidas (por diseño del backend actual)

- **Sin paginacion en el backend**: los endpoints de listado devuelven arrays
  completos. La paginacion y la busqueda de este frontend son 100% del lado
  del cliente (`src/utils/pagination.ts`).
- **Sin refresh token**: el login solo devuelve un JWT de 24h. Al expirar, la
  sesion se cierra y se pide volver a iniciar sesion.
- **Sin endpoint `/usuarios/me`**: la sesion del usuario se reconstruye
  decodificando el propio JWT (`src/utils/jwt.ts`), que incluye `sub` (email),
  `userId` y `rol`.
- **Actualizar perfil exige contrasena siempre**: `PUT /usuarios/{id}` no tiene
  un endpoint separado para "solo actualizar datos", asi que el formulario de
  perfil pide confirmar la contrasena en cada guardado.
