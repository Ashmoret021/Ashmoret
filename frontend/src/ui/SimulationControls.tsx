import React from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  IconButton,
  Paper,
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
    setState,
  } = useSimulation();

  const isRunning = state.status === 'running';
  const isPaused = state.status === 'paused';
  const isIdle = state.status === 'idle';
  const isFinished = state.status === 'finished';

  const handlePlayPause = () => {
    if (isRunning) {
      pauseClock();
    } else if (isPaused) {
      resumeClock();
    } else {
      startClock();
    }
  };

  const handleRestart = () => {
    if (onRestart) {
      onRestart();
    } else {
      // Fallback: basic stop if no callback provided
      stopClock();
      setState({ simulationTime: 0 });
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
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 3,
        py: 1.5,
        borderRadius: 4,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        color: '#ffffff',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Simulation Time Display */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 160 }}>
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
              '&.Mui-disabled': {
                color: 'rgba(255, 255, 255, 0.3)',
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
        <SpeedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
        <ButtonGroup size="small" variant="outlined" sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
          {SPEED_OPTIONS.map((speed) => (
            <Button
              key={speed}
              onClick={() => setSpeed(speed)}
              variant={state.speedMultiplier === speed ? 'contained' : 'outlined'}
              sx={{
                minWidth: 40,
                fontWeight: 600,
                color: state.speedMultiplier === speed ? '#0f172a' : '#cbd5e1',
                backgroundColor:
                  state.speedMultiplier === speed ? '#38bdf8' : 'transparent',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  backgroundColor:
                    state.speedMultiplier === speed
                      ? '#0284c7'
                      : 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              x{speed}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {/* Status Badge */}
      <Chip
        label={getStatusLabel()}
        color={getStatusColor()}
        size="small"
        sx={{
          fontWeight: 600,
          ml: 1,
          px: 0.5,
        }}
      />
    </Paper>
  );
};
