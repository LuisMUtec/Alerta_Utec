# 🚨 Alerta UTEC - Sistema de Gestión de Incidentes en Tiempo Real

> **Sistema Cloud-Native de Alertas para Campus Universitario**  
> Proyecto Final - Curso de Cloud Computing | UTEC 2025

[![AWS](https://img.shields.io/badge/AWS-Cloud-orange?logo=amazon-aws)](https://aws.amazon.com)
[![Serverless](https://img.shields.io/badge/Architecture-Serverless-blue)](https://www.serverless.com)
[![Apache Airflow](https://img.shields.io/badge/Workflow-Apache%20Airflow-017cee?logo=apache-airflow)](https://airflow.apache.org)
[![WebSockets](https://img.shields.io/badge/Real--Time-WebSockets-green)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

---

## 🌐 Demo en Vivo

**🔗 Aplicación:** https://main.d14fh7vvz1m7i7.amplifyapp.com/

**👥 Usuarios de Prueba:**

| Rol | Email | Password | Permisos |
|-----|-------|----------|----------|
| 🎓 Estudiante | `estudiante@utec.edu.pe` | `123456` | Ver y reportar incidentes |
| 🛡️ Autoridad | `autoridad@utec.edu.pe` | `123456` | Gestionar todos los incidentes + Panel Admin |
| 👨‍💼 Admin | `admin@utec.edu.pe` | `123456` | Acceso completo al sistema |

---

## 📋 Tabla de Contenidos

- [Descripción del Proyecto](#-descripción-del-proyecto)
- [Arquitectura Cloud](#️-arquitectura-cloud)
- [Servicios AWS Utilizados](#-servicios-aws-utilizados)
- [Funcionalidades por Rol](#-funcionalidades-por-rol)
- [Apache Airflow - Workflows Automatizados](#-apache-airflow---workflows-automatizados)
- [WebSockets - Comunicación en Tiempo Real](#-websockets---comunicación-en-tiempo-real)
- [Características Técnicas Destacadas](#-características-técnicas-destacadas)
- [Guía de Uso del Sistema](#-guía-de-uso-del-sistema)
- [Deployment y CI/CD](#-deployment-y-cicd)
- [Escalabilidad y Alta Disponibilidad](#-escalabilidad-y-alta-disponibilidad)

---

## 📖 Descripción del Proyecto

**Alerta UTEC** es un sistema integral de gestión de incidentes diseñado para mejorar la seguridad y respuesta ante emergencias en el campus universitario. El proyecto implementa una **arquitectura serverless completa en AWS**, utilizando las mejores prácticas de cloud computing.

### 🎯 Problema que Resuelve

- ❌ **Antes**: Reportes de incidentes por teléfono o presencial, tiempo de respuesta lento, sin trazabilidad
- ✅ **Ahora**: Sistema digital en tiempo real, notificaciones automáticas, trazabilidad completa, panel de gestión centralizado

### 💡 Valor del Proyecto

1. **Tiempo Real**: WebSockets para notificaciones instantáneas
2. **Automatización**: Apache Airflow para workflows programados
3. **Escalabilidad**: Arquitectura serverless que escala automáticamente
4. **Multi-canal**: Notificaciones por email (SNS) y WebSocket
5. **Trazabilidad**: Historial completo de cada incidente

---

## 🏗️ Arquitectura Cloud

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            USUARIOS FINALES                              │
│  👨‍🎓 Estudiantes  |  🛡️ Seguridad  |  👨‍💼 Administradores              │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────────┐
        │         AWS AMPLIFY (Frontend)             │
        │    React + TypeScript + TailwindCSS        │
        │   https://main.d14fh7vvz1m7i7...           │
        └────────────┬───────────────────────────────┘
                     │
         ┌───────────┴──────────────┐
         │                          │
         ▼                          ▼
┌─────────────────┐      ┌──────────────────────┐
│  API Gateway    │      │  API Gateway         │
│  (REST API)     │      │  (WebSocket API)     │
└────────┬────────┘      └──────────┬───────────┘
         │                          │
         │                          ▼
         │              ┌───────────────────────┐
         │              │  Lambda Functions     │
         │              │  - connect.js         │
         │              │  - disconnect.js      │
         │              │  - notify.js          │
         │              └───────────┬───────────┘
         │                          │
         ▼                          ▼
┌─────────────────────────────────────────────┐
│          9 Lambda Functions                 │
│  ┌─────────────┐  ┌──────────────────────┐ │
│  │   Auth      │  │    Incidentes        │ │
│  │ - login     │  │ - crear              │ │
│  │ - register  │  │ - listar             │ │
│  └─────────────┘  │ - obtener            │ │
│                   │ - actualizar estado  │ │
│                   └──────────────────────┘ │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│           DynamoDB (NoSQL)                  │
│  ┌──────────────┐  ┌──────────────────┐   │
│  │   Usuarios   │  │   Incidentes     │   │
│  │   - userId   │  │   - incidenteId  │   │
│  │   - email    │  │   - tipo         │   │
│  │   - rol      │  │   - urgencia     │   │
│  │   - area     │  │   - estado       │   │
│  └──────────────┘  │   - historial    │   │
│                    └──────────────────┘   │
│  ┌──────────────────────────────────────┐ │
│  │   WebSocketConnections               │ │
│  │   - connectionId                     │ │
│  └──────────────────────────────────────┘ │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│          Amazon SNS (Notificaciones)        │
│     Topic: IncidentesNotificaciones         │
│  - Email a Seguridad                        │
│  - Email a Autoridades suscritas            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              APACHE AIRFLOW EN ECS FARGATE                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Container 1: Airflow Webserver (:8080)            │    │
│  │  Container 2: Airflow Scheduler                    │    │
│  └───────────────────┬────────────────────────────────┘    │
│                      │                                      │
│  ┌───────────────────▼────────────────────────────────┐    │
│  │  3 DAGs Programados:                               │    │
│  │  1️⃣ Monitorear Incidentes Antiguos (cada 5 min)   │    │
│  │  2️⃣ Enviar Notificaciones (cada 10 min)           │    │
│  │  3️⃣ Generar Reportes (diario)                     │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
          ┌────────────────────┐
          │  RDS PostgreSQL    │
          │  (Airflow Metadata)│
          └────────────────────┘
```

---

## ☁️ Servicios AWS Utilizados

| Servicio | Propósito | Configuración |
|----------|-----------|---------------|
| **🚀 AWS Amplify** | Hosting frontend | Deploy automático desde GitHub, CDN global |
| **⚡ Lambda** | Backend serverless | 9 funciones, Node.js 18.x, triggers HTTP y WebSocket |
| **🌐 API Gateway** | API REST + WebSocket | CORS habilitado, integración con Lambda |
| **💾 DynamoDB** | Base de datos NoSQL | 3 tablas, PAY_PER_REQUEST, GSI para queries |
| **📧 SNS** | Notificaciones email | Topic para incidentes, suscripción automática |
| **🐳 ECS Fargate** | Contenedores serverless | Apache Airflow (2 containers), 1 vCPU, 2GB RAM |
| **🗄️ RDS PostgreSQL** | Base de datos relacional | Metadata de Airflow, db.t3.micro |
| **📊 CloudWatch** | Monitoreo y logs | Logs de Lambda, métricas, alertas |
| **🔐 IAM** | Gestión de accesos | LabRole con permisos necesarios |

### 💰 Optimización de Costos

- ✅ **Serverless First**: Lambda y Fargate escalan a 0 cuando no hay uso
- ✅ **Pay-per-request**: DynamoDB sin capacidad aprovisionada
- ✅ **RDS Minimal**: db.t3.micro suficiente para Airflow metadata
- ✅ **CDN con Amplify**: Caché global reduce latencia y costos

---

## 👥 Funcionalidades por Rol

### 🎓 Rol: ESTUDIANTE

**Accesos:**
- ✅ Ver todos los incidentes del sistema
- ✅ Reportar nuevos incidentes (emergencia médica, seguridad, infraestructura)
- ✅ Filtrar incidentes por estado (pendiente, en atención, resuelto)
- ❌ NO puede cambiar estados
- ❌ NO accede al panel administrativo
- ❌ NO recibe notificaciones por email

**Casos de Uso:**
```
1. Estudiante ve a alguien desmayado en el pabellón
   → Reporta "Emergencia médica" con urgencia "Alta"
   → Seguridad recibe notificación email inmediata
   → WebSocket notifica al panel admin en tiempo real

2. Estudiante observa fuga de agua en el baño
   → Reporta "Infraestructura" con urgencia "Media"
   → Sistema crea registro con timestamp y ubicación
```

---

### 🛡️ Rol: SEGURIDAD / AUTORIDAD

**Accesos:**
- ✅ Ver todos los incidentes (todas las áreas)
- ✅ Reportar nuevos incidentes
- ✅ **Cambiar estados de incidentes** (pendiente → en atención → resuelto)
- ✅ **Acceso al Panel Administrativo** con estadísticas
- ✅ **Recibe notificaciones email** (SNS) de nuevos incidentes
- ✅ **Notificaciones WebSocket en tiempo real**

**Flujo de Trabajo:**
```
1. Usuario con rol Autoridad inicia sesión
   → Accede al Panel Admin
   → Ve dashboard con:
      📊 Total Incidentes: 45
      ⏳ Pendientes: 3
      🔧 En Atención: 7
      ✅ Resueltos: 35

2. Llega nuevo incidente (WebSocket notification)
   → "Nuevo incidente reportado: Emergencia médica en Pabellón B"
   → Click en el incidente
   → Botón "Cambiar Estado" → Pendiente → En Atención
   → Se envía email automático

3. Una vez resuelto el incidente
   → Botón "Cambiar Estado" → En Atención → Resuelto
   → Incidente archivado con historial completo
```

---

### 👨‍💼 Rol: ADMIN

**Accesos:**
- ✅ Acceso completo al sistema
- ✅ Ver, crear y gestionar todos los incidentes
- ✅ Cambiar estados de incidentes
- ✅ Panel administrativo con estadísticas avanzadas
- ✅ Notificaciones email (SNS)
- ✅ Notificaciones WebSocket
- ✅ **Supervisión del sistema Airflow**
- ✅ Gestión de usuarios (potencial)

**Casos de Uso:**
```
1. Revisar reportes generados por Airflow
2. Supervisar métricas de respuesta (tiempo promedio de atención)
3. Gestionar incidentes antiguos (Airflow detecta y escala)
4. Auditoría del historial completo de cada incidente
5. Supervisión general del sistema y coordinación con autoridades
```

---

## 🔄 Apache Airflow - Workflows Automatizados

### ¿Qué es Apache Airflow?

**Apache Airflow** es una plataforma para programar, monitorear y ejecutar workflows (flujos de trabajo) de manera automatizada. En nuestro proyecto, **corre en un contenedor ECS Fargate** (requisito del hackathon).

### Arquitectura de Airflow en el Proyecto

```
┌─────────────────────────────────────────┐
│      ECS Fargate Cluster                │
│  ┌───────────────────────────────────┐  │
│  │  Task Definition:                 │  │
│  │  alerta-utec-airflow              │  │
│  │                                   │  │
│  │  Container 1:                     │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  Airflow Webserver          │  │  │
│  │  │  Port: 8080                 │  │  │
│  │  │  UI de gestión              │  │  │
│  │  └─────────────────────────────┘  │  │
│  │                                   │  │
│  │  Container 2:                     │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  Airflow Scheduler          │  │  │
│  │  │  Ejecuta DAGs programados   │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────┬───────────────────┘  │
└──────────────────┼───────────────────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │  RDS PostgreSQL     │
        │  Metadata Database  │
        │  - DAG runs         │
        │  - Task instances   │
        │  - Logs             │
        └─────────────────────┘
```

### 📋 3 DAGs Implementados

#### 1️⃣ **Monitorear Incidentes Antiguos** 
📁 `airflow/dags/monitorear_incidentes_antiguos.py`

**Frecuencia:** Cada 5 minutos  
**Propósito:** Detectar incidentes pendientes por más de 30 minutos y escalarlos

```python
Workflow:
1. Consultar DynamoDB (tabla Incidentes)
2. Filtrar incidentes con:
   - Estado = "pendiente"
   - fechaCreacion > 30 minutos
   - urgencia = "Alta" o "Crítica"
3. Enviar email de alerta a administradores
4. Actualizar campo "escalado" en DynamoDB
5. Log en CloudWatch
```

**Caso de Uso:**
```
Escenario: Emergencia médica reportada hace 35 minutos, aún pendiente
→ Airflow detecta el incidente
→ Envía email urgente: "⚠️ INCIDENTE SIN ATENDER: [ID-123]"
→ Marca el incidente como escalado
→ Administrador toma acción inmediata
```

---

#### 2️⃣ **Enviar Notificaciones Periódicas**
📁 `airflow/dags/enviar_notificaciones.py`

**Frecuencia:** Cada 10 minutos  
**Propósito:** Resumen de incidentes activos vía email

```python
Workflow:
1. Consultar DynamoDB
2. Contar incidentes por estado:
   - Pendientes
   - En atención
3. Generar resumen en texto plano
4. Enviar email vía SNS a supervisores
5. Registrar envío en logs
```

**Email de Ejemplo:**
```
Asunto: 📊 Resumen de Incidentes - 16/11/2025 14:30

Hola Equipo de Seguridad,

Estado actual del sistema:
- 🔴 Pendientes: 3 incidentes
- 🟡 En Atención: 5 incidentes
- 🟢 Resueltos (últimas 24h): 12 incidentes

Incidentes críticos pendientes:
1. [INC-789] Emergencia médica - Pabellón A (hace 15 min)
2. [INC-790] Incendio - Laboratorio Química (hace 5 min)

Revisa el panel: https://main.d14fh7vvz1m7i7.amplifyapp.com/admin
```

---

#### 3️⃣ **Generar Reportes Diarios**
📁 `airflow/dags/generar_reportes.py`

**Frecuencia:** Diario a las 23:59  
**Propósito:** Crear reportes analíticos y guardarlos en S3 (opcional)

```python
Workflow:
1. Consultar todos los incidentes del día
2. Calcular métricas:
   - Total de incidentes
   - Tiempo promedio de resolución
   - Incidentes por tipo
   - Incidentes por urgencia
   - Incidentes por ubicación
3. Generar CSV o JSON
4. (Opcional) Subir a S3
5. Enviar resumen por email
```

**Reporte de Ejemplo (CSV):**
```csv
Fecha,Total Incidentes,Emergencias Médicas,Seguridad,Infraestructura,Tiempo Promedio Resolución
2025-11-16,28,7,12,9,23 minutos
```

---

### 🎯 Ventajas de Usar Airflow en Fargate

| Característica | Beneficio |
|----------------|-----------|
| **Serverless** | No gestionar servidores, escala automáticamente |
| **Contenedores** | Aislamiento, reproducibilidad, fácil deployment |
| **Monitoreo** | UI web para ver estado de DAGs, logs, métricas |
| **Retry automático** | Si un task falla, Airflow reintenta automáticamente |
| **Scheduling robusto** | Cron expressions, dependencias entre tasks |
| **Integración AWS** | Acceso directo a DynamoDB, SNS, S3, Lambda |

---

### 📊 Acceso a Airflow UI

```
URL: http://[ECS-PUBLIC-IP]:8080
Usuario: admin
Password: admin

Funcionalidades:
- Ver estado de los 3 DAGs
- Ejecutar DAGs manualmente
- Ver logs de cada ejecución
- Gráfico de dependencias entre tasks
- Métricas de tiempo de ejecución
```

---

## 🔌 WebSockets - Comunicación en Tiempo Real

### ¿Qué son WebSockets?

WebSockets permiten **comunicación bidireccional persistente** entre cliente (navegador) y servidor (AWS API Gateway). A diferencia de HTTP (request/response), WebSocket mantiene una conexión abierta.

### Arquitectura WebSocket en el Proyecto

```
┌─────────────────────────────────────────────────────────┐
│                    Cliente (Browser)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  websocket.ts                                     │  │
│  │  - Conecta al WS API Gateway                      │  │
│  │  - Escucha mensajes de notificaciones             │  │
│  │  - Reconecta automáticamente si se desconecta     │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ wss://...execute-api...
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│          API Gateway WebSocket API                       │
│  Routes:                                                 │
│  - $connect    → Lambda: connect.js                     │
│  - $disconnect → Lambda: disconnect.js                  │
│  - notify      → Lambda: notify.js                      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Lambda Functions (WebSocket)                │
│                                                          │
│  connect.js:                                            │
│  - Guarda connectionId en DynamoDB                      │
│  - Tabla: WebSocketConnections                          │
│                                                          │
│  disconnect.js:                                         │
│  - Elimina connectionId de DynamoDB                     │
│                                                          │
│  notify.js:                                             │
│  - Envía mensaje a todos los connectionId activos      │
│  - Limpia conexiones obsoletas                          │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   DynamoDB Table     │
              │ WebSocketConnections │
              │  - connectionId (PK) │
              │  - timestamp         │
              └──────────────────────┘
```

### 🔄 Flujo de Notificaciones en Tiempo Real

```
1. 🎓 Estudiante reporta incidente
   │
   ▼
2. ⚡ Lambda crearIncidente.handler()
   │ - Guarda en DynamoDB
   │ - Publica mensaje a SNS (email)
   │ - 🔥 LLAMA a Lambda notify (WebSocket)
   │
   ▼
3. 📡 Lambda notify.handler()
   │ - Obtiene todos los connectionId de DynamoDB
   │ - Envía mensaje WebSocket a cada conexión:
   │   {
   │     type: "new_incident",
   │     data: { incidenteId, tipo, urgencia, descripcion }
   │   }
   │
   ▼
4. 💻 Clientes conectados reciben notificación
   │ - Panel Admin actualiza lista automáticamente
   │ - Notificación del navegador (si está habilitado)
   │ - Contador de incidentes se actualiza
   │
   ▼
5. ✅ Sin recargar página, datos actualizados
```

### 📱 Código del Cliente (Simplificado)

```typescript
// FrontendHack/src/sockets/websocket.ts

class WebSocketService {
  connect() {
    this.ws = new WebSocket('wss://...execute-api.../dev');
    
    this.ws.onopen = () => {
      console.log('✅ WebSocket conectado');
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'new_incident') {
        // 🔔 Mostrar notificación
        new Notification('Nuevo Incidente', {
          body: `${message.data.tipo} - ${message.data.ubicacion}`,
          icon: '/logo.png'
        });
        
        // 🔄 Actualizar lista de incidentes
        this.updateIncidentsList();
      }
    };
    
    this.ws.onclose = () => {
      // 🔄 Reconectar automáticamente después de 3 segundos
      setTimeout(() => this.connect(), 3000);
    };
  }
}
```

### 🎯 Ventajas de WebSockets en el Proyecto

| Ventaja | Descripción |
|---------|-------------|
| **⚡ Latencia ultra-baja** | Notificaciones en ~100ms vs polling cada X segundos |
| **📉 Menos carga al servidor** | Una conexión persistente vs múltiples requests HTTP |
| **🔄 Actualizaciones instantáneas** | Sin necesidad de refrescar la página |
| **💰 Costo-efectivo** | Menos invocaciones de Lambda |
| **🎯 Push real** | Servidor notifica al cliente cuando hay cambios |

---

## ⚙️ Características Técnicas Destacadas

### 1. Arquitectura Serverless Completa

```
✅ Frontend: AWS Amplify (CDN global, hosting estático)
✅ Backend: AWS Lambda (9 funciones, escala automáticamente)
✅ Base de Datos: DynamoDB (NoSQL, PAY_PER_REQUEST)
✅ Workflows: Airflow en Fargate (contenedores serverless)
✅ Notificaciones: SNS (pub/sub), WebSocket (tiempo real)
```

**Beneficio:** Sistema escala de 0 a millones de usuarios sin gestionar servidores.

---

### 2. Seguridad Robusta

| Capa | Implementación |
|------|----------------|
| **Autenticación** | JWT (JSON Web Tokens), expiración 24h |
| **Contraseñas** | Bcrypt con salt rounds = 10 |
| **CORS** | Configurado en API Gateway, origins permitidos |
| **IAM** | Roles con permisos mínimos necesarios |
| **HTTPS** | Todo el tráfico encriptado (TLS 1.2+) |
| **Validación** | Input validation en todos los endpoints |

---

### 3. Trazabilidad Completa

Cada incidente mantiene un **historial de cambios**:

```json
{
  "incidenteId": "INC-789",
  "tipo": "Emergencia médica",
  "estado": "resuelto",
  "historial": [
    {
      "estado": "pendiente",
      "fecha": "2025-11-16T10:15:00Z",
      "usuario": "estudiante@utec.edu.pe"
    },
    {
      "estado": "en_atencion",
      "fecha": "2025-11-16T10:18:00Z",
      "usuario": "autoridad@utec.edu.pe",
      "comentario": "Personal de enfermería en camino"
    },
    {
      "estado": "resuelto",
      "fecha": "2025-11-16T10:45:00Z",
      "usuario": "autoridad@utec.edu.pe",
      "comentario": "Estudiante atendido, trasladado a enfermería"
    }
  ]
}
```

---

### 4. Multi-tenancy con Roles Dinámicos

El sistema soporta **múltiples roles** con permisos granulares:

```javascript
// Middleware de autorización
function verificarPermiso(rol, accion) {
  const permisos = {
    'estudiante': ['ver_incidentes', 'crear_incidente'],
    'autoridad': ['ver_incidentes', 'crear_incidente', 'actualizar_estado', 'panel_admin'],
    'admin': ['ver_incidentes', 'crear_incidente', 'actualizar_estado', 'panel_admin', 'gestionar_usuarios']
  };
  
  return permisos[rol]?.includes(accion);
}
```

---

### 5. Notificaciones Multi-Canal

```
Canal 1: Email (SNS)
  → Usuarios suscritos: Autoridad, Admin
  → Trigger: Nuevo incidente, cambio de estado
  → Formato: Texto plano con detalles completos

Canal 2: WebSocket
  → Clientes conectados: Panel Admin, usuarios en línea
  → Trigger: Nuevo incidente, actualización de estado
  → Formato: JSON con datos estructurados

Canal 3: Push Notifications (Browser API)
  → Usuarios con permisos habilitados
  → Trigger: Nuevo incidente crítico
  → Formato: Notificación nativa del navegador
```

---

## 📱 Guía de Uso del Sistema

### Paso 1: Acceder a la Aplicación

1. Abrir navegador
2. Ir a: https://main.d14fh7vvz1m7i7.amplifyapp.com/
3. Verás la pantalla de login

---

### Paso 2: Iniciar Sesión

**Usar las credenciales de prueba:**

```
Opción 1 - Estudiante:
  Email: estudiante@utec.edu.pe
  Password: 123456

Opción 2 - Autoridad:
  Email: autoridad@utec.edu.pe
  Password: 123456

Opción 3 - Admin:
  Email: admin@utec.edu.pe
  Password: 123456
```

---

### Paso 3: Reportar un Incidente (Todos los roles)

1. En la columna izquierda, completar el formulario:
   - **Tipo**: Emergencia médica / Incendio / Seguridad / Infraestructura
   - **Descripción**: "Estudiante desmayado en el pasillo"
   - **Ubicación**: "Pabellón B, Piso 2"
   - **Urgencia**: Alta

2. Click en **"Reportar Incidente"**

3. Verás confirmación: ✅ "Incidente reportado exitosamente"

**Qué sucede en el backend:**
```
1. Lambda crearIncidente guarda en DynamoDB
2. SNS envía email a usuarios con rol autoridad y admin
3. WebSocket notifica a todos los clientes conectados
4. Panel Admin actualiza automáticamente
```

---

### Paso 4: Gestionar Incidentes (Solo Autoridad/Admin)

1. Iniciar sesión con **autoridad@utec.edu.pe**

2. Click en **"Panel Admin"** (header superior derecho)

3. Verás dashboard con estadísticas:
   ```
   📊 Total Incidentes: 45
   ⏳ Pendientes: 3
   🔧 En Atención: 7
   ✅ Resueltos: 35
   ```

4. Localizar incidente en la lista

5. Click en botón **"Cambiar Estado"**:
   - Pendiente → En Atención
   - En Atención → Resuelto

6. El sistema envía email automático al reportante

---

### Paso 5: Habilitar Notificaciones Push (Opcional)

1. En el Panel Admin, click **"Habilitar Notificaciones"**

2. El navegador pedirá permiso:
   ```
   "Alerta UTEC desea enviarte notificaciones"
   [Permitir] [Bloquear]
   ```

3. Click en **"Permitir"**

4. Ahora recibirás notificaciones del navegador cuando:
   - Se reporte un nuevo incidente
   - Se actualice un incidente

---

## 🚀 Deployment y CI/CD

### Frontend (AWS Amplify)

```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

**Flujo de Deploy:**
```
1. Push a GitHub (branch main)
   │
   ▼
2. AWS Amplify detecta cambio
   │
   ▼
3. Build automático (npm install + npm run build)
   │
   ▼
4. Deploy a CDN global
   │
   ▼
5. ✅ Aplicación actualizada en < 3 minutos
```

---

### Backend (Serverless Framework)

```bash
# Desde BackendHack/
npm run deploy

# Esto ejecuta:
serverless deploy --stage dev --region us-east-1
```

**Qué despliega:**
```
✅ 9 Lambda Functions
✅ API Gateway REST API
✅ API Gateway WebSocket API
✅ 3 Tablas DynamoDB
✅ 1 SNS Topic con suscripción
✅ CloudWatch Log Groups
✅ IAM Roles y Políticas
```

**Tiempo de deploy:** ~2 minutos

---

### Airflow (ECS Fargate)

```bash
# Desde BackendHack/airflow/

# 1. Build imagen Docker
docker build -t alerta-utec-airflow .

# 2. Tag imagen
docker tag alerta-utec-airflow:latest [ECR-URI]:latest

# 3. Push a ECR
docker push [ECR-URI]:latest

# 4. Actualizar ECS Service
aws ecs update-service \
  --cluster alerta-utec-airflow-cluster \
  --service airflow-service \
  --force-new-deployment
```

**Deploy automatizado con script:** `airflow/REDESPLIEGUE.md`

---

## 📈 Escalabilidad y Alta Disponibilidad

### Escalamiento Automático

| Componente | Escala | Límite |
|------------|--------|--------|
| **Lambda** | Automático (1-1000 instancias concurrentes) | AWS Account limits |
| **DynamoDB** | Automático (PAY_PER_REQUEST) | Ilimitado |
| **API Gateway** | Automático | 10,000 requests/second |
| **Fargate** | Manual (aumentar task count) | 1-10 tasks |
| **SNS** | Automático | 100,000 mensajes/segundo |

---

### Alta Disponibilidad

```
✅ Multi-AZ: Lambda, DynamoDB, RDS replican en múltiples AZs
✅ Global CDN: Amplify distribuye frontend en 200+ locations
✅ Retry automático: Lambda reintentos en caso de fallo
✅ Failover: RDS con standby replica (opcional)
✅ Monitoreo: CloudWatch Alarms para detectar problemas
```

---

### Manejo de Fallos

```python
# Ejemplo: Lambda con retry exponential backoff

import time

def handler(event, context):
    max_retries = 3
    retry_delay = 1
    
    for attempt in range(max_retries):
        try:
            # Lógica de negocio
            result = process_incident(event)
            return result
        
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(retry_delay * (2 ** attempt))
                continue
            else:
                # Log error en CloudWatch
                print(f"Error después de {max_retries} intentos: {e}")
                raise
```

---

## 🎓 Puntos Destacados para la Evaluación

### 1. ✅ Cumplimiento de Requisitos del Curso

| Requisito | Implementación | ✅ |
|-----------|----------------|---|
| **Cloud-native** | 100% arquitectura AWS serverless | ✅ |
| **Contenedores** | Airflow en ECS Fargate (2 containers) | ✅ |
| **Microservicios** | 9 Lambda functions independientes | ✅ |
| **NoSQL** | DynamoDB con 3 tablas | ✅ |
| **Notificaciones** | SNS + WebSocket | ✅ |
| **Workflows** | Apache Airflow con 3 DAGs | ✅ |
| **CI/CD** | Amplify auto-deploy desde GitHub | ✅ |
| **Monitoreo** | CloudWatch Logs + Metrics | ✅ |

---

### 2. 🏆 Innovaciones Técnicas

- **WebSockets para tiempo real**: Latencia < 100ms en notificaciones
- **Apache Airflow en Fargate**: Workflows automatizados sin servidores
- **Arquitectura serverless completa**: 0% gestión de infraestructura
- **Multi-canal de notificaciones**: Email + WebSocket + Push
- **Trazabilidad completa**: Historial de cada cambio
- **Security best practices**: JWT, bcrypt, CORS, IAM

---

### 3. 📊 Métricas del Proyecto

```
📁 Líneas de Código:
  - Frontend: ~2,500 líneas (TypeScript + React)
  - Backend: ~1,800 líneas (Node.js)
  - Airflow: ~600 líneas (Python)
  - Infrastructure as Code: ~400 líneas (YAML)

☁️ Recursos AWS:
  - 9 Lambda Functions
  - 2 API Gateways (REST + WebSocket)
  - 3 DynamoDB Tables
  - 1 SNS Topic
  - 1 ECS Cluster (Fargate)
  - 1 RDS PostgreSQL
  - 1 ECR Repository
  - 10+ CloudWatch Log Groups

💰 Costo Estimado Mensual (tráfico bajo):
  - Lambda: $0-5
  - DynamoDB: $0-2
  - RDS db.t3.micro: $15
  - Fargate: $10-20
  - Amplify: $0 (incluido en free tier)
  - TOTAL: ~$30-40/mes
```

---

## 📚 Documentación Adicional

- 📄 **BackendHack/README.md** - Documentación del backend
- 📄 **FrontendHack/README.md** - Documentación del frontend
- 📄 **BackendHack/WEBSOCKET-EXPLICACION.md** - Guía de WebSockets
- 📄 **BackendHack/GUIA-AIRFLOW-FARGATE.md** - Despliegue de Airflow
- 📄 **BackendHack/DEPLOYMENT.md** - Guía de deployment
- 📄 **BackendHack/AWS-ACADEMY-SETUP.md** - Setup para AWS Academy

---

## 👨‍💻 Equipo de Desarrollo

**Proyecto desarrollado para el curso de Cloud Computing - UTEC 2025**

---

## 📞 Soporte

Para preguntas sobre el proyecto:
- **Email**: admin@utec.edu.pe
- **GitHub Issues**: [Link al repositorio]

---

## 📄 Licencia

Este proyecto es propiedad académica de la Universidad de Ingeniería y Tecnología (UTEC).

---

## 🙏 Agradecimientos

- Profesor del curso de Cloud Computing
- Teaching Assistants
- AWS por la infraestructura (AWS Academy)
- Comunidad open-source de Airflow, Serverless Framework, React

---

<div align="center">

**⭐ Si este proyecto te parece interesante, dale una estrella en GitHub ⭐**

**Desarrollado con ❤️ por el equipo UTEC**

**Noviembre 2025**

</div>
