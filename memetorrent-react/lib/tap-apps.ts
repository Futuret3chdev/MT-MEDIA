export const TAP_APPS = [
  {
    id: "tap",
    name: "TAP",
    tag: "Play",
    desc: "Games, Rockets, and the TAP play layer. One login through this portal.",
  },
  {
    id: "tapshop",
    name: "TAPSHOP",
    tag: "Trade",
    desc: "Buy, sell, and trade items with $MT and Rockets. One login through this portal.",
  },
  {
    id: "tapmatch",
    name: "TAPMATCH",
    tag: "Work",
    desc: "Employees and employers connect — Fast Connect for short-term work, or long-term roles.",
  },
] as const;

export type TapAppId = (typeof TAP_APPS)[number]["id"];
export type AuthDestination = "mt" | TapAppId;
