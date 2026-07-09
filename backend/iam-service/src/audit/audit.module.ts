import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { AuditLoggerService } from './audit-logger.service';

@Module({
  imports: [
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: 'audit-all',
          type: 'fanout', // fan-out to all bound audit queues
        },
        {
          name: 'events',
          type: 'topic',
        },
      ],
      uri: process.env.RABBITMQ_URI || 'amqp://guest:guest@localhost:5672',
      connectionInitOptions: { wait: false },
    }),
  ],
  providers: [AuditLoggerService],
  exports: [AuditLoggerService, RabbitMQModule],
})
export class AuditModule {}
