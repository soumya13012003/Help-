import * as net from 'net';
import { Logger } from '@nestjs/common';
import { QuarantineQueue } from './quarantine-queue';
import { FhirTransformer } from './fhir-transformer';

export class MllpServer {
  private readonly logger = new Logger(MllpServer.name);
  private server: net.Server;
  private readonly MLLP_START = '\x0b'; // VT (Vertical Tab)
  private readonly MLLP_END = '\x1c\x0d'; // FS CR (File Separator, Carriage Return)

  constructor(
    private readonly port: number,
    private readonly fhirTransformer: FhirTransformer,
    private readonly quarantineQueue: QuarantineQueue
  ) {
    this.server = net.createServer((socket) => this.handleConnection(socket));
    
    this.server.on('error', (err) => {
      this.logger.error(`MLLP Server Error: ${err.message}`, err.stack);
    });
  }

  public start() {
    this.server.listen(this.port, () => {
      this.logger.log(`HL7 MLLP Server listening on port ${this.port}`);
    });
  }

  private handleConnection(socket: net.Socket) {
    const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    this.logger.log(`New connection from ${remoteAddress}`);

    let buffer = '';

    // Timeout to prevent bad actors from holding connections open indefinitely
    socket.setTimeout(30000); // 30 seconds
    socket.on('timeout', () => {
      this.logger.warn(`Connection timeout for ${remoteAddress}. Disconnecting.`);
      socket.destroy();
    });

    socket.on('data', async (data) => {
      buffer += data.toString('utf-8');

      // Check if we have a complete MLLP frame
      const startIndex = buffer.indexOf(this.MLLP_START);
      const endIndex = buffer.indexOf(this.MLLP_END);

      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        const hl7Message = buffer.substring(startIndex + 1, endIndex);
        
        // Remove processed message from buffer
        buffer = buffer.substring(endIndex + this.MLLP_END.length);
        
        try {
          // Process the raw HL7 message
          await this.processMessage(hl7Message, remoteAddress);
          
          // Send ACK back to the client
          const ackMessage = this.generateAck(hl7Message, 'AA', 'Message accepted');
          socket.write(`${this.MLLP_START}${ackMessage}${this.MLLP_END}`);
        } catch (error: any) {
          this.logger.error(`Failed to process HL7 message from ${remoteAddress}`, error.stack);
          
          // Quarantine the malformed message
          await this.quarantineQueue.quarantineMessage(hl7Message, error.message, remoteAddress);

          // Send Application Reject (AR) or Application Error (AE) back to client
          const nackMessage = this.generateAck(hl7Message, 'AE', 'Internal Processing Error');
          socket.write(`${this.MLLP_START}${nackMessage}${this.MLLP_END}`);
        }
      }
    });

    socket.on('close', () => {
      this.logger.log(`Connection closed for ${remoteAddress}`);
    });

    socket.on('error', (err) => {
      this.logger.error(`Socket Error [${remoteAddress}]: ${err.message}`);
    });
  }

  private async processMessage(hl7Message: string, source: string) {
    // Basic structural check
    if (!hl7Message.startsWith('MSH')) {
      throw new Error('Invalid HL7 Message: Does not start with MSH segment');
    }

    this.logger.log(`Received valid HL7 message from ${source}`);
    
    // Pass to Transformer (ADT to FHIR)
    const fhirBundle = this.fhirTransformer.transformAdtToFhir(hl7Message);
    
    // In production, this would publish the FHIR Bundle to the Clinical Service via RabbitMQ
    this.logger.log(`Successfully transformed HL7 to FHIR Bundle with ${fhirBundle.entry?.length} entries.`);
  }

  private generateAck(originalMessage: string, ackCode: 'AA' | 'AE' | 'AR', text: string): string {
    const segments = originalMessage.split('\r');
    const mshSegment = segments[0];
    const mshFields = mshSegment.split('|');
    
    const messageControlId = mshFields[9] || 'UNKNOWN';
    const sendingApp = mshFields[2] || '';
    const sendingFacility = mshFields[3] || '';
    const receivingApp = mshFields[4] || 'HelpPlus';
    const receivingFacility = mshFields[5] || 'Gateway';
    
    const date = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

    return [
      `MSH|^~\\&|${receivingApp}|${receivingFacility}|${sendingApp}|${sendingFacility}|${date}||ACK|${messageControlId}|P|2.5`,
      `MSA|${ackCode}|${messageControlId}|${text}`
    ].join('\r');
  }
}
