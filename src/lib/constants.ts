export const RESOURCES = [
  "customer",
  "subscription",
  "invoice",
  "payment",
  "paymentMethod",
  "product",
  "order",
  "report",
  "project",
] as const;

export const ACTIONS = ["create", "read", "update", "delete"] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];
