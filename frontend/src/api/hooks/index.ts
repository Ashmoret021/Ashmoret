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
          setDronesGroups(response.data.data);
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
