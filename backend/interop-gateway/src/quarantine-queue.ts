import { Logger, Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { v4 as uuidv4 } from 'uuid';

export interface QuarantinedMessage {
  incidentId: string;
  timestamp: string;
  sourceIp: string;
  errorMessage: string;
  rawPayload: string; // The malformed HL7 string
}

@Injectable()
export class QuarantineQueue {
  private readonly logger = new Logger(QuarantineQueue.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  /**
   * Catches malformed or un-parsable HL7 messages and pushes them to a dead-letter queue
   * for manual review by an integration engineer, preventing silent data loss.
   */
  public async quarantineMessage(rawMessage: string, errorReason: string, sourceAddress: string): Promise<void> {
    const incidentId = uuidv4();
    
    const payload: QuarantinedMessage = {
      incidentId,
      timestamp: new Date().toISOString(),
      sourceIp: sourceAddress,
      errorMessage: errorReason,
      rawPayload: rawMessage,
    };

    try {
      // Publish to the Dead-Letter Exchange specifically meant for Interoperability issues
      await this.amqpConnection.publish(
        'interop-dlx', 
        'ehr.message.quarantined', 
        payload
      );
      this.logger.warn(`Message quarantined. Incident ID: ${incidentId} | Reason: ${errorReason}`);
    } catch (publishError) {
      // If RabbitMQ is down, fallback to critical local disk logging
      this.logger.error(`CRITICAL: Failed to publish to quarantine queue. Message might be lost!`, publishError);
      this.fallbackToDisk(payload);
    }
  }

  private fallbackToDisk(payload: QuarantinedMessage) {
    // Implementation for writing to a persistent local volume
    // e.g. fs.writeFileSync(`/var/log/quarantine/${payload.incidentId}.json`, JSON.stringify(payload))
    this.logger.error(`Writing quarantined message to disk fallback... [Simulated]`);
  }
}
