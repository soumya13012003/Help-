import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { Prescription } from './entities/prescription.entity';
import { Bill } from './entities/bill.entity';

@Injectable()
export class ClinicalService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Prescription)
    private readonly prescriptionRepo: Repository<Prescription>,
    @InjectRepository(Bill)
    private readonly billRepo: Repository<Bill>,
  ) {}

  async requestAppointment(data: {
    patientId: string;
    patientSystemId?: string;
    patientName?: string;
    patientEmail?: string;
    department?: string;
    doctorId?: string;
    doctorSystemId?: string;
    doctorName?: string;
    appointmentDate: Date;
    reasonForVisit: string;
  }) {
    const appointment = this.appointmentRepo.create({
      patientId: data.patientId,
      patientSystemId: data.patientSystemId || null,
      patientName: data.patientName || null,
      patientEmail: data.patientEmail || null,
      department: data.department || null,
      doctorId: data.doctorId || null,
      doctorSystemId: data.doctorSystemId || null,
      doctorName: data.doctorName || null,
      appointmentDate: data.appointmentDate,
      reasonForVisit: data.reasonForVisit,
      status: 'REQUESTED',
    });
    return this.appointmentRepo.save(appointment);
  }

  async getAppointmentQueue() {
    return this.appointmentRepo.find({
      where: { status: 'REQUESTED' },
      order: { createdAt: 'ASC' },
    });
  }

  async getAllAppointments() {
    return this.appointmentRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getAppointmentsByPatient(patientId: string) {
    return this.appointmentRepo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAppointmentsByDoctor(doctorId: string) {
    return this.appointmentRepo.find({
      where: { doctorId },
      order: { appointmentDate: 'ASC' },
    });
  }

  async allocateDoctor(
    appointmentId: string,
    doctorId: string,
    doctorSystemId: string,
    doctorName: string,
    department: string,
  ) {
    const appointment = await this.appointmentRepo.findOne({ where: { id: appointmentId } });
    if (!appointment) throw new NotFoundException('Appointment not found');

    appointment.doctorId = doctorId;
    appointment.doctorSystemId = doctorSystemId;
    appointment.doctorName = doctorName;
    appointment.department = department;
    appointment.status = 'SCHEDULED';

    return this.appointmentRepo.save(appointment);
  }

  async updateStatus(appointmentId: string, status: string) {
    const appointment = await this.appointmentRepo.findOne({ where: { id: appointmentId } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    appointment.status = status;
    return this.appointmentRepo.save(appointment);
  }

  async createPrescriptions(prescriptions: Partial<Prescription>[]) {
    const newPrescriptions = this.prescriptionRepo.create(prescriptions);
    return this.prescriptionRepo.save(newPrescriptions);
  }

  async createBill(billData: Partial<Bill>) {
    const newBill = this.billRepo.create(billData);
    return this.billRepo.save(newBill);
  }

  async getPrescriptionsByPatient(patientId: string) {
    return this.prescriptionRepo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }

  async getBillsByPatient(patientId: string) {
    return this.billRepo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }
}
