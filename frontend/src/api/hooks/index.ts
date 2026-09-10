import { useEffect, useState } from "react";
import api from "../index";
import { DroneGroup, LauncherGroup } from "../../types";

export const useGetAllDronesGroups = () => {
  const [dronesGroups, setDronesGroups] = useState<DroneGroup[]>([]);

  useEffect(() => {
    const fetchDronesGroups = async () => {
      api
        .dronesGroup()
        .getAllDronesGroups()
        .then((response) => {
          setDronesGroups(response.data);
        })
        .catch((error) => {
          console.log(error);
        });
    };
    fetchDronesGroups();
    console.log(dronesGroups)
  }, []);

  return { dronesGroups, setDronesGroups };
};

export const useGetAllLaunchersGroups = () => {
  const [launchersGroups, setLaunchersGroups] = useState<LauncherGroup[]>([]);

  useEffect(() => {
    const fetchLaunchersGroups = async () => {
      api
        .launchersGroup()
        .getAllLaunchersGroups()
        .then((response) => {
          setLaunchersGroups(response.data);
        })
        .catch((error) => {
          console.log(error);
        });
    };
    fetchLaunchersGroups();
  }, []);

  return { launchersGroups, setLaunchersGroups };
};

export const useGetAllScenarios = () => {
  const [scenarios, setScenarios] = useState<any>([]);

  useEffect(() => {
    const fetchScenarios = async () => {
      api
        .scenerios()
        .getAllScenerios()
        .then((response) => {
          setScenarios(response.data);
        })
        .catch((error) => {
          console.log(error);
        });
    };
    fetchScenarios();
  }, []);

  return { scenarios, setScenarios };
};