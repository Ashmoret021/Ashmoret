import { useRef, useState } from "react";
import { Box, IconButton, Popper, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const options = ["הוספת הגנה", "הוספת תקיפה", "יצירת תרחיש"];

export default function AddScenerioButton() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <IconButton
        ref={buttonRef}
        onClick={() => setOpen((value) => !value)}
        sx={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          backgroundColor: "#8799B5",
          color: "white",
          transition: "all 0.2s ease",

          "&:hover": {
            backgroundColor: "#788BA8",
            transform: "scale(1.04)",
          },
        }}
      >
        <AddIcon />
      </IconButton>

      <Popper
        open={open}
        anchorEl={buttonRef.current}
        placement="top"
        modifiers={[
          {
            name: "flip",
            options: {
              fallbackPlacements: ["bottom"],
            },
          },
          {
            name: "offset",
            options: {
              offset: [0, 10],
            },
          },
        ]}
      >
        <Box
          sx={{
            display: "flex",
            gap: 0.75,
            p: 1,
            borderRadius: "14px",

            // Gray palette background
            backgroundColor: "#EEF1F5",

            // Subtle border
            border: "1px solid #DCE1E8",

            // Floating effect
            boxShadow: `
              0 10px 30px rgba(45, 55, 72, 0.12),
              0 2px 6px rgba(45, 55, 72, 0.06)
            `,
          }}
        >
          {options.map((option) => (
            <Box
              key={option}
              onClick={() => setOpen(false)}
              sx={{
                minWidth: 90,
                px: 1.75,
                py: 1.25,

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                borderRadius: "10px",

                cursor: "pointer",
                userSelect: "none",

                color: "#536176",
                backgroundColor: "transparent",

                transition: "all 0.15s ease",

                "&:hover": {
                  backgroundColor: "#FFFFFF",
                  color: "#35445A",
                  boxShadow: "0 2px 8px rgba(45, 55, 72, 0.08)",
                },

                "&:active": {
                  transform: "scale(0.97)",
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {option}
              </Typography>
            </Box>
          ))}
        </Box>
      </Popper>
    </>
  );
}
