// Seed directory of suppliers / vendors / in-house manufacturing units.
// type: RAW_MATERIAL (raw material supplier), MANUFACTURING (external contract
// manufacturer), or BOTH.
export const seedVendors = [
  {
    id: "vnd-steel-co",
    name: "Bharat Steel & Alloys",
    type: "RAW_MATERIAL",
    contactEmail: "sales@bharatsteel.example.com",
    location: "Jamshedpur, IN",
    rating: 4.6,
  },
  {
    id: "vnd-poly-traders",
    name: "Poly Polymers Trading Co.",
    type: "RAW_MATERIAL",
    contactEmail: "orders@polypolymers.example.com",
    location: "Vadodara, IN",
    rating: 4.2,
  },
  {
    id: "vnd-global-metals",
    name: "Global Metals Sourcing Ltd.",
    type: "RAW_MATERIAL",
    contactEmail: "rfq@globalmetals.example.com",
    location: "Singapore",
    rating: 4.4,
  },
  {
    id: "vnd-precision-mfg",
    name: "Precision Contract Manufacturing",
    type: "MANUFACTURING",
    contactEmail: "quotes@precisionmfg.example.com",
    location: "Pune, IN",
    rating: 4.7,
  },
  {
    id: "vnd-eastline-mfg",
    name: "Eastline Manufacturing Partners",
    type: "MANUFACTURING",
    contactEmail: "biz@eastlinemfg.example.com",
    location: "Shenzhen, CN",
    rating: 4.3,
  },
  {
    id: "vnd-omni-industrial",
    name: "Omni Industrial Group",
    type: "BOTH",
    contactEmail: "contact@omniindustrial.example.com",
    location: "Chennai, IN",
    rating: 4.5,
  },
];
