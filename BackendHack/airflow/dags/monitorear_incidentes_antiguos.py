"""
DAG de Monitoreo de SLA
Detecta incidentes antiguos sin atender y escala su urgencia automáticamente
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
import json
import boto3
import requests
import os

# Configuración desde variables de entorno
API_BASE_URL = os.getenv('API_BASE_URL', 'https://zictdclmxa.execute-api.us-east-1.amazonaws.com/dev')
DYNAMODB_TABLE = os.getenv('DYNAMODB_TABLE_INCIDENTES', 'Incidentes')
AWS_REGION = os.getenv('AWS_DEFAULT_REGION', 'us-east-1')
THRESHOLD_TIEMPO_CRITICO = int(os.getenv('THRESHOLD_TIEMPO_CRITICO_MINUTES', '30'))

# Thresholds de escalación (en minutos)
THRESHOLD_BAJA_A_MEDIA = 240      # 4 horas
THRESHOLD_MEDIA_A_ALTA = 120      # 2 horas
THRESHOLD_ALTA_A_CRITICA = 60     # 1 hora
THRESHOLD_RECORDATORIO = 30       # 30 minutos

default_args = {
    'owner': 'alerta-utec',
    'depends_on_past': False,
    'start_date': datetime(2025, 11, 15),
    'email_on_failure': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'monitorear_incidentes_antiguos',
    default_args=default_args,
    description='Monitoreo de SLA y escalación automática de incidentes antiguos',
    schedule_interval=timedelta(minutes=30),  # Cada 30 minutos
    catchup=False,
    tags=['monitoreo', 'sla', 'escalacion']
)

def obtener_incidentes_sin_resolver(**context):
    """Obtiene incidentes que no han sido resueltos"""
    dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
    table = dynamodb.Table(DYNAMODB_TABLE)

    # Buscar incidentes NO resueltos
    response = table.scan(
        FilterExpression='estado <> :resuelto AND estado <> :cancelado',
        ExpressionAttributeValues={
            ':resuelto': 'resuelto',
            ':cancelado': 'cancelado'
        }
    )

    incidentes = response.get('Items', [])
    print(f"📋 Encontrados {len(incidentes)} incidentes sin resolver")

    context['ti'].xcom_push(key='incidentes_sin_resolver', value=incidentes)
    return len(incidentes)

def calcular_tiempo_transcurrido(**context):
    """Calcula el tiempo transcurrido desde la creación de cada incidente"""
    incidentes = context['ti'].xcom_pull(key='incidentes_sin_resolver')
    ahora = datetime.now()

    incidentes_con_tiempo = []

    for inc in incidentes:
        try:
            fecha_creacion = datetime.fromisoformat(inc['fechaCreacion'].replace('Z', '+00:00'))
            tiempo_transcurrido_min = (ahora - fecha_creacion.replace(tzinfo=None)).total_seconds() / 60

            inc['tiempo_transcurrido_minutos'] = round(tiempo_transcurrido_min, 2)
            incidentes_con_tiempo.append(inc)

        except Exception as e:
            print(f"❌ Error procesando {inc.get('incidenteId', 'UNKNOWN')}: {str(e)}")

    # Ordenar por tiempo transcurrido (más antiguos primero)
    incidentes_con_tiempo.sort(key=lambda x: x['tiempo_transcurrido_minutos'], reverse=True)

    print(f"⏱️ Incidentes más antiguos:")
    for inc in incidentes_con_tiempo[:5]:
        print(f"  {inc['incidenteId']}: {inc['tiempo_transcurrido_minutos']:.0f} min ({inc['urgencia']})")

    context['ti'].xcom_push(key='incidentes_con_tiempo', value=incidentes_con_tiempo)
    return incidentes_con_tiempo

def identificar_incidentes_para_escalar(**context):
    """Identifica incidentes que deben escalarse según el tiempo transcurrido"""
    incidentes = context['ti'].xcom_pull(key='incidentes_con_tiempo')

    incidentes_a_escalar = []

    for inc in incidentes:
        tiempo = inc['tiempo_transcurrido_minutos']
        urgencia_actual = inc.get('urgencia', 'baja')
        nueva_urgencia = None
        razon = None

        # Lógica de escalación basada en tiempo y urgencia actual
        if urgencia_actual == 'baja' and tiempo >= THRESHOLD_BAJA_A_MEDIA:
            nueva_urgencia = 'media'
            razon = f'Escalado: >4 horas sin resolver (tiempo: {tiempo:.0f} min)'
        
        elif urgencia_actual == 'media' and tiempo >= THRESHOLD_MEDIA_A_ALTA:
            nueva_urgencia = 'alta'
            razon = f'Escalado: >2 horas sin resolver (tiempo: {tiempo:.0f} min)'
        
        elif urgencia_actual == 'alta' and tiempo >= THRESHOLD_ALTA_A_CRITICA:
            nueva_urgencia = 'critica'
            razon = f'Escalado a CRÍTICO: >1 hora sin resolver (tiempo: {tiempo:.0f} min)'

        # Si debe escalarse, agregarlo a la lista
        if nueva_urgencia:
            incidentes_a_escalar.append({
                'incidenteId': inc['incidenteId'],
                'urgencia_actual': urgencia_actual,
                'nueva_urgencia': nueva_urgencia,
                'tiempo_transcurrido': tiempo,
                'razon': razon,
                'tipo': inc.get('tipo', 'N/A'),
                'ubicacion': inc.get('ubicacion', 'N/A'),
                'area': inc.get('area', 'general')
            })

    print(f"🚨 Identificados {len(incidentes_a_escalar)} incidentes para escalar:")
    for inc in incidentes_a_escalar:
        print(f"  {inc['incidenteId']}: {inc['urgencia_actual']} → {inc['nueva_urgencia']}")

    context['ti'].xcom_push(key='incidentes_a_escalar', value=incidentes_a_escalar)
    return incidentes_a_escalar

def escalar_urgencia_en_dynamodb(**context):
    """Actualiza la urgencia de los incidentes en DynamoDB"""
    incidentes_a_escalar = context['ti'].xcom_pull(key='incidentes_a_escalar')

    if not incidentes_a_escalar:
        print("✅ No hay incidentes para escalar")
        return 0

    dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
    table = dynamodb.Table(DYNAMODB_TABLE)

    escalados = 0

    for inc in incidentes_a_escalar:
        try:
            # Obtener historial actual
            response = table.get_item(Key={'incidenteId': inc['incidenteId']})
            incidente_actual = response.get('Item', {})
            historial = incidente_actual.get('historial', [])

            # Agregar evento de escalación
            historial.append({
                'accion': 'escalacion_automatica',
                'fecha': datetime.now().isoformat(),
                'urgencia_anterior': inc['urgencia_actual'],
                'urgencia_nueva': inc['nueva_urgencia'],
                'razon': inc['razon'],
                'automatico': True
            })

            # Actualizar en DynamoDB
            table.update_item(
                Key={'incidenteId': inc['incidenteId']},
                UpdateExpression='SET urgencia = :nueva_urg, historial = :hist',
                ExpressionAttributeValues={
                    ':nueva_urg': inc['nueva_urgencia'],
                    ':hist': historial
                }
            )

            print(f"✅ Escalado: {inc['incidenteId']} → {inc['nueva_urgencia']}")
            escalados += 1

        except Exception as e:
            print(f"❌ Error escalando {inc['incidenteId']}: {str(e)}")

    print(f"📊 Total escalados: {escalados}/{len(incidentes_a_escalar)}")
    context['ti'].xcom_push(key='total_escalados', value=escalados)
    return escalados

def notificar_escalaciones(**context):
    """Envía notificaciones sobre las escalaciones realizadas"""
    incidentes_escalados = context['ti'].xcom_pull(key='incidentes_a_escalar')
    total_escalados = context['ti'].xcom_pull(key='total_escalados')

    if total_escalados == 0:
        print("ℹ️ No hay escalaciones para notificar")
        return 0

    # Agrupar por área para notificaciones dirigidas
    por_area = {}
    for inc in incidentes_escalados:
        area = inc['area']
        if area not in por_area:
            por_area[area] = []
        por_area[area].append(inc)

    print(f"📢 Notificando escalaciones a {len(por_area)} áreas:")
    for area, incidentes in por_area.items():
        print(f"  {area}: {len(incidentes)} incidentes escalados")
        
        # Aquí se podría enviar notificación WebSocket o email
        # Por ahora solo registramos en logs
        for inc in incidentes:
            print(f"    - {inc['incidenteId']}: {inc['urgencia_actual']} → {inc['nueva_urgencia']}")

    return len(por_area)

def generar_reporte_escalaciones(**context):
    """Genera un reporte resumen de las escalaciones"""
    incidentes_a_escalar = context['ti'].xcom_pull(key='incidentes_a_escalar')
    total_escalados = context['ti'].xcom_pull(key='total_escalados')

    reporte = {
        'fecha': datetime.now().isoformat(),
        'total_incidentes_escalados': total_escalados,
        'escalaciones': [],
        'por_urgencia': {
            'media': 0,
            'alta': 0,
            'critica': 0
        }
    }

    for inc in incidentes_a_escalar:
        reporte['escalaciones'].append({
            'incidenteId': inc['incidenteId'],
            'tipo': inc['tipo'],
            'ubicacion': inc['ubicacion'],
            'area': inc['area'],
            'urgencia_anterior': inc['urgencia_actual'],
            'urgencia_nueva': inc['nueva_urgencia'],
            'tiempo_transcurrido_min': inc['tiempo_transcurrido']
        })
        
        # Contar por nueva urgencia
        reporte['por_urgencia'][inc['nueva_urgencia']] += 1

    print("\n" + "="*60)
    print("📊 REPORTE DE ESCALACIONES - MONITOREO SLA")
    print("="*60)
    print(f"Total escalados: {total_escalados}")
    print(f"  → Media: {reporte['por_urgencia']['media']}")
    print(f"  → Alta: {reporte['por_urgencia']['alta']}")
    print(f"  → Crítica: {reporte['por_urgencia']['critica']}")
    print("="*60 + "\n")

    context['ti'].xcom_push(key='reporte_escalaciones', value=reporte)
    return reporte

# Definir tareas
task_obtener = PythonOperator(
    task_id='obtener_incidentes_sin_resolver',
    python_callable=obtener_incidentes_sin_resolver,
    dag=dag
)

task_calcular_tiempo = PythonOperator(
    task_id='calcular_tiempo_transcurrido',
    python_callable=calcular_tiempo_transcurrido,
    dag=dag
)

task_identificar = PythonOperator(
    task_id='identificar_para_escalar',
    python_callable=identificar_incidentes_para_escalar,
    dag=dag
)

task_escalar = PythonOperator(
    task_id='escalar_urgencia',
    python_callable=escalar_urgencia_en_dynamodb,
    dag=dag
)

task_notificar = PythonOperator(
    task_id='notificar_escalaciones',
    python_callable=notificar_escalaciones,
    dag=dag
)

task_reporte = PythonOperator(
    task_id='generar_reporte',
    python_callable=generar_reporte_escalaciones,
    dag=dag
)

# Definir flujo
task_obtener >> task_calcular_tiempo >> task_identificar >> task_escalar >> task_notificar >> task_reporte
