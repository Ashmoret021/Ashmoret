import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { ScenerioCreationType } from "../types/types";
 
const axiosInstance = axios.create({
  baseURL: "http://localhost:3000",
});

export default {
    scenerios() {
        return {
            createScenerio: (data: ScenerioCreationType): Promise<AxiosResponse> => {
                return axiosInstance.post("/scenerios", data);
            }
        }
    },
    dronesGroup() {
        return {
            getAllDronesGroups: (): Promise<AxiosResponse> => {
                return axiosInstance.get("/drones-groups");
            }
        }
    },
    launchersGroup() {
        return {
            getAllLaunchersGroups: (): Promise<AxiosResponse> => {
                return axiosInstance.get("/launchers-groups");
            }
        }
    }
}