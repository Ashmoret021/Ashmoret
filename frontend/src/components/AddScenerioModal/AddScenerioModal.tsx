import React, { FC, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Step,
  StepLabel,
  Stepper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  GeneralDetailsPage,
  DroneSelectionPage,
  LauncherSelectionPage,
} from "./ModalPages";

import api from "../../api";

export interface ModalPage {
  label: string;
  component: React.ReactNode;
}

interface AddScenerioModalProps {
  open: boolean;
  onClose: () => void;
}

export const MODAL_PAGES: ModalPage[] = [
  {
    label: "פרטים כלליים",
    component: <GeneralDetailsPage />,
  },
  {
    label: "בחירת רחפנים",
    component: <DroneSelectionPage />,
  },
  {
    label: "בחירת משגרים",
    component: <LauncherSelectionPage />,
  },
];

const STEP_LABELS = ["פרטים כלליים", "בחירת רחפנים", "בחירת משגרים"];

export const AddScenerioModal: FC<AddScenerioModalProps> = ({ open, onClose }) => {
  const [page, setPage] = useState(0);
  const [canMovePage, setCanMovePage] = useState(false);

  // Scenario Wizard State
  const [generalData, setGeneralData] = useState({
    scenarioName: "",
    scenarioType: "יחיד",
  });

  const [name, setName] = useState("");
  const [selectedDroneGroup, setSelectedDroneGroup] = useState(1);
  const [selectedLauncherGroup, setSelectedLauncherGroup] = useState(1);

  const handleNext = () => {
    if (page < STEP_LABELS.length - 1) {
      setPage((curr) => curr + 1);
    } else {
      api.scenerios().createScenerio({
        name: generalData.scenarioName,
        type: generalData.scenarioType,
        dronesGroupId: selectedDroneGroup,
        launchersGroupId: selectedLauncherGroup,
      });
      console.log("Scenario created!");
      handleClose();
    }
  };

  const handleBack = () => {
    if (page > 0) {
      setPage((curr) => curr - 1);
    }
  };

  const handleClose = () => {
    onClose();
    setPage(0);
    setName("");
    setCanMovePage(false);
  };

  return (
    <>
      {/* Main Modal Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            direction: "rtl",
            textAlign: "right",
            backgroundColor: "#1e293b",
            color: "#f8fafc",
            borderRadius: 3,
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          },
        }}
      >
        {/* Dialog Header */}
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            direction: "rtl",
            textAlign: "right",
            px: 3,
            pt: 2.5,
            pb: 1.5,
            fontWeight: 700,
            fontSize: "1.2rem",
          }}
        >
          יצירת תרחיש
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              color: "#94a3b8",
              "&:hover": { color: "#f8fafc" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        {/* Standard MUI Stepper (RTL) */}
        <Box sx={{ px: 3, py: 1.5, direction: "rtl" }}>
          <Stepper
            activeStep={page}
            sx={{
              direction: "rtl",
              "& .MuiStep-root": {
                direction: "rtl",
              },
              "& .MuiStepLabel-root": {
                direction: "rtl",
              },
              "& .MuiStepLabel-iconContainer": {
                paddingRight: 0,
                paddingLeft: "8px",
              },
              "& .MuiStepLabel-label": {
                color: "#64748b",
                fontSize: "0.85rem",
                textAlign: "right",
              },
              "& .MuiStepLabel-label.Mui-active": {
                color: "#38bdf8",
                fontWeight: 700,
              },
              "& .MuiStepLabel-label.Mui-completed": {
                color: "#22c55e",
                fontWeight: 600,
              },
              "& .MuiStepIcon-root": {
                color: "rgba(255, 255, 255, 0.2)",
              },
              "& .MuiStepIcon-root.Mui-active": {
                color: "#0284c7",
              },
              "& .MuiStepIcon-root.Mui-completed": {
                color: "#22c55e",
              },
              "& .MuiStepConnector-line": {
                borderColor: "rgba(255, 255, 255, 0.12)",
              },
            }}
          >
            {STEP_LABELS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)" }} />

        {/* Dialog Content */}
        <DialogContent sx={{ px: 3, py: 2.5, direction: "rtl", textAlign: "right" }}>
          {page === 0 && (
            <GeneralDetailsPage
              data={generalData}
              onChange={(updated) =>
                setGeneralData((prev) => ({ ...prev, ...updated }))
              }
              setCanMovePage={setCanMovePage}
              name={name}
              onNameChange={setName}
            />
          )}

          {page === 1 && (
            <DroneSelectionPage
              selectedGroup={selectedDroneGroup}
              onSelectGroup={(id) => setSelectedDroneGroup(id)}
            />
          )}

          {page === 2 && (
            <LauncherSelectionPage
              selectedGroup={+selectedLauncherGroup}
              onSelectGroup={(id) => setSelectedLauncherGroup(id)}
            />
          )}
        </DialogContent>

        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)" }} />

        {/* Dialog Actions */}
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            direction: "rtl",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Button onClick={handleClose} color="inherit" sx={{ color: "#94a3b8" }}>
            ביטול
          </Button>

          <Box sx={{ display: "flex", gap: 1.5, direction: "rtl" }}>
            {page > 0 && (
              <Button onClick={handleBack} color="inherit" sx={{ color: "#cbd5e1" }}>
                חזור
              </Button>
            )}

            <Button
              variant="contained"
              onClick={handleNext}
              sx={{
                bgcolor: "#0284c7",
                "&:hover": { bgcolor: "#0369a1" },
                px: 3,
                fontWeight: 600,
              }}
              disabled={!canMovePage}
            >
              {page === STEP_LABELS.length - 1 ? "יצירה" : "הבא"}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
};
