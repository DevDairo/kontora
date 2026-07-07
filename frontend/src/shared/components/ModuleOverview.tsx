import {
  BadgeDollarSign,
  Boxes,
  ClipboardList,
  FileCheck2,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import type { ComponentType } from "react";

type ModuleCard = {
  title: string;
  endpoint: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
};

const modules: ModuleCard[] = [
  { title: "Autenticacion", endpoint: "POST /api/auth/login", icon: LockKeyhole },
  { title: "Caja diaria", endpoint: "GET /api/cajas-diarias/abierta", icon: WalletCards },
  { title: "Ventas y pagos", endpoint: "POST /api/ventas", icon: BadgeDollarSign },
  { title: "Inventario", endpoint: "GET /api/inventario/existencias/general", icon: Boxes },
  { title: "Gastos", endpoint: "GET /api/operaciones-caja/gastos-caja/abierta", icon: ReceiptText },
  { title: "Cierre y deposito", endpoint: "GET /api/cajas-diarias/{id}/cierre", icon: FileCheck2 },
  { title: "Evidencias", endpoint: "POST /api/evidencias/...", icon: ClipboardList },
  { title: "Auditoria", endpoint: "GET /api/consultas/auditoria", icon: ShieldCheck },
];

export function ModuleOverview() {
  return (
    <article className="panel">
      <div className="panel-title">
        <div>
          <h2>Modulos frontend</h2>
          <p>Orden base de Fase 4</p>
        </div>
        <span className="badge">PR 1</span>
      </div>

      <div className="module-grid">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <div className="metric-card" key={module.title}>
              <div className="metric-icon">
                <Icon size={19} strokeWidth={2.2} />
              </div>
              <div>
                <h3>{module.title}</h3>
                <span>Pendiente</span>
              </div>
              <p>{module.endpoint}</p>
            </div>
          );
        })}
      </div>
    </article>
  );
}
