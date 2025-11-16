# 🔌 Sistema de Notificaciones WebSocket - Alerta UTEC

## 📋 ¿Cómo Funciona?

### 1️⃣ **Conexión WebSocket**

Cuando un usuario (especialmente Autoridad/Administrativo) abre el panel de administración:

```javascript
// Frontend: src/pages/Admin.jsx
connectWebSocket(handleWebSocketMessage);
```

Esto establece una conexión persistente con:
```
wss://3lgmyhtvpa.execute-api.us-east-1.amazonaws.com/dev
```

### 2️⃣ **Registro de Conexión**

Cuando un cliente se conecta, el backend guarda la conexión en DynamoDB:

```javascript
// Backend: src/websocket/connect.js
await dynamo.put({
  TableName: "WebSocketConnections",
  Item: {
    connectionId: event.requestContext.connectionId,
    connectedAt: new Date().toISOString()
  }
}).promise();
```

**Tabla:** `WebSocketConnections`
- `connectionId`: ID único de la conexión WebSocket
- `connectedAt`: Timestamp de cuando se conectó

### 3️⃣ **Evento: Nuevo Incidente Creado** 🆕

Cuando alguien crea un incidente:

```javascript
// Backend: src/incidentes/crearIncidente.js

// 1. Se crea el incidente en DynamoDB
await put("Incidentes", item);

// 2. Se notifica a TODAS las conexiones WebSocket activas
await notifyWebSocketClients(item);
```

**Función de Notificación:**

```javascript
async function notifyWebSocketClients(incidente) {
  // 1. Obtener todas las conexiones activas
  const connections = await dynamo.scan({
    TableName: "WebSocketConnections"
  }).promise();

  // 2. Preparar el mensaje
  const message = JSON.stringify({
    evento: "nuevo_incidente",
    data: incidente  // Incidente completo
  });

  // 3. Enviar a TODAS las conexiones
  for (const { connectionId } of connections.Items) {
    await apiGateway.postToConnection({
      ConnectionId: connectionId,
      Data: message
    }).promise();
  }
}
```

### 4️⃣ **Recepción en el Frontend** 📨

El frontend recibe la notificación automáticamente:

```javascript
// Frontend: src/pages/Admin.jsx
const handleWebSocketMessage = (mensaje) => {
  console.log("📨 Mensaje WebSocket recibido:", mensaje);

  if (mensaje.evento === "nuevo_incidente") {
    // Agregar el nuevo incidente al inicio de la lista
    setIncidentes(prev => [mensaje.data, ...prev]);

    // Mostrar notificación del navegador
    mostrarNotificacion("🆕 Nuevo incidente reportado");
  }
};
```

### 5️⃣ **Notificación del Navegador** 🔔

Si el usuario ha dado permisos:

```javascript
if ("Notification" in window && Notification.permission === "granted") {
  new Notification("Alerta UTEC", {
    body: "🆕 Nuevo incidente reportado"
  });
}
```

## 🎯 Flujo Completo

```
[Usuario reporta incidente]
         ↓
[Backend crea incidente en DynamoDB]
         ↓
[Backend busca todas las conexiones WebSocket]
         ↓
[Backend envía mensaje a cada conexión]
         ↓
[Admins conectados reciben notificación INSTANTÁNEA]
         ↓
[Frontend actualiza la lista automáticamente]
         ↓
[Notificación del navegador (si tiene permisos)]
```

## 📊 Eventos WebSocket Disponibles

### 1. **nuevo_incidente**
```json
{
  "evento": "nuevo_incidente",
  "data": {
    "incidenteId": "INC_abc123",
    "tipo": "emergencia_medica",
    "descripcion": "Estudiante con dolor en el pecho",
    "ubicacion": "Cafetería principal",
    "urgencia": "critica",
    "estado": "pendiente",
    "fechaCreacion": "2025-11-16T05:30:00.000Z",
    "historial": [...]
  }
}
```

### 2. **estado_actualizado**
```json
{
  "evento": "estado_actualizado",
  "incidenteId": "INC_abc123",
  "nuevoEstado": "en_atencion"
}
```

## 🔧 Arquitectura Técnica

### Backend (AWS Lambda + API Gateway WebSocket)

```
WebSocket Routes:
├── $connect → src/websocket/connect.js
│   └── Guarda connectionId en DynamoDB
│
├── $disconnect → src/websocket/disconnect.js
│   └── Elimina connectionId de DynamoDB
│
└── notify → src/websocket/notify.js
    └── Envía mensajes personalizados
```

### Frontend (React)

```
src/sockets/websocket.js
├── connectWebSocket(callback)
│   └── Establece conexión y configura listeners
│
├── sendMessage(message)
│   └── Envía mensajes al backend
│
├── disconnectWebSocket()
│   └── Cierra la conexión
│
└── isConnected()
    └── Verifica estado de conexión
```

## 🚀 Ventajas del Sistema

1. **Tiempo Real**: Las notificaciones llegan instantáneamente
2. **Escalable**: Múltiples admins pueden estar conectados simultáneamente
3. **Eficiente**: No hay polling, solo push cuando hay cambios
4. **Robusto**: Maneja conexiones obsoletas automáticamente
5. **Sin Base de Datos**: Solo notificaciones, no almacena mensajes

## 🔍 Debugging

### Ver conexiones activas:
```bash
aws dynamodb scan --table-name WebSocketConnections
```

### Ver logs de Lambda:
```bash
npm run logs -- -f crearIncidente
npm run logs -- -f wsConnect
```

### Probar conexión WebSocket:
```bash
# Usar wscat (npm install -g wscat)
wscat -c wss://3lgmyhtvpa.execute-api.us-east-1.amazonaws.com/dev
```

## ⚠️ Consideraciones

1. **Conexiones expiran**: AWS API Gateway cierra conexiones inactivas después de 2 horas
2. **Reconexión automática**: El frontend reintenta conectar si se desconecta
3. **Limpieza automática**: Las conexiones obsoletas se eliminan al intentar enviar
4. **Sin historial**: Las notificaciones son en tiempo real, no se almacenan

## 🎓 Casos de Uso

### Admin Dashboard:
- ✅ Recibe notificaciones de nuevos incidentes
- ✅ Se actualiza automáticamente cuando cambia el estado
- ✅ No necesita recargar la página

### Sistema de Alertas:
- ✅ Notificaciones instantáneas en emergencias
- ✅ Múltiples equipos de seguridad reciben la misma alerta
- ✅ Coordinación en tiempo real

## 📝 Próximas Mejoras

1. **Filtros de notificación**: Solo notificar según urgencia
2. **Salas privadas**: WebSocket rooms por tipo de incidente
3. **Mensajería bidireccional**: Chat entre admins
4. **Historial de notificaciones**: Guardar últimas 10 notificaciones
5. **Audio de alerta**: Sonido cuando llega incidente crítico

---

**Estado Actual**: ✅ Implementado y funcional
**Última actualización**: 16 de Noviembre 2025
