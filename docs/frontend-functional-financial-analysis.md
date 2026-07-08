# Analisis funcional y financiero del frontend CrediAuto

Fecha de revision: 2026-07-07

Este documento describe el funcionamiento completo del frontend, sus pantallas, estructura visual, datos mostrados, reglas financieras representadas, formatos numericos y criterios de consistencia con el backend financiero.

## 1. Objetivo del frontend

El frontend de CrediAuto permite que un usuario autenticado simule un credito vehicular inteligente, consulte resultados financieros, revise cronogramas de pago, mantenga historial de simulaciones y gestione su perfil.

El frontend no implementa el motor financiero. Su responsabilidad es:

- Capturar correctamente los datos de entrada.
- Validar reglas basicas antes de enviar al backend.
- Enviar un payload compatible con la API.
- Mostrar resultados calculados por el backend.
- Mantener navegacion, sesion, historial y exportaciones.

La fuente de verdad financiera es el backend. El frontend solo construye el formulario, muestra indicadores y formatea la informacion.

## 2. Navegacion general

Las pantallas protegidas comparten un sidebar con:

- Dashboard.
- Simulacion.
- Historial.
- Perfil.
- Ayuda.
- Cerrar sesion.

El boton `Cerrar sesion` aparece al fondo del sidebar, en color rojo. Al usarlo, se limpia la sesion local y se redirige a autenticacion.

En mobile existe navegacion inferior para las pantallas principales.

## 3. Autenticacion

### 3.1 Login

Ruta principal: `/auth`

Modo: `login`

Elementos visibles:

- Encabezado de marca `CrediAuto`.
- Tabs: `Ingresar` y `Registrarse`.
- Campo `Correo electronico`.
- Campo `Contrasena`.
- Link/boton `Olvidaste tu contrasena?`.
- Boton `Acceder a mi cuenta`.
- Mensajes de error o exito.
- Link para pasar a registro.

Validaciones:

- Email requerido y con formato valido.
- Password requerido.

Endpoint:

- `POST /api/v1/auth/login`

Comportamiento:

- Si el login es correcto, guarda token y usuario.
- Navega a `/dashboard`.
- Si falla, muestra mensaje de credenciales incorrectas.

### 3.2 Registro

Ruta principal: `/auth`

Modo: `register`

Elementos visibles:

- DNI.
- Nombre completo.
- Correo electronico.
- Contrasena.
- Confirmar contrasena.
- Checkbox de politicas de privacidad.
- Boton `Crear mi cuenta`.

Validaciones:

- DNI obligatorio con 8 digitos numericos.
- Nombre obligatorio.
- Email valido.
- Password minimo 8 caracteres.
- Confirmacion obligatoria.
- Password y confirmacion deben coincidir.
- Aceptacion de politicas obligatoria.

Endpoint:

- `POST /api/v1/auth/register`

Nota:

- El checkbox de privacidad es una validacion frontend. No se envia al backend.

### 3.3 Recuperacion de contrasena

Rutas:

- `/forgot-password`
- `/reset-password`

Elementos visibles:

- Solicitud de token por correo.
- Ingreso de token.
- Nueva contrasena.
- Confirmacion de nueva contrasena.

Endpoints:

- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

Comportamiento:

- En modo demo/desarrollo, si el backend devuelve `resetToken`, el frontend lo muestra y lo coloca en el formulario de restablecimiento.
- Valida que la nueva contrasena y la confirmacion coincidan.

## 4. Dashboard

Ruta: `/dashboard`

Objetivo:

Mostrar el estado financiero resumido del usuario autenticado y el acceso rapido a simulaciones.

Estructura:

- Sidebar.
- Estado de carga.
- Estado de error.
- Seccion de bienvenida.
- Boton `Nueva Simulacion`.
- Seccion `Resumen de ultima simulacion`.
- Tabla de simulaciones recientes.

Endpoint principal:

- `GET /api/v1/dashboard`

Datos mostrados:

- Nombre del usuario.
- TCEA de la ultima simulacion.
- VAN de la ultima simulacion.
- Pago mensual.
- Plazo.
- Ultimas simulaciones.

Formatos:

- TCEA del resumen: `number:'1.1-1'`, se muestra con 1 decimal.
- VAN del resumen: `currency:'USD':'symbol':'1.0-0'`, se muestra sin decimales.
- Pago mensual: `currency:'USD':'symbol':'1.2-2'`, se muestra con 2 decimales.
- Fecha de simulaciones recientes: `date:'dd MMM yyyy'`.
- Precio vehiculo en tabla: `currency:simulation.currency:'symbol':'1.2-2'`.
- TCEA de tabla: `number:'1.2-2'`, se muestra con 2 decimales.

Consideracion financiera:

El dashboard no recalcula indicadores. Interpreta `summary` como la ultima simulacion guardada y muestra indicadores ya calculados por backend.

## 5. Nueva simulacion

Ruta: `/simulation`

Objetivo:

Capturar los datos necesarios para calcular y persistir una simulacion de credito vehicular.

Endpoint:

- `POST /api/v1/simulations/calculate`

### 5.1 Datos del cliente

Datos mostrados:

- DNI (`documentNumber`) del usuario autenticado.
- Nombre completo (`fullName`) del usuario autenticado.

Origen:

- Se cargan desde la sesion local o desde `/api/v1/auth/me`.
- Se muestran en modo lectura.
- No se editan desde la pantalla de simulacion.
- No se envian dentro del payload de calculo.

Uso financiero:

El backend identifica al cliente usando el usuario autenticado por JWT. Esto evita que una simulacion pueda enviarse con DNI o nombre distinto al de la cuenta.

### 5.2 Vehiculo

Campos:

- Moneda: `PEN` o `USD`.
- Precio del vehiculo.

Validaciones:

- Moneda requerida.
- Precio mayor a 0.

UI:

- La moneda se elige con control segmentado, no dropdown.
- El precio usa simbolo dinamico:
  - `S/` para PEN.
  - `$` para USD.

Uso financiero:

El precio del vehiculo es base para:

- Monto financiado.
- Cuota inicial.
- Seguro vehicular.
- Saldo inicial del credito.

### 5.3 Configuracion del credito

Campos:

- Cuota inicial (%).
- Cuota balloon (%).
- Plazo en meses.

Validaciones:

- Cuota inicial: 10% a 30%.
- Cuota balloon: 35% a 50%.
- Plazo permitido: 24, 36 o 48 meses.

UI:

- Cuota inicial se muestra con slider.
- Cuota balloon se muestra con opciones: 35%, 40%, 45%, 50%.
- Plazo se muestra con opciones: 24, 36, 48 meses.

Uso financiero:

- La cuota inicial reduce el capital financiado.
- La cuota balloon representa un pago final mayor.
- El plazo define la cantidad de periodos del cronograma.

### 5.4 Tasas de interes

Campos:

- Tipo de tasa: `TEA` o `TNA (Nominal)`.
- Valor porcentual de la tasa.
- Frecuencia de pago.
- Capitalizacion, solo si se elige tasa nominal.

Validaciones:

- Tipo de tasa requerido.
- Tasa mayor a 0.
- Frecuencia de pago fija: mensual.
- Capitalizacion visible y enviada solo cuando la tasa es `TNA`.

Frecuencia de pago:

- Se muestra como texto fijo: `Mensual (30 dias)`.
- No se muestra como dropdown porque solo existe una opcion.
- Se envia como `MONTHLY`.

Capitalizacion:

Cuando el usuario elige `TNA (Nominal)`, aparece el selector de capitalizacion con estos valores enviados al backend:

- Diaria.
- Quincenal.
- Mensual.
- Bimestral.
- Trimestral.
- Cuatrimestral.
- Semestral.
- Anual.

Cuando el usuario elige `TEA`, el frontend envia:

```json
"capitalizationFrequency": null
```

Uso financiero:

- Para TEA, el backend convierte la tasa efectiva anual a tasa mensual efectiva.
- Para TNA, el backend necesita frecuencia de capitalizacion para convertir correctamente la tasa nominal a efectiva.

### 5.5 Periodo de gracia

Campos:

- Tipo de gracia:
  - `NONE`.
  - `TOTAL`.
  - `PARTIAL`.
- Meses de gracia.

Validaciones:

- Tipo requerido.
- Meses entre 0 y 6.
- Si el tipo es `NONE`, el frontend fuerza `months = 0`.

Uso financiero:

- Sin gracia: pagos ordinarios desde el primer periodo.
- Gracia parcial: se pagan intereses/costos durante el periodo de gracia.
- Gracia total: el pago puede ser 0 y el saldo se capitaliza segun reglas del backend.

### 5.6 Analisis financiero

Campo:

- COK anual (%).

Texto informativo:

```text
Nota:
La COK se utilizara para calcular el VAN desde el punto de vista del deudor.
```

Validacion:

- COK anual mayor o igual a 0.

Uso financiero:

La COK es la tasa de descuento usada para calcular el VAN. No es TIR objetivo. La TIR es calculada por el backend a partir de los flujos del credito.

### 5.7 Costos y seguros

Campos:

- Seguro de desgravamen mensual (%).
- Gastos administrativos.
- Seguro vehicular anual (%).

Validaciones:

- Todos deben ser mayores o iguales a 0.

Uso financiero:

- Seguro de desgravamen: costo mensual asociado al saldo deudor.
- Gastos administrativos: costo fijo por cuota.
- Seguro vehicular: costo anual asociado al valor del vehiculo.

### 5.8 Payload financiero enviado

El frontend envia:

```json
{
  "vehicle": {},
  "credit": {},
  "interest": {},
  "gracePeriod": {},
  "financialAnalysis": {
    "cokAnnualPercentage": 15
  },
  "costs": {}
}
```

El backend responde con `id`, `createdAt`, `input` y `results`.

Despues del calculo exitoso, el frontend navega a:

```text
/simulation-results/{id}
```

## 6. Resultado de simulacion

Ruta: `/simulation-results/:id`

Objetivo:

Mostrar el resultado financiero completo de una simulacion persistida.

Endpoints:

- `GET /api/v1/simulations/{id}`.
- `GET /api/v1/simulations/{id}/schedule`.
- `GET /api/v1/simulations/{id}/report/pdf`.

Estructura:

- Sidebar.
- Estado de carga.
- Estado de error.
- Header con titulo y acciones.
- Boton `Descargar PDF`.
- Boton `Nueva Simulacion`.
- Tarjeta principal con cuota mensual.
- Columna de metricas financieras.
- Grafico de interes vs amortizacion.
- Evolucion de saldo pendiente.
- Cronograma resumido.
- Link a detalle completo del plan de pagos.

### 6.1 Tarjeta principal

Muestra:

- Cuota mensual estimada.
- Moneda.
- Descripcion de costos incluidos.
- Capital inicial.
- Plazo total.
- Tasa efectiva.

Formatos:

- Cuota mensual: `currency:currencyCode:'symbol':'1.2-2'`.
- Capital inicial: `currency:currencyCode:'symbol':'1.2-2'`.
- Tasa efectiva: `number:'1.2-2'`.

Uso financiero:

La cuota mensual corresponde a `results.monthlyPayment`, calculada por backend.

### 6.2 Indicadores financieros

Muestra:

- TCEA.
- VAN.
- Viabilidad.
- TIR.

Formatos:

- TCEA: `number:'1.2-2'`.
- VAN: `currency:currencyCode:'symbol':'1.2-2'`.
- TIR: `number:'1.2-2'`.

Interpretacion:

- TCEA representa el costo efectivo anual total.
- VAN se calcula desde el punto de vista del deudor usando COK.
- TIR es calculada desde los flujos del credito.
- Viabilidad se muestra como `Viable` o `No viable`.

### 6.3 Graficos

Interes vs amortizacion:

- Usa `interestAmortizationChart`.
- Muestra barras de interes y capital.
- Si el backend no envia el arreglo, el frontend lo deriva desde el cronograma.

Evolucion de saldo:

- Usa `balanceEvolution`.
- Muestra saldos por periodo relevante.
- Si el backend no envia el arreglo, el frontend lo deriva desde el cronograma.

Formatos:

- Saldos: `currency:currencyCode:'symbol':'1.2-2'`.
- Saldo inicial en pie: `currency:currencyCode:'symbol':'1.0-0'`.
- Saldo final mostrado: `currency:currencyCode:'symbol':'1.2-2'`.

### 6.4 Cronograma resumido

Muestra filas de periodos clave:

- Mes 1.
- Mes 12.
- Mes 24.
- Mes final segun plazo.

Columnas:

- Periodo.
- Amortizacion.
- Interes.
- Seguros/Gastos.
- Cuota Total.
- Saldo Final.

Formatos:

- Todos los importes monetarios usan `currency:currencyCode:'symbol':'1.2-2'`.

## 7. Plan de pagos completo

Ruta:

```text
/simulation-results/:id/payment-plan
```

Objetivo:

Mostrar la tabla de amortizacion completa, con filtros y exportaciones.

Endpoints:

- `GET /api/v1/simulations/{id}`.
- `GET /api/v1/simulations/{id}/schedule`.
- `GET /api/v1/simulations/{id}/schedule/export/pdf`.
- `GET /api/v1/simulations/{id}/schedule/export/xlsx`.

Estructura:

- Sidebar.
- Estado de carga.
- Estado de error.
- Header.
- Botones:
  - Exportar PDF.
  - Exportar Excel.
- Cards resumen.
- Filtros.
- Tabla completa.
- Paginador local.

### 7.1 Resumen superior

Muestra:

- Monto total.
- Tasa anual.
- Plazo.
- Cuota mensual.

Formatos:

- Monto total: `currency:currencyCode:'symbol':'1.2-2'`.
- Tasa anual: `number:'1.2-2'`.
- Cuota mensual: `currency:currencyCode:'symbol':'1.2-2'`.

### 7.2 Filtros

Campos:

- Rango de meses: desde / hasta.
- Estado:
  - Todos.
  - Pendientes.
  - Completados.
  - Proximo.

El filtrado se aplica sobre el cronograma cargado.

### 7.3 Tabla de amortizacion

Columnas:

- Mes.
- Fecha.
- Saldo inicial.
- Interes.
- Amortizacion.
- Seguro/Gastos.
- Cuota total.
- Saldo final.
- Estado.

Formatos:

- Fecha: `date:'dd MMM, yyyy'`.
- Saldos, interes, amortizacion, costos, cuota total: `currency:currencyCode:'symbol':'1.2-2'`.

Uso financiero:

- `initialBalance` muestra el saldo al inicio del periodo.
- `interest` muestra el interes del periodo.
- `amortization` muestra reduccion de capital.
- `costs` agrupa seguros y gastos.
- `totalPayment` es el pago total del periodo.
- `finalBalance` muestra el saldo despues del pago.

## 8. Historial

Ruta: `/history`

Objetivo:

Permitir revisar, filtrar, consultar y eliminar simulaciones anteriores.

Endpoint:

- `GET /api/v1/simulations/history/page`.
- `DELETE /api/v1/simulations/{id}`.

Estructura:

- Sidebar.
- Header con titulo.
- Boton `Nueva Simulacion`.
- Filtros.
- Tabla.
- Paginador.
- Cards inferiores de resumen.

Filtros:

- Busqueda local por:
  - ID.
  - Precio.
  - TCEA.
  - Cuota mensual.
- Rango de fecha:
  - Ultimos 30 dias.
  - Ultimos 3 meses.
  - Este ano.
  - Todo el tiempo.
- Estado:
  - Todos.
  - Calculados.
  - Guardados.
  - Expirados.

El rango de fecha se transforma a:

- `createdFrom`.
- `createdTo`.

Formato `YYYY-MM-DD`.

Tabla:

- Fecha.
- Precio vehiculo.
- TCEA.
- Cuota mensual.
- Plazo.
- Estado.
- Acciones.

Formatos:

- Fecha: `date:'dd MMM, yyyy'`.
- Precio: `currency:item.currency:'symbol':'1.2-2'`.
- TCEA: `number:'1.2-2'`.
- Cuota mensual: `currency:item.currency:'symbol':'1.2-2'`.
- TCEA promedio mensual: `number:'1.2-2'`.

Acciones:

- Ver detalle.
- Eliminar simulacion.

## 9. Perfil

Ruta: `/profile`

Objetivo:

Permitir gestion basica de cuenta.

Endpoints:

- `GET /api/v1/auth/me`.
- `PATCH /api/v1/auth/me`.
- `POST /api/v1/auth/me/password`.

Estructura:

- Sidebar.
- Card de perfil.
- Avatar iconico.
- Email del usuario.
- Formulario de datos.

Campos:

- DNI.
- Nombre completo.
- Preferencia de moneda.
- Contrasena actual.
- Nueva contrasena.
- Confirmar nueva contrasena.

Validaciones:

- DNI requerido con 8 digitos numericos.
- Nombre requerido.
- Nombre maximo 100 caracteres.
- Si se cambia contrasena, los tres campos de contrasena deben completarse.
- Nueva contrasena y confirmacion deben coincidir.

Nota funcional:

La preferencia de moneda es visual/local en el formulario. El endpoint de perfil actualiza DNI y nombre completo.

## 10. Ayuda

Ruta: `/help`

Objetivo:

Mostrar preguntas frecuentes y permitir busqueda local.

Estructura:

- Sidebar.
- Buscador.
- Lista FAQ expandible.

FAQ actuales:

- Que es la TCEA y como se calcula.
- En que consiste la cuota Balloon.
- Que documentos necesito para calificar.
- Puedo realizar pagos anticipados.

No depende de backend.

## 11. Formatos numericos y decimales

Resumen de formatos usados:

| Dato | Formato |
|---|---|
| TCEA dashboard | 1 decimal |
| VAN dashboard | moneda sin decimales |
| Pago mensual dashboard | moneda con 2 decimales |
| TCEA tablas | 2 decimales |
| Precio vehiculo | moneda con 2 decimales |
| Cuota mensual | moneda con 2 decimales |
| Capital inicial | moneda con 2 decimales |
| Tasa efectiva | 2 decimales |
| VAN resultados | moneda con 2 decimales |
| TIR resultados | 2 decimales |
| Saldos cronograma | moneda con 2 decimales |
| Interes cronograma | moneda con 2 decimales |
| Amortizacion cronograma | moneda con 2 decimales |
| Costos cronograma | moneda con 2 decimales |
| Pago total periodo | moneda con 2 decimales |

## 12. Consistencia financiera del frontend

El frontend contempla correctamente los elementos necesarios para una simulacion financiera de credito vehicular:

- Precio del vehiculo.
- Moneda.
- Cuota inicial.
- Cuota balloon.
- Plazo.
- Tipo de tasa.
- Valor de tasa.
- Frecuencia de pago mensual.
- Capitalizacion para tasa nominal.
- Periodo de gracia.
- COK para VAN.
- Seguro de desgravamen.
- Seguro vehicular.
- Gastos administrativos.

Tambien muestra los principales resultados financieros:

- Cuota mensual.
- Capital inicial.
- Tasa efectiva.
- TCEA.
- VAN.
- TIR.
- Viabilidad.
- Cronograma de pagos.
- Interes.
- Amortizacion.
- Costos.
- Pago total.
- Saldo final.

El frontend evita inconsistencias importantes:

- No pide TIR como input.
- Usa COK como input para VAN.
- Solo pide capitalizacion si la tasa es nominal.
- No permite plazos fuera de 24, 36 o 48 meses.
- No permite cuota inicial fuera de 10% a 30%.
- No permite cuota balloon fuera de 35% a 50%.
- No permite meses de gracia mayores a 6.
- Fuerza meses de gracia a 0 cuando no hay gracia.
- No calcula indicadores financieros por su cuenta; los lee desde backend.

## 13. Limites del analisis

Este documento valida que el frontend captura, envia y muestra correctamente los datos financieros esperados. No demuestra matematicamente que el motor financiero del backend calcule bien.

Para asegurar el funcionamiento financiero completo se recomienda complementar con pruebas backend de:

- Formula de cuota francesa.
- Conversion TEA/TNA a tasa mensual efectiva.
- Capitalizacion nominal por frecuencia.
- Gracia parcial.
- Gracia total.
- Cuota balloon.
- Seguro desgravamen.
- Seguro vehicular.
- Gastos administrativos.
- VAN desde el punto de vista del deudor.
- TIR.
- TCEA.
- Cronograma periodo por periodo.
