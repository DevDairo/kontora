package com.kontora.pos.evidencias.storage;

import com.kontora.pos.common.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.stream.Collectors;

@Component
public class SupabaseStorageClient implements EvidenciaStorageClient {

    private final SupabaseStorageProperties properties;
    private final HttpClient httpClient;

    public SupabaseStorageClient(SupabaseStorageProperties properties) {
        this.properties = properties;
        this.httpClient = HttpClient.newHttpClient();
    }

    @Override
    public ArchivoAlmacenado subir(String rutaArchivo, String contentType, byte[] contenido) {
        validarConfiguracion();
        String bucket = properties.getBucket().trim();
        String serviceRoleKey = properties.getServiceRoleKey().trim();
        URI uri = URI.create(storageApiBaseUrl() + "/object/" + encode(bucket) + "/" + encodePath(rutaArchivo));

        HttpRequest request = HttpRequest.newBuilder(uri)
                .header("Authorization", "Bearer " + serviceRoleKey)
                .header("apikey", serviceRoleKey)
                .header("Content-Type", contentType)
                .header("x-upsert", "false")
                .POST(HttpRequest.BodyPublishers.ofByteArray(contenido))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Supabase Storage rechazo la carga de evidencia");
            }
            return new ArchivoAlmacenado("supabase://" + bucket + "/" + rutaArchivo);
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "No fue posible conectar con Supabase Storage");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Carga de evidencia interrumpida");
        }
    }

    private void validarConfiguracion() {
        if (isBlank(properties.getUrl()) || isBlank(properties.getServiceRoleKey()) || isBlank(properties.getBucket())) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Supabase Storage no esta configurado");
        }
    }

    private String storageApiBaseUrl() {
        String baseUrl = properties.getUrl().trim();
        while (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        if (baseUrl.endsWith("/storage/v1")) {
            return baseUrl;
        }
        return baseUrl + "/storage/v1";
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String encodePath(String path) {
        return Arrays.stream(path.split("/"))
                .map(this::encode)
                .collect(Collectors.joining("/"));
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8)
                .replace("+", "%20");
    }
}
