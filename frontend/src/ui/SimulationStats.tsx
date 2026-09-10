import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DangerousIcon from "@mui/icons-material/Dangerous";
import WifiIcon from "@mui/icons-material/Wifi";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useSimulation } from "../simulation/useSimulation";
import { algorithmClient } from "../algorithm/AlgorithmClient";

export interface SimulationStatsProps {
  isAlgorithmConnected?: boolean;
}

export const SimulationStats: React.FC<SimulationStatsProps> = () => {
  const { state } = useSimulation();
  const [isConnected, setIsConnected] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setIsConnected(algorithmClient.getIsAvailable());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const threatsList = Object.values(state.threats);
  const interceptorsList = Object.values(state.interceptors);

  const activeThreatsCount = threatsList.filter(
    (t) =>
      t.logicalStatus === "active" || t.logicalStatus === "interceptPending",
  ).length;

  const airborneInterceptorsCount = interceptorsList.filter(
    (i) => i.status === "flying",
  ).length;

  const interceptedCount = threatsList.filter(
    (t) => t.logicalStatus === "intercepted",
  ).length;

  const impactedCount = threatsList.filter(
    (t) => t.logicalStatus === "impacted",
  ).length;

  const stats = [
    {
      id: "active",
      label: "איומים פעילים",
      value: activeThreatsCount,
      color: "#f97316",
      bgColor: "rgba(249, 115, 22, 0.15)",
      icon: <WarningAmberIcon sx={{ color: "#f97316" }} />,
    },
    {
      id: "airborne",
      label: "מיירטים באוויר",
      value: airborneInterceptorsCount,
      color: "#38bdf8",
      bgColor: "rgba(56, 189, 248, 0.15)",
      icon: <FlightTakeoffIcon sx={{ color: "#38bdf8" }} />,
    },
    {
      id: "intercepted",
      label: "יורטו בהצלחה",
      value: interceptedCount,
      color: "#22c55e",
      bgColor: "rgba(34, 197, 94, 0.15)",
      icon: <CheckCircleIcon sx={{ color: "#22c55e" }} />,
    },
    {
      id: "impacted",
      label: "נפלו בשטח",
      value: impactedCount,
      color: "#ef4444",
      bgColor: "rgba(239, 68, 68, 0.15)",
      icon: <DangerousIcon sx={{ color: "#ef4444" }} />,
    },
  ];

  return (
    <Card
      elevation={8}
      dir="rtl"
      sx={{
        position: "relative",
        flex: "0 0 auto",
        zIndex: 1100,
        width: 252,
        backgroundColor: "rgba(15, 23, 42, 0.88)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        borderRadius: 3.5,
        color: "#ffffff",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
      }}
    >
      <CardContent
        sx={{ p: 1.5, "&:last-child": { pb: isExpanded ? 1.5 : 1 } }}
      >
        {/* Header & Connection Indicator */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            userSelect: "none",
          }}
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, color: "#f8fafc" }}
            >
              לוח סטטיסטיקות
            </Typography>
            <Tooltip title={isExpanded ? "מזער לוח" : "הרחב לוח"}>
              <IconButton size="small" sx={{ color: "#94a3b8", p: 0.25 }}>
                {isExpanded ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Box>

          <Chip
            icon={<WifiIcon sx={{ fontSize: 16 }} />}
            label={isConnected ? "מחובר" : "גיבוי"}
            size="small"
            color={isConnected ? "success" : "warning"}
            variant="outlined"
            sx={{
              fontWeight: 600,
              fontSize: "0.7rem",
              height: 24,
            }}
          />
        </Box>

        <Collapse in={isExpanded}>
          <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)", my: 1 }} />

          {/* Counter Items Grid */}
          <Stack spacing={0.75}>
            {stats.map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 2,
                  backgroundColor: item.bgColor,
                  border: `1px solid ${item.color}33`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {item.icon}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "#e2e8f0",
                      fontSize: "0.8rem",
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 800,
                    fontFamily: "monospace",
                    color: item.color,
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  );
};
