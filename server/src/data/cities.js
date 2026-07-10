export const cities = [
  { id: "BLR", name: "Bangalore", station: "Krantivira Sangolli Rayanna (SBC)" },
  { id: "BOM", name: "Mumbai", station: "Chhatrapati Shivaji Maharaj Terminus (CSMT)" },
  { id: "DEL", name: "Delhi", station: "New Delhi (NDLS)" },
  { id: "MAA", name: "Chennai", station: "Chennai Central (MAS)" },
];

export const cityById = Object.fromEntries(cities.map((c) => [c.id, c]));
