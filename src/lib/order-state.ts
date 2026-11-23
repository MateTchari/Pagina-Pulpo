import type { OrderStatus } from "@prisma/client";
export const labels: Record<OrderStatus, string> = {
  PENDING: "Pendiente de confirmación",
  CONFIRMED: "Confirmado",
  PREPARING: "En preparación",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};
export const transitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};
