export const products = [
  { sku: "WIN-JACKET-001", name: "ArcticShell Winter Jacket", category: "winter apparel", season: "autumn/winter", price: 249, margin: "high" },
  { sku: "WIN-BOOT-011", name: "NordGrip Winter Boots", category: "winter sports", season: "autumn/winter", price: 179, margin: "high" },
  { sku: "SKI-GLOVE-042", name: "ThermoTrail Ski Gloves", category: "winter sports", season: "autumn/winter", price: 69, margin: "medium" },
  { sku: "HIKE-BOOT-210", name: "WetRock Hiking Boots", category: "hiking", season: "spring/summer", price: 159, margin: "high" },
  { sku: "CAMP-TENT-034", name: "BalticLight 2P Tent", category: "camping", season: "spring/summer", price: 229, margin: "high" },
  { sku: "CAMP-STOVE-088", name: "TrailCup Stove Kit", category: "camping", season: "spring/summer", price: 89, margin: "medium" },
  { sku: "BIKE-HELM-120", name: "AeroSafe Cycling Helmet", category: "cycling", season: "spring/summer", price: 119, margin: "medium" },
  { sku: "RUN-SHOE-317", name: "GravelRun Trail Shoes", category: "running", season: "spring/summer", price: 139, margin: "medium" },
  { sku: "BASE-LAYER-012", name: "Merino Base Layer", category: "accessories", season: "all-season", price: 79, margin: "high" },
  { sku: "DRY-BAG-070", name: "StormPack Dry Bag", category: "accessories", season: "all-season", price: 39, margin: "medium" }
];

export const customers = [
  { id: "C-1001", country: "FI", ltv: 620, lastPurchaseDays: 46, orders: ["WIN-JACKET-001", "WIN-BOOT-011", "BASE-LAYER-012"] },
  { id: "C-1002", country: "FI", ltv: 185, lastPurchaseDays: 22, orders: ["HIKE-BOOT-210", "DRY-BAG-070"] },
  { id: "C-1003", country: "EE", ltv: 88, lastPurchaseDays: 210, orders: ["CAMP-STOVE-088"] },
  { id: "C-1004", country: "FI", ltv: 740, lastPurchaseDays: 17, orders: ["CAMP-TENT-034", "HIKE-BOOT-210", "DRY-BAG-070", "BASE-LAYER-012"] },
  { id: "C-1005", country: "LV", ltv: 129, lastPurchaseDays: 71, orders: ["BIKE-HELM-120"] },
  { id: "C-1006", country: "FI", ltv: 305, lastPurchaseDays: 15, orders: ["RUN-SHOE-317", "DRY-BAG-070", "BASE-LAYER-012"] },
  { id: "C-1007", country: "LT", ltv: 515, lastPurchaseDays: 365, orders: ["WIN-JACKET-001", "SKI-GLOVE-042", "WIN-BOOT-011"] },
  { id: "C-1008", country: "FI", ltv: 92, lastPurchaseDays: 9, orders: ["CAMP-STOVE-088"] },
  { id: "C-1009", country: "EE", ltv: 452, lastPurchaseDays: 34, orders: ["BIKE-HELM-120", "RUN-SHOE-317", "DRY-BAG-070"] },
  { id: "C-1010", country: "FI", ltv: 388, lastPurchaseDays: 155, orders: ["HIKE-BOOT-210", "CAMP-TENT-034"] },
  { id: "C-1011", country: "FI", ltv: 71, lastPurchaseDays: 14, orders: ["BASE-LAYER-012"] },
  { id: "C-1012", country: "LV", ltv: 836, lastPurchaseDays: 91, orders: ["WIN-JACKET-001", "HIKE-BOOT-210", "CAMP-TENT-034", "BIKE-HELM-120"] },
  { id: "C-1013", country: "FI", ltv: 268, lastPurchaseDays: 260, orders: ["RUN-SHOE-317", "BIKE-HELM-120"] },
  { id: "C-1014", country: "EE", ltv: 602, lastPurchaseDays: 41, orders: ["CAMP-TENT-034", "CAMP-STOVE-088", "DRY-BAG-070"] },
  { id: "C-1015", country: "FI", ltv: 219, lastPurchaseDays: 25, orders: ["SKI-GLOVE-042", "BASE-LAYER-012"] },
  { id: "C-1016", country: "LT", ltv: 132, lastPurchaseDays: 5, orders: ["HIKE-BOOT-210"] },
  { id: "C-1017", country: "FI", ltv: 489, lastPurchaseDays: 198, orders: ["WIN-BOOT-011", "BASE-LAYER-012"] },
  { id: "C-1018", country: "FI", ltv: 910, lastPurchaseDays: 63, orders: ["WIN-JACKET-001", "CAMP-TENT-034", "BIKE-HELM-120", "RUN-SHOE-317", "DRY-BAG-070"] }
];
