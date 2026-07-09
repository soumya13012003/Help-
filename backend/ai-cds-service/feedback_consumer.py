import pika
import json
import sqlite3
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# SQLite used here for local event staging before batch extraction to the Data Lake
DB_PATH = "/data/feedback_lake.sqlite"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ai_overrides (
            event_id TEXT PRIMARY KEY,
            timestamp TEXT,
            clinician_id TEXT,
            original_suggestion TEXT,
            clinician_override TEXT,
            reason TEXT
        )
    ''')
    conn.commit()
    conn.close()

def save_feedback(payload: dict):
    """Save the override event for future fine-tuning datasets."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO ai_overrides (event_id, timestamp, clinician_id, original_suggestion, clinician_override, reason)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        payload.get('event_id'),
        payload.get('timestamp'),
        payload.get('clinician_id'),
        payload.get('original_suggestion'),
        payload.get('clinician_override'),
        payload.get('reason', 'N/A')
    ))
    conn.commit()
    conn.close()
    logger.info(f"Logged AI override event: {payload.get('event_id')} for future retraining.")

def consume_feedback():
    """
    Connects to RabbitMQ and listens to the ai-feedback queue for clinician overrides.
    """
    rmq_host = os.environ.get('RABBITMQ_HOST', 'rabbitmq.help-plus-infra.svc.cluster.local')
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=rmq_host))
    channel = connection.channel()

    # Declare exchange and queue
    channel.exchange_declare(exchange='clinical-events', exchange_type='topic')
    result = channel.queue_declare(queue='ai-feedback-ingestion', durable=True)
    queue_name = result.method.queue

    # Bind queue to the specific override routing key
    channel.queue_bind(exchange='clinical-events', queue=queue_name, routing_key='ai.suggestion.overridden')

    def callback(ch, method, properties, body):
        try:
            event_payload = json.loads(body)
            save_feedback(event_payload)
            # Acknowledge the message so it's removed from the queue
            ch.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as e:
            logger.error(f"Error processing feedback event: {e}")
            # Negative Acknowledge to requeue the message
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

    logger.info("Starting RabbitMQ consumer for ai.suggestion.overridden events...")
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=queue_name, on_message_callback=callback)
    
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        channel.stop_consuming()
    finally:
        connection.close()

if __name__ == "__main__":
    init_db()
    consume_feedback()
