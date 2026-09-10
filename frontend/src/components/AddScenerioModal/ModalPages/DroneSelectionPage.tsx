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
import { FC, useState } from "react";
import { useGetAllDronesGroups } from "../../../api/hooks";
import { DroneGroup } from "../../../types/types";

export interface DroneSelectionPageProps {
  selectedGroup?: string;
  onSelectGroup?: (groupId: string, groupName?: string) => void;
}

const darkInputSx = {
  direction: "rtl",
  "& .MuiOutlinedInput-root": {
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    borderRadius: 1.5,
    color: "#f8fafc",
    direction: "rtl",
    "& fieldset": {
      borderColor: "rgba(255, 255, 255, 0.15)",
      textAlign: "right",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255, 255, 255, 0.3)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#38bdf8",
    },
    "& .MuiOutlinedInput-input": {
      textAlign: "right",
      direction: "rtl",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#94a3b8",
    right: 28,
    left: "auto",
    transformOrigin: "top right",
    textAlign: "right",
    direction: "rtl",
    transform: "translate(0, 16px) scale(1)",
    "&.Mui-focused": {
      color: "#38bdf8",
    },
    "&.MuiInputLabel-shrink, &[data-shrink='true']": {
      transform: "translate(14px, -9px) scale(0.75)",
      transformOrigin: "top right",
    },
  },
  "& .MuiOutlinedInput-notchedOutline": {
    textAlign: "right",
    "& legend": {
      textAlign: "right",
      fontSize: "0.75em",
    },
  },
  "& .MuiSelect-select": {
    textAlign: "right",
    direction: "rtl",
    paddingRight: "14px !important",
    paddingLeft: "36px !important",
  },
  "& .MuiSelect-icon": {
    color: "#94a3b8",
    right: "auto",
    left: 7,
  },
};

const menuPropsSx = {
  PaperProps: {
    dir: "rtl",
    sx: {
      backgroundColor: "#1e293b",
      color: "#f8fafc",
      direction: "rtl",
      textAlign: "right",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      "& .MuiMenuItem-root": {
        direction: "rtl",
        textAlign: "right",
        justifyContent: "flex-start",
      },
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

export const DroneSelectionPage: FC<DroneSelectionPageProps> = ({
  selectedGroup: propGroup,
  onSelectGroup,
}) => {
  const [internalGroup, setInternalGroup] = useState<string>("");
  const {dronesGroups} = useGetAllDronesGroups();

  const currentGroup = propGroup ?? internalGroup;

  const handleSelectChange = (event: SelectChangeEvent) => {
    const val = event.target.value;
    setInternalGroup(val);
    const chosen = dronesGroups?.data?.find((g: DroneGroup) => g.id === val);
    onSelectGroup?.(val, chosen?.name);
  };

  return (
    <Box dir="rtl" sx={{ width: "100%", direction: "rtl", textAlign: "right", pt: 1 }}>
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
            {dronesGroups?.data?.map((g: DroneGroup) => (
              <MenuItem key={g.id} value={g.id}>
                {g.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          fullWidth
          sx={{
            color: "#38bdf8",
            borderColor: "rgba(56, 189, 248, 0.4)",
            "&:hover": {
              borderColor: "#38bdf8",
              backgroundColor: "rgba(56, 189, 248, 0.08)",
            },
          }}
        >
          יצירת קבוצת רחפנים
        </Button>
      </Stack>
    </Box>
  );
};
