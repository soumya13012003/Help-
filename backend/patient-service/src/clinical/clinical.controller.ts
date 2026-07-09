import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { ClinicalService } from './clinical.service';

@Controller('clinical')
export class ClinicalController {
  constructor(private readonly clinicalService: ClinicalService) {}

  @Post('appointments/request')
  async requestAppointment(@Body() body: {
    patientId: string;
    patientSystemId?: string;
    patientName?: string;
    patientEmail?: string;
    department?: string;
    doctorId?: string;
    doctorSystemId?: string;
    doctorName?: string;
    appointmentDate: string;
    reasonForVisit: string;
  }) {
    return this.clinicalService.requestAppointment({
      ...body,
      appointmentDate: new Date(body.appointmentDate),
    });
  }

  @Get('appointments/queue')
  async getAppointmentQueue() {
    return this.clinicalService.getAppointmentQueue();
  }

  @Get('appointments/all')
  async getAllAppointments() {
    return this.clinicalService.getAllAppointments();
  }

  @Get('appointments/patient/:patientId')
  async getPatientAppointments(@Param('patientId') patientId: string) {
    return this.clinicalService.getAppointmentsByPatient(patientId);
  }

  @Get('appointments/doctor/:doctorId')
  async getDoctorAppointments(@Param('doctorId') doctorId: string) {
    return this.clinicalService.getAppointmentsByDoctor(doctorId);
  }

  @Patch('appointments/:id/allocate')
  async allocateDoctor(
    @Param('id') id: string,
    @Body() body: {
      doctorId: string;
      doctorSystemId: string;
      doctorName: string;
      department: string;
    },
  ) {
    return this.clinicalService.allocateDoctor(
      id,
      body.doctorId,
      body.doctorSystemId,
      body.doctorName,
      body.department,
    );
  }

  @Patch('appointments/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.clinicalService.updateStatus(id, body.status);
  }

  @Post('prescriptions')
  async createPrescriptions(@Body() body: { prescriptions: any[] }) {
    return this.clinicalService.createPrescriptions(body.prescriptions);
  }

  @Post('bills')
  async createBill(@Body() body: any) {
    return this.clinicalService.createBill(body);
  }

  @Get('prescriptions/patient/:patientId')
  async getPatientPrescriptions(@Param('patientId') patientId: string) {
    return this.clinicalService.getPrescriptionsByPatient(patientId);
  }

  @Get('bills/patient/:patientId')
  async getPatientBills(@Param('patientId') patientId: string) {
    return this.clinicalService.getBillsByPatient(patientId);
  }
}
