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

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed');
  }

  return payload?.data as T;
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
