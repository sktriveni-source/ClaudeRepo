// Product master data from two catalogs. Inconsistent category casing/units
// and a couple of price outliers give the profiling/anomaly engines signal.
export const products = [
  { id: "prd-001", sourceId: "src-product-db", sourceRecordId: "PDB-10001", sku: "FST-HEX-0025", name: "Hex Bolt 1/4in Grade 8", category: "Fasteners", unit: "EA", unitPrice: 0.42, description: "1/4-20 x 1in zinc-plated hex bolt, grade 8", createdAt: "2020-01-10" },
  { id: "prd-002", sourceId: "src-shopify-api", sourceRecordId: "SHOP-99881", sku: "FST-HEX-0025", name: "1/4in Grade 8 Hex Bolt", category: "fasteners", unit: "Each", unitPrice: 0.45, description: "1/4-20 x 1in zinc-plated hex bolt, grade 8", createdAt: "2023-06-01" },

  { id: "prd-003", sourceId: "src-product-db", sourceRecordId: "PDB-10014", sku: "PKG-BOX-0110", name: "Corrugated Shipping Box 12x12x12", category: "Packaging", unit: "EA", unitPrice: 1.15, description: "200lb test double-wall corrugated box", createdAt: "2019-08-22" },

  { id: "prd-004", sourceId: "src-shopify-api", sourceRecordId: "SHOP-99902", sku: "PKG-TAPE-2200", name: "Packing Tape 2in x 110yd", category: "PACKAGING", unit: "roll", unitPrice: 3.29, description: null, createdAt: "2024-02-14" },

  { id: "prd-005", sourceId: "src-product-db", sourceRecordId: "PDB-10077", sku: "ELE-CBL-5010", name: "Cat6 Ethernet Cable 50ft", category: "Electronics", unit: "EA", unitPrice: 12.99, description: "Shielded Cat6 cable, 50ft, blue", createdAt: "2021-03-30" },
  { id: "prd-006", sourceId: "src-shopify-api", sourceRecordId: "SHOP-99944", sku: "ELE-CBL-5010", name: "50ft Cat 6 Cable (Shielded)", category: "electronics", unit: "pcs", unitPrice: 999.00, description: "Shielded Cat6 cable, 50ft, blue", createdAt: "2025-01-09" },

  { id: "prd-007", sourceId: "src-product-db", sourceRecordId: "PDB-10102", sku: "CHM-SOLV-3301", name: "Industrial Degreaser Solvent 5gal", category: "Chemicals", unit: "PAIL", unitPrice: 48.50, description: "Heavy-duty industrial degreaser, 5-gallon pail", createdAt: "2018-12-01" },

  { id: "prd-008", sourceId: "src-shopify-api", sourceRecordId: "SHOP-99977", sku: "OFC-PPR-A400", name: "Copy Paper 8.5x11 Case", category: "Office Supplies", unit: "Case", unitPrice: 34.99, description: "20lb copy paper, 10 reams per case", createdAt: "2022-09-17" },

  { id: "prd-009", sourceId: "src-product-db", sourceRecordId: "PDB-10133", sku: "TXT-COT-1120", name: "Cotton Canvas Roll 60in", category: "Textiles", unit: "YD", unitPrice: 4.10, description: null, createdAt: "2020-05-05" },

  { id: "prd-010", sourceId: "src-shopify-api", sourceRecordId: "SHOP-99988", sku: "TXT-COT-1120", name: "60in Cotton Canvas (Roll)", category: "textiles", unit: "yard", unitPrice: 4.10, description: "12oz cotton canvas, 60in width", createdAt: "2024-11-20" },

  { id: "prd-011", sourceId: "src-product-db", sourceRecordId: "PDB-10144", sku: "IND-COAT-7701", name: "Epoxy Floor Coating 1gal", category: "Coatings", unit: "GAL", unitPrice: 62.00, description: "Two-part epoxy floor coating, gray", createdAt: "2019-02-28" },

  { id: "prd-012", sourceId: "src-shopify-api", sourceRecordId: "SHOP-99999", sku: "REN-PNL-9001", name: "Solar Panel 400W Monocrystalline", category: "Renewable Energy", unit: "EA", unitPrice: 189.00, description: "400W mono solar panel", createdAt: "2023-04-19" },

  { id: "prd-013", sourceId: "src-product-db", sourceRecordId: "PDB-10199", sku: "FST-NUT-0088", name: "Hex Nut 1/4-20 Zinc", category: "Fasteners", unit: "EA", unitPrice: 0.08, description: "1/4-20 zinc-plated hex nut", createdAt: "2020-01-10" },

  { id: "prd-014", sourceId: "src-shopify-api", sourceRecordId: "SHOP-100010", sku: "LOG-PALT-4048", name: "Standard Wood Pallet 48x40", category: "logistics", unit: "EA", unitPrice: 14.75, description: null, createdAt: "2022-01-08" },
];
