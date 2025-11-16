"""
DAG de Notificaciones por Email
Envía notificaciones por email a usuarios offline del área responsable
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.email import EmailOperator
import json
import boto3
import requests
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configuración desde variables de entorno
API_BASE_URL = os.getenv('API_BASE_URL', 'https://if1stu7r2g.execute-api.us-east-1.amazonaws.com/dev')
WEBSOCKET_URL = os.getenv('WEBSOCKET_URL', 'wss://3lgmyhtvpa.execute-api.us-east-1.amazonaws.com/dev')
DYNAMODB_TABLE = os.getenv('DYNAMODB_TABLE_INCIDENTES', 'Incidentes')
AWS_REGION = os.getenv('AWS_DEFAULT_REGION', 'us-east-1')
THRESHOLD_TIEMPO_CRITICO = int(os.getenv('THRESHOLD_TIEMPO_CRITICO_MINUTES', '30'))
DASHBOARD_URL = os.getenv('DASHBOARD_URL', 'https://alerta-utec.com/dashboard')

# Configuración SMTP Brevo
SMTP_EMAIL = os.getenv('SMTP_EMAIL', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
SMTP_HOST = os.getenv('SMTP_HOST', 'smtp-relay.brevo.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))

# Emails de áreas responsables
EMAILS = {
    'Seguridad': os.getenv('EMAIL_SEGURIDAD', 'seguridad@utec.edu.pe'),
    'Infraestructura': os.getenv('EMAIL_INFRAESTRUCTURA', 'infraestructura@utec.edu.pe'),
    'Limpieza': os.getenv('EMAIL_LIMPIEZA', 'servicios@utec.edu.pe'),
    'Tecnología': os.getenv('EMAIL_TECNOLOGIA', 'ti@utec.edu.pe'),
    'Académico': os.getenv('EMAIL_ACADEMICO', 'academico@utec.edu.pe'),
}

# Contactos SMS de emergencia
CONTACTOS_EMERGENCIA = [
    os.getenv('SMS_CONTACTO_SEGURIDAD_1', '+51999999999'),
    os.getenv('SMS_CONTACTO_SEGURIDAD_2', '+51888888888'),
]

default_args = {
    'owner': 'alerta-utec',
    'depends_on_past': False,
    'start_date': datetime(2025, 11, 15),
    'email_on_failure': True,
    'email': ['soporte@utec.edu.pe'],
    'retries': 1,
    'retry_delay': timedelta(minutes=1),
}

dag = DAG(
    'enviar_notificaciones',
    default_args=default_args,
    description='Envío de notificaciones por email a usuarios offline',
    schedule_interval=timedelta(minutes=int(os.getenv('DAG_NOTIFICACIONES_INTERVAL_MINUTES', '10'))),  # Cada 10 min
    catchup=False,
    tags=['notificaciones', 'email', 'usuarios-offline']
)

def detectar_incidentes_para_notificar(**context):
    """Detecta incidentes que requieren notificación por email"""
    dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
    table = dynamodb.Table(DYNAMODB_TABLE)

    # Buscar incidentes de alta o crítica urgencia sin resolver
    response = table.scan(
        FilterExpression='(urgencia = :alta OR urgencia = :critica) AND (estado = :pend OR estado = :aten)',
        ExpressionAttributeValues={
            ':alta': 'alta',
            ':critica': 'critica',
            ':pend': 'pendiente',
            ':aten': 'en_atencion'
        }
    )

    incidentes = response.get('Items', [])
    print(f"📧 Encontrados {len(incidentes)} incidentes de alta/crítica urgencia para notificar")

    context['ti'].xcom_push(key='incidentes_para_notificar', value=incidentes)
    return incidentes

def obtener_usuarios_area(**context):
    """Obtiene usuarios del área responsable con rol 'autoridad'"""
    incidentes = context['ti'].xcom_pull(key='incidentes_para_notificar')
    
    dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
    usuarios_table = dynamodb.Table('Usuarios')
    
    # Mapeo de área del incidente a área de usuario
    area_mapping = {
        'seguridad': 'seguridad',
        'enfermeria': 'enfermeria',
        'infraestructura': 'infraestructura',
        'limpieza': 'limpieza',
        'tecnologia': 'tecnologia',
        'mantenimiento': 'mantenimiento',
        'general': 'general'
    }
    
    # Agrupar incidentes por área
    por_area = {}
    for inc in incidentes:
        area_incidente = inc.get('area', 'general').lower()
        area_usuario = area_mapping.get(area_incidente, 'general')
        
        if area_usuario not in por_area:
            por_area[area_usuario] = []
        por_area[area_usuario].append(inc)
    
    # Obtener usuarios de cada área
    usuarios_por_area = {}
    
    for area, incidentes_area in por_area.items():
        try:
            # Buscar usuarios con rol 'autoridad' en esta área
            response = usuarios_table.scan(
                FilterExpression='area = :area AND rol = :rol',
                ExpressionAttributeValues={
                    ':area': area,
                    ':rol': 'autoridad'
                }
            )
            
            usuarios = response.get('Items', [])
            usuarios_por_area[area] = {
                'usuarios': usuarios,
                'incidentes': incidentes_area
            }
            
            print(f"👥 Área '{area}': {len(usuarios)} usuarios autoridad, {len(incidentes_area)} incidentes")
            
        except Exception as e:
            print(f"❌ Error obteniendo usuarios de área {area}: {str(e)}")
    
    context['ti'].xcom_push(key='usuarios_por_area', value=usuarios_por_area)
    return usuarios_por_area

def filtrar_usuarios_offline(**context):
    """Filtra usuarios que NO están conectados por WebSocket"""
    usuarios_por_area = context['ti'].xcom_pull(key='usuarios_por_area')
    
    dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
    connections_table = dynamodb.Table('WebSocketConnections')
    
    # Obtener todas las conexiones activas
    try:
        response = connections_table.scan()
        conexiones_activas = response.get('Items', [])
        usuarios_online = set([conn.get('userId') for conn in conexiones_activas if conn.get('userId')])
        
        print(f"🌐 {len(usuarios_online)} usuarios online actualmente")
    except Exception as e:
        print(f"⚠️ Error obteniendo conexiones: {str(e)}")
        usuarios_online = set()
    
    # Filtrar usuarios offline por área
    usuarios_offline_por_area = {}
    
    for area, data in usuarios_por_area.items():
        usuarios_offline = [
            u for u in data['usuarios']
            if u.get('userId') not in usuarios_online
        ]
        
        if usuarios_offline:
            usuarios_offline_por_area[area] = {
                'usuarios': usuarios_offline,
                'incidentes': data['incidentes']
            }
            
            print(f"📧 Área '{area}': {len(usuarios_offline)} usuarios offline para notificar")
    
    context['ti'].xcom_push(key='usuarios_offline_por_area', value=usuarios_offline_por_area)
    return usuarios_offline_por_area

def preparar_notificaciones_email(**context):
    """Prepara contenido de emails para usuarios offline"""
    usuarios_offline_por_area = context['ti'].xcom_pull(key='usuarios_offline_por_area')

    if not usuarios_offline_por_area:
        print("✅ No hay usuarios offline para notificar")
        return []

    emails_a_enviar = []

    for area, data in usuarios_offline_por_area.items():
        usuarios = data['usuarios']
        incidentes_area = data['incidentes']

        for usuario in usuarios:
            contenido = f"""
        <h2>🚨 Alerta de Incidentes - {area.upper()}</h2>
        <p>Hola {usuario.get('nombre', usuario.get('email', 'Usuario'))},</p>
        <p>Se han detectado {len(incidentes_area)} incidentes de alta prioridad en tu área que requieren atención:</p>
        <ul>
        """

            for inc in incidentes_area:
                contenido += f"""
            <li>
                <strong>ID:</strong> {inc['incidenteId']}<br>
                <strong>Tipo:</strong> {inc.get('tipo', 'N/A')}<br>
                <strong>Ubicación:</strong> {inc.get('ubicacion', 'N/A')}<br>
                <strong>Descripción:</strong> {inc.get('descripcion', 'N/A')}<br>
                <strong>Estado:</strong> {inc.get('estado', 'N/A')}<br>
                <strong>Urgencia:</strong> {inc.get('urgencia', 'N/A')}<br>
                <strong>Fecha:</strong> {inc.get('fechaCreacion', 'N/A')}<br>
                <hr>
            </li>
            """

            contenido += f"""
        </ul>
        <p>Por favor, ingresa al sistema para gestionar estos incidentes.</p>
        <p><a href="{DASHBOARD_URL}">🔗 Acceder al Dashboard</a></p>
        <br>
        <p><small>Esta es una notificación automática del Sistema de Alertas UTEC.<br>
        Recibiste este email porque tu usuario está registrado como autoridad del área de {area}.</small></p>
        """

            emails_a_enviar.append({
                'destinatario': usuario.get('email', ''),
                'nombre': usuario.get('nombre', usuario.get('email', 'Usuario')),
                'area': area,
                'asunto': f'🚨 {len(incidentes_area)} Incidente(s) Prioritario(s) - {area.upper()}',
                'contenido': contenido
            })

    print(f"📧 Preparados {len(emails_a_enviar)} emails para enviar")
    context['ti'].xcom_push(key='emails', value=emails_a_enviar)
    return emails_a_enviar

def enviar_emails_via_smtp(**context):
    """Envía los emails usando Gmail SMTP"""
    emails = context['ti'].xcom_pull(key='emails')

    if not emails:
        print("ℹ️ No hay emails para enviar")
        return 0

    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("⚠️ SMTP_EMAIL o SMTP_PASSWORD no configurados. Simulando envío...")
        for email_data in emails:
            print(f"📧 [SIMULADO] Email a: {email_data['destinatario']}")
            print(f"   Asunto: {email_data['asunto']}")
        return len(emails)

    enviados = 0

    try:
        # Conectar al servidor SMTP de Gmail
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()  # Habilitar encriptación TLS
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        
        print(f"✅ Conectado a Gmail SMTP como {SMTP_EMAIL}")

        for email_data in emails:
            try:
                # Crear mensaje
                mensaje = MIMEMultipart('alternative')
                mensaje['Subject'] = email_data['asunto']
                mensaje['From'] = f"Alertas UTEC <{SMTP_EMAIL}>"
                mensaje['To'] = email_data['destinatario']

                # Agregar contenido HTML
                parte_html = MIMEText(email_data['contenido'], 'html', 'utf-8')
                mensaje.attach(parte_html)

                # Enviar email
                server.send_message(mensaje)
                
                print(f"✅ Email enviado a {email_data['nombre']} ({email_data['destinatario']})")
                enviados += 1

            except Exception as e:
                print(f"❌ Error enviando email a {email_data['destinatario']}: {str(e)}")

        # Cerrar conexión
        server.quit()
        print(f"📊 Total enviados: {enviados}/{len(emails)}")

    except Exception as e:
        print(f"❌ Error conectando a Gmail SMTP: {str(e)}")
        print("💡 Verifica que SMTP_EMAIL y SMTP_PASSWORD estén correctos")
        print("💡 Asegúrate de usar una 'Contraseña de aplicación' en lugar de tu contraseña normal")

    return enviados

def registrar_notificaciones(**context):
    """Registra las notificaciones enviadas en el historial de incidentes"""
    incidentes_para_notificar = context['ti'].xcom_pull(key='incidentes_para_notificar')
    emails_enviados = context['ti'].xcom_pull(key='emails')

    if not emails_enviados:
        print("ℹ️ No hay notificaciones para registrar")
        return 0

    dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
    table = dynamodb.Table(DYNAMODB_TABLE)

    registrados = 0

    for inc in incidentes_para_notificar:
        try:
            # Obtener historial actual
            response = table.get_item(Key={'incidenteId': inc['incidenteId']})
            incidente_actual = response.get('Item', {})
            historial = incidente_actual.get('historial', [])

            # Agregar evento de notificación
            historial.append({
                'accion': 'notificacion_email_enviada',
                'fecha': datetime.now().isoformat(),
                'tipo': 'automatica',
                'canal': 'email',
                'destinatarios': 'usuarios_offline_area'
            })

            # Actualizar en DynamoDB
            table.update_item(
                Key={'incidenteId': inc['incidenteId']},
                UpdateExpression='SET historial = :h',
                ExpressionAttributeValues={':h': historial}
            )

            registrados += 1

        except Exception as e:
            print(f"❌ Error registrando notificación para {inc.get('incidenteId', 'UNKNOWN')}: {str(e)}")

    print(f"✅ Registradas {registrados} notificaciones")
    return registrados

# Definir tareas
task_detectar = PythonOperator(
    task_id='detectar_incidentes_para_notificar',
    python_callable=detectar_incidentes_para_notificar,
    dag=dag
)

task_obtener_usuarios = PythonOperator(
    task_id='obtener_usuarios_area',
    python_callable=obtener_usuarios_area,
    dag=dag
)

task_filtrar_offline = PythonOperator(
    task_id='filtrar_usuarios_offline',
    python_callable=filtrar_usuarios_offline,
    dag=dag
)

task_preparar_email = PythonOperator(
    task_id='preparar_emails',
    python_callable=preparar_notificaciones_email,
    dag=dag
)

task_enviar_emails = PythonOperator(
    task_id='enviar_emails',
    python_callable=enviar_emails_via_smtp,
    dag=dag
)

task_registrar = PythonOperator(
    task_id='registrar_notificaciones',
    python_callable=registrar_notificaciones,
    dag=dag
)

# Definir flujo
task_detectar >> task_obtener_usuarios >> task_filtrar_offline >> task_preparar_email >> task_enviar_emails >> task_registrar
