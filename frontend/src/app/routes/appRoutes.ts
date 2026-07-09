import {
  BadgeDollarSign,
  Boxes,
  ClipboardList,
  Database,
  FileCheck2,
  Landmark,
  LayoutDashboard,
  ListChecks,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import type { ComponentType } from "react";

export type UserRole = "vendedor" | "administrador" | "gerente";
export type RouteStatus = "base" | "pendiente";

export type AppRoute = {
  id: string;
  label: string;
  path: string;
  status: RouteStatus;
  description: string;
  endpoints: string[];
  roleDescriptions?: Partial<Record<UserRole, string>>;
  roleEndpoints?: Partial<Record<UserRole, string[]>>;
  roles: UserRole[];
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
};

export const roleLabels: Record<UserRole, string> = {
  vendedor: "Vendedor",
  administrador: "Administrador",
  gerente: "Gerente",
};

export const routeStatusLabels: Record<RouteStatus, string> = {
  base: "Base lista",
  pendiente: "Pantalla pendiente",
};

const allRoles: UserRole[] = ["vendedor", "administrador", "gerente"];
const adminRoles: UserRole[] = ["administrador", "gerente"];

export const appRoutes: AppRoute[] = [
  {
    id: "inicio",
    label: "Inicio",
    path: "/",
    status: "base",
    description: "Panel principal construido con la sesion confirmada por backend.",
    endpoints: ["GET /api/auth/me", "GET /api/health"],
    roles: allRoles,
    icon: LayoutDashboard,
  },
  {
    id: "ventas",
    label: "Ventas",
    path: "/ventas",
    status: "pendiente",
    description: "Registro de ventas y consulta operativa segun visibilidad del usuario autenticado.",
    endpoints: ["POST /api/ventas", "GET /api/consultas/ventas"],
    roles: allRoles,
    icon: BadgeDollarSign,
  },
  {
    id: "caja",
    label: "Caja",
    path: "/caja",
    status: "base",
    description: "Consulta de caja abierta y apertura para roles autorizados por backend.",
    endpoints: ["GET /api/cajas-diarias/abierta", "POST /api/cajas-diarias"],
    roleDescriptions: {
      vendedor: "Consulta de la caja abierta para la operacion diaria.",
      administrador: "Consulta y apertura de caja diaria validada por backend.",
      gerente: "Consulta y apertura de caja diaria validada por backend.",
    },
    roleEndpoints: {
      vendedor: ["GET /api/cajas-diarias/abierta"],
    },
    roles: allRoles,
    icon: WalletCards,
  },
  {
    id: "inventario",
    label: "Inventario",
    path: "/inventario",
    status: "pendiente",
    description: "Existencias actuales, stock diario y movimientos de inventario.",
    endpoints: [
      "GET /api/inventario/existencias/general",
      "GET /api/inventario/existencias/diarias/abierta",
      "POST /api/inventario/paquetes-vasos",
      "POST /api/inventario/consumos-diarios",
      "GET /api/inventario/movimientos",
      "GET /api/inventario/ajustes",
      "POST /api/inventario/ajustes",
      "POST /api/inventario/ajustes/{idAjusteInventario}/aprobar",
      "POST /api/inventario/ajustes/{idAjusteInventario}/rechazar",
    ],
    roleDescriptions: {
      vendedor: "Consulta de stock, movimientos y ajustes de inventario.",
      administrador: "Consulta de stock, apertura de paquetes, consumos manuales y solicitud de ajustes.",
      gerente: "Consulta de stock, apertura de paquetes, consumos manuales y aprobacion de ajustes.",
    },
    roleEndpoints: {
      vendedor: [
        "GET /api/inventario/existencias/general",
        "GET /api/inventario/existencias/diarias/abierta",
        "GET /api/inventario/movimientos",
        "GET /api/inventario/ajustes",
      ],
      administrador: [
        "GET /api/inventario/existencias/general",
        "GET /api/inventario/existencias/diarias/abierta",
        "POST /api/inventario/paquetes-vasos",
        "POST /api/inventario/consumos-diarios",
        "GET /api/inventario/movimientos",
        "GET /api/inventario/ajustes",
        "POST /api/inventario/ajustes",
      ],
    },
    roles: allRoles,
    icon: Boxes,
  },
  {
    id: "gastos",
    label: "Gastos",
    path: "/gastos",
    status: "pendiente",
    description: "Gastos de caja, adiciones diarias y pago a trabajadores segun rol.",
    endpoints: [
      "GET /api/operaciones-caja/gastos-caja/abierta",
      "POST /api/operaciones-caja/gastos-caja",
      "GET /api/consultas/gastos",
    ],
    roleEndpoints: {
      vendedor: [
        "GET /api/operaciones-caja/gastos-caja/abierta",
        "POST /api/operaciones-caja/gastos-caja",
        "GET /api/consultas/gastos",
      ],
      administrador: [
        "GET /api/operaciones-caja/gastos-caja/abierta",
        "PUT /api/operaciones-caja/gastos-caja/{idGastoCaja}",
        "POST /api/operaciones-caja/gastos-caja/{idGastoCaja}/anular",
        "POST /api/operaciones-caja/pagos-trabajadores-diarios",
      ],
      gerente: [
        "GET /api/operaciones-caja/gastos-caja/abierta",
        "PUT /api/operaciones-caja/gastos-caja/{idGastoCaja}",
        "POST /api/operaciones-caja/gastos-caja/{idGastoCaja}/anular",
        "POST /api/operaciones-caja/pagos-trabajadores-diarios",
      ],
    },
    roles: allRoles,
    icon: ReceiptText,
  },
  {
    id: "transferencias",
    label: "Transferencias",
    path: "/transferencias",
    status: "pendiente",
    description: "Seguimiento de transferencias y validacion para administrador o gerente.",
    endpoints: [
      "GET /api/consultas/transferencias",
      "POST /api/pagos-venta/{idPagoVenta}/validar",
      "POST /api/pagos-venta/{idPagoVenta}/rechazar",
    ],
    roleDescriptions: {
      vendedor: "Seguimiento de transferencias propias desde consultas operativas.",
      administrador: "Seguimiento y validacion de transferencias pendientes.",
      gerente: "Seguimiento y validacion de transferencias pendientes.",
    },
    roleEndpoints: {
      vendedor: ["GET /api/consultas/transferencias"],
    },
    roles: allRoles,
    icon: ListChecks,
  },
  {
    id: "evidencias",
    label: "Evidencias",
    path: "/evidencias",
    status: "pendiente",
    description: "Carga y consulta de soportes para pagos, gastos y procesos administrativos.",
    endpoints: ["POST /api/evidencias/...", "GET /api/evidencias/{idArchivoEvidencia}"],
    roleEndpoints: {
      vendedor: [
        "POST /api/evidencias/pagos-venta/{idPagoVenta}",
        "POST /api/evidencias/gastos-caja/{idGastoCaja}",
        "GET /api/evidencias/{idArchivoEvidencia}",
      ],
      administrador: [
        "POST /api/evidencias/pagos-venta/{idPagoVenta}",
        "POST /api/evidencias/gastos-caja/{idGastoCaja}",
        "POST /api/evidencias/consignaciones-bancarias/{idConsignacionBancaria}",
        "GET /api/evidencias/{idArchivoEvidencia}",
      ],
      gerente: [
        "POST /api/evidencias/pagos-venta/{idPagoVenta}",
        "POST /api/evidencias/gastos-caja/{idGastoCaja}",
        "POST /api/evidencias/consignaciones-bancarias/{idConsignacionBancaria}",
        "GET /api/evidencias/{idArchivoEvidencia}",
      ],
    },
    roles: allRoles,
    icon: ClipboardList,
  },
  {
    id: "catalogos",
    label: "Catalogos",
    path: "/catalogos",
    status: "base",
    description: "Catalogos activos usados por formularios operativos.",
    endpoints: [
      "GET /api/catalogos/metodos-pago",
      "GET /api/catalogos/tipos-granizado",
      "GET /api/catalogos/precios-granizado/vigentes",
      "GET /api/catalogos/promociones/vigentes",
      "GET /api/catalogos/items-inventario",
    ],
    roles: allRoles,
    icon: Database,
  },
  {
    id: "cierre",
    label: "Cierre",
    path: "/cierre",
    status: "pendiente",
    description: "Cierre de caja diaria y consulta del cierre registrado.",
    endpoints: ["POST /api/cajas-diarias/{idCajaDiaria}/cerrar", "GET /api/cajas-diarias/{idCajaDiaria}/cierre"],
    roles: adminRoles,
    icon: FileCheck2,
  },
  {
    id: "deposito",
    label: "Deposito",
    path: "/deposito",
    status: "pendiente",
    description: "Historial operativo de movimientos de deposito.",
    endpoints: ["GET /api/consultas/deposito/movimientos"],
    roles: adminRoles,
    icon: Landmark,
  },
  {
    id: "consultas",
    label: "Consultas",
    path: "/consultas",
    status: "pendiente",
    description: "Consultas operativas de solo lectura con filtros documentados.",
    endpoints: [
      "GET /api/consultas/ventas",
      "GET /api/consultas/gastos",
      "GET /api/consultas/inventario/actual",
    ],
    roles: allRoles,
    icon: ListChecks,
  },
  {
    id: "auditoria",
    label: "Auditoria",
    path: "/auditoria",
    status: "pendiente",
    description: "Consulta de auditoria operativa; el gerente conserva visibilidad completa.",
    endpoints: ["GET /api/consultas/auditoria"],
    roles: adminRoles,
    icon: ShieldCheck,
  },
];

export function normalizeRole(roleName: string): UserRole | null {
  const normalized = roleName.trim().toLowerCase();
  return allRoles.find((role) => role === normalized) ?? null;
}

export function getVisibleRoutes(roleName: string): AppRoute[] {
  const role = normalizeRole(roleName);

  if (!role) {
    return appRoutes.filter((route) => route.id === "inicio");
  }

  return appRoutes.filter((route) => route.roles.includes(role));
}

export function findRouteByPath(routes: AppRoute[], path: string): AppRoute | undefined {
  return routes.find((route) => route.path === path);
}

export function getRouteDescriptionForRole(route: AppRoute, role: UserRole | null): string {
  if (!role) {
    return route.description;
  }

  return route.roleDescriptions?.[role] ?? route.description;
}

export function getRouteEndpointsForRole(route: AppRoute, role: UserRole | null): string[] {
  if (!role) {
    return route.endpoints;
  }

  return route.roleEndpoints?.[role] ?? route.endpoints;
}
