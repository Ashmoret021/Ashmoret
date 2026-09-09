import {
  Box,
  Button,
  Collapse,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
} from "@mui/material";
import { FC, useState } from "react";

export interface LauncherSelectionPageProps {
  selectedGroup?: string;
  onSelectGroup?: (groupId: string, groupName?: string) => void;
}

const darkInputSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    borderRadius: 1.5,
    color: "#f8fafc",
    "& fieldset": {
      borderColor: "rgba(255, 255, 255, 0.15)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255, 255, 255, 0.3)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#38bdf8",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#94a3b8",
    "&.Mui-focused": {
      color: "#38bdf8",
    },
  },
  "& .MuiSelect-icon": {
    color: "#94a3b8",
  },
};

const menuPropsSx = {
  PaperProps: {
    sx: {
      backgroundColor: "#1e293b",
      color: "#f8fafc",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      "& .MuiMenuItem-root:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.08)",
      },
      "& .MuiMenuItem-root.Mui-selected": {
        backgroundColor: "rgba(56, 189, 248, 0.15)",
        color: "#38bdf8",
      },
    },
  },
};

interface BatteryItem {
  id: string;
  label: string;
}

const DEFAULT_BATTERIES: BatteryItem[] = [
  { id: "battery-1", label: "סוללה אלפא - כיפת ברזל" },
  { id: "battery-2", label: "סוללה בטא - קלע דוד" },
  { id: "battery-3", label: "סוללה גמא - מערכת חץ" },
];

export const LauncherSelectionPage: FC<LauncherSelectionPageProps> = ({
  selectedGroup: propGroup,
  onSelectGroup,
}) => {
  const [internalGroup, setInternalGroup] = useState<string>("battery-1");
  const [batteries, setBatteries] = useState<BatteryItem[]>(DEFAULT_BATTERIES);
  const [isCreating, setIsCreating] = useState(false);
  const [newBatteryName, setNewBatteryName] = useState("");

  const currentGroup = propGroup ?? internalGroup;

  const handleSelectChange = (event: SelectChangeEvent) => {
    const val = event.target.value;
    setInternalGroup(val);
    const chosen = batteries.find((b) => b.id === val);
    onSelectGroup?.(val, chosen?.label);
  };

  const handleAddBattery = () => {
    if (!newBatteryName.trim()) return;
    const newId = `battery-${Date.now()}`;
    const newBattery: BatteryItem = {
      id: newId,
      label: newBatteryName.trim(),
    };
    setBatteries((prev) => [...prev, newBattery]);
    setInternalGroup(newId);
    onSelectGroup?.(newId, newBattery.label);
    setNewBatteryName("");
    setIsCreating(false);
  };

  return (
    <Box sx={{ width: "100%", dir: "rtl", pt: 1 }}>
      <Stack spacing={2.5}>
        <FormControl fullWidth sx={darkInputSx}>
          <InputLabel id="launcher-select-label">בחר קבוצת משגרים</InputLabel>
          <Select
            labelId="launcher-select-label"
            id="launcher-select-option"
            value={currentGroup}
            label="בחר קבוצת משגרים"
            onChange={handleSelectChange}
            MenuProps={menuPropsSx}
          >
            {batteries.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          fullWidth
          onClick={() => setIsCreating((prev) => !prev)}
          sx={{
            color: "#38bdf8",
            borderColor: "rgba(56, 189, 248, 0.4)",
            "&:hover": {
              borderColor: "#38bdf8",
              backgroundColor: "rgba(56, 189, 248, 0.08)",
            },
          }}
        >
          {isCreating ? "ביטול הוספה" : "יצירת קבוצת משגרים"}
        </Button>

        <Collapse in={isCreating}>
          <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="שם סוללת משגרים חדשה"
              value={newBatteryName}
              onChange={(e) => setNewBatteryName(e.target.value)}
              sx={darkInputSx}
            />
            <Button
              variant="contained"
              disabled={!newBatteryName.trim()}
              onClick={handleAddBattery}
              sx={{
                bgcolor: "#0284c7",
                "&:hover": { bgcolor: "#0369a1" },
                whiteSpace: "nowrap",
                px: 2.5,
              }}
            >
              הוסף
            </Button>
          </Stack>
        </Collapse>
      </Stack>
    </Box>
  );
};
