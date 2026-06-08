# TFS Deployment & Integration Standards for GKE

This document provides the necessary configuration standards for deploying the TeraFlowSDN (TFS) controller on Google Kubernetes Engine (GKE) to ensure seamless integration with the **TFS Controller Dashboard**.

## 1. Service Exposure (Networking)

The following TFS microservices must be exposed externally to allow the dashboard to communicate with them.

### A. Northbound API (REST/gRPC-web)
- **Service Name**: `nb-service`
- **Exposure Method**: Ingress (preferred) or LoadBalancer.
- **Protocol**: HTTPS (Port 443).
- **Requirement**: Must support `OPTIONS` requests for CORS preflight.

### B. WebSocket Stream
- **Exposure Method**: Must be accessible via the same Ingress or a dedicated LoadBalancer.
- **Requirement**: Support for long-lived TCP connections and WebSocket upgrades.

## 2. CORS Configuration

The TFS Northbound API must be configured to allow requests from the dashboard's domain.

- **Allowed Origins**: `https://<DASHBOARD_URL>` (Replace with the actual Cloud Run URL of the dashboard).
- **Allowed Methods**: `GET, POST, PUT, DELETE, OPTIONS`.
- **Allowed Headers**: `Content-Type, Authorization, X-Requested-With`.
- **Allow Credentials**: `true`.

## 3. Identity & Access Management (Keycloak)

TFS uses Keycloak for authentication. The following setup is required:

- **Realm**: `tfs` (or custom).
- **Client ID**: `tfs-dashboard`.
- **Access Type**: `public` (for PKCE flow) or `confidential`.
- **Valid Redirect URIs**: `https://<DASHBOARD_URL>/*`.
- **Web Origins**: `https://<DASHBOARD_URL>`.
- **Standard Flow Enabled**: `true`.

## 4. Required Output for Integration

After deployment, the following endpoints must be provided to be configured in the dashboard's environment variables:

1. `VITE_TFS_API_URL`: The public HTTPS URL of the Northbound API.
2. `VITE_TFS_WS_URL`: The public WSS URL for the WebSocket stream.
3. `VITE_KEYCLOAK_URL`: The public HTTPS URL of the Keycloak server.
4. `VITE_KEYCLOAK_REALM`: The name of the realm used.
5. `VITE_KEYCLOAK_CLIENT_ID`: The client ID created for the dashboard.

## 5. Security Note

Ensure that all external communication is encrypted via TLS. Self-signed certificates should be avoided for production-like environments to prevent browser security warnings in the dashboard.
