# 🚨 Alerta UTEC - Sistema de Alertas en Tiempo Real

Sistema web de gestión de incidentes para el campus universitario UTEC, que permite reportar y gestionar incidentes de seguridad, emergencias médicas, infraestructura y más en tiempo real.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Uso del Sistema](#uso-del-sistema)
- [Roles y Permisos](#roles-y-permisos)
- [Funcionalidades por Rol](#funcionalidades-por-rol)

---

## ✨ Características

- 🔐 **Sistema de autenticación** con roles diferenciados
- 📝 **Reporte de incidentes** con categorización y niveles de urgencia
- 🔄 **Actualización en tiempo real** del estado de incidentes
- 👥 **Control de acceso basado en roles** (Estudiante, Administrativo, Seguridad, Administrador)
- 📊 **Panel administrativo** con estadísticas y gestión avanzada
- 🔔 **Notificaciones por email** (SNS) para cambios de estado
- 📱 **Diseño responsive** adaptado a móviles y tablets

---

## 🔧 Requisitos

- Node.js v16 o superior
- npm o yarn
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet (para conectarse al backend AWS)

---

## 🚀 Instalación

1. **Clonar el repositorio:**
```bash
git clone <url-del-repositorio>
cd project
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
Crear un archivo `.env` en la raíz del proyecto:
```env
VITE_API_BASE_URL=https://if1stu7r2g.execute-api.us-east-1.amazonaws.com/dev
VITE_WS_URL=wss://YOUR_WEBSOCKET_ID.execute-api.us-east-1.amazonaws.com/dev
```

4. **Iniciar el servidor de desarrollo:**
```bash
npm run dev
```

5. **Abrir en el navegador:**
```
http://localhost:5178
```

---

## 📖 Uso del Sistema

### 1. Registro e Inicio de Sesión

#### **Registrarse como nuevo usuario:**
1. Acceder a la página principal
2. Hacer clic en la pestaña **"Registrarse"**
3. Completar el formulario:
   - **Correo Electrónico**: Usar correo institucional (@utec.edu.pe)
   - **Contraseña**: Mínimo 6 caracteres
   - **Rol**: Seleccionar según corresponda
     - `Estudiante`: Para alumnos
     - `Administrativo`: Para personal administrativo
     - `Seguridad`: Para personal de seguridad
4. Hacer clic en **"Registrarse"**
5. El sistema creará la cuenta y redirigirá automáticamente al inicio

#### **Iniciar Sesión:**
1. Ingresar **correo electrónico** y **contraseña**
2. Hacer clic en **"Iniciar Sesión"**
3. El sistema validará las credenciales y redirigirá según el rol

---

### 2. Reportar un Incidente

Todos los usuarios autenticados pueden reportar incidentes.

**Pasos:**
1. En la página principal, localizar el formulario **"Reportar Incidente"** (columna izquierda)
2. Completar los campos requeridos:

   **Tipo de Incidente:**
   - 🏥 **Emergencia Médica**: Desmayos, heridas, malestar
   - 🔥 **Incendio**: Fuego, humo, sistemas contra incendios
   - 🔒 **Seguridad**: Robos, personas sospechosas, amenazas
   - 🏗️ **Infraestructura**: Daños en edificios, fugas, fallas eléctricas

   **Descripción:**
   - Detallar el incidente lo más específico posible
   - Ejemplo: "Alumno vomitó en el lavadero del baño"

   **Ubicación:**
   - Indicar el lugar exacto del incidente
   - Ejemplo: "Pabellón A, Piso 1", "Laboratorio de Química"

   **Nivel de Urgencia:**
   - **Baja**: Situación menor, sin riesgo inmediato
   - **Media**: Situación que requiere atención pronta
   - **Alta**: Situación urgente que requiere respuesta rápida
   - **Crítica**: Emergencia que requiere acción inmediata

3. Hacer clic en **"Reportar Incidente"**
4. Esperar la confirmación ✅ "Incidente reportado exitosamente"
5. La página se recargará automáticamente mostrando el nuevo incidente

---

### 3. Ver Incidentes

Todos los usuarios pueden visualizar los incidentes reportados.

**Panel de Incidentes (columna derecha):**
- **Filtros rápidos:**
  - **Todos**: Muestra todos los incidentes
  - **Pendientes**: Incidentes sin atender
  - **En Curso**: Incidentes en proceso de resolución
  - **Resueltos**: Incidentes ya atendidos

- **Información mostrada:**
  - Tipo de incidente (icono y color)
  - ID único del incidente
  - Descripción completa
  - Ubicación exacta
  - Fecha y hora de reporte
  - Nivel de urgencia (badge de color)
  - Estado actual (badge de color)

- **Actualizar lista:**
  - Hacer clic en el botón **"Actualizar"** para recargar los incidentes

---

### 4. Gestionar Estados (Solo Administradores y Seguridad)

**Nota:** Esta funcionalidad solo está disponible para usuarios con rol **Administrador** o **Seguridad**.

**Estados disponibles:**
- ⏱ **Pendiente**: Incidente reportado, esperando atención
- 🔄 **En Atención**: Personal trabajando en resolver el incidente
- ✓ **Resuelto**: Incidente atendido y solucionado

**Cambiar estado:**
1. Localizar el incidente en la lista
2. Hacer clic en el botón **"Cambiar"** junto al estado actual
3. El sistema cambiará automáticamente al siguiente estado:
   - Pendiente → En Atención
   - En Atención → Resuelto
   - Resuelto → Pendiente (para reabrir)

4. Se enviará una notificación por email a los usuarios suscritos (Administradores y Seguridad)

---

### 5. Panel Administrativo

**Acceso:** Solo para roles **Administrador** y **Seguridad**

**Para acceder:**
1. Hacer clic en el botón **"Panel Admin"** en el header (esquina superior derecha)
2. Serás redirigido a `/admin`

**Funcionalidades del Panel:**

#### **Estadísticas en Tiempo Real:**
- 📊 **Total Incidentes**: Cantidad total de incidentes registrados
- ⏳ **Pendientes**: Incidentes sin atender
- 🔧 **En Atención**: Incidentes siendo atendidos
- ✅ **Resueltos**: Incidentes completados

#### **Lista Completa de Incidentes:**
- Vista detallada de todos los incidentes
- Posibilidad de cambiar estados directamente
- Actualización automática vía WebSocket (si está configurado)

#### **Notificaciones Push:**
- Hacer clic en **"Habilitar Notificaciones"** para recibir alertas del navegador
- Recibirás notificaciones cuando:
  - Se reporte un nuevo incidente
  - Se actualice el estado de un incidente

---

## 👥 Roles y Permisos

### 🎓 Estudiante
**Permisos:**
- ✅ Ver todos los incidentes
- ✅ Reportar nuevos incidentes
- ❌ NO puede cambiar estados de incidentes
- ❌ NO tiene acceso al panel administrativo

**Casos de uso:**
- Reportar emergencias médicas
- Alertar sobre problemas de infraestructura
- Reportar situaciones de seguridad

---

### 📋 Administrativo
**Permisos:**
- ✅ Ver todos los incidentes
- ✅ Reportar nuevos incidentes
- ❌ NO puede cambiar estados de incidentes
- ❌ NO tiene acceso al panel administrativo

**Casos de uso:**
- Reportar daños en instalaciones
- Alertar sobre problemas operativos
- Documentar incidentes observados

---

### 🛡️ Seguridad
**Permisos:**
- ✅ Ver todos los incidentes
- ✅ Reportar nuevos incidentes
- ✅ **Cambiar estados de incidentes**
- ✅ **Acceso al panel administrativo**
- ✅ Recibe notificaciones por email (SNS)

**Casos de uso:**
- Gestionar incidentes de seguridad
- Actualizar estados conforme se atienden
- Monitorear situaciones en tiempo real
- Coordinar respuestas a emergencias

---

### 👨‍💼 Administrador
**Permisos:**
- ✅ Ver todos los incidentes
- ✅ Reportar nuevos incidentes
- ✅ **Cambiar estados de incidentes**
- ✅ **Acceso al panel administrativo**
- ✅ Recibe notificaciones por email (SNS)
- ✅ Acceso completo al sistema

**Casos de uso:**
- Supervisión general del sistema
- Gestión completa de incidentes
- Análisis de estadísticas
- Coordinación con seguridad y personal

---

## 🔔 Notificaciones

### Notificaciones por Email (SNS)
Los usuarios con rol **Administrador** y **Seguridad** son automáticamente suscritos al sistema de notificaciones por email cuando se registran.

**Recibirás emails cuando:**
- Un incidente cambia de estado
- Se reporta un nuevo incidente (opcional, configurable en backend)

**Confirmar suscripción:**
1. Revisar la bandeja de entrada después del registro
2. Buscar email de AWS SNS con asunto "AWS Notification - Subscription Confirmation"
3. Hacer clic en el enlace de confirmación
4. A partir de ese momento recibirás notificaciones

---

## 🎨 Interfaz de Usuario

### Página Principal
- **Header fijo**: Logo, información de usuario, botones de navegación
- **Columna izquierda**: Formulario de reporte de incidentes
- **Columna derecha**: Lista de incidentes con filtros

### Panel Administrativo
- **Tarjetas de estadísticas**: Métricas en tiempo real
- **Botones de acción**: Actualizar, habilitar notificaciones
- **Lista detallada**: Todos los incidentes con gestión completa

### Diseño Responsive
- **Desktop**: Layout de 2 columnas
- **Tablet**: Layout adaptativo
- **Mobile**: Layout de 1 columna con scroll vertical

---

## 🔒 Seguridad

- Autenticación con JWT (JSON Web Tokens)
- Contraseñas hasheadas con bcrypt
- Validación de roles en frontend y backend
- HTTPS en producción (AWS API Gateway)
- Protección contra accesos no autorizados

---

## 🐛 Solución de Problemas

### No puedo iniciar sesión
- Verificar que el correo y contraseña sean correctos
- Asegurarse de haber registrado la cuenta previamente
- Revisar que el backend esté funcionando

### No veo el botón "Cambiar Estado"
- Verificar que tu rol sea **Administrador** o **Seguridad**
- Los roles **Estudiante** y **Administrativo** no tienen este permiso

### No recibo notificaciones por email
- Verificar que confirmaste la suscripción a SNS
- Revisar la carpeta de spam/correo no deseado
- Solo usuarios **Administrador** y **Seguridad** reciben notificaciones

### La página no carga los incidentes
- Verificar la conexión a internet
- Hacer clic en el botón "Actualizar"
- Revisar que la URL del backend esté correctamente configurada en `.env`

---

## 📞 Soporte

Para reportar problemas o solicitar ayuda:
- Email: soporte@utec.edu.pe
- Campus: Oficina de Seguridad - Pabellón Administrativo

---

## 📄 Licencia

Este proyecto es propiedad de la Universidad de Ingeniería y Tecnología (UTEC).

---

## 🏆 Créditos

Desarrollado por el equipo de tecnología de UTEC para mejorar la seguridad y respuesta ante incidentes en el campus universitario.

**Versión:** 1.0.0
**Última actualización:** Noviembre 2025
