# 🚀 Despliegue en AWS Amplify

Esta guía te ayudará a desplegar la aplicación **Alerta UTEC** en AWS Amplify.

## 📋 Pre-requisitos

- ✅ Cuenta de AWS activa
- ✅ Repositorio Git (GitHub, GitLab, Bitbucket, o AWS CodeCommit)
- ✅ Backend desplegado en AWS (API Gateway funcionando)
- ✅ Variables de entorno configuradas

---

## 🔧 Paso 1: Preparar el Repositorio

### 1.1 Verificar que `.env` está en `.gitignore`

Asegúrate de que el archivo `.env` **NO** se suba al repositorio:

```bash
# Verificar .gitignore
cat .gitignore | grep .env
```

Debe aparecer `.env` en la lista.

### 1.2 Commit y Push al repositorio

```bash
git add .
git commit -m "Preparar proyecto para despliegue en Amplify"
git push origin main
```

---

## 🌐 Paso 2: Crear App en AWS Amplify

### 2.1 Acceder a AWS Amplify Console

1. Ir a la consola de AWS: https://console.aws.amazon.com
2. Buscar **AWS Amplify** en los servicios
3. Hacer clic en **"Create new app"** o **"Nueva aplicación"**

### 2.2 Conectar Repositorio Git

1. Seleccionar tu proveedor de Git:
   - GitHub
   - GitLab
   - Bitbucket
   - AWS CodeCommit

2. Autorizar a AWS Amplify para acceder a tu repositorio

3. Seleccionar el repositorio `Alerta_Utec`

4. Seleccionar la rama `main` (o la rama que uses)

---

## ⚙️ Paso 3: Configurar Build Settings

### 3.1 Configuración Automática

Amplify detectará automáticamente que es un proyecto Vite + React y generará este archivo `amplify.yml`:

```yaml
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

### 3.2 Si necesitas personalizar

Si Amplify no detecta la configuración, copia y pega esto en **"Build settings"**:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci --legacy-peer-deps
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

---

## 🔐 Paso 4: Configurar Variables de Entorno

**MUY IMPORTANTE**: Debes configurar las variables de entorno en Amplify.

### 4.1 En la consola de Amplify:

1. Ir a **"Environment variables"** (Variables de entorno)
2. Agregar las siguientes variables:

| Clave | Valor |
|-------|-------|
| `VITE_API_BASE_URL` | `https://if1stu7r2g.execute-api.us-east-1.amazonaws.com/dev` |
| `VITE_WS_URL` | `wss://YOUR_WEBSOCKET_ID.execute-api.us-east-1.amazonaws.com/dev` |

**Nota:** Si no tienes WebSocket configurado, puedes omitir `VITE_WS_URL` o dejar el valor placeholder.

### 4.2 Screenshot de la configuración:

```
+---------------------------+-------------------------------------------------------+
| Variable name             | Value                                                  |
+---------------------------+-------------------------------------------------------+
| VITE_API_BASE_URL         | https://if1stu7r2g.execute-api.us-east-1.amazonaws.com/dev |
| VITE_WS_URL              | wss://YOUR_WEBSOCKET_ID.execute-api.us-east-1.amazonaws.com/dev |
+---------------------------+-------------------------------------------------------+
```

---

## 🚀 Paso 5: Desplegar

1. Hacer clic en **"Save and deploy"** (Guardar y desplegar)

2. Amplify comenzará el proceso de despliegue:
   - ⏳ **Provisión**: Crear ambiente
   - 📦 **Build**: Instalar dependencias y compilar
   - 🚀 **Deploy**: Desplegar a CDN
   - ✅ **Verify**: Verificar el despliegue

3. Esperar 5-10 minutos hasta que termine el proceso

---

## ✅ Paso 6: Verificar el Despliegue

### 6.1 Obtener la URL

Una vez terminado, Amplify te dará una URL como:

```
https://main.d1234567890.amplifyapp.com
```

### 6.2 Probar la aplicación

1. Abrir la URL en el navegador
2. Verificar que la página cargue correctamente
3. Probar el registro de usuario
4. Probar el inicio de sesión
5. Probar crear un incidente
6. Verificar que se conecte al backend de AWS

---

## 🔧 Configuraciones Adicionales

### 📱 Dominio Personalizado

Si quieres usar tu propio dominio:

1. En Amplify, ir a **"Domain management"**
2. Hacer clic en **"Add domain"**
3. Seguir las instrucciones para configurar DNS

### 🔄 Despliegue Continuo

Amplify desplegará automáticamente cuando hagas push a la rama configurada:

```bash
git add .
git commit -m "Nueva funcionalidad"
git push origin main
# Amplify desplegará automáticamente
```

### 🌿 Ramas de Ambiente

Puedes configurar diferentes ambientes:

- `main` → Producción
- `develop` → Desarrollo
- `staging` → Pruebas

---

## 🐛 Solución de Problemas

### ❌ Error: "Build failed"

**Problema:** Error al compilar el proyecto

**Solución:**
1. Revisar los logs en la consola de Amplify
2. Verificar que `package.json` tenga todos los scripts necesarios:
   ```json
   {
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "preview": "vite preview"
     }
   }
   ```
3. Si hay conflictos de dependencias, usar `npm ci --legacy-peer-deps` en el build settings

### ❌ Error: "Cannot connect to backend"

**Problema:** La aplicación no se conecta al backend

**Solución:**
1. Verificar que las variables de entorno estén configuradas en Amplify
2. Verificar que `VITE_API_BASE_URL` tenga la URL correcta del backend
3. Verificar que el backend esté funcionando:
   ```bash
   curl https://if1stu7r2g.execute-api.us-east-1.amazonaws.com/dev/incidentes
   ```

### ❌ Error: "404 on page refresh"

**Problema:** Al recargar la página en rutas como `/admin` o `/login` aparece 404

**Solución:**
1. En Amplify, ir a **"Rewrites and redirects"**
2. Agregar esta regla:
   ```
   Source: </^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|ttf)$)([^.]+$)/>
   Target: /index.html
   Type: 200 (Rewrite)
   ```

### ⚠️ Warning: Variables de entorno no están disponibles

**Problema:** `import.meta.env.VITE_API_BASE_URL` retorna `undefined`

**Solución:**
1. Asegurarse de que las variables empiecen con `VITE_`
2. Verificar que estén configuradas en Amplify Console
3. Re-desplegar la aplicación para que tome las nuevas variables

---

## 📊 Monitoreo

### Logs de Build

Ver los logs de compilación en:
```
Amplify Console → App → Build → View logs
```

### Logs de la Aplicación

Para ver errores de runtime, usar el navegador:
```
F12 → Console → Ver errores
```

---

## 🔒 Seguridad

### Variables sensibles

- ✅ **NO** subir `.env` al repositorio
- ✅ Configurar variables en Amplify Console
- ✅ Usar HTTPS para todas las comunicaciones
- ✅ Verificar CORS en el backend

### CORS en API Gateway

Asegúrate de que tu backend permite requests desde el dominio de Amplify:

```javascript
// En tu backend
headers: {
  'Access-Control-Allow-Origin': 'https://main.d1234567890.amplifyapp.com',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization'
}
```

O permitir todos los orígenes en desarrollo:
```javascript
'Access-Control-Allow-Origin': '*'
```

---

## 📞 Soporte

Si encuentras problemas durante el despliegue:

1. Revisar la documentación oficial de Amplify: https://docs.amplify.aws
2. Revisar los logs de build en la consola de Amplify
3. Verificar que el backend esté funcionando correctamente

---

## ✅ Checklist Final

Antes de desplegar, verifica:

- [ ] `.env` está en `.gitignore`
- [ ] Código sin errores TypeScript (`npm run typecheck`)
- [ ] Backend funcionando en AWS
- [ ] Variables de entorno configuradas en Amplify
- [ ] `amplify.yml` configurado correctamente
- [ ] CORS configurado en el backend
- [ ] Build local funciona (`npm run build`)
- [ ] Preview local funciona (`npm run preview`)

---

## 🎉 ¡Listo!

Tu aplicación **Alerta UTEC** debería estar funcionando en:

```
https://main.dXXXXXXXXXX.amplifyapp.com
```

¡Felicidades! 🚀
