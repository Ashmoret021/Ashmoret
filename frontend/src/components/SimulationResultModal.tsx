import React from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TargetIcon from '@mui/icons-material/TrackChanges';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import TimerIcon from '@mui/icons-material/Timer';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import './SimulationResultModal.css';

interface SimulationResultModalProps {
  open: boolean;
  onClose: () => void;
  interceptedCount: number;
  totalThreats: number;
  responseTimeSeconds?: number;
}

export const SimulationResultModal: React.FC<SimulationResultModalProps> = ({
  open,
  onClose,
  interceptedCount,
  totalThreats,
  responseTimeSeconds = 12.4,
}) => {
  const rawPercentage =
    totalThreats > 0 ? (interceptedCount / totalThreats) * 100 : 0;

  // Apply response time penalty multiplier
  let timeMultiplier = 1;
  if (responseTimeSeconds > 30) {
    timeMultiplier = 0.90;
  } else if (responseTimeSeconds > 20) {
    timeMultiplier = 0.95;
  }

  const percentage = Math.round(rawPercentage * timeMultiplier);

  // SVG Circular progress math
  const radius = 64;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        className: 'sim-result-paper',
      }}
    >
      {/* Header (RTL: Title + Icon on the Right, X Button on the Left) */}
      <Box className="sim-result-header">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TargetIcon sx={{ color: '#00b4ff', fontSize: 24 }} />
          <Typography className="sim-result-header-title" variant="h6">
            תוצאות הסימולטור
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        {/* Score Circle Gauge */}
        <Box className="sim-result-gauge-container">
          <Box className="sim-result-gauge-box">
            <svg width="160" height="160" viewBox="0 0 160 160">
              {/* Background circle track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="rgba(0, 120, 200, 0.2)"
                strokeWidth={strokeWidth}
              />
              {/* Foreground animated progress arc */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="url(#blueGlowGrad)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              />
              <defs>
                <linearGradient id="blueGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f0ff" />
                  <stop offset="100%" stopColor="#0072ff" />
                </linearGradient>
              </defs>
            </svg>

            {/* Score Text Overlay */}
            <Box className="sim-result-score-overlay">
              <Typography className="sim-result-score-num">
                {percentage}
              </Typography>
              <Typography className="sim-result-score-denom">
                /100
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Divider with Title */}
        <Box className="sim-result-divider-container">
          <Box className="sim-result-divider-line" />
          <Typography className="sim-result-divider-text">
            מפרט
          </Typography>
          <Box className="sim-result-divider-line" />
        </Box>

        {/* Metrics Table */}
        <Box className="sim-result-table-box">
          <Box className="sim-result-table-header">
            <Typography sx={{ color: '#60a5fa', fontSize: '13px', fontWeight: 600 }}>
              סוג מדד
            </Typography>
            <Typography sx={{ color: '#60a5fa', fontSize: '13px', fontWeight: 600 }}>
              תוצאה
            </Typography>
          </Box>

          {/* Row 1: Interceptor Efficiency */}
          <Box className="sim-result-table-row">
            <Box className="sim-result-row-label-box">
              <RocketLaunchIcon sx={{ color: '#38bdf8', fontSize: 20 }} />
              <Typography className="sim-result-row-label-text">
                יעילות מיירטים
              </Typography>
            </Box>
            <Typography className="sim-result-row-value">
              {percentage}%
            </Typography>
          </Box>

          {/* Row 2: Intercepted Drones */}
          <Box className="sim-result-table-row">
            <Box className="sim-result-row-label-box">
              <TargetIcon sx={{ color: '#38bdf8', fontSize: 20 }} />
              <Typography className="sim-result-row-label-text">
                איומים שורטו
              </Typography>
            </Box>
            <Typography className="sim-result-row-value">
              {interceptedCount}/{totalThreats}
            </Typography>
          </Box>

          {/* Row 3: Response Time */}
          <Box className="sim-result-table-row">
            <Box className="sim-result-row-label-box">
              <TimerIcon sx={{ color: '#38bdf8', fontSize: 20 }} />
              <Typography className="sim-result-row-label-text">
                זמן תגובה
              </Typography>
              <Box className="sim-result-status-badge">
                <CheckCircleOutlineIcon sx={{ color: '#10b981', fontSize: 14 }} />
                <Typography className="sim-result-status-text">
                  תקין
                </Typography>
              </Box>
            </Box>
            <Typography className="sim-result-row-value">
              {responseTimeSeconds}s
            </Typography>
          </Box>
        </Box>

        {/* Action Button */}
        <Box className="sim-result-button-container">
          <Button
            onClick={onClose}
            variant="contained"
            fullWidth
            className="sim-result-close-btn"
          >
            ✕ סגור
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
