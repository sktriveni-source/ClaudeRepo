// Customer records from Salesforce (API) and NetSuite (Database). `segment`
// is intentionally left unset on most rows so the AI classification service
// has something real to do.
export const customers = [
  { id: "cus-001", sourceId: "src-salesforce", sourceRecordId: "SF-0031000001abcAA", name: "Northgate Retail Group Inc.", email: "purchasing@northgateretail.com", phone: "(555) 118-2200", addressLine1: "500 Commerce Plaza", city: "Chicago", state: "IL", postalCode: "60601", country: "US", lifetimeValue: 482000, segment: null, createdAt: "2019-04-02" },
  { id: "cus-002", sourceId: "src-netsuite", sourceRecordId: "NS-CUST-55210", name: "Northgate Retail Group", email: "purchasing@northgateretail.com", phone: null, addressLine1: "500 Commerce Plz", city: "Chicago", state: "IL", postalCode: null, country: "US", lifetimeValue: 479500, segment: null, createdAt: "2021-01-11" },

  { id: "cus-003", sourceId: "src-salesforce", sourceRecordId: "SF-0031000002defBB", name: "Jonathan Reyes", email: "jon.reyes@fastmail.com", phone: "(555) 771-0093", addressLine1: "14 Willow Ct", city: "Austin", state: "TX", postalCode: "78704", country: "US", lifetimeValue: 3400, segment: null, createdAt: "2023-08-14" },
  { id: "cus-004", sourceId: "src-netsuite", sourceRecordId: "NS-CUST-55244", name: "Jon Reyes", email: "jon.reyes@fastmail.com", phone: "555-771-0093", addressLine1: null, city: null, state: null, postalCode: null, country: null, lifetimeValue: 3400, segment: null, createdAt: "2024-01-05" },

  { id: "cus-005", sourceId: "src-salesforce", sourceRecordId: "SF-0031000003ghiCC", name: "Meadowbrook School District", email: "procurement@meadowbrookisd.edu", phone: "(555) 209-4471", addressLine1: "1 Administration Dr", city: "Rochester", state: "NY", postalCode: "14604", country: "US", lifetimeValue: 128900, segment: null, createdAt: "2020-06-19" },

  { id: "cus-006", sourceId: "src-netsuite", sourceRecordId: "NS-CUST-55290", name: "Priya Natarajan", email: "priya.n@outlook.com", phone: "(555) 663-8820", addressLine1: "220 Birchwood Ave", city: "San Jose", state: "CA", postalCode: "95112", country: "US", lifetimeValue: 5100, segment: null, createdAt: "2022-11-30" },

  { id: "cus-007", sourceId: "src-salesforce", sourceRecordId: "SF-0031000004jklDD", name: "Union Pacific Hardware Co", email: "ap@unionpachardware.com", phone: "(555) 340-7712", addressLine1: "77 Rail Yard Rd", city: "Omaha", state: "NE", postalCode: "68102", country: "US", lifetimeValue: 941000, segment: null, createdAt: "2016-02-08" },

  { id: "cus-008", sourceId: "src-netsuite", sourceRecordId: "NS-CUST-55318", name: "Union Pacific Hardware Company", email: "ap@unionpachardware.com", phone: "(555) 340-7712", addressLine1: "77 Rail Yard Road", city: "Omaha", state: "NE", postalCode: "68102", country: "US", lifetimeValue: 4500000, segment: null, createdAt: "2024-07-01" },

  { id: "cus-009", sourceId: "src-salesforce", sourceRecordId: "SF-0031000005mnoEE", name: "Diego Fernandez", email: null, phone: "(555) 442-1187", addressLine1: "9 Maple St", city: "Tampa", state: "FL", postalCode: "33602", country: "US", lifetimeValue: 2100, segment: null, createdAt: "2023-03-27" },

  { id: "cus-010", sourceId: "src-netsuite", sourceRecordId: "NS-CUST-55350", name: "Bay Area Coffee Roasters LLC", email: "orders@bayareacoffee.com", phone: "(555) 990-4423", addressLine1: "30 Roastery Ln", city: "Oakland", state: "CA", postalCode: "94612", country: "US", lifetimeValue: 61200, segment: null, createdAt: "2021-09-13" },

  { id: "cus-011", sourceId: "src-salesforce", sourceRecordId: "SF-0031000006pqrFF", name: "Halcyon Biotech Research", email: "finance@halcyonbio.com", phone: "(555) 118-6620", addressLine1: "410 Innovation Pkwy", city: "Cambridge", state: "MA", postalCode: "02139", country: "US", lifetimeValue: 1250000, segment: null, createdAt: "2018-10-02" },

  { id: "cus-012", sourceId: "src-netsuite", sourceRecordId: "NS-CUST-55402", name: "Marisol Ibarra", email: "marisol.ibarra@gmail.com", phone: null, addressLine1: "88 Sunset Ter", city: "Phoenix", state: "AZ", postalCode: "85004", country: "US", lifetimeValue: 890, segment: null, createdAt: "2024-05-19" },

  { id: "cus-013", sourceId: "src-salesforce", sourceRecordId: "SF-0031000007stuGG", name: "Redwood Family Dental PC", email: "billing@redwooddental.com", phone: "(555) 227-9013", addressLine1: "5 Clinic Sq", city: "Sacramento", state: "CA", postalCode: "95814", country: "US", lifetimeValue: 34500, segment: null, createdAt: "2020-01-22" },

  { id: "cus-014", sourceId: "src-netsuite", sourceRecordId: "NS-CUST-55440", name: "Tobias Lindqvist", email: "tobias.l@proton.me", phone: "(555) 664-2201", addressLine1: "17 Harbor View", city: "Seattle", state: "WA", postalCode: "98101", country: "US", lifetimeValue: 1800, segment: null, createdAt: "2023-12-08" },

  { id: "cus-015", sourceId: "src-salesforce", sourceRecordId: "SF-0031000008vwxHH", name: "Crestline Auto Parts Inc.", email: "purchasing@crestlineauto.com", phone: "(555) 809-3345", addressLine1: "600 Distribution Way", city: "Memphis", state: "TN", postalCode: "38103", country: "US", lifetimeValue: 217600, segment: null, createdAt: "2019-07-30" },

  { id: "cus-016", sourceId: "src-netsuite", sourceRecordId: "NS-CUST-55475", name: "Crestline Auto Parts", email: "purchasing@crestlineauto.com", phone: "555-809-3345", addressLine1: "600 Distribution Way", city: "Memphis", state: "TN", postalCode: null, country: "US", lifetimeValue: 217600, segment: null, createdAt: "2025-02-14" },

  { id: "cus-017", sourceId: "src-salesforce", sourceRecordId: "SF-0031000009yzaII", name: "Amara Okafor", email: "amara.okafor@yahoo.com", phone: "(555) 331-8845", addressLine1: "44 Elm Grove", city: "Atlanta", state: "GA", postalCode: "30303", country: "US", lifetimeValue: 4200, segment: null, createdAt: "2022-04-11" },

  { id: "cus-018", sourceId: "src-netsuite", sourceRecordId: "NS-CUST-55510", name: "Lakeside Municipal Utilities", email: "ap@lakesideutilities.gov", phone: "(555) 118-0022", addressLine1: "1 Civic Center Dr", city: "Madison", state: "WI", postalCode: "53703", country: "US", lifetimeValue: 356000, segment: null, createdAt: "2017-11-06" },
];
