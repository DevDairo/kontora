import { apiClient } from "../../../shared/services/apiClient";
import type { RegistrarVentaRequest, VentaResponse } from "../types";

export function registrarVenta(token: string, request: RegistrarVentaRequest) {
  return apiClient.post<VentaResponse>("/ventas", JSON.stringify(request), { token });
}
