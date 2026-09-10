import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Slider,
  Tooltip,
  Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
import { useSimulation } from '../simulation/useSimulation';
import type { SpeedMultiplier } from '../simulation/SimulationContext';

function formatSimulationTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 100);
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  const ms = String(millis).padStart(2, '0');
  return `T+ ${mm}:${ss}.${ms}`;
}

const SPEED_OPTIONS: SpeedMultiplier[] = [1, 2, 5, 10];

export const SimulationControls: React.FC<{ onRestart?: () => void }> = ({ onRestart }) => {
  const {
    state,
    startClock,
    pauseClock,
    resumeClock,
    stopClock,
    setSpeed,
    seekToTime,
    setState,
  } = useSimulation();

  const hasScenario =
    Object.keys(state.threats).length > 0 ||
    Object.keys(state.launchers).length > 0;

  if (!hasScenario) {
    return null;
  }

  const isRunning = state.status === 'running';
  const isPaused = state.status === 'paused';
  const isFinished = state.status === 'finished';

  const handlePlayPause = () => {
    if (isRunning) {
      pauseClock();
    } else if (isFinished) {
      handleRestart();
    } else if (isPaused) {
      resumeClock();
    } else {
      startClock();
    }
  };

  const handleRestart = () => {
    if (onRestart) {
      onRestart();
      startClock();
    } else {
      stopClock();
      setState({ simulationTime: 0 });
      startClock();
    }
  };

  const getStatusColor = (): 'default' | 'success' | 'warning' | 'info' => {
    if (isRunning) return 'success';
    if (isPaused) return 'warning';
    if (isFinished) return 'info';
    return 'default';
  };

  const getStatusLabel = (): string => {
    if (isRunning) return 'פועל';
    if (isPaused) return 'מושהה';
    if (isFinished) return 'הסתיים';
    return 'מוכן';
  };

  return (
    <Paper
      elevation={8}
      dir="rtl"
      sx={{
        position: 'absolute',
        bottom: 36,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        px: 3,
        py: 1.5,
        borderRadius: 4,
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        color: '#ffffff',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
        minWidth: 540,
      }}
    >
      {/* Video Player Style Timeline Scrub Bar (Shown ONCE initial simulation run completes) */}
      {state.maxSimulationTime > 0 && (
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.5, px: 0.5, pb: 0.5 }}>
          <Slider
            size="small"
            min={0}
            max={Math.max(state.maxSimulationTime, 0.1)}
            step={0.1}
            value={Math.min(state.simulationTime, Math.max(state.maxSimulationTime, 0.1))}
            onChange={(_, val) => seekToTime(val as number)}
            sx={{
              color: '#38bdf8',
              '& .MuiSlider-thumb': {
                width: 14,
                height: 14,
                backgroundColor: '#38bdf8',
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: '0 0 0 8px rgba(56, 189, 248, 0.2)',
                },
              },
              '& .MuiSlider-rail': {
                opacity: 0.3,
                backgroundColor: '#94a3b8',
              },
              '& .MuiSlider-track': {
                backgroundColor: '#38bdf8',
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{ fontFamily: 'monospace', color: '#94a3b8', fontSize: 11, minWidth: 70 }}
          >
            Max: {formatSimulationTime(state.maxSimulationTime).replace('T+ ', '')}
          </Typography>
        </Box>
      )}

      {/* Control Buttons & Indicators */}
      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        {/* Simulation Time Display */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 150 }}>
          <TimerIcon sx={{ color: '#38bdf8' }} />
          <Typography
            variant="h6"
            component="span"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: 1,
              color: '#f8fafc',
            }}
          >
            {formatSimulationTime(state.simulationTime)}
          </Typography>
        </Box>

        {/* Play / Pause / Restart Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={isRunning ? 'השהה' : 'הפעל'}>
            <IconButton
              onClick={handlePlayPause}
              sx={{
                backgroundColor: isRunning ? '#eab308' : '#22c55e',
                color: '#0f172a',
                '&:hover': {
                  backgroundColor: isRunning ? '#ca8a04' : '#16a34a',
                },
                width: 44,
                height: 44,
              }}
            >
              {isRunning ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="אפס">
            <IconButton
              onClick={handleRestart}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
                width: 44,
                height: 44,
              }}
            >
              <RestartAltIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Speed Selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SpeedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
          <Box
            sx={{
              display: 'flex',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderRadius: 2,
              p: 0.4,
              gap: 0.4,
            }}
          >
            {SPEED_OPTIONS.map((speed) => {
              const active = state.speedMultiplier === speed;
              return (
                <Box
                  key={speed}
                  component="button"
                  onClick={() => setSpeed(speed)}
                  sx={{
                    minWidth: 36,
                    px: 1.2,
                    py: 0.5,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    border: 'none',
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    color: active ? '#0f172a' : '#94a3b8',
                    backgroundColor: active ? '#38bdf8' : 'transparent',
                    '&:hover': {
                      backgroundColor: active ? '#0284c7' : 'rgba(255,255,255,0.1)',
                      color: active ? '#0f172a' : '#e2e8f0',
                    },
                  }}
                >
                  x{speed}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Status Badge */}
        <Chip
          label={getStatusLabel()}
          color={getStatusColor()}
          size="small"
          sx={{
            fontWeight: 600,
            px: 0.5,
          }}
        />
      </Box>
    </Paper>
  );
};
