# 🔐 Gestión de Credenciales - Task Definition

Este directorio contiene el sistema de gestión de credenciales para el despliegue de Airflow en ECS/Fargate.

## 📁 Archivos

- **`.env`** - Variables de entorno con credenciales reales (NO commitear)
- **`.env.example`** - Plantilla de variables de entorno
- **`task-definition.template.json`** - Template con placeholders `${VAR_NAME}`
- **`task-definition.json`** - Archivo generado automáticamente (NO commitear)
- **`generate-task-definition.ps1`** - Script que genera el task-definition.json

## 🚀 Uso

### 1. Configurar credenciales

Si no tienes el archivo `.env`, créalo a partir del ejemplo:

```powershell
Copy-Item .env.example .env
```

Luego edita `.env` y configura tus credenciales de Brevo (SMTP):

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_EMAIL=tu-email@smtp-brevo.com
SMTP_PASSWORD=tu-clave-smtp-de-brevo
```

### 2. Generar task-definition.json

Ejecuta el script de generación:

```powershell
.\generate-task-definition.ps1
```

Este script:
- Lee las variables desde `.env`
- Valida que las credenciales críticas estén presentes
- Reemplaza los placeholders en el template
- Genera `task-definition.json` listo para deployment

### 3. Desplegar a ECS

Después de generar el archivo, puedes registrar la nueva task definition:

```powershell
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

## ⚠️ Importante

- **NUNCA** commitees el archivo `task-definition.json` con credenciales reales
- **NUNCA** commitees el archivo `.env` con credenciales reales
- El `.gitignore` ya está configurado para ignorar estos archivos
- Siempre genera el `task-definition.json` desde el template antes de desplegar

## 🔄 Workflow

```
.env (credenciales) + task-definition.template.json
              ↓
    generate-task-definition.ps1
              ↓
     task-definition.json (con credenciales)
              ↓
          AWS ECS Deploy
```

## 🛡️ Seguridad

Para mayor seguridad en producción, considera usar:

- **AWS Systems Manager Parameter Store**: Para almacenar variables de configuración
- **AWS Secrets Manager**: Para almacenar credenciales sensibles (SMTP, API keys, etc.)

Ejemplo de migración a Secrets Manager:

```json
{
  "secrets": [
    {
      "name": "SMTP_PASSWORD",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:airflow/smtp-password"
    }
  ]
}
```

## 📝 Variables de Entorno Críticas

Las siguientes variables son críticas para el funcionamiento del sistema:

### SMTP (Brevo)
- `SMTP_HOST` - Servidor SMTP
- `SMTP_PORT` - Puerto SMTP (587)
- `SMTP_EMAIL` - Usuario SMTP
- `SMTP_PASSWORD` - Contraseña SMTP (⚠️ SENSIBLE)

### AWS
- `AWS_DEFAULT_REGION` - Región de AWS
- `AWS_ACCESS_KEY_ID` - Access Key (⚠️ SENSIBLE)
- `AWS_SECRET_ACCESS_KEY` - Secret Key (⚠️ SENSIBLE)
- `AWS_SESSION_TOKEN` - Session Token (⚠️ SENSIBLE)

### Base de Datos
- `AIRFLOW__DATABASE__SQL_ALCHEMY_CONN` - Connection string de PostgreSQL (⚠️ SENSIBLE)

## 🔍 Verificar Configuración

Para verificar que las variables se aplicaron correctamente:

```powershell
# Ver el contenido generado (sin mostrar contraseñas)
Get-Content task-definition.json | Select-String "SMTP"
```

## 📚 Referencias

- [Brevo SMTP Documentation](https://developers.brevo.com/docs/send-a-transactional-email)
- [AWS ECS Task Definitions](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definitions.html)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
