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

- 🔐 **Sistema de autenticación** con roles diferenciados y áreas especializadas
- 📝 **Reporte de incidentes** con categorización y niveles de urgencia
- 🔄 **Actualización en tiempo real** del estado de incidentes vía WebSocket
- 👥 **Control de acceso basado en roles** (Estudiante, Autoridad, Administrativo)
- 🎯 **Filtros por área** para personal especializado (seguridad, enfermería, infraestructura)
- 📊 **Panel administrativo** con estadísticas avanzadas en tiempo real
- 🔔 **Notificaciones multi-canal**: Email (SNS) + WebSocket + Push del navegador
- 📱 **Diseño responsive moderno** con animaciones fluidas (Framer Motion)
- 🔌 **WebSocket persistente** con reconexión automática
- ✅ **5 estados de incidente**: Pendiente, En Atención, Resuelto, Cancelado

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
     - `Autoridad/Personal`: Para personal de áreas específicas (seguridad, enfermería, infraestructura, etc.)
     - `Administrativo`: Para personal administrativo
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

### 4. Gestionar Estados (Solo Autoridades y Administrativos)

**Nota:** Esta funcionalidad solo está disponible para usuarios con rol **Autoridad** o **Administrativo**.

**Estados disponibles:**
- ⏱ **Pendiente**: Incidente reportado, esperando atención
- 🔄 **En Atención**: Personal trabajando en resolver el incidente
- ✓ **Resuelto**: Incidente atendido y solucionado
- ❌ **Cancelado**: Incidente descartado o reportado por error

**Cambiar estado:**
1. Localizar el incidente en la lista
2. Hacer clic en el botón **"Cambiar Estado"** junto al estado actual
3. El sistema cambiará automáticamente al siguiente estado:
   - Pendiente → En Atención
   - En Atención → Resuelto
   - Resuelto → Cancelado
   - Cancelado → Pendiente (para reabrir)

4. Se enviarán notificaciones automáticamente:
   - 📧 **Email vía SNS** a usuarios Autoridad y Administrativo
   - 🔔 **WebSocket** a todos los clientes conectados en tiempo real
   - 🔔 **Push del navegador** si el usuario habilitó notificaciones

---

### 5. Panel Administrativo

**Acceso:** Solo para roles **Autoridad** y **Administrativo**

**Para acceder:**
1. Hacer clic en el botón **"Panel Admin"** en el header (esquina superior derecha)
2. Serás redirigido a `/admin`

**Funcionalidades del Panel:**

#### **Estadísticas en Tiempo Real:**
- 📊 **Total Incidentes**: Cantidad total de incidentes registrados
- ⏳ **Pendientes**: Incidentes sin atender
- 🔧 **En Atención**: Incidentes siendo atendidos
- ✅ **Resueltos**: Incidentes completados
- ❌ **Cancelados**: Incidentes descartados

#### **Filtros Avanzados (Solo para Autoridad):**
- 🌐 **Ver Todos**: Visualiza todos los incidentes del sistema
- 🎯 **Mi Área**: Filtra solo incidentes de tu área especializada (ej: solo seguridad, solo enfermería)
- Cambio dinámico entre vistas para mejor gestión

#### **Lista Completa de Incidentes:**
- Vista detallada de todos los incidentes (o filtrados por área)
- Posibilidad de cambiar estados directamente
- **Actualización automática vía WebSocket** (tiempo real)
- Indicador de conexión WebSocket en el header

#### **Notificaciones Push:**
- Hacer clic en **"Habilitar Notificaciones"** para recibir alertas del navegador
- Recibirás notificaciones cuando:
  - Se reporte un nuevo incidente
  - Se actualice el estado de un incidente
  - Se escale un incidente (via Airflow)

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
- ✅ Ver todos los incidentes del sistema
- ✅ Reportar nuevos incidentes
- ✅ **Cambiar estados de incidentes** (todos los tipos)
- ✅ **Acceso al Panel Administrativo** con estadísticas completas
- ✅ **Recibe notificaciones email** (SNS) de nuevos incidentes
- ✅ **Notificaciones WebSocket en tiempo real**
- ✅ **Supervisión completa del sistema**

**Casos de uso:**
- Supervisión general de todos los incidentes del campus
- Gestión completa de estados de cualquier tipo de incidente
- Análisis de estadísticas y métricas del sistema
- Coordinación entre diferentes áreas (seguridad, enfermería, infraestructura)
- Monitoreo en tiempo real desde el panel administrativo

---

### 🛡️ Autoridad (Personal Especializado por Área)
**Permisos:**
- ✅ Ver todos los incidentes del sistema
- ✅ Reportar nuevos incidentes
- ✅ **Cambiar estados de incidentes** (de su área o todos)
- ✅ **Acceso al Panel Administrativo** con filtros por área
- ✅ **Recibe notificaciones email** (SNS) de incidentes de su área
- ✅ **Notificaciones WebSocket en tiempo real**
- ✅ **Filtro especializado por área** (ver solo incidentes de su competencia)

**Áreas disponibles:**
- 🛡️ **Seguridad**: Gestiona incidentes de seguridad, robos, amenazas
- 🏥 **Enfermería**: Atiende emergencias médicas, primeros auxilios
- 🔧 **Infraestructura**: Resuelve problemas de mantenimiento, fugas, daños
- 🔥 **Bomberos**: Responde a incendios y emergencias de fuego

**Casos de uso:**
- Personal de seguridad filtra solo incidentes de seguridad
- Enfermería visualiza únicamente emergencias médicas
- Infraestructura se enfoca en daños y mantenimiento
- Cada área actualiza estados de sus incidentes asignados
- Opción de ver todos los incidentes para coordinación general

---

### 👨‍💼 Administrador (Supervisión Global)
**Permisos:**
- ✅ Ver todos los incidentes sin restricciones
- ✅ Reportar nuevos incidentes
- ✅ **Cambiar estados de cualquier incidente**
- ✅ **Acceso completo al Panel Administrativo**
- ✅ **Recibe notificaciones email** (SNS) de todos los eventos
- ✅ **Notificaciones WebSocket en tiempo real**
- ✅ **Supervisión del sistema Airflow** (workflows automatizados)
- ✅ **Acceso a métricas avanzadas y reportes**

**Casos de uso:**
- Supervisión general de toda la operación del sistema
- Gestión completa de incidentes de todas las áreas
- Análisis de estadísticas: tiempo de respuesta, incidentes por tipo
- Revisión de reportes generados automáticamente por Airflow
- Coordinación estratégica entre todas las áreas
- Auditoría del historial completo de incidentes

---

## 🔔 Notificaciones

### Notificaciones por Email (SNS)
Los usuarios con rol **Autoridad** y **Administrativo** son automáticamente suscritos al sistema de notificaciones por email cuando se registran.

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
- Limpiar localStorage del navegador: `F12 → Application → Local Storage → Clear`

### No veo el botón "Cambiar Estado"
- Verificar que tu rol sea **Autoridad** o **Administrativo**
- El rol **Estudiante** NO tiene permiso para cambiar estados
- Cerrar sesión y volver a iniciar si acabas de cambiar de rol

### No veo el botón "Panel Admin"
- Solo el rol **Administrativo** tiene acceso al panel de administración
- El rol **Autoridad** NO tiene este botón (acceden desde la URL directamente si se configura)
- Verificar tu rol en el header superior derecho

### No veo los filtros por área en el Panel Admin
- Los filtros **"Ver Todos"** y **"Mi Área"** solo aparecen para usuarios con rol **Autoridad**
- El rol **Administrativo** siempre ve todos los incidentes sin necesidad de filtros
- Asegúrate de tener un área asignada en tu cuenta

### WebSocket desconectado
- Verificar la conexión a internet
- El indicador en el header muestra el estado: verde = conectado, rojo = desconectado
- El sistema intenta reconectar automáticamente
- Refrescar la página si el problema persiste

### No recibo notificaciones por email
- Verificar que confirmaste la suscripción a SNS
- Revisar la carpeta de spam/correo no deseado
- Solo usuarios **Autoridad** y **Administrativo** reciben notificaciones
- Revisar que tu email esté correctamente configurado en la cuenta

### No recibo notificaciones Push del navegador
- Hacer clic en "Habilitar Notificaciones" en el Panel Admin
- Asegurarse de dar permiso cuando el navegador lo solicite
- Las notificaciones push solo funcionan con HTTPS o localhost
- Revisar configuración de notificaciones del navegador

### La página no carga los incidentes
- Verificar la conexión a internet
- Hacer clic en el botón "Actualizar"
- Revisar que la URL del backend esté correctamente configurada en `.env`
- Revisar la consola del navegador (`F12`) para ver errores

### Veo incidentes de otras áreas siendo Autoridad
- Asegúrate de tener seleccionado el filtro **"Mi Área"** en el Panel Admin
- Por defecto, **"Ver Todos"** muestra todos los incidentes del sistema
- Esto es intencional para permitir coordinación entre áreas

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- ⚛️ **React 18** - Framework de UI moderno
- 📘 **TypeScript** - Tipado estático para JavaScript
- 🎨 **TailwindCSS** - Framework CSS utility-first
- 🎭 **Framer Motion** - Librería de animaciones fluidas
- 🧭 **React Router v7** - Navegación y routing
- 🎯 **Lucide React** - Iconos modernos y escalables
- ⚡ **Vite** - Build tool ultra-rápido

### Backend (AWS)
- 🚀 **AWS Amplify** - Hosting y CI/CD del frontend
- ⚡ **AWS Lambda** - Funciones serverless para la API
- 🌐 **API Gateway** - REST API + WebSocket API
- 💾 **DynamoDB** - Base de datos NoSQL
- 📧 **SNS** - Notificaciones por email
- 🔌 **WebSocket** - Comunicación bidireccional en tiempo real

### Características Técnicas
- 🔐 **JWT Authentication** - Autenticación segura con tokens
- 🔄 **WebSocket Persistente** - Conexión en tiempo real con reconexión automática
- 📱 **Responsive Design** - Adaptado a móviles, tablets y desktop
- ♿ **Accesibilidad** - Diseño inclusivo con semántica HTML correcta
- 🎯 **Protected Routes** - Control de acceso basado en roles
- 🔔 **Multi-channel Notifications** - Email + WebSocket + Push del navegador

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

**Versión:** 2.0.0
**Última actualización:** Noviembre 2025
