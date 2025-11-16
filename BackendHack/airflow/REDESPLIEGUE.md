# 🔄 Guía de Redespliegue de Airflow

## ✅ Cambios Realizados

### 1. Sistema de Gestión de Credenciales
- ✅ Creado `task-definition.template.json` con placeholders `${VAR_NAME}`
- ✅ Creado script `generate-task-definition.ps1` para generar desde .env
- ✅ Agregado `task-definition.json` al `.gitignore` (contiene credenciales)
- ✅ Creado `README-CREDENTIALS.md` con documentación del sistema

### 2. Variables de Entorno Configuradas
- ✅ Creado `.env.example` con todas las variables
- ✅ Actualizado `clasificar_incidentes.py` para usar variables de entorno
- ✅ Actualizado `enviar_notificaciones.py` para usar variables de entorno
- ✅ Actualizado `generar_reportes.py` para usar variables de entorno
- ✅ Actualizado `docker-compose.yml` para usar archivo `.env`

### 3. Variables Extraídas (Ya No Hardcodeadas)
- `API_BASE_URL` - URL del API Gateway
- `WEBSOCKET_URL` - URL del WebSocket
- `DYNAMODB_TABLE_INCIDENTES` - Nombre de la tabla DynamoDB
- `AWS_DEFAULT_REGION` - Región de AWS
- Emails de todas las áreas responsables
- Números de SMS para emergencias
- Buckets de S3
- Intervalos de ejecución de DAGs
- Thresholds y límites
- URL del dashboard

---

## 📋 Pasos para Redesplegar

### PASO 1: Configurar AWS CLI (Si no está configurado)

```powershell
# Obtener credenciales de AWS Academy
# Ir a AWS Academy → AWS Details → Show Credentials

# Configurar credenciales
aws configure set aws_access_key_id "TU_ACCESS_KEY"
aws configure set aws_secret_access_key "TU_SECRET_KEY"
aws configure set aws_session_token "TU_SESSION_TOKEN"
aws configure set region us-east-1

# O crear el archivo manualmente en:
# C:\Users\TU_USUARIO\.aws\credentials
```

Contenido de `credentials`:
```ini
[default]
aws_access_key_id = TU_ACCESS_KEY
aws_secret_access_key = TU_SECRET_KEY
aws_session_token = TU_SESSION_TOKEN
```

Contenido de `config`:
```ini
[default]
region = us-east-1
output = json
```

---

### PASO 2: Verificar Conexión AWS

```powershell
cd D:\PAN\Alerta_Utec\BackendHack

# Verificar que puedes acceder a AWS
aws sts get-caller-identity

# Verificar bucket S3
aws s3 ls s3://alerta-utec-airflow-dags/
```

---

### PASO 3: Subir DAGs Actualizados a S3

```powershell
cd D:\PAN\Alerta_Utec\BackendHack

# Sincronizar DAGs al bucket S3
aws s3 sync airflow/dags/ s3://alerta-utec-airflow-dags/dags/ --delete

# Verificar que se subieron
aws s3 ls s3://alerta-utec-airflow-dags/dags/
```

Deberías ver:
```
2025-11-16 XX:XX:XX   XXXX clasificar_incidentes.py
2025-11-16 XX:XX:XX   XXXX enviar_notificaciones.py
2025-11-16 XX:XX:XX   XXXX generar_reportes.py
```

---

### PASO 4: Generar Task Definition desde .env

```powershell
cd D:\PAN\Alerta_Utec\BackendHack\airflow

# Generar task-definition.json desde el template usando las variables del .env
.\generate-task-definition.ps1

# Este script:
# - Lee las credenciales desde .env
# - Valida que las variables críticas de SMTP existan
# - Genera task-definition.json con los valores reales
```

**Nota:** El archivo `task-definition.json` NO está en git porque contiene credenciales. Siempre debes generarlo desde el template antes de cada deployment.

---

### PASO 5: Registrar Nueva Task Definition

```powershell
# Registrar nueva revisión
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Deberías ver algo como:
# "revision": 2 (o el número siguiente)
```

---

### PASO 6: Actualizar Servicio ECS

```powershell
# Forzar nuevo deployment del servicio
aws ecs update-service `
  --cluster alerta-utec-airflow-cluster `
  --service airflow-service `
  --force-new-deployment

# Esto hará que:
# 1. Se detenga la tarea actual
# 2. Se inicie una nueva tarea con la última task definition
# 3. La nueva tarea descargue los DAGs actualizados de S3
```

---

### PASO 7: Monitorear el Despliegue

```powershell
# Ver estado del servicio
aws ecs describe-services `
  --cluster alerta-utec-airflow-cluster `
  --services airflow-service `
  --query 'services[0].deployments'

# Ver tareas en ejecución
aws ecs list-tasks `
  --cluster alerta-utec-airflow-cluster `
  --service-name airflow-service

# Ver logs en tiempo real
aws logs tail /ecs/alerta-utec-airflow --follow
```

**Espera** a que:
- `runningCount` = 1
- `pendingCount` = 0
- `desiredCount` = 1

---

### PASO 8: Obtener Nueva IP Pública

```powershell
# Obtener ARN de la nueva tarea
$TASK_ARN = (aws ecs list-tasks --cluster alerta-utec-airflow-cluster --service-name airflow-service --query 'taskArns[0]' --output text)

# Obtener detalles de la tarea
aws ecs describe-tasks --cluster alerta-utec-airflow-cluster --tasks $TASK_ARN

# Extraer IP pública (buscar en el output el campo "publicIp")
```

---

### PASO 9: Verificar Airflow UI

```
URL: http://NUEVA_IP_PUBLICA:8080
Usuario: admin
Contraseña: admin
```

**Verificar:**
1. ✅ Los 3 DAGs aparecen
2. ✅ No hay errores de importación
3. ✅ Los DAGs muestran la última modificación
4. ✅ Activar cada DAG y ejecutar manualmente
5. ✅ Revisar logs para confirmar que usan las variables de entorno

---

## 🔍 Verificar Variables de Entorno

En Airflow UI, puedes ejecutar este código en un DAG de prueba:

```python
import os

print("API_BASE_URL:", os.getenv('API_BASE_URL'))
print("DYNAMODB_TABLE:", os.getenv('DYNAMODB_TABLE_INCIDENTES'))
print("EMAIL_SEGURIDAD:", os.getenv('EMAIL_SEGURIDAD'))
```

---

## 🐛 Troubleshooting

### Error: "Unable to locate credentials"
```powershell
# Verificar credenciales
aws configure list

# Re-configurar
aws configure
```

### Error: "No such bucket"
```powershell
# Crear el bucket si no existe
aws s3 mb s3://alerta-utec-airflow-dags
```

### Error: Task no inicia
```powershell
# Ver logs detallados
aws logs tail /ecs/alerta-utec-airflow --follow

# Ver eventos del servicio
aws ecs describe-services --cluster alerta-utec-airflow-cluster --services airflow-service --query 'services[0].events'
```

### DAGs no aparecen en Airflow
1. Verificar que se subieron a S3
2. Revisar logs del contenedor para errores de importación
3. Verificar que el comando de sync en task-definition.json es correcto

---

## 📊 Resumen de Cambios

| Archivo | Cambio |
|---------|--------|
| `.env` | Credenciales reales (NO commitear) |
| `.env.example` | Plantilla con todas las variables documentadas |
| `task-definition.template.json` | Template con placeholders ${VAR_NAME} |
| `task-definition.json` | Generado automáticamente (NO commitear) |
| `generate-task-definition.ps1` | Script para generar task-definition.json |
| `clasificar_incidentes.py` | Usa `os.getenv()` para todas las configs |
| `enviar_notificaciones.py` | Usa `os.getenv()` para todas las configs |
| `generar_reportes.py` | Usa `os.getenv()` para todas las configs |
| `docker-compose.yml` | Usa archivo `.env` |
| `.gitignore` | Ignora archivos con credenciales |

---

## 🎯 Próximos Pasos

Después del redespliegue exitoso:

1. **Probar cada DAG** - Ejecutar manualmente y verificar logs
2. **Crear incidente de prueba** - Verificar que el flujo completo funciona
3. **Monitorear por 1 hora** - Asegurar que los schedules funcionan
4. **Documentar IP pública** - Para acceso al UI de Airflow
5. **Crear .env local** - Para desarrollo con Docker Compose

---

## ✅ Checklist Final

- [ ] AWS CLI configurado con credenciales válidas
- [ ] `.env` configurado con credenciales de Brevo/SMTP
- [ ] `task-definition.json` generado desde template
- [ ] DAGs sincronizados a S3
- [ ] Task definition registrada (nueva revisión)
- [ ] Servicio ECS actualizado (force-new-deployment)
- [ ] Nueva tarea en estado RUNNING
- [ ] IP pública obtenida
- [ ] Airflow UI accesible
- [ ] Los 3 DAGs visibles sin errores
- [ ] Variables de entorno verificadas
- [ ] DAGs ejecutados manualmente con éxito
- [ ] Logs sin errores críticos

---

¿Necesitas ayuda con algún paso específico?
