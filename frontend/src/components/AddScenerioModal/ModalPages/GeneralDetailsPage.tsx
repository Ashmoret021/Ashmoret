import React, { useState } from "react";
import {
  Box,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export interface ScenerioType {
  value: string;
  label: string;
  description?: string;
}

export const SCENERIO_TYPES: ScenerioType[] = [
  {
    value: "single",
    label: "בודד (Single)",
    description: "תרחיש עם איום בודד לבדיקה ממוקדת",
  },
  {
    value: "swarm",
    label: "נחיל (Swarm)",
    description: "מתקפת נחיל רחפנים רב-מוקדית",
  },
  {
    value: "combined",
    label: "משולב (Combined)",
    description: "תרחיש משולב של מספר סוגי איומים",
  },
];

interface GeneralDetailsPageProps {
  scenarioName?: string;
  scenarioType?: string;
  onScenarioNameChange?: (name: string) => void;
  onScenarioTypeChange?: (type: string) => void;
}

export const GeneralDetailsPage: React.FC<GeneralDetailsPageProps> = ({
  scenarioName: initialName = "",
  scenarioType: initialType = "single",
  onScenarioNameChange,
  onScenarioTypeChange,
}) => {
  const [scenarioName, setScenarioName] = useState(initialName);
  const [scenarioType, setScenarioType] = useState(initialType);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setScenarioName(value);
    onScenarioNameChange?.(value);
  };

  const handleTypeChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setScenarioType(value);
    onScenarioTypeChange?.(value);
  };

  return (
    <Box
      dir="rtl"
      sx={{
        width: "100%",
        maxWidth: 480,
        mx: "auto",
        py: 1,
      }}
    >
      <Stack spacing={3}>
        {/* כותרת משנה / הנחיה */}
        <Box textAlign="right">
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            פרטי תרחיש כלליים
          </Typography>
          <Typography variant="body2" color="text.secondary">
            הגדר את שם התרחיש ואת אופי האיומים להרצה
          </Typography>
        </Box>

        {/* שדה שם התרחיש */}
        <TextField
          fullWidth
          required
          id="scenario-name-input"
          label="שם התרחיש"
          variant="outlined"
          placeholder="לדוגמה: תרחיש הגנה גזרה צפונית"
          value={scenarioName}
          onChange={handleNameChange}
          helperText="שם מזהה ייחודי עבור התרחיש"
        />

        {/* בחירת סוג תרחיש */}
        <FormControl fullWidth required>
          <InputLabel id="scenerio-type-label">סוג תרחיש</InputLabel>
          <Select
            labelId="scenerio-type-label"
            id="scenerio-type-select"
            value={scenarioType}
            label="סוג תרחיש"
            onChange={handleTypeChange}
          >
            {SCENERIO_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                <Box sx={{ display: "flex", flexDirection: "column", textAlign: "right" }}>
                  <Typography variant="body1">{type.label}</Typography>
                  {type.description && (
                    <Typography variant="caption" color="text.secondary">
                      {type.description}
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>בחר את מבנה האיומים שיופעלו בתרחיש</FormHelperText>
        </FormControl>
      </Stack>
    </Box>
  );
};

