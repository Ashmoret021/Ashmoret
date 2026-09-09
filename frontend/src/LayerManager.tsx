import { useState } from 'react';
import { Box, Button, ButtonBase, Checkbox, Collapse, FormControlLabel, Paper, Typography } from '@mui/material';
import { MAP_THEMES, OVERLAYS, previewUrl, themeFilter, type OverlayId, type OverlayVisibility, type ThemeId } from './mapLayers';

interface Props {
  theme: ThemeId;
  overlays: OverlayVisibility;
  onTheme: (theme: ThemeId) => void;
  onOverlay: (id: OverlayId, visible: boolean) => void;
  cityStatus: string;
  tileErrors: string[];
  placedCount: number;
}

export default function LayerManager({ theme, overlays, onTheme, onOverlay, cityStatus, tileErrors, placedCount }: Props) {
  const [expanded, setExpanded] = useState(true);
  return (
    <Paper component="aside" aria-label="Layer manager" elevation={5} sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, width: 310, maxWidth: 'calc(100vw - 76px)', borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography fontWeight={700}>Map layers</Typography>
        <Button size="small" aria-expanded={expanded} aria-controls="map-layer-options" onClick={() => setExpanded(!expanded)}>{expanded ? 'Hide' : 'Show'}</Button>
      </Box>
      <Collapse in={expanded}>
        <Box id="map-layer-options" sx={{ px: 2, pb: 2, maxHeight: 'calc(100dvh - 140px)', overflowY: 'auto' }}>
          <Typography variant="overline" color="text.secondary">Map theme</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            {MAP_THEMES.map((item) => (
              <ButtonBase key={item.id} aria-label={`${item.name} map theme`} aria-pressed={theme === item.id} onClick={() => onTheme(item.id)} sx={{ display: 'block', textAlign: 'left', overflow: 'hidden', borderRadius: 2, border: '2px solid', borderColor: theme === item.id ? 'primary.main' : 'divider', '&.Mui-focusVisible': { outline: '3px solid #42a5f5' } }}>
                <Box sx={{ height: 65, background: '#e2e8f0', position: 'relative' }}>
                  <Typography variant="caption" sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>Preview unavailable</Typography>
                  <Box component="img" src={previewUrl(item.url)} alt={`${item.name} map preview`} onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} sx={{ position: 'relative', width: '100%', height: '100%', objectFit: 'cover', filter: themeFilter(item.id) }} />
                </Box>
                <Box sx={{ px: 1, py: 0.5 }}>
                  <Typography variant="body2" fontWeight={700}>{item.name}{theme === item.id ? ' ✓' : ''}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.source}</Typography>
                </Box>
              </ButtonBase>
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>Previews © OpenStreetMap contributors, Esri and imagery contributors, OpenTopoMap / SRTM (CC-BY-SA).</Typography>
          <Typography variant="overline" color="text.secondary" component="div" sx={{ mt: 1 }}>Overlays</Typography>
          {OVERLAYS.map((overlay) => (
            <FormControlLabel key={overlay.id} sx={{ display: 'flex', alignItems: 'flex-start', mx: -1, mb: 0.5 }} control={<Checkbox checked={overlays[overlay.id]} onChange={(_, checked) => onOverlay(overlay.id, checked)} />} label={<Box sx={{ pt: 0.7 }}><Typography variant="body2">{overlay.name}{overlay.id === 'systems' ? ` (${placedCount})` : ''}</Typography><Typography variant="caption" color="text.secondary">{overlay.description}</Typography></Box>} />
          ))}
          <Typography variant="caption" component="div" role="status" sx={{ mt: 1 }}>{cityStatus}</Typography>
          {tileErrors.map((error) => <Typography key={error} variant="caption" component="div" role="alert" color="error.main">{error} tiles could not load. Try another theme or toggle the layer to retry.</Typography>)}
        </Box>
      </Collapse>
    </Paper>
  );
}
