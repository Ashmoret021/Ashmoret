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
          setDronesGroups(response.data);
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
