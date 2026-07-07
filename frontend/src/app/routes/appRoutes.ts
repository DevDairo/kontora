import {
  BadgeDollarSign,
  Boxes,
  ClipboardList,
  Database,
  FileCheck2,
  LayoutDashboard,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import type { ComponentType } from "react";

export type AppRoute = {
  label: string;
  path: string;
  status: "activo" | "pendiente";
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
};

export const appRoutes: AppRoute[] = [
  { label: "Inicio", path: "/", status: "activo", icon: LayoutDashboard },
  { label: "Autenticacion", path: "/auth", status: "pendiente", icon: LockKeyhole },
  { label: "Caja", path: "/caja", status: "pendiente", icon: WalletCards },
  { label: "Catalogos", path: "/catalogos", status: "pendiente", icon: Database },
  { label: "Ventas", path: "/ventas", status: "pendiente", icon: BadgeDollarSign },
  { label: "Inventario", path: "/inventario", status: "pendiente", icon: Boxes },
  { label: "Gastos", path: "/gastos", status: "pendiente", icon: ReceiptText },
  { label: "Deposito", path: "/deposito", status: "pendiente", icon: FileCheck2 },
  { label: "Evidencias", path: "/evidencias", status: "pendiente", icon: ClipboardList },
  { label: "Auditoria", path: "/auditoria", status: "pendiente", icon: ShieldCheck },
];
