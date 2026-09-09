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
  description?: string;
}

export interface GeneralDetailsPageProps {
  data?: GeneralDetailsData;
  onChange?: (data: Partial<GeneralDetailsData>) => void;
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

export const GeneralDetailsPage: FC<GeneralDetailsPageProps> = ({
  data,
  onChange,
}) => {
  const [internalName, setInternalName] = useState("");
  const [internalType, setInternalType] = useState("Single");
  const [internalDesc, setInternalDesc] = useState("");

  const scenarioName = data?.scenarioName ?? internalName;
  const scenarioType = data?.scenarioType ?? internalType;
  const description = data?.description ?? internalDesc;

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

  const handleDescChange = (event: ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    setInternalDesc(val);
    onChange?.({ description: val });
  };

  return (
    <Box sx={{ width: "100%", dir: "rtl", pt: 1 }}>
      <Stack spacing={2.5}>
        <TextField
          fullWidth
          variant="outlined"
          label="שם התרחיש"
          placeholder="הזן שם לתרחיש"
          value={scenarioName}
          onChange={handleNameChange}
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

        <TextField
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          label="תיאור (אופציונלי)"
          placeholder="הערות או דגשים מבצעיים..."
          value={description}
          onChange={handleDescChange}
          sx={darkInputSx}
        />
      </Stack>
    </Box>
  );
};
