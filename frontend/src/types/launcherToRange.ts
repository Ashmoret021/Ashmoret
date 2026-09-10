import { LauncherType } from "./types";

export const launcherToRange = new Map<LauncherType, number>([
    [LauncherType.CloudFenceArea, 7],
    [LauncherType.HorizonEyeMX, 70],
    [LauncherType.IronHookSR, 30],
    [LauncherType.ShieldNestLite, 10],
]);