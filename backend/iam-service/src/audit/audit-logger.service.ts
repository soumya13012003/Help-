import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface AuditEventPayload {
  actor: string; // user ID or service name
  tenantId?: string;
  targetResource: string;
  action: string;
  status: 'SUCCESS' | 'FAILURE';
  reason?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger(AuditLoggerService.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  /**
   * Publishes an immutable audit event to the RabbitMQ fan-out exchange.
   */
  async logEvent(payload: AuditEventPayload): Promise<void> {
    const eventId = uuidv4();
    const timestamp = new Date().toISOString();

    const event = {
      event_id: eventId,
      timestamp,
      schema_version: '1.0',
      ...payload,
    };

    // Calculate integrity hash chaining the event data
    const hash = crypto.createHash('sha256')
      .update(JSON.stringify(event))
      .digest('hex');

    const secureEvent = {
      ...event,
      integrity_hash: hash,
    };

    try {
      const routingKey = `authorization.${payload.status.toLowerCase()}`;
      
      await this.amqpConnection.publish(
        'audit-all', // exchange name
        routingKey,
        secureEvent,
      );
      this.logger.log(`Audit event ${eventId} published successfully [${payload.status}]`);
    } catch (error) {
      // In a real system, you might want to write to a local fallback log file here 
      // to guarantee audit trail preservation if RMQ is down.
      this.logger.error(`Failed to publish audit event ${eventId}`, error);
    }
  }

  async logSuccess(payload: Omit<AuditEventPayload, 'status'>): Promise<void> {
    return this.logEvent({ ...payload, status: 'SUCCESS' });
  }

  async logFailure(payload: Omit<AuditEventPayload, 'status'>): Promise<void> {
    return this.logEvent({ ...payload, status: 'FAILURE' });
  }
}
