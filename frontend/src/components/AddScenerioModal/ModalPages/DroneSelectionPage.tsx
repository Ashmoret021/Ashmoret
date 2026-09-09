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

export interface DroneSelectionPageProps {
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

interface GroupItem {
  id: string;
  label: string;
}

const DEFAULT_GROUPS: GroupItem[] = [
  { id: "group-1", label: "קבוצה 1 - נחיל סיור ותצפית" },
  { id: "group-2", label: "קבוצה 2 - נחיל תקיפה" },
  { id: "group-3", label: "קבוצה 3 - נחיל שיבוש וחסימה" },
];

export const DroneSelectionPage: FC<DroneSelectionPageProps> = ({
  selectedGroup: propGroup,
  onSelectGroup,
}) => {
  const [internalGroup, setInternalGroup] = useState<string>("group-1");
  const [groups, setGroups] = useState<GroupItem[]>(DEFAULT_GROUPS);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const currentGroup = propGroup ?? internalGroup;

  const handleSelectChange = (event: SelectChangeEvent) => {
    const val = event.target.value;
    setInternalGroup(val);
    const chosen = groups.find((g) => g.id === val);
    onSelectGroup?.(val, chosen?.label);
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const newId = `group-${Date.now()}`;
    const newGroup: GroupItem = { id: newId, label: newGroupName.trim() };
    setGroups((prev) => [...prev, newGroup]);
    setInternalGroup(newId);
    onSelectGroup?.(newId, newGroup.label);
    setNewGroupName("");
    setIsCreating(false);
  };

  return (
    <Box sx={{ width: "100%", dir: "rtl", pt: 1 }}>
      <Stack spacing={2.5}>
        <FormControl fullWidth sx={darkInputSx}>
          <InputLabel id="drone-select-label">בחר קבוצת רחפנים</InputLabel>
          <Select
            labelId="drone-select-label"
            id="drone-select-option"
            value={currentGroup}
            label="בחר קבוצת רחפנים"
            onChange={handleSelectChange}
            MenuProps={menuPropsSx}
          >
            {groups.map((g) => (
              <MenuItem key={g.id} value={g.id}>
                {g.label}
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
          {isCreating ? "ביטול הוספה" : "יצירת קבוצת רחפנים"}
        </Button>

        <Collapse in={isCreating}>
          <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="שם קבוצת רחפנים חדשה"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              sx={darkInputSx}
            />
            <Button
              variant="contained"
              disabled={!newGroupName.trim()}
              onClick={handleAddGroup}
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
