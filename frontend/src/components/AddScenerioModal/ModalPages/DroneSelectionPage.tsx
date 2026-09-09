import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
} from "@mui/material";
import { useState } from "react";

export const DroneSelectionPage = () => {
  const [droneGroup, setDroneGroup] = useState<string>("");

  const handleSelectChange = (event: SelectChangeEvent) => {
    setDroneGroup(event.target.value);
  };

  return (
    <>
      <Box sx={{ maxWidth: 300, mx: "auto", mt: 4 }}>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="select-label">בחר קבוצת רחפנים</InputLabel>
            <Select
              labelId="select-label"
              id="select-option"
              value={droneGroup}
              label="בחר קבוצת רחפנים"
              onChange={handleSelectChange}
            >
              <MenuItem value="option1">Option 1</MenuItem>
              <MenuItem value="option2">Option 2</MenuItem>
              <MenuItem value="option3">Option 3</MenuItem>
            </Select>
          </FormControl>

          <Button variant="contained" disabled={!droneGroup} fullWidth>
            יצירת קבוצת הרחפנים
          </Button>
        </Stack>
      </Box>
    </>
  );
};
