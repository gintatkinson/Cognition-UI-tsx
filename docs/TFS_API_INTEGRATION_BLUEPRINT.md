# TFS API Integration Blueprint: React GUI to GKE-Deployed TeraFlowSDN

This blueprint provides step-by-step, code-level instructions for integrating this React-based Dashboard with a TeraFlowSDN (TFS) controller deployed in the same Google Kubernetes Engine (GKE) cluster.

---

## 1. Architecture Overview

When both the GUI and TFS are in GKE:
- **GUI**: Deployed as a Pod/Service (or served via Nginx).
- **TFS**: A collection of microservices (Context, Device, Service, etc.).
- **Communication**: The GUI (browser-side) communicates with the **TFS Northbound (NB) API** via an Ingress or LoadBalancer.

---

## 2. Step 1: Authentication (Keycloak Integration)

TFS uses Keycloak. We use the `keycloak-js` library for the OIDC flow.

### Code Implementation (`src/lib/auth.ts`)

```typescript
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

export const initAuth = async () => {
  try {
    const authenticated = await keycloak.init({ 
      onLoad: 'check-sso',
      pkceMethod: 'S256' 
    });
    return authenticated;
  } catch (error) {
    console.error("Failed to initialize Keycloak", error);
    return false;
  }
};

export const getAuthToken = () => keycloak.token;
export default keycloak;
```

---

## 3. Step 2: API Client Setup (Axios + Interceptors)

Create a centralized client that automatically attaches the Keycloak token to every request.

### Code Implementation (`src/services/apiClient.ts`)

```typescript
import axios from 'axios';
import { getAuthToken } from '@/lib/auth';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_TFS_API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

---

## 4. Step 3: Service Layer Implementation

Map the TFS microservice endpoints to typed TypeScript functions.

### Example: Device Service (`src/services/deviceService.ts`)

```typescript
import apiClient from './apiClient';
import { Device } from '@/types';

export const deviceService = {
  // List all devices in a context
  getDevices: async (contextId: string): Promise<Device[]> => {
    const { data } = await apiClient.get(`/context/${contextId}/devices`);
    return data;
  },

  // Get specific device details
  getDevice: async (deviceId: string): Promise<Device> => {
    const { data } = await apiClient.get(`/device/${deviceId}`);
    return data;
  },

  // Onboard a new device
  onboardDevice: async (deviceData: Partial<Device>) => {
    const { data } = await apiClient.post('/device', deviceData);
    return data;
  }
};
```

---

## 5. Step 4: Data Fetching with React Query

Use `@tanstack/react-query` to manage server state, caching, and loading indicators.

### Code Implementation (`src/hooks/useDevices.ts`)

```typescript
import { useQuery } from '@tanstack/react-query';
import { deviceService } from '@/services/deviceService';

export function useDevices(contextId: string) {
  return useQuery({
    queryKey: ['devices', contextId],
    queryFn: () => deviceService.getDevices(contextId),
    enabled: !!contextId,
    refetchInterval: 10000, // Poll every 10s as fallback for WebSockets
  });
}
```

---

## 6. Step 5: Real-Time Updates (WebSockets)

TFS provides a stream of events. Use a custom hook to listen for topology changes.

### Code Implementation (`src/hooks/useTfsEvents.ts`)

```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useTfsEvents(contextId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const ws = new WebSocket(`${import.meta.env.VITE_TFS_WS_URL}/events?contextId=${contextId}`);

    ws.onmessage = (event) => {
      const { type, resourceId } = JSON.parse(event.data);
      // Invalidate specific cache keys based on event type
      if (type === 'DEVICE_EVENT') {
        queryClient.invalidateQueries({ queryKey: ['devices', contextId] });
      }
    };

    return () => ws.close();
  }, [contextId, queryClient]);
}
```

---

## 7. GKE Networking Checklist

To ensure the "Next to each other" deployment works:

1. **Internal DNS**: If the GUI is served from a Pod in the same namespace, you can use internal service names (e.g., `http://nb-service.tfs-namespace.svc.cluster.local`) for server-side calls.
2. **Ingress**: For browser-side calls, ensure the GKE Ingress has `add_header 'Access-Control-Allow-Origin' '*';` (or specific dashboard URL) configured.
3. **Environment Variables**:
   - `VITE_TFS_API_URL`: Public LoadBalancer IP or DNS.
   - `VITE_KEYCLOAK_URL`: Public Keycloak endpoint.

---

## 8. Integration Workflow (Example: Creating a Service)

1. **UI**: User fills out the Service form in `ServicesView`.
2. **Action**: `serviceService.createService(payload)` is called.
3. **Backend**: TFS Context service receives the request -> PathComp computes route -> Service service provisions.
4. **Update**: WebSocket sends `SERVICE_EVENT`, UI auto-refreshes via React Query invalidation.

---

## 9. Advanced Workflow: QKD Path Provisioning (ETSI GS QKD 018)

For QKD-specific connectivity, the integration follows the ETSI candidate path workflow.

### Code Implementation: Path Selection Hook (`src/hooks/useQkdPath.ts`)

```typescript
import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';

export function useQkdProvisioning(appId: string) {
  // 1. Fetch Candidate Paths
  const candidates = useQuery({
    queryKey: ['qkd-candidates', appId],
    queryFn: async () => {
      const { data } = await apiClient.post('/rpc/create-candidate-paths', { appId });
      return data.candidate_paths;
    },
    enabled: !!appId
  });

  // 2. Deploy Selected Path
  const deploy = useMutation({
    mutationFn: async (pathId: number) => {
      return apiClient.post('/rpc/deploy-candidate-path', { appId, pathId });
    }
  });

  return { candidates, deploy };
}
```

### UI Implementation Strategy:
- **Topology Overlay**: When `candidates.data` is available, render the `phys_links` array for each candidate path as highlighted SVG paths on the D3 canvas.
- **Path Comparison**: Use a `Table` to compare `skr` (Secret Key Rate) across different candidate paths before the user clicks "Deploy".

---

## 10. Inventory & Operational Control (ETSI GS QKD 018)

The inventory model allows for direct operational control of the QKD hardware.

### Code Implementation: Link Control (`src/hooks/useLinkControl.ts`)

```typescript
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';

export function useLinkControl(linkId: string) {
  // Toggle Key Generation
  const toggleGeneration = useMutation({
    mutationFn: async (enabled: boolean) => {
      return apiClient.patch(`/inventory/phys-link/${linkId}`, { enable: enabled });
    }
  });

  // Update Restoration Settings
  const updateRestoration = useMutation({
    mutationFn: async (settings: { type: 'AUTOMATIC' | 'MANUAL', holdOff: number }) => {
      return apiClient.patch(`/inventory/svc-link/${linkId}/restoration`, settings);
    }
  });

  return { toggleGeneration, updateRestoration };
}
```

### Key Inventory Data Points for UI:
- **KME Endpoint**: Display `KME_ip` and `KME_port` in the Node Detail view so applications know where to fetch keys.
- **Wavelength**: Show the operational wavelength (e.g., "1550nm") in the Physical Link properties.
- **Restoration Status**: Use a `Badge` to indicate if a service link is configured for `AUTOMATIC` or `MANUAL` restoration.
