# Reporte de integracion frontend-backend

Fecha de revision: 2026-07-07

Guia usada: `C:/Users/USER/IdeaProjects/backend/docs/frontend-integration-guide.md`

## Funcionalidades conectadas

### Autenticacion y sesion

- Login: `POST /api/v1/auth/login`.
- Registro: `POST /api/v1/auth/register`.
- Restaurar sesion: `GET /api/v1/auth/me`.
- Recuperacion de contrasena: `POST /api/v1/auth/forgot-password`.
- Restablecer contrasena: `POST /api/v1/auth/reset-password`.
- Rutas publicas agregadas:
  - `/forgot-password`
  - `/reset-password`
- El interceptor agrega `Authorization: Bearer <token>` y limpia sesion ante `401` o `403`.

### Perfil

- Centro de ayuda/perfil conectado a:
  - `PATCH /api/v1/auth/me` para actualizar `fullName`.
  - `POST /api/v1/auth/me/password` para cambiar contrasena.
- El usuario actualizado se guarda de nuevo en `localStorage`.
- La preferencia de moneda se mantiene solo como control visual/local porque el backend no la recibe en `PATCH /auth/me`.

### Dashboard

- Dashboard conectado a `GET /api/v1/dashboard`.
- Las simulaciones recientes salen de `dashboard.simulations`.
- El resumen sale de `dashboard.summary`.

### Nueva simulacion

- Simulacion conectada a `POST /api/v1/simulations/calculate`.
- Payload alineado con la guia:
  - `client`
  - `vehicle`
  - `credit`
  - `interest`
  - `gracePeriod`
  - `financialAnalysis.cokAnnualPercentage`
  - `costs`
- Validaciones compatibles con backend:
  - DNI de 8 digitos.
  - Nombre maximo 100.
  - Cuota inicial 10 a 30.
  - Cuota balloon 35 a 50.
  - Plazo 24, 36 o 48.
  - Frecuencia `MONTHLY`.
  - Meses de gracia 0 a 6.

### Resultados y reporte PDF

- Detalle conectado a `GET /api/v1/simulations/{id}`.
- Boton "Descargar PDF" conectado a:
  - `GET /api/v1/simulations/{id}/report/pdf`
- La descarga usa `responseType: blob` y toma el nombre desde `Content-Disposition` si viene expuesto.

### Cronograma y exportaciones

- Cronograma conectado a `GET /api/v1/simulations/{id}/schedule`.
- Boton "Exportar PDF" conectado a:
  - `GET /api/v1/simulations/{id}/schedule/export/pdf`
- Boton "Exportar Excel" conectado a:
  - `GET /api/v1/simulations/{id}/schedule/export/xlsx`
- La tabla muestra `paymentDate` en formato local y usa `totalPayment` como pago del periodo.

### Historial

- Historial conectado a `GET /api/v1/simulations/history/page`.
- El selector de rango existente se convierte a `createdFrom` y `createdTo`.
- El paginador usa `page`, `size`, `totalElements` y `totalPages`.
- Eliminar simulacion usa `DELETE /api/v1/simulations/{id}`.

## Pantallas o botones sin backend requerido

### FAQ / Centro de ayuda

- La guia indica que FAQ administrable no esta implementado y no es requerido si el contenido se mantiene estatico.
- La busqueda de FAQ sigue siendo local.

### Terminos y privacidad

- Los links del footer de auth siguen como contenido estatico pendiente de pagina/contenido.
- No se requiere endpoint backend salvo que se quiera administrar el contenido.

### Calculo directo de motor

- `POST /api/v1/simulations/calculate-engine` existe, pero la guia recomienda mantenerlo fuera del flujo final de usuario porque es tecnico/QA y no persiste historial.

## Observaciones tecnicas

- Se mantiene el diseno visual existente; los cambios son de conexion, estados y validaciones.
- La build de desarrollo compila con `npx ng build --configuration development`.
- La build de produccion puede fallar por budgets existentes y por inlining de Google Fonts/certificados; eso no corresponde a errores de integracion con backend.
