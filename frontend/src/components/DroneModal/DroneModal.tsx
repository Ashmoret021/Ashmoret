import {
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import NavigationRoundedIcon from "@mui/icons-material/NavigationRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import MemoryRoundedIcon from "@mui/icons-material/MemoryRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";

import { Drone, DroneType } from "../../types/types";
import "./DroneModal.css";

type DroneModalProps = {
  drone: Drone;
  onClose: () => void;
  droneName: string;
  hebrewName: string;
  flightDistance: string | number;
  estimatedDamage: string;
};

const droneTypeNames: Record<DroneType, string> = {
  [DroneType.SkyMiteC7]: "SkyMite C7",
  [DroneType.LoadBeeM2]: "LoadBee M2",
  [DroneType.FalconLongX4]: "Falcon Long X4",
  [DroneType.NanoSwarmQ9]: "NanoSwarm Q9",
};

export default function DroneModal({
  drone,
  onClose,
  droneName,
  hebrewName,
  flightDistance,
  estimatedDamage,
}: DroneModalProps) {
  const commercialName = droneTypeNames[drone.type] || "לא ידוע";

  return (
    <Dialog
      open={true}
      onClose={onClose}
      hideBackdrop
      PaperProps={{
        className: "drone-dialog-glass",
      }}
    >
      {/* 
        sx={{ p: 0, overflow: 'visible' }} overrides MUI's default DialogContent 
        padding collapse when DialogTitle is omitted.
      */}
      <DialogContent 
        className="drone-dialog-content"
        sx={{ p: 0, overflow: "hidden" }}
      >
        {/* Header with status pulse indicator */}
        <Box className="modal-header">
          <Box className="header-info">
            <Box className="title-with-status">
              <span className="status-pulse-dot" />
              <Typography className="drone-title">{hebrewName}</Typography>
            </Box>
            <Typography className="drone-subtitle">{droneName}</Typography>
          </Box>

          <IconButton
            className="close-button"
            onClick={onClose}
            size="small"
            aria-label="סגור"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box className="drone-body">
          {/* Main Info Card */}
          <Box className="info-card">
            <Box className="info-row">
              <Box className="info-label-group">
                <MemoryRoundedIcon className="row-icon" />
                <Typography className="info-label">שם רחפן</Typography>
              </Box>
              <Typography className="info-value font-mono">{droneName}</Typography>
            </Box>

            <Box className="info-row">
              <Box className="info-label-group">
                <StorefrontRoundedIcon className="row-icon" />
                <Typography className="info-label">שם מסחרי</Typography>
              </Box>
              <Typography className="info-value">{commercialName}</Typography>
            </Box>

            <Box className="info-row">
              <Box className="info-label-group">
                <LanguageRoundedIcon className="row-icon" />
                <Typography className="info-label">שם בעברית</Typography>
              </Box>
              <Typography className="info-value accent-text">{hebrewName}</Typography>
            </Box>
          </Box>

          {/* Dynamic Telemetry Grid */}
          <Box className="status-grid">
            <Box className="status-card glow-cyan">
              <SpeedRoundedIcon className="status-icon cyan" />
              <Box className="status-text">
                <Typography className="status-label">מהירות טיסה</Typography>
                <Typography className="status-value">
                  {drone.velocity ? `${drone.velocity} קמ"ש` : "--"}
                </Typography>
              </Box>
            </Box>

            <Box className="status-card glow-blue">
              <NavigationRoundedIcon className="status-icon blue" />
              <Box className="status-text">
                <Typography className="status-label">מרחק טיסה</Typography>
                <Typography className="status-value">
                  {flightDistance}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Threat / Damage Assessment Banner */}
          <Box className="damage-card">
            <Box className="damage-header">
              <WarningRoundedIcon className="damage-icon" />
              <Typography className="damage-label">נזק משוער</Typography>
            </Box>
            <Typography className="damage-value">{estimatedDamage}</Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}