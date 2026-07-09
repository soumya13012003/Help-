import { FhirTransformer } from './src/fhir-transformer.ts';

// A mock HL7 v2 ADT^A01 (Admit Patient) message
const mockHl7Message = 
`MSH|^~\\&|EPIC|HOSPITAL_A|HelpPlus|Gateway|202610121030||ADT^A01|MSG00001|P|2.5
EVN|A01|202610121030
PID|1||MRN123456^^^HOSPITAL_A^MR||Doe^Jane^Marie||19851025|F
PV1|1|I|2000^2012^01||||004777^Vance^Eleanor^J.||||||||||||||||||||||||||||||||||||202610121030`;

async function runTest() {
  console.log("=== Testing HL7 to FHIR Transformation ===");
  console.log("Raw HL7 ADT Input:");
  console.log(mockHl7Message);
  console.log("\n----------------------------------------\n");

  const transformer = new FhirTransformer();
  
  try {
    const fhirBundle = transformer.transformAdtToFhir(mockHl7Message);
    console.log("Success! Generated FHIR R4 Bundle:");
    console.log(JSON.stringify(fhirBundle, null, 2));
  } catch (err) {
    console.error("Transformation Failed:", err);
  }
}

runTest();
