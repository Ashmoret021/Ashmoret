import { useEffect, useState } from "react";
import api from "../index";

export const useGetAllDronesGroups = () => {
  const [dronesGroups, setDronesGroups] = useState<any>([]);

  useEffect(() => {
    const fetchDronesGroups = async () => {
      api
        .dronesGroup()
        .getAllDronesGroups()
        .then((response) => {
          setDronesGroups(response.data.data);
        })
        .catch((error) => {
          console.log(error);
        });
    };
    fetchDronesGroups();
  }, []);

  return { dronesGroups, setDronesGroups };
};

export const useGetAllLaunchersGroups = () => {
  const [launchersGroups, setLaunchersGroups] = useState<any>([]);

  useEffect(() => {
    const fetchLaunchersGroups = async () => {
      api
        .launchersGroup()
        .getAllLaunchersGroups()
        .then((response) => {
          setLaunchersGroups(response.data.data);
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
          setScenarios(response.data.data);
        })
        .catch((error) => {
          console.log(error);
        });
    };
    fetchScenarios();
  }, []);

  return { scenarios, setScenarios };
};