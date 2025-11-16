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

- **Estudiante**: Usuario que puede reportar incidentes y ver el estado de sus reportes
- **Seguridad**: Personal de seguridad que puede gestionar y actualizar el estado de incidentes
- **Administrador**: Usuario con acceso completo al sistema para gestión avanzada

## 📊 Tipos de Incidentes

El sistema clasifica los incidentes en las siguientes categorías:

- **Emergencia médica**: Situaciones que requieren atención médica inmediata
- **Seguridad**: Incidentes relacionados con la seguridad del campus
- **Infraestructura**: Problemas con instalaciones o equipamiento
- **Otro**: Incidentes que no encajan en las categorías anteriores

## 🚨 Niveles de Urgencia

Cada incidente se clasifica según su nivel de urgencia:

- **Baja**: Situaciones que pueden esperar atención programada
- **Media**: Situaciones que requieren atención en un plazo razonable
- **Alta**: Situaciones que requieren atención inmediata
- **Crítica**: Emergencias que ponen en riesgo la seguridad o vida

## 📈 Estados de Incidentes

Los incidentes pasan por diferentes estados durante su ciclo de vida:

- **pendiente**: Incidente recién creado, esperando asignación
- **en_atencion**: Incidente siendo atendido por personal
- **resuelto**: Incidente completamente resuelto
- **cancelado**: Incidente cancelado o duplicado

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
- **Suscripción automática**: Usuarios con rol `seguridad` o `administrador` se suscriben automáticamente al registrarse
- **Confirmación requerida**: Los usuarios deben confirmar su suscripción haciendo click en el link enviado por AWS SNS
- **Formato texto plano**: Emails legibles con todos los detalles del incidente

#### Quiénes reciben notificaciones por email:
- ✅ Usuarios registrados con rol **seguridad**
- ✅ Usuarios registrados con rol **administrador**
- ✅ Email configurado en `serverless.yml` (`seguridad@utec.edu.pe`)
- ❌ Usuarios con rol **estudiante** (solo reportan, no reciben notificaciones)

## 🗄️ Base de Datos (DynamoDB)

### Tablas:

1. **Usuarios**
   - Clave primaria: `userId`
   - Índice secundario: `EmailIndex` para búsquedas por email
   - Campos: email, password (hasheado), rol, fechaCreacion
   - Auto-suscripción a SNS para roles seguridad/administrador

2. **Incidentes**
   - Clave primaria: `incidenteId`
   - Campos: tipo, descripcion, ubicacion, urgencia, estado, fechaCreacion, historial, emailReportante (opcional)
   - Notificaciones SNS al crear o actualizar

3. **WebSocketConnections**
   - Clave primaria: `connectionId`
   - Gestión automática de conexiones activas

## ⚡ Características Técnicas

- **Serverless Framework**: Despliegue automatizado en AWS
- **Pay-per-request**: DynamoDB con facturación por uso
- **Escalabilidad automática**: Lambda escala según demanda
- **Historial de cambios**: Cada incidente mantiene un registro de todos los cambios de estado
- **Manejo de errores**: Responses consistentes con códigos HTTP apropiados
- **Notificaciones multi-canal**: WebSocket para tiempo real + SNS para emails
- **Pub/Sub con SNS**: Arquitectura de mensajería desacoplada para notificaciones

## 🧪 Endpoints

### Autenticación
- `POST /auth/register` - Registrar usuario
- `POST /auth/login` - Iniciar sesión

### Incidentes
- `POST /incidentes` - Crear incidente
- `GET /incidentes` - Listar incidentes
- `GET /incidentes/{id}` - Obtener incidente
- `PATCH /incidentes/{id}/estado` - Actualizar estado

### WebSocket
- `$connect` - Conectar cliente
- `$disconnect` - Desconectar cliente
- `notify` - Enviar notificaciones

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

4. **Usuarios registrados**: Al registrarse con rol `seguridad` o `administrador`, recibirán automáticamente un email de confirmación de suscripción

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
