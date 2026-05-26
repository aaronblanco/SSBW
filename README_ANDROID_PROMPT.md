# README Android API Review + Prompt

Este documento sirve para dos cosas:
1. Validar rapidamente que el backend de este repo funciona.
2. Usarlo como prompt base para revisar coherencia en tu app Android.

## 1) Resumen de revision tecnica (backend)

Revision realizada sobre rutas, controladores y servicios actuales.

Puntos relevantes para Android:
- Auth soporta token Bearer en header Authorization y tambien cookie.
- Admin demo por defecto: `admin@ssbw.local` / `!SqvXv!3KivhniR#8H@x^W`.
- IDs de User/Product son numericos (Int en backend, usar Long en Android).
- GET /api/products devuelve objeto paginado (no lista plana).
- Carrito existe en backend y persiste en PostgreSQL por usuario.
- GET /api/orders/my devuelve stub (items vacio + mensaje), aun no hay logica real de pedidos.
- /api/logs/cart no exige autenticacion en su estado actual.
- Hay endpoint legacy de scraping: GET /api/scrape/kiwoko.

## 2) Contrato de endpoints para Android

Base URL local: http://localhost:3000
Prefijo API: /api

### Salud
- GET /health
- 200: { ok: true, service: "ssbw-backend" }

### Auth
- POST /api/auth/register
  - body: firstName, lastName, birthDate (yyyy-MM-dd), email, password, role? (default user)
  - 201: { token, user }
- POST /api/auth/login
  - body: email, password
  - 200: { token, user }
- GET /api/auth/me
  - header: Authorization: Bearer <token>
  - 200: { user }
- POST /api/auth/logout
  - opcionalmente con token
  - 200: { ok: true }

### Products
- GET /api/products
  - query soportada:
    - paginacion estandar: take, skip
    - alias de paginacion: desde, hasta
    - filtro: search
    - orden: sortBy (id,title,price,source,scrapedAt,createdAt,updatedAt)
    - direccion: sortDir (asc, desc, ascendente, descendente)
    - aliases de orden: ordenacionCampo/orderBy, ordenacion/order
  - 200: { total, take, skip, sortBy, sortDir, items: [...] }
- GET /api/products/:id
  - 200 producto
  - 404 si no existe
- POST /api/products (admin)
- PUT /api/products/:id (admin)
- DELETE /api/products/:id (admin)
- POST /api/products/scrape/kiwoko
- GET /api/products/scrape/kiwoko
- GET /api/scrape/kiwoko (legacy)

### Cart (requiere auth)
- GET /api/cart
  - 200: { items, count, totalAmount }
- POST /api/cart
  - body minimo: id, title, price
  - 201: { items, count, totalAmount }
- DELETE /api/cart/:productId
- DELETE /api/cart

### Logs
- POST /api/logs/cart
  - body: action (add|remove|checkout), product?, cartCount?, totalAmount?
  - 201: { ok: true, event }

### Orders
- GET /api/orders/my (requiere auth)
  - 200 actual: { items: [], message: "Aun no tienes pedidos." }

## 3) Smoke test real ejecutado (25-04-2026)

Se ejecuto en local:
- docker compose up -d postgres
- npm run db:push
- npm run dev

Resultados observados:
- health OK
- register/login/me/logout OK
- products list + detail OK
- admin create/update/delete product OK
- cart add/list/remove/clear OK
- logs cart OK
- orders/my OK (respuesta stub esperada)
- scrape kiwoko OK (savedCount observado en pruebas)
- cart sin token responde 401 (esperado)

## 4) Comandos de prueba rapida (PowerShell)

### 4.1 Setup

```powershell
npm install
docker compose up -d postgres
npm run db:push
npm run dev
```

### 4.2 Prueba integral corta (sin admin CRUD)

```powershell
$base='http://localhost:3000'
$email = 'android.check.' + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() + '@example.com'

$registerBody = @{
  firstName='Android'; lastName='Check'; birthDate='1999-05-21';
  email=$email; password='Pass1234!'; role='user'
} | ConvertTo-Json

$register = Invoke-RestMethod -Method Post -Uri "$base/api/auth/register" -ContentType 'application/json' -Body $registerBody
$token = $register.token

$health = Invoke-RestMethod -Method Get -Uri "$base/health"
$me = Invoke-RestMethod -Method Get -Uri "$base/api/auth/me" -Headers @{ Authorization = "Bearer $token" }
$products = Invoke-RestMethod -Method Get -Uri "$base/api/products?take=5&skip=0&sortBy=scrapedAt&sortDir=desc"

$cartAddBody = @{ id=1; title='Producto Demo'; price=10.5 } | ConvertTo-Json
$cartAdd = Invoke-RestMethod -Method Post -Uri "$base/api/cart" -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $cartAddBody
$cartList = Invoke-RestMethod -Method Get -Uri "$base/api/cart" -Headers @{ Authorization = "Bearer $token" }

$logBody = @{ action='add'; product=@{ id=1; title='Producto Demo' }; cartCount=1; totalAmount=10.5 } | ConvertTo-Json -Depth 5
$logRes = Invoke-RestMethod -Method Post -Uri "$base/api/logs/cart" -ContentType 'application/json' -Body $logBody

$orders = Invoke-RestMethod -Method Get -Uri "$base/api/orders/my" -Headers @{ Authorization = "Bearer $token" }

[PSCustomObject]@{
  healthOk = $health.ok
  meEmail = $me.user.email
  productsTotal = $products.total
  cartCount = $cartList.count
  logOk = $logRes.ok
  ordersItems = $orders.items.Count
} | Format-List
```

## 5) Prompt reutilizable para auditar tu proyecto Android

Copia y pega este prompt en tu repo Android (Copilot/ChatGPT):

"""
Actua como revisor tecnico Android + API contract reviewer.

Contexto de backend (fuente de verdad):
- Base URL local: http://localhost:3000
- Auth: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout
- Products: GET /api/products (respuesta paginada con total,take,skip,sortBy,sortDir,items), GET /api/products/:id, POST/PUT/DELETE /api/products (admin)
- Scrape: POST y GET /api/products/scrape/kiwoko, legacy GET /api/scrape/kiwoko
- Cart (auth): GET/POST/DELETE /api/cart y DELETE /api/cart/:productId
- Logs: POST /api/logs/cart con action in [add,remove,checkout]
- Orders (auth): GET /api/orders/my devuelve hoy un stub (items vacio)

Reglas de contrato importantes:
- IDs numericos: usar Long en Kotlin para user/product ids.
- Auth principal para Android: Authorization: Bearer <jwt>.
- register/login devuelven JSON con token y user.
- birthDate se envia como yyyy-MM-dd.
- GET /api/products NO devuelve lista plana, devuelve objeto paginado.

Tu tarea:
1) Escanea el proyecto Android completo (Retrofit interfaces, data classes DTO, mappers, repository, datasource, use cases, ViewModel).
2) Detecta incoherencias exactas contra el contrato (tipos, nombres de campos, optionalidad, wrappers de respuesta, rutas, metodos HTTP, query params, headers, manejo de errores HTTP).
3) Devuelve una tabla de hallazgos con columnas:
   - Severidad (Alta/Media/Baja)
   - Archivo y linea
   - Problema
   - Impacto real
   - Fix propuesto (codigo concreto)
4) Propone cambios minimos para dejarlo estable sin refactors grandes.
5) Genera tests sugeridos para:
   - Auth flow (register/login/me/logout)
   - Products list paginada + filtros + orden
   - Cart add/remove/clear
   - Manejo de 401/403/404/500
6) Si algo del backend es ambiguo, listalo como "Pregunta abierta" en vez de inventar.

Formato de salida:
- Primero hallazgos (ordenados por severidad).
- Luego patch plan por archivos.
- Luego checklist final de validacion manual para QA.
"""

## 6) Checklist rapido de coherencia Android

Marca cada punto antes de cerrar tu entrega:
- [ ] Product id y User id son Long, no String.
- [ ] Existe DTO para ProductsListResponse con items + metadatos de paginacion.
- [ ] register/login parsean token + user desde JSON.
- [ ] me usa Authorization Bearer y parsea { user: ... }.
- [ ] birthDate se formatea yyyy-MM-dd al enviar.
- [ ] Cart endpoints incluyen token y modelos { items, count, totalAmount }.
- [ ] Manejo de errores 401/403/404/500 implementado.
- [ ] No se asume persistencia de pedidos en /api/orders/my (hoy es stub).

## 7) Nota de alcance

Este README esta enfocado en coherencia Android <-> backend de este repo.
Si cambian rutas o payloads en backend, actualiza primero este archivo y luego re-ejecuta el prompt sobre Android.

## 8) Addendum tras revisar repo Android MiauMarket

Revision basada en el repo: https://github.com/aaronblanco/MiauMarket

Hallazgos concretos observados:
- Auth y productos estan implementados (Retrofit + repositorio + DTO) y en general coherentes con backend.
- `ProductResponse` mapea `title` -> `name`, lo cual es correcto para el payload actual.
- Base URL de emulador (`10.0.2.2`) y Bearer interceptor estan bien planteados.
- La app inicia en catalogo de forma fija (comentario: "Always start at Catalog now, login is optional"). Esto puede contradecir la logica de auto-login esperada y el flujo auth estricto.
- No se detecta en la capa de red Android cliente para cart/orders/logs/scrape, aunque esos endpoints existen en backend y estaban en el alcance funcional que definimos.
- En products se usan `skip/take/search`, pero no hay consumo de `sortBy/sortDir` ni aliases de ordenacion.

### Prompt delta especifico para MiauMarket Android

Copia y pega este prompt en el repo Android para una revision enfocada:

"""
Actua como auditor tecnico Android y valida EXCLUSIVAMENTE el repo MiauMarket contra el contrato backend SSBW.

Objetivo:
- Confirmar que auth y products estan correctos.
- Detectar huecos funcionales reales en cart/orders/logs/scrape.
- Validar si la navegacion inicial contradice auto-login esperado.
- Proponer fixes minimos por archivo, sin refactor masivo.

Contrato backend a validar:
- Auth: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout
- Products: GET /api/products (paginado), GET /api/products/:id
- Products query recomendada: skip,take,search + sortBy/sortDir
- Cart(auth): GET/POST/DELETE /api/cart y DELETE /api/cart/:productId
- Logs: POST /api/logs/cart
- Orders(auth): GET /api/orders/my (actualmente stub)
- Scrape: GET/POST /api/products/scrape/kiwoko y legacy GET /api/scrape/kiwoko

Comprobaciones obligatorias:
1) Inventaria interfaces Retrofit existentes y lista endpoints faltantes respecto al contrato.
2) Revisa si hay repositorios/use-cases/viewmodels para cart y orders; si no existen, marca gap funcional.
3) Verifica navegacion inicial:
  - Si startDestination es catalogo siempre.
  - Si existe comprobacion real de token valido para auto-login.
4) Revisa products:
  - wrapper paginado {total,take,skip,items}
  - soporte real de ordenacion (sortBy/sortDir) en API/repository/viewmodel.
5) Para cada hallazgo entrega fix minimo con diff sugerido.

Formato de salida:
- Seccion A: Hallazgos (Alta/Media/Baja) con archivo y linea.
- Seccion B: Plan de cambios minimos por archivo.
- Seccion C: Criterios de aceptacion verificables (checklist QA manual).
"""

### Checklist breve de cierre para MiauMarket

- [ ] Existe cliente Retrofit para `cart`, `orders` y `logs` (si forman parte del alcance final).
- [ ] Existe capa repository + ViewModel para esos modulos, o se documenta explicitamente que quedan fuera de alcance.
- [ ] La decision de arranque en catalogo vs login/token-check esta alineada con requisitos.
- [ ] Products soporta ordenacion o se documenta como deuda tecnica aceptada.
