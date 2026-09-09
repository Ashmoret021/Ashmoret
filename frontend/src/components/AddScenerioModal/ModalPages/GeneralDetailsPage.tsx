import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, TextField } from "@mui/material";
import { useState } from "react";

interface ScenerioType {
  value: string;
  label: string;
}
const SCENERIO_TYPES: ScenerioType[] = [
  {
    value: "Single",
    label: "חד זירתי"
  },
  {
    value: "Multi",
    label: "מולטי-זירתי"
  }
]

export const GeneralDetailsPage = () => {

  const [scenerioType, setScenerioType] = useState<string>("");
  const handleSelectChange = (event: SelectChangeEvent) => {
    setScenerioType(event.target.value);
  };

  const [scenarioName, setScenarioName] = useState<string>("");
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setScenarioName(event.target.value);
  };

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
        <TextField
          fullWidth
          variant="outlined"
          label="שם התרחיש"
          value={scenarioName}
          onChange={handleTextChange}
        />
        <FormControl fullWidth>
          <InputLabel id="scenario-type-label">סוג תרחיש</InputLabel>
          <Select
            labelId="scenario-type-label"
            id="scenario-type-select"
            value={scenerioType}
            label="סוג תרחיש"
            onChange={handleSelectChange}
          >
            {SCENERIO_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </>
  );
};
