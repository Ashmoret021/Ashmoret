import React, { useState } from 'react';
import {
  Box,
  Divider,
  FormControlLabel,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';

export interface MapLegendProps {
  showThreatRoutes?: boolean;
  showInterceptorRoutes?: boolean;
  onToggleThreatRoutes?: (show: boolean) => void;
  onToggleInterceptorRoutes?: (show: boolean) => void;
}

const LEGEND_ITEMS = [
  { symbol: '🔴', label: 'איום' },
  { symbol: '🔵', label: 'מיירט' },
  { symbol: '🟦', label: 'סוללה' },
  { symbol: '✴️', label: 'יירוט' },
  { symbol: '💥', label: 'פגיעה' },
];

export const MapLegend: React.FC<MapLegendProps> = ({
  showThreatRoutes: externalThreatRoutes,
  showInterceptorRoutes: externalInterceptorRoutes,
  onToggleThreatRoutes,
  onToggleInterceptorRoutes,
}) => {
  const [internalThreatRoutes, setInternalThreatRoutes] = useState<boolean>(true);
  const [internalInterceptorRoutes, setInternalInterceptorRoutes] = useState<boolean>(true);

  const threatRoutes = externalThreatRoutes ?? internalThreatRoutes;
  const interceptorRoutes = externalInterceptorRoutes ?? internalInterceptorRoutes;

  const handleThreatRoutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalThreatRoutes(e.target.checked);
    onToggleThreatRoutes?.(e.target.checked);
  };

  const handleInterceptorRoutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalInterceptorRoutes(e.target.checked);
    onToggleInterceptorRoutes?.(e.target.checked);
  };

  return (
    <Box
      dir="rtl"
      sx={{
        position: 'absolute',
        bottom: 88, // sits above the SimulationControls bar
        left: 16,
        zIndex: 1100,
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.13)',
        borderRadius: 3,
        px: 1.5,
        py: 1,
        boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        minWidth: 0,
      }}
    >
      {/* Symbol row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        {LEGEND_ITEMS.map((item) => (
          <Tooltip key={item.symbol} title={item.label} placement="top" arrow>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'default',
              }}
            >
              <Typography sx={{ fontSize: '1rem', lineHeight: 1 }}>{item.symbol}</Typography>
              <Typography
                sx={{
                  fontSize: '0.6rem',
                  color: '#94a3b8',
                  lineHeight: 1.3,
                  mt: 0.25,
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </Typography>
            </Box>
          </Tooltip>
        ))}

        <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.12)', mx: 0.25 }} />

        {/* Route toggles — compact inline */}
        <Tooltip title="הצג/הסתר מסלולי איומים" placement="top" arrow>
          <FormControlLabel
            control={
              <Switch
                checked={threatRoutes}
                onChange={handleThreatRoutesChange}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#ef4444' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#ef4444',
                  },
                }}
              />
            }
            label={
              <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                מסלולי 🔴
              </Typography>
            }
            sx={{ m: 0, gap: 0.25 }}
          />
        </Tooltip>

        <Tooltip title="הצג/הסתר מסלולי מיירטים" placement="top" arrow>
          <FormControlLabel
            control={
              <Switch
                checked={interceptorRoutes}
                onChange={handleInterceptorRoutesChange}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#38bdf8' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#38bdf8',
                  },
                }}
              />
            }
            label={
              <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                מסלולי 🔵
              </Typography>
            }
            sx={{ m: 0, gap: 0.25 }}
          />
        </Tooltip>
      </Box>
    </Box>
  );
};
