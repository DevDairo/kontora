import { apiClient } from "../../../shared/services/apiClient";
import type {
  ConsignacionBancaria,
  FiltroMovimientosDeposito,
  MovimientoDeposito,
  PagoServicio,
  RegistrarConsignacionBancariaRequest,
  RegistrarPagoServicioRequest,
  SaldoDeposito,
} from "../types";

function jsonBody<T>(payload: T) {
  return JSON.stringify(payload);
}

function movimientoQuery(filtro: FiltroMovimientosDeposito) {
  const params = new URLSearchParams();

  if (filtro.fechaInicio) {
    params.set("fechaInicio", filtro.fechaInicio);
  }
  if (filtro.fechaFin) {
    params.set("fechaFin", filtro.fechaFin);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function obtenerSaldoDeposito(token: string) {
  return apiClient.get<SaldoDeposito>("/deposito/saldo", { token });
}

export function consultarMovimientosDeposito(token: string, filtro: FiltroMovimientosDeposito = {}) {
  return apiClient.get<MovimientoDeposito[]>(`/consultas/deposito/movimientos${movimientoQuery(filtro)}`, { token });
}

export function registrarConsignacionBancaria(token: string, request: RegistrarConsignacionBancariaRequest) {
  return apiClient.post<ConsignacionBancaria>("/deposito/consignaciones-bancarias", jsonBody(request), { token });
}

export function registrarPagoServicio(token: string, request: RegistrarPagoServicioRequest) {
  return apiClient.post<PagoServicio>("/deposito/pagos-servicios", jsonBody(request), { token });
}
