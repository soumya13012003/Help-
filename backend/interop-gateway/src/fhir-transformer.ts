import { Logger } from '@nestjs/common';
import { Bundle, Patient, Encounter, Identifier, HumanName, Reference } from '@medplum/fhirtypes';
import { v4 as uuidv4 } from 'uuid';

export class FhirTransformer {
  private readonly logger = new Logger(FhirTransformer.name);

  /**
   * Transforms a raw HL7 ADT^A01 (Admit) message into a FHIR R4 Bundle 
   * containing Patient and Encounter resources.
   */
  public transformAdtToFhir(hl7Message: string): Bundle {
    this.logger.log('Transforming HL7 ADT message to FHIR R4');
    
    // Split by \r or \n to be robust against different environments and mock tests
    const segments = hl7Message.split(/\r?\n|\r/);
    this.logger.log(`Parsed ${segments.length} segments`);
    
    let patientResource: Patient | null = null;
    let encounterResource: Encounter | null = null;

    const patientId = uuidv4();
    const encounterId = uuidv4();

    for (const segment of segments) {
      const cleanSegment = segment.trim();
      if (cleanSegment.startsWith('PID')) {
        patientResource = this.parsePidSegment(cleanSegment, patientId);
      } else if (cleanSegment.startsWith('PV1')) {
        encounterResource = this.parsePv1Segment(cleanSegment, encounterId, patientId);
      }
    }

    if (!patientResource) {
      throw new Error('Invalid ADT Message: Missing PID (Patient Identification) segment');
    }

    // Construct the FHIR Transaction Bundle
    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [
        {
          fullUrl: `urn:uuid:${patientId}`,
          resource: patientResource,
          request: {
            method: 'POST',
            url: 'Patient',
          },
        },
      ],
    };

    if (encounterResource) {
      bundle.entry!.push({
        fullUrl: `urn:uuid:${encounterId}`,
        resource: encounterResource,
        request: {
          method: 'POST',
          url: 'Encounter',
        },
      });
    }

    return bundle;
  }

  private parsePidSegment(segment: string, fhirId: string): Patient {
    const fields = segment.split('|');
    
    // PID-3: Patient Identifier List (e.g., MRN)
    const mrnField = fields[3] || '';
    const mrn = mrnField.split('^')[0];

    // PID-5: Patient Name
    const nameField = fields[5] || '';
    const nameParts = nameField.split('^');
    const familyName = nameParts[0] || '';
    const givenName = nameParts[1] || '';

    // PID-7: Date/Time of Birth (YYYYMMDD)
    const dobRaw = fields[7] || '';
    const dob = dobRaw.length >= 8 ? `${dobRaw.slice(0,4)}-${dobRaw.slice(4,6)}-${dobRaw.slice(6,8)}` : undefined;

    // PID-8: Administrative Sex
    const sexRaw = fields[8] || '';
    let gender: 'male' | 'female' | 'other' | 'unknown' = 'unknown';
    if (sexRaw === 'M') gender = 'male';
    if (sexRaw === 'F') gender = 'female';
    if (sexRaw === 'O') gender = 'other';

    return {
      resourceType: 'Patient',
      id: fhirId,
      identifier: [
        {
          use: 'usual',
          type: {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MR' }]
          },
          value: mrn,
        }
      ],
      name: [
        {
          use: 'official',
          family: familyName,
          given: givenName ? [givenName] : undefined,
        }
      ],
      gender: gender,
      birthDate: dob,
    };
  }

  private parsePv1Segment(segment: string, encounterId: string, patientId: string): Encounter {
    const fields = segment.split('|');
    
    // PV1-2: Patient Class (e.g., E=Emergency, I=Inpatient, O=Outpatient)
    const patientClass = fields[2] || 'U'; // Unknown by default
    let fhirClassCode = 'UNK';
    if (patientClass === 'E') fhirClassCode = 'EMER';
    if (patientClass === 'I') fhirClassCode = 'IMP';
    if (patientClass === 'O') fhirClassCode = 'AMB';

    // PV1-44: Admit Date/Time
    const admitTimeRaw = fields[44] || '';

    return {
      resourceType: 'Encounter',
      id: encounterId,
      status: 'in-progress',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: fhirClassCode,
      },
      subject: {
        reference: `urn:uuid:${patientId}`
      }
    };
  }
}
