import { apiClient } from "../../../shared/services/apiClient";
import type {
  ConsultaGastoCajaEvidencia,
  ConsultaMovimientoDepositoEvidencia,
} from "../types";

export type FiltroEvidencias = {
  fechaFin?: string;
  fechaInicio?: string;
};

function construirQuery(filtro: FiltroEvidencias, requiereFechaInicio = false) {
  const params = new URLSearchParams();

  if (filtro.fechaInicio) {
    params.set("fechaInicio", filtro.fechaInicio);
  } else if (requiereFechaInicio) {
    throw new Error("Selecciona una fecha inicial para consultar gastos.");
  }
  if (filtro.fechaFin) {
    params.set("fechaFin", filtro.fechaFin);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function consultarGastosConEvidencia(token: string, filtro: FiltroEvidencias) {
  return apiClient.get<ConsultaGastoCajaEvidencia[]>(
    `/consultas/gastos${construirQuery(filtro, true)}`,
    { token },
  );
}

export function consultarMovimientosDepositoConEvidencia(token: string, filtro: FiltroEvidencias) {
  return apiClient.get<ConsultaMovimientoDepositoEvidencia[]>(
    `/consultas/deposito/movimientos${construirQuery(filtro)}`,
    { token },
  );
}
