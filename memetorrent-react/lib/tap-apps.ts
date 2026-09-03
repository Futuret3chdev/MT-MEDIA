export const TAP_APPS = [
  {
    id: "tap",
    name: "TAP",
    tag: "Trips · Packages · Food",
    href: "/portal/tap",
    desc: "Rides, parcels, and food deliveries. Uber / Dasher / Panda style — not games.",
  },
  {
    id: "tapshop",
    name: "TAPSHOP",
    tag: "Trade",
    href: "/portal/tapshop",
    desc: "Buy, sell, and trade items with $MT and Rockets.",
  },
  {
    id: "tapmatch",
    name: "TAPMATCH",
    tag: "Work",
    href: "/portal/tapmatch",
    desc: "Employees and employers. Fast Connect or long-term. Staff preview is on the TAPMATCH desk.",
  },
] as const;

export type TapAppId = (typeof TAP_APPS)[number]["id"];
