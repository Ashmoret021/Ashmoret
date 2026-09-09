import { ComponentType, ReactNode } from "react";
import {
  DroneSelectionPage,
  GeneralDetailsPage,
  LauncherSelectionPage,
} from "./ModalPages";

export * from "./AddScenerioModal";
export * from "./ModalPages";

interface ModalPage {
  label: string;
  component: ReactNode;
}

export const MODAL_PAGES: ModalPage[] = [
  {
    label: "פרטים כלליים",
    component: GeneralDetailsPage(),
  },
  {
    label: "בחירת רחפנים",
    component: DroneSelectionPage(),
  },
  {
    label: "בחירת משגרים",
    component: LauncherSelectionPage(),
  },
];
