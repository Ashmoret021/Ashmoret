import axios from "axios";

interface LauncherRangeResponse {
  launcher_id: number;
  longitude: number;
  latitude: number;
  max_range_m: number;
}

export async function fetchLauncherRanges(
  groupId?: number,
): Promise<LauncherRange[]> {
  const response = await axios.get<LauncherRangeResponse[]>(
    "/api/launchers/range",
    {
      params: groupId !== undefined ? { launchers_group_id: groupId } : {},
    },
  );

  return response.data.map((l) => ({
    launcherId: l.launcher_id,
    longitude: l.longitude,
    latitude: l.latitude,
    maxRangeM: l.max_range_m,
  }));
}