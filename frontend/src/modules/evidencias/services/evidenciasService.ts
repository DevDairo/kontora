import { apiClient } from "../../../shared/services/apiClient";
import type { ArchivoEvidenciaResponse } from "../types";

export function cargarEvidenciaPagoVenta(token: string, idPagoVenta: string, archivo: File) {
  const formData = new FormData();
  formData.append("archivo", archivo);

  return apiClient.post<ArchivoEvidenciaResponse>(
    `/evidencias/pagos-venta/${encodeURIComponent(idPagoVenta)}`,
    formData,
    { token },
  );
}
