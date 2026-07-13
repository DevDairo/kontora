import { apiClient } from "../../../shared/services/apiClient";
import type { RegistrarVentaRequest, TrabajadorVenta, VentaResponse } from "../types";

export function listarTrabajadoresVenta(token: string) {
  return apiClient.get<TrabajadorVenta[]>("/ventas/trabajadores", { token });
}

export function registrarVenta(token: string, request: RegistrarVentaRequest) {
  return apiClient.post<VentaResponse>("/ventas", JSON.stringify(request), { token });
}
