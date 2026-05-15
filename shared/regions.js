export const REGIONS = [
  { id: "north-america", label: "North America", lat: 45.0, lng: -100.0 },
  { id: "south-america", label: "South America", lat: -15.0, lng: -60.0 },
  { id: "western-europe", label: "Western Europe", lat: 50.0, lng: 10.0 },
  { id: "eastern-europe", label: "Eastern Europe", lat: 52.0, lng: 30.0 },
  { id: "middle-east", label: "Middle East", lat: 26.0, lng: 45.0 },
  { id: "africa", label: "Africa", lat: 5.0, lng: 20.0 },
  { id: "south-asia", label: "South Asia", lat: 22.0, lng: 78.0 },
  { id: "east-asia", label: "East Asia", lat: 36.0, lng: 120.0 },
  { id: "southeast-asia", label: "Southeast Asia", lat: 5.0, lng: 110.0 },
  { id: "oceania", label: "Oceania", lat: -27.0, lng: 135.0 }
];

export const COUNTRY_TO_REGION = {
  US: "north-america",
  CA: "north-america",
  MX: "north-america",
  BR: "south-america",
  AR: "south-america",
  CO: "south-america",
  GB: "western-europe",
  DE: "western-europe",
  FR: "western-europe",
  ES: "western-europe",
  IT: "western-europe",
  NL: "western-europe",
  PL: "eastern-europe",
  UA: "eastern-europe",
  RO: "eastern-europe",
  SA: "middle-east",
  AE: "middle-east",
  IL: "middle-east",
  NG: "africa",
  ZA: "africa",
  KE: "africa",
  IN: "south-asia",
  PK: "south-asia",
  BD: "south-asia",
  CN: "east-asia",
  JP: "east-asia",
  KR: "east-asia",
  SG: "southeast-asia",
  ID: "southeast-asia",
  TH: "southeast-asia",
  AU: "oceania",
  NZ: "oceania"
};

export function getRegionById(regionId) {
  return REGIONS.find((region) => region.id === regionId) || REGIONS.find((region) => region.id === "western-europe");
}

export function createRegionEvent(regionId = "western-europe") {
  const region = getRegionById(regionId);
  return {
    region: region.id,
    label: region.label,
    lat: region.lat,
    lng: region.lng,
    timestamp: Date.now()
  };
}
