const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export type DroneTypeRecord = {
  id: number;
  name: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? String((payload as { message?: string }).message)
        : 'Request failed';
    throw new Error(message || 'Request failed');
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

export async function getDroneTypes(): Promise<DroneTypeRecord[]> {
  return request<DroneTypeRecord[]>('/drone-types');
}

export async function getDronesGroups() {
  return request('/drones-groups');
}

export async function createDronesGroupWithDrones(payload: Record<string, unknown>) {
  return request('/drones-groups/with-drones', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateDronesGroupWithDrones(id: number, payload: Record<string, unknown>) {
  return request(`/drones-groups/${id}/with-drones`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function createDrone(payload: Record<string, unknown>) {
  return request('/drones', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAttackSides(scenarioId?: string) {
  const query = scenarioId ? `?scenario_id=${encodeURIComponent(scenarioId)}` : '';
  return request('/attack-sides' + query);
}

export async function getAttackSideById(id: number) {
  return request(`/attack-sides/${id}`);
}

export async function createAttackSide(payload: Record<string, unknown>) {
  return request('/attack-sides', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAttackSide(id: number, payload: Record<string, unknown>) {
  return request(`/attack-sides/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteAttackSide(id: number) {
  return request(`/attack-sides/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Create a launchers group + its launcher rows in one call. Mirrors
 * `createDronesGroupWithDrones` for the defense-side modal.
 */
export async function createLaunchersGroupWithLaunchers(payload: Record<string, unknown>) {
  return request('/launchers-groups/with-launchers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getLauncherTypes(): Promise<DroneTypeRecord[]> {
  return request<DroneTypeRecord[]>('/launcher-types');
}

export async function getInterceptorTypes(): Promise<DroneTypeRecord[]> {
  return request<DroneTypeRecord[]>('/interceptor-types');
}
