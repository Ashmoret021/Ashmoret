export interface LatLng {
  lat: number;
  lng: number;
}

export interface ThreatSnapshot {
  id: string;
  type: string;
  position: LatLng;
  route: LatLng[];
  progress: number;
  engagementStatus?: "none" | "engaged";
}

export interface InterceptorInventoryItem {
  type: string;
  quantity: number;
}

export interface DefenseSystemSnapshot {
  id: string;
  type: string;
  position: LatLng;
  interceptorInventory: InterceptorInventoryItem[];
}

export interface ActiveInterceptorSnapshot {
  id: string;
  type: string;
  targetId: string;
  position: LatLng;
}

export interface ActiveEngagementInfo {
  threatId: string;
  interceptorId?: string;
  defenseSystemId?: string;
}

export interface WorldSnapshot {
  tickId: number;
  simulationTime: number;
  activeThreats: ThreatSnapshot[];
  defenseSystems: DefenseSystemSnapshot[];
  activeInterceptors: ActiveInterceptorSnapshot[];
  activeEngagements?: ActiveEngagementInfo[];
}

export interface EngagementDecision {
  defenseSystemId: string;
  interceptorType: string;
  targetId: string;
  result?: "success" | "failure";
}

export interface AlgorithmResponse {
  tickId: number;
  engagements: EngagementDecision[];
  status?: "ok" | "error";
  errorMessage?: string;
}

export interface StepRequestPayload {
  snapshot: WorldSnapshot;
}
