import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Box,
} from "@mui/material";
import { ChangeEvent, FC, useState } from "react";

export interface GeneralDetailsData {
  scenarioName: string;
  scenarioType: string;
}

export interface GeneralDetailsPageProps {
  data?: GeneralDetailsData;
  onChange?: (data: Partial<GeneralDetailsData>) => void;
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

export const GeneralDetailsPage: FC<GeneralDetailsPageProps> = ({
  data,
  onChange,
}) => {
  const [internalName, setInternalName] = useState("");
  const [internalType, setInternalType] = useState("Single");

  const scenarioName = data?.scenarioName ?? internalName;
  const scenarioType = data?.scenarioType ?? internalType;

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    setInternalName(val);
    onChange?.({ scenarioName: val });
  };

  const handleSelectChange = (event: SelectChangeEvent) => {
    const val = event.target.value;
    setInternalType(val);
    onChange?.({ scenarioType: val });
  };

  return (
    <Box
      dir="rtl"
      sx={{ width: "100%", direction: "rtl", textAlign: "right", pt: 1 }}
    >
      <Stack spacing={2.5}>
        <TextField
          fullWidth
          variant="outlined"
          label="שם התרחיש"
          placeholder="הזן שם לתרחיש"
          value={scenarioName}
          onChange={handleNameChange}
          inputProps={{ dir: "rtl", style: { textAlign: "right" } }}
          sx={darkInputSx}
        />

        <FormControl fullWidth sx={darkInputSx}>
          <InputLabel id="scenario-type-label">סוג תרחיש</InputLabel>
          <Select
            labelId="scenario-type-label"
            id="scenario-type-select"
            value={scenarioType}
            label="סוג תרחיש"
            onChange={handleSelectChange}
            MenuProps={menuPropsSx}
          >
            <MenuItem value="Single">חד זירתי</MenuItem>
            <MenuItem value="Multi">רב-זירתי</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );
};
