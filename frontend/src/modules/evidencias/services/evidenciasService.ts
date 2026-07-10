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

export function cargarEvidenciaConsignacionBancaria(token: string, idConsignacionBancaria: string, archivo: File) {
  const formData = new FormData();
  formData.append("archivo", archivo);

  return apiClient.post<ArchivoEvidenciaResponse>(
    `/evidencias/consignaciones-bancarias/${encodeURIComponent(idConsignacionBancaria)}`,
    formData,
    { token },
  );
}

export function cargarEvidenciaPagoServicio(token: string, idPagoServicio: string, archivo: File) {
  const formData = new FormData();
  formData.append("archivo", archivo);

  return apiClient.post<ArchivoEvidenciaResponse>(
    `/evidencias/pagos-servicios/${encodeURIComponent(idPagoServicio)}`,
    formData,
    { token },
  );
}
