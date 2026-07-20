// Seed technical documents. Content strings intentionally embed
// extractable "Key: Value" facts so the AI metadata-extraction feature
// has real patterns to find, and enough prose so summarization is
// meaningfully different from the raw text.
export const documents = [
  {
    id: "DOC-2001",
    productId: "PRD-1001",
    name: "SNS-TEMP-100 Product Specification",
    type: "Specification",
    version: "1.3",
    uploadedBy: "Priya Menon",
    uploadedAt: "2026-03-01T09:00:00Z",
    content:
      "The SmartSense IoT Temperature Sensor (SNS-TEMP-100) is a wireless, battery-powered monitoring device intended for cold-chain logistics and warehouse environments. " +
      "It reports temperature readings over Bluetooth Low Energy 5.0 to a gateway hub every 60 seconds and stores up to 30 days of history locally when disconnected. " +
      "Material: Polycarbonate housing. Weight: 45g. Operating Temperature: -30C to 60C. Battery Life: 18 months typical usage. Revision: C. " +
      "Compliance Standard: IP67, CE, FCC Part 15. The sensor has passed drop testing from 1.5 meters onto concrete without loss of calibration. " +
      "Known limitation: BLE range drops significantly in metal-shelving warehouse environments, and customers have requested an extended-range antenna variant, which shipped separately as the Pro model.",
  },
  {
    id: "DOC-2002",
    productId: "PRD-1001",
    name: "SNS-TEMP-100 Compliance Certificate",
    type: "Compliance Certificate",
    version: "1.0",
    uploadedBy: "Carla Nunez",
    uploadedAt: "2023-03-20T09:00:00Z",
    content:
      "This certifies that the SmartSense IoT Temperature Sensor (SNS-TEMP-100) has been tested and found compliant with FCC Part 15 Subpart B, CE RED Directive 2014/53/EU, and IP67 ingress protection standards. " +
      "Compliance Standard: FCC Part 15, CE RED, IP67. Test Lab: Northbridge Compliance Labs. Certificate Valid Through: 2027-03-20. Revision: C.",
  },
  {
    id: "DOC-2003",
    productId: "PRD-1002",
    name: "SNS-TEMP-100P Product Specification",
    type: "Specification",
    version: "1.0",
    uploadedBy: "Priya Menon",
    uploadedAt: "2024-11-10T09:00:00Z",
    content:
      "The SmartSense IoT Temperature Sensor Pro (SNS-TEMP-100P) extends the base SNS-TEMP-100 platform with an added humidity sensor and a redesigned extended-range antenna. " +
      "Material: Polycarbonate housing. Weight: 48g. Operating Temperature: -30C to 60C. Battery Life: 15 months typical usage. Revision: A. " +
      "Compliance Standard: IP67, CE, FCC Part 15. This variant directly addresses customer feedback about BLE range limitations reported against the original sensor in dense warehouse racking.",
  },
  {
    id: "DOC-2004",
    productId: "PRD-1003",
    name: "AGX-PV-200 Engineering Drawing Notes",
    type: "Drawing",
    version: "D",
    uploadedBy: "Ethan Wright",
    uploadedAt: "2026-01-15T09:00:00Z",
    content:
      "Engineering drawing package for the Aegis Industrial Pressure Valve V2 (AGX-PV-200). " +
      "Material: 316 Stainless Steel. Weight: 1.8kg. Pressure Rating: 350 bar. Revision: D. Seal Type: PTFE O-ring. " +
      "Compliance Standard: ISO 4126, PED 2014/68/EU. Manufacturing tolerance +/-0.05mm on the seating face. " +
      "Field reports indicate seal wear after approximately 40,000 duty cycles under continuous high-pressure operation; a reinforced seal is under evaluation in the V2 Plus variant.",
  },
  {
    id: "DOC-2005",
    productId: "PRD-1004",
    name: "AGX-PV-200P Draft Specification",
    type: "Specification",
    version: "0.9",
    uploadedBy: "Ethan Wright",
    uploadedAt: "2026-06-10T09:00:00Z",
    content:
      "Draft specification for the Aegis Industrial Pressure Valve V2 Plus (AGX-PV-200P), currently in design review. " +
      "Material: 316 Stainless Steel. Weight: 1.9kg. Pressure Rating: 400 bar. Revision: A. Seal Type: Reinforced PTFE/Viton composite. " +
      "Compliance Standard: ISO 4126, PED 2014/68/EU (pending certification). Target duty cycle life: 100,000 cycles, roughly 2.5x the outgoing V2 seal life.",
  },
  {
    id: "DOC-2006",
    productId: "PRD-1005",
    name: "CFW-SYNC-300 Integration Guide",
    type: "User Manual",
    version: "5.2",
    uploadedBy: "Ethan Wright",
    uploadedAt: "2026-02-01T09:00:00Z",
    content:
      "The CoreFlow Inventory Sync Module (CFW-SYNC-300) is a middleware service that reconciles stock counts between ERP and warehouse management systems in near real time using a polling interval of 30 seconds. " +
      "Platform: Linux/Windows. License Model: Per-seat. Revision: 5.2. Supported ERP integrations: SAP, NetSuite, Dynamics 365. " +
      "The module replaces the legacy CFW-SYNC-200L, which lacks support for multi-warehouse routing and is being phased out. Customers on the legacy module should plan migration before its end-of-life date.",
  },
  {
    id: "DOC-2007",
    productId: "PRD-1006",
    name: "CFW-SYNC-200L Retirement Notice",
    type: "Specification",
    version: "4.1",
    uploadedBy: "Ethan Wright",
    uploadedAt: "2025-08-04T09:00:00Z",
    content:
      "The CoreFlow Inventory Sync Module Legacy (CFW-SYNC-200L) is being retired in favor of CFW-SYNC-300. " +
      "Platform: Windows only. License Model: Per-seat. Revision: 4.1. Support for this module ends at its end-of-life date; no further security patches will be issued afterward. " +
      "Owner assignment for the wind-down project is currently pending.",
  },
  {
    id: "DOC-2008",
    productId: "PRD-1009",
    name: "CHB-ADH-X200 Safety Data Sheet",
    type: "Compliance Certificate",
    version: "3",
    uploadedBy: "Carla Nunez",
    uploadedAt: "2026-02-01T09:00:00Z",
    content:
      "Safety data sheet for ChemBond Industrial Adhesive X200, a two-part epoxy structural adhesive. " +
      "Cure Time: 24h. VOC Content: 410 g/L. Revision: 3. Compliance Standard: REACH, EPA VOC limits. " +
      "This formulation currently exceeds the 350 g/L VOC threshold required for automotive assembly-line compliance in several jurisdictions; a reformulated variant (X200 RevB) has been developed to address this.",
  },
  {
    id: "DOC-2009",
    productId: "PRD-1010",
    name: "CHB-ADH-X200B Safety Data Sheet",
    type: "Compliance Certificate",
    version: "1",
    uploadedBy: "Carla Nunez",
    uploadedAt: "2026-06-01T09:00:00Z",
    content:
      "Safety data sheet for ChemBond Industrial Adhesive X200 RevB, a reformulated two-part epoxy structural adhesive with reduced solvent content. " +
      "Cure Time: 18h. VOC Content: 260 g/L. Revision: 1. Compliance Standard: REACH, EPA VOC limits. " +
      "Final compliance sign-off is still outstanding pending an updated third-party lab test; status remains non-compliant until certification is issued.",
  },
  {
    id: "DOC-2010",
    productId: "PRD-1011",
    name: "NVC-BAT-5000 Product Specification",
    type: "Specification",
    version: "F",
    uploadedBy: "Priya Menon",
    uploadedAt: "2026-01-05T09:00:00Z",
    content:
      "Product specification for the NovaCore Lithium Battery Pack 5000mAh. " +
      "Capacity: 5000mAh. Weight: 98g. Revision: F. Compliance Standard: UN38.3, IEC 62133. Cycle Life: 500 cycles to 80% capacity. " +
      "Includes integrated protection circuit against overcharge, overdischarge, and short circuit.",
  },
  {
    id: "DOC-2011",
    productId: "PRD-1013",
    name: "TTF-CHS-MK3 Machining Drawing",
    type: "Drawing",
    version: "3",
    uploadedBy: "Ethan Wright",
    uploadedAt: "2024-09-01T09:00:00Z",
    content:
      "CNC machining drawing for TitanFrame Aluminum Chassis Mk3. " +
      "Material: 6061-T6 Aluminum. Weight: 620g. Revision: 3. Finish: Type II anodize, matte black. " +
      "Compliance Standard: RoHS, REACH. No design changes have been logged against this drawing in over a year; recommend a lifecycle review to confirm the specification is still current.",
  },
  {
    id: "DOC-2012",
    productId: "PRD-1015",
    name: "VTG-DASH-FW Release Notes",
    type: "Specification",
    version: "2.9.1",
    uploadedBy: "Ethan Wright",
    uploadedAt: "2026-04-20T09:00:00Z",
    content:
      "Release notes for Vantage Analytics Dashboard Firmware version 2.9.1. " +
      "Platform: ARM Cortex-M7. Revision: 2.9.1. This release includes an OTA update fix and a memory leak identified in the chart-rendering module during extended uptime, which remains open in the tracker. " +
      "Compliance Standard: pending review for updated wireless module certification.",
  },
  {
    id: "DOC-2013",
    productId: "PRD-1017",
    name: "GRD-COAT-F7 Test Report",
    type: "Test Report",
    version: "2",
    uploadedBy: "Carla Nunez",
    uploadedAt: "2026-01-10T09:00:00Z",
    content:
      "Fire resistance test report for Guardian Fire-Retardant Coating F7 applied to structural steel I-beams. " +
      "Fire Rating: 90 min. VOC Content: 180 g/L. Revision: 2. Compliance Standard: ASTM E119, UL 263. " +
      "Coating maintained structural integrity for 94 minutes under standard time-temperature curve testing, exceeding the 90-minute target rating.",
  },
  {
    id: "DOC-2014",
    productId: "PRD-1021",
    name: "FLC-SRV-750 Field Reliability Report",
    type: "Test Report",
    version: "1",
    uploadedBy: "Ethan Wright",
    uploadedAt: "2025-11-01T09:00:00Z",
    content:
      "Field reliability report for the Falcon Servo Motor Drive Unit (FLC-SRV-750). " +
      "Power Rating: 750W. Weight: 3.2kg. Revision: C. Compliance Standard: IEC 60034. " +
      "Multiple field sites have reported thermal shutdown under sustained high-duty-cycle operation above 40C ambient; several units have been flagged for overheating and require a driver firmware or heat-sink revision.",
  },
];
