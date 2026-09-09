import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Collapse,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RouteIcon from '@mui/icons-material/Route';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

export interface MapLegendProps {
  showThreatRoutes?: boolean;
  showInterceptorRoutes?: boolean;
  onToggleThreatRoutes?: (show: boolean) => void;
  onToggleInterceptorRoutes?: (show: boolean) => void;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  showThreatRoutes: externalThreatRoutes,
  showInterceptorRoutes: externalInterceptorRoutes,
  onToggleThreatRoutes,
  onToggleInterceptorRoutes,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [internalThreatRoutes, setInternalThreatRoutes] = useState<boolean>(true);
  const [internalInterceptorRoutes, setInternalInterceptorRoutes] = useState<boolean>(true);

  const threatRoutes = externalThreatRoutes ?? internalThreatRoutes;
  const interceptorRoutes = externalInterceptorRoutes ?? internalInterceptorRoutes;

  const handleThreatRoutesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setInternalThreatRoutes(checked);
    onToggleThreatRoutes?.(checked);
  };

  const handleInterceptorRoutesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setInternalInterceptorRoutes(checked);
    onToggleInterceptorRoutes?.(checked);
  };

  const legendItems = [
    {
      id: 'threat',
      label: 'איום',
      symbol: '🔴',
      color: '#ef4444',
      description: 'כטב"מ / רחפן אויב',
    },
    {
      id: 'interceptor',
      label: 'מיירט',
      symbol: '🔵',
      color: '#38bdf8',
      description: 'טיל / כלי יירוט',
    },
    {
      id: 'launcher',
      label: 'סוללת שיגור',
      symbol: '🟦',
      color: '#3b82f6',
      description: 'עמדת שיגור מיירטים',
    },
    {
      id: 'interception',
      label: 'יירוט / פיצוץ',
      symbol: '✴',
      color: '#eab308',
      description: 'נקודת פגיעה באוויר',
    },
    {
      id: 'impact',
      label: 'פגיעה בשטח',
      symbol: '💥',
      color: '#f97316',
      description: 'פגיעה / נפילה בשטח',
    },
  ];

  return (
    <Card
      elevation={8}
      dir="rtl"
      sx={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 1100,
        width: 280,
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 4,
        color: '#ffffff',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: isExpanded ? 2 : 1 } }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MapIcon sx={{ color: '#38bdf8' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
              מקרא מפה והגדרות
            </Typography>
          </Box>
          <Tooltip title={isExpanded ? 'מזער' : 'הרחב'}>
            <IconButton size="small" sx={{ color: '#94a3b8' }}>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        <Collapse in={isExpanded}>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1.5 }} />

          {/* Legend Items */}
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5 }}
          >
            מקרא סמלים
          </Typography>
          <Stack spacing={1} sx={{ mt: 1, mb: 2 }}>
            {legendItems.map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" sx={{ lineHeight: 1 }}>
                    {item.symbol}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#e2e8f0' }}>
                    {item.label}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                  {item.description}
                </Typography>
              </Box>
            ))}
          </Stack>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 1.5 }} />

          {/* Layer Visibility Toggles */}
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5 }}
          >
            תצוגת מסלולים
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={threatRoutes}
                  onChange={handleThreatRoutesChange}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#ef4444',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#ef4444',
                    },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RouteIcon sx={{ color: '#ef4444', fontSize: 18 }} />
                  <Typography variant="body2" sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
                    מסלולי איומים
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={interceptorRoutes}
                  onChange={handleInterceptorRoutesChange}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#38bdf8',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#38bdf8',
                    },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalOfferIcon sx={{ color: '#38bdf8', fontSize: 18 }} />
                  <Typography variant="body2" sx={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
                    מסלולי מיירטים
                  </Typography>
                </Box>
              }
            />
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  );
};
