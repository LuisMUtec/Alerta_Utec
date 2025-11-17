# Alerta UTEC - Backend

Sistema de alertas en tiempo real para UTEC usando AWS Lambda, API Gateway, DynamoDB y WebSockets.

## 📋 Requisitos

- Node.js 18+
- AWS CLI configurado
- Serverless Framework

## 🚀 Instalación

```bash
npm install
```

## 📦 Despliegue

```bash
npm run deploy
```

## 👥 Roles de Usuario

El sistema maneja diferentes tipos de roles para gestionar permisos y accesos:

### 🎓 Estudiante
- Puede reportar incidentes de cualquier tipo
- Solo puede ver los incidentes que él/ella ha reportado
- **NO recibe notificaciones por email** (solo reporta)
- **NO puede cambiar estados** de incidentes

### 🛡️ Autoridad (Personal Especializado)
- Tiene un **área asignada** (obligatoria al registrarse)
- Puede reportar y gestionar incidentes
- **Recibe notificaciones por email** de todos los incidentes
- **Puede cambiar estados** de incidentes
- Puede filtrar incidentes por su área específica
- **Áreas disponibles:**
  - 🔒 **Seguridad**: Robos, acoso, peleas, accesos no autorizados
  - 🏥 **Enfermería**: Emergencias médicas, accidentes, malestares
  - 🏗️ **Infraestructura**: Fugas, daños estructurales, inundaciones
  - 🧹 **Limpieza**: Baños sucios, basura acumulada, derrames
  - 💻 **Tecnología**: Internet caído, equipos dañados, sistemas caídos
  - 🔧 **Mantenimiento**: Luces fundidas, aire acondicionado, puertas dañadas

### 👨‍💼 Administrativo
- Acceso completo al sistema sin restricciones de área
- Puede reportar incidentes de cualquier tipo
- **Recibe notificaciones por email** de todos los incidentes
- **Puede cambiar estados** de cualquier incidente
- **Acceso al Panel Administrativo** con estadísticas completas
- Supervisa todas las áreas del sistema

## 📊 Tipos de Incidentes

El sistema clasifica los incidentes en categorías detalladas por área:

### 🔒 Seguridad
- **robo**: Robo o hurto de pertenencias
- **acoso**: Acoso o intimidación
- **pelea**: Pelea o altercado físico
- **acceso_no_autorizado**: Acceso no autorizado a instalaciones

### 🏥 Salud
- **emergencia_medica**: Emergencia médica que requiere atención inmediata
- **accidente**: Accidente con lesiones
- **malestar**: Malestar general o desmayo

### 🏗️ Infraestructura
- **fuga_agua**: Fuga de agua o problemas de tubería
- **daño_estructural**: Daño en edificios o estructuras
- **inundacion**: Inundación o acumulación de agua

### 🧹 Limpieza
- **baño_sucio**: Baño en mal estado o sucio
- **basura_acumulada**: Basura acumulada sin recoger
- **derrame**: Derrame de líquidos o suciedad

### 💻 Tecnología
- **internet_caido**: Internet caído o problemas de conectividad
- **equipo_dañado**: Equipo informático dañado
- **sistema_caido**: Sistema o aplicación caída

### 🔧 Mantenimiento
- **luz_fundida**: Luz fundida o problema eléctrico
- **aire_acondicionado**: Aire acondicionado dañado
- **puerta_dañada**: Puerta dañada o cerrada

## 🚨 Niveles de Urgencia

Cada incidente se clasifica según su nivel de urgencia:

- **Baja**: Situaciones que pueden esperar atención programada
- **Media**: Situaciones que requieren atención en un plazo razonable
- **Alta**: Situaciones que requieren atención inmediata
- **Crítica**: Emergencias que ponen en riesgo la seguridad o vida

## 📈 Estados de Incidentes

Los incidentes pasan por diferentes estados durante su ciclo de vida:

- **pendiente**: Incidente recién creado, esperando asignación o atención
- **en_atencion**: Incidente siendo atendido activamente por el personal correspondiente
- **resuelto**: Incidente completamente resuelto y cerrado
- **cancelado**: Incidente cancelado, duplicado, o reportado por error

### 🔄 Flujo de Estados

```
Pendiente → En Atención → Resuelto → Cancelado → Pendiente (reapertura)
```

### 👥 Permisos por Estado

- **Estudiantes**: Solo pueden ver estados, no modificarlos
- **Autoridad y Administrativo**: Pueden cambiar estados siguiendo el flujo
- **Cancelar**: Cualquier usuario autenticado puede cancelar un incidente
- **Notificaciones**: Cada cambio de estado envía email (SNS) y WebSocket

## 🔐 Seguridad

- **Autenticación JWT**: Tokens con expiración de 24 horas
- **Encriptación de contraseñas**: Bcrypt con salt rounds de 10
- **CORS habilitado**: Para integración con frontend
- **Validación de datos**: Validación en todos los endpoints

## 🔄 Notificaciones en Tiempo Real

### WebSockets
El sistema utiliza AWS API Gateway WebSocket para:

- Notificaciones instantáneas de nuevos incidentes en el panel Admin
- Actualizaciones de estado en tiempo real
- Conexión persistente entre cliente y servidor
- Gestión automática de conexiones obsoletas

### Amazon SNS (Simple Notification Service)
Sistema de notificaciones por correo electrónico:

- **Nuevos incidentes**: Email automático cuando se crea un incidente
- **Cambios de estado**: Email cuando se actualiza el estado de un incidente
- **Suscripción automática**: Usuarios con rol `autoridad` o `administrativo` se suscriben automáticamente al registrarse
- **Confirmación requerida**: Los usuarios deben confirmar su suscripción haciendo click en el link enviado por AWS SNS
- **Formato texto plano**: Emails legibles con todos los detalles del incidente

#### 📧 Quiénes reciben notificaciones por email:
- ✅ Usuarios registrados con rol **autoridad** (todas las áreas: seguridad, enfermería, infraestructura, etc.)
- ✅ Usuarios registrados con rol **administrativo**
- ✅ Email configurado manualmente en `serverless.yml` (ej: `seguridad@utec.edu.pe`)
- ❌ Usuarios con rol **estudiante** (solo reportan, no reciben notificaciones)

#### 📨 Tipos de notificaciones enviadas:

1. **Nuevo Incidente Creado**
   - Asunto: `🚨 [Urgencia] Tipo de Incidente - INC_XXX`
   - Incluye: ID, tipo, área asignada, urgencia, ubicación, descripción, contacto
   - Formato: Texto plano con emojis y separadores legibles

2. **Estado Actualizado**
   - Asunto: `📝 Estado actualizado: INC_XXX → Nuevo Estado`
   - Incluye: Cambio de estado anterior → nuevo, fecha de actualización
   - Muestra historial del incidente

#### 🔔 Notificaciones en Tiempo Real (WebSocket)
- Evento: `nuevo_incidente` - Cuando se crea un incidente
- Evento: `estado_actualizado` - Cuando cambia el estado
- Todos los clientes conectados al Panel Admin reciben actualizaciones instantáneas
- Gestión automática de conexiones obsoletas (cleanup cuando falla envío)

## 🗄️ Base de Datos (DynamoDB)

### Tablas:

1. **Usuarios**
   - **Clave primaria**: `userId` (String)
   - **Índices secundarios globales (GSI)**:
     - `EmailIndex`: Búsqueda por email (único por usuario)
     - `AreaIndex`: Búsqueda por área (filtra usuarios de una área específica)
   - **Campos principales**:
     - `email`: Email del usuario (único)
     - `password`: Contraseña hasheada con bcrypt (salt rounds = 10)
     - `rol`: estudiante | autoridad | administrativo
     - `area`: Área asignada (obligatorio para autoridad): seguridad | enfermeria | infraestructura | limpieza | tecnologia | mantenimiento
     - `fechaCreacion`: Timestamp ISO 8601
   - **Auto-suscripción a SNS**: Usuarios con rol `autoridad` o `administrativo` se suscriben automáticamente al registrarse

2. **Incidentes**
   - **Clave primaria**: `incidenteId` (String, formato: INC_XXXXX)
   - **Índices secundarios globales (GSI)**:
     - `UserIdIndex`: Permite filtrar incidentes por usuario reportante
   - **Campos principales**:
     - `tipo`: Tipo específico del incidente (robo, emergencia_medica, fuga_agua, etc.)
     - `descripcion`: Descripción detallada del problema
     - `ubicacion`: Ubicación exacta en el campus
     - `urgencia`: baja | media | alta | critica
     - `area`: Área asignada automáticamente según el tipo (seguridad, enfermeria, infraestructura, etc.)
     - `userId`: ID del usuario que reportó el incidente
     - `emailReportante`: Email del reportante (para seguimiento)
     - `estado`: pendiente | en_atencion | resuelto | cancelado
     - `fechaCreacion`: Timestamp ISO 8601
     - `historial`: Array de objetos con cambios (acción, fecha, usuario)
   - **Notificaciones automáticas**: SNS (email) + WebSocket al crear o actualizar

3. **WebSocketConnections**
   - **Clave primaria**: `connectionId` (String)
   - **Campos**:
     - `timestamp`: Fecha de conexión
   - **Gestión automática**: Limpieza de conexiones obsoletas (statusCode 410)
   - **Uso**: Notificaciones en tiempo real al Panel Admin

## ⚡ Características Técnicas

### 🏗️ Arquitectura
- **Serverless Framework**: Despliegue completamente automatizado en AWS
- **Node.js 18.x**: Runtime moderno con soporte para ES6+
- **AWS Lambda**: 9 funciones serverless que escalan automáticamente
- **API Gateway**: REST API + WebSocket API para comunicación bidireccional
- **Pay-per-request**: DynamoDB sin capacidad aprovisionada, pago solo por uso

### 🔒 Seguridad
- **JWT con expiración**: Tokens válidos por 24 horas
- **Bcrypt**: Hash de contraseñas con 10 salt rounds
- **CORS configurado**: Permite integración segura con frontend
- **Validación de entrada**: Todos los endpoints validan datos recibidos
- **Control de acceso basado en roles (RBAC)**: Permisos granulares por rol

### 📊 Base de Datos
- **3 Tablas DynamoDB**: Usuarios, Incidentes, WebSocketConnections
- **Índices Globales Secundarios (GSI)**: EmailIndex, AreaIndex, UserIdIndex
- **Historial de cambios**: Cada incidente registra todas las modificaciones
- **Queries optimizadas**: Uso eficiente de índices para búsquedas rápidas

### 🔔 Notificaciones Multi-Canal
- **WebSocket (tiempo real)**: Actualizaciones instantáneas en Panel Admin
- **SNS (email)**: Notificaciones asíncronas a múltiples suscriptores
- **Pub/Sub desacoplado**: Arquitectura escalable y resiliente
- **Gestión automática de conexiones**: Limpieza de conexiones obsoletas
- **Formato legible**: Emails en texto plano con emojis y estructura clara

### 🔍 Filtrado y Búsqueda
- **Por usuario**: Estudiantes solo ven sus propios incidentes
- **Por área**: Autoridades pueden filtrar por su área especializada
- **Por estado**: Filtros de pendiente, en_atención, resuelto, cancelado
- **Sin restricciones**: Administrativos ven todos los incidentes

### 📈 Escalabilidad y Rendimiento
- **Lambda concurrency**: Hasta 1000 invocaciones concurrentes
- **DynamoDB auto-scaling**: Capacidad ajustada automáticamente
- **WebSocket gestionado**: AWS API Gateway maneja conexiones persistentes
- **Notificaciones asíncronas**: No bloquea el flujo principal
- **Error handling robusto**: Responses HTTP consistentes (200, 400, 403, 404, 500)

## 🧪 Endpoints API

### 🔐 Autenticación (públicos)

#### `POST /auth/register`
Registra un nuevo usuario y lo suscribe automáticamente a SNS si es autoridad/administrativo.

**Body:**
```json
{
  "email": "usuario@utec.edu.pe",
  "password": "123456",
  "rol": "autoridad",
  "area": "seguridad"  // Obligatorio para autoridad
}
```

**Response 200:**
```json
{
  "ok": true,
  "userId": "USR_abc12",
  "message": "Usuario registrado correctamente. Revisa tu email para confirmar la suscripción a notificaciones."
}
```

#### `POST /auth/login`
Inicia sesión y devuelve un JWT válido por 24 horas.

**Body:**
```json
{
  "email": "usuario@utec.edu.pe",
  "password": "123456"
}
```

**Response 200:**
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "USR_abc12",
  "rol": "autoridad",
  "area": "seguridad",
  "email": "usuario@utec.edu.pe"
}
```

---

### 📝 Incidentes (requieren autenticación)

Todos estos endpoints requieren el header:
```
Authorization: Bearer <token>
```

#### `POST /incidentes`
Crea un nuevo incidente. Envía notificaciones SNS y WebSocket automáticamente.

**Body:**
```json
{
  "tipo": "emergencia_medica",
  "descripcion": "Estudiante desmayado en el pabellón",
  "ubicacion": "Pabellón A, Piso 2",
  "urgencia": "alta",
  "area": "enfermeria"  // Opcional, se asigna automáticamente
}
```

**Response 200:**
```json
{
  "ok": true,
  "incidenteId": "INC_a1b2c3",
  "estado": "pendiente"
}
```

#### `GET /incidentes`
Lista incidentes según el rol del usuario:
- **Estudiante**: Solo sus propios incidentes
- **Autoridad**: Todos (puede filtrar por área en frontend)
- **Administrativo**: Todos sin restricción

**Response 200:**
```json
{
  "ok": true,
  "incidentes": [
    {
      "incidenteId": "INC_a1b2c3",
      "tipo": "emergencia_medica",
      "descripcion": "...",
      "ubicacion": "...",
      "urgencia": "alta",
      "area": "enfermeria",
      "estado": "pendiente",
      "fechaCreacion": "2025-11-16T10:30:00.000Z",
      "emailReportante": "estudiante@utec.edu.pe",
      "historial": [...]
    }
  ]
}
```

#### `GET /incidentes/{id}`
Obtiene un incidente específico por ID.

**Response 200:**
```json
{
  "ok": true,
  "incidente": { /* detalles completos */ }
}
```

#### `PATCH /incidentes/{id}/estado`
Actualiza el estado de un incidente. Solo autoridad/administrativo (excepto estado "cancelado").

**Body:**
```json
{
  "nuevoEstado": "en_atencion"
}
```

**Response 200:**
```json
{
  "ok": true,
  "incidenteId": "INC_a1b2c3",
  "estado": "en_atencion"
}
```

**Estados válidos:** `pendiente`, `en_atencion`, `resuelto`, `cancelado`

---

### 🔌 WebSocket API

**URL de conexión:** `wss://[API-ID].execute-api.us-east-1.amazonaws.com/dev`

#### `$connect`
Se ejecuta automáticamente cuando un cliente se conecta. Guarda `connectionId` en DynamoDB.

#### `$disconnect`
Se ejecuta automáticamente cuando un cliente se desconecta. Elimina `connectionId` de DynamoDB.

#### `notify` (ruta custom)
Envía notificaciones a todas las conexiones activas.

**Eventos enviados:**
- `nuevo_incidente`: Cuando se crea un incidente
- `estado_actualizado`: Cuando cambia el estado

**Formato del mensaje:**
```json
{
  "evento": "nuevo_incidente",
  "data": {
    "incidenteId": "INC_xyz",
    "tipo": "emergencia_medica",
    "urgencia": "alta",
    "estado": "pendiente"
  }
}
```

## 📧 Configuración de Notificaciones Email

Para configurar las notificaciones por email:

1. **Editar `serverless.yml`** - Cambiar el email en la suscripción SNS:
```yaml
SecurityEmailSubscription:
  Properties:
    Endpoint: tu-email@utec.edu.pe  # Cambiar aquí
```

2. **Desplegar los cambios**:
```bash
npm run deploy
```

3. **Confirmar suscripción**: Revisar tu bandeja de entrada y hacer click en el link de confirmación enviado por AWS SNS

4. **Usuarios registrados**: Al registrarse con rol `autoridad` o `administrativo`, recibirán automáticamente un email de confirmación de suscripción

## 🔧 Variables de Entorno

El sistema utiliza las siguientes variables de entorno (configuradas automáticamente por Serverless):

- `SNS_TOPIC_ARN`: ARN del topic SNS para notificaciones (auto-generado)
- `WEBSOCKET_ENDPOINT`: Endpoint del API Gateway WebSocket (configurar manualmente si no se auto-detecta)

**Nota:** No necesitas crear archivo `.env`, las variables se inyectan automáticamente desde `serverless.yml`

---

## 🗄️ Estructura

```
BackendHack/
├── serverless.yml          # Configuración AWS + SNS Topic
├── package.json
├── src/
│   ├── auth/
│   │   ├── login.js
│   │   └── register.js    # Suscripción automática a SNS
│   ├── incidentes/
│   │   ├── crearIncidente.js      # Publica a SNS
│   │   ├── actualizarEstado.js    # Publica a SNS
│   │   ├── listarIncidentes.js
│   │   └── obtenerIncidente.js
│   ├── websocket/
│   │   ├── connect.js
│   │   ├── disconnect.js
│   │   └── notify.js
│   ├── notifications/
│   │   └── enviarEmail.js  # (Deprecado - SNS directo)
│   └── utils/
│       └── responses.js
└── db/
    ├── get.js
    ├── put.js
    ├── query.js
    └── update.js
```

## 📚 Documentación Adicional

- `WEBSOCKET-EXPLICACION.md` - Guía completa de WebSockets
- `CONFIGURACION-SES.md` - Información sobre Amazon SES (deprecado)
- `DEPLOYMENT.md` - Guía de despliegue
- `AWS-ACADEMY-SETUP.md` - Configuración para AWS Academy
