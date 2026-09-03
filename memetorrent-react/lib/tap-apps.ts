export const TAP_APPS = [
  {
    id: "tap",
    name: "TAP",
    tag: "Go",
    href: "/portal/tap",
    desc: "Trips, packages, and food deliveries — rides, drop-offs, and Dasher-style runs.",
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
    desc: "Employees and employers connect — Fast Connect for short-term work, or long-term roles.",
  },
] as const;

export type TapAppId = (typeof TAP_APPS)[number]["id"];
