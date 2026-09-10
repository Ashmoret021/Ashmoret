import React, { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  IconButton,
  List,
  ListItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import HistoryIcon from '@mui/icons-material/History';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import GppGoodIcon from '@mui/icons-material/GppGood';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import RadarIcon from '@mui/icons-material/Radar';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useSimulation } from '../simulation/useSimulation';
import type { LogEntry } from '../simulation/SimulationContext';
import type { Location } from '../types/types';

export type EventCategory = 'all' | 'launch' | 'interception' | 'impact' | 'detection';

function formatEventTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 10);
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  return `T+ ${mm}:${ss}.${millis}`;
}

export const EventLog: React.FC = () => {
  const { state } = useSimulation();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('all');

  const logEntries = useMemo<LogEntry[]>(() => {
    const history = state.logHistory || [];
    // Only entries that occurred at or before current scrub time
    const visible = history.filter((e) => e.time <= state.simulationTime + 0.05);
    // Sort newest first
    return [...visible].sort((a, b) => b.time - a.time);
  }, [state.logHistory, state.simulationTime]);

  const filteredEntries = useMemo(() => {
    if (selectedCategory === 'all') return logEntries;
    return logEntries.filter((e) => e.category === selectedCategory);
  }, [logEntries, selectedCategory]);

  const getCategoryConfig = (category: LogEntry['category']) => {
    switch (category) {
      case 'launch':
        return {
          label: 'שיגור',
          color: '#38bdf8',
          bgColor: 'rgba(56, 189, 248, 0.12)',
          borderColor: '#38bdf8',
          icon: <RocketLaunchIcon sx={{ color: '#38bdf8', fontSize: 18 }} />,
        };
      case 'interception':
        return {
          label: 'יירוט',
          color: '#22c55e',
          bgColor: 'rgba(34, 197, 94, 0.12)',
          borderColor: '#22c55e',
          icon: <GppGoodIcon sx={{ color: '#22c55e', fontSize: 18 }} />,
        };
      case 'impact':
        return {
          label: 'פגיעה',
          color: '#ef4444',
          bgColor: 'rgba(239, 68, 68, 0.12)',
          borderColor: '#ef4444',
          icon: <ReportProblemIcon sx={{ color: '#ef4444', fontSize: 18 }} />,
        };
      case 'detection':
      default:
        return {
          label: 'זיהוי',
          color: '#f97316',
          bgColor: 'rgba(249, 115, 22, 0.12)',
          borderColor: '#f97316',
          icon: <RadarIcon sx={{ color: '#f97316', fontSize: 18 }} />,
        };
    }
  };

  return (
    <Card
      elevation={8}
      dir="rtl"
      sx={{
        position: 'absolute',
        top: 395,
        left: 16,
        zIndex: 1100,
        width: 252,
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 3.5,
        color: '#ffffff',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: isExpanded ? 1.5 : 1 } }}>
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
            <Badge badgeContent={logEntries.length} color="primary" max={99}>
              <HistoryIcon sx={{ color: '#38bdf8' }} />
            </Badge>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc', mr: 1 }}>
              יומן אירועים
            </Typography>
          </Box>
          <Tooltip title={isExpanded ? 'מזער' : 'הרחב'}>
            <IconButton size="small" sx={{ color: '#94a3b8' }}>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        <Collapse in={isExpanded}>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />

          {/* Filter Chips */}
          <Stack direction="row" spacing={0.5} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
            {(['all', 'launch', 'interception', 'impact', 'detection'] as EventCategory[]).map(
              (cat) => {
                const labels: Record<EventCategory, string> = {
                  all: 'הכל',
                  launch: 'שיגורים',
                  interception: 'יירוטים',
                  impact: 'פגיעות',
                  detection: 'זיהויים',
                };
                const isSelected = selectedCategory === cat;
                return (
                  <Chip
                    key={cat}
                    label={labels[cat]}
                    size="small"
                    onClick={() => setSelectedCategory(cat)}
                    sx={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      height: 22,
                      backgroundColor: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
                      color: isSelected ? '#0f172a' : '#cbd5e1',
                      '&:hover': {
                        backgroundColor: isSelected ? '#0284c7' : 'rgba(255, 255, 255, 0.15)',
                      },
                    }}
                  />
                );
              },
            )}
          </Stack>

          {/* Log Items List */}
          <Box sx={{ maxHeight: 'calc(100vh - 585px)', minHeight: 60, overflowY: 'auto', pr: 0.5 }}>
            {filteredEntries.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  py: 3,
                  color: '#64748b',
                }}
              >
                <InfoOutlinedIcon sx={{ fontSize: 32, mb: 0.5 }} />
                <Typography variant="caption" sx={{ textAlign: 'center' }}>
                  אין אירועים רשומים עדיין
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {filteredEntries.map((entry) => {
                  const config = getCategoryConfig(entry.category);
                  return (
                    <ListItem
                      key={entry.id}
                      disableGutters
                      sx={{
                        mb: 1,
                        p: 1.25,
                        borderRadius: 2,
                        backgroundColor: config.bgColor,
                        borderRight: `4px solid ${config.borderColor}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          mb: 0.5,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          {config.icon}
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, color: config.color, fontSize: '0.8rem' }}
                          >
                            {entry.title}
                          </Typography>
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            color: '#94a3b8',
                            fontSize: '0.75rem',
                          }}
                        >
                          {formatEventTime(entry.time)}
                        </Typography>
                      </Box>

                      <Typography
                        variant="caption"
                        sx={{ color: '#cbd5e1', fontSize: '0.75rem', lineHeight: 1.3 }}
                      >
                        {entry.description}
                      </Typography>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};
