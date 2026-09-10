import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

interface DeleteConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      dir="rtl"
      PaperProps={{
        sx: {
          backgroundColor: "#1e293b",
          color: "#f8fafc",
          borderRadius: 3,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 2,
          borderBottom: "1px solid rgba(148, 163, 184, 0.18)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(239, 68, 68, 0.12)",
              color: "#fca5a5",
            }}
          >
            <WarningAmberRoundedIcon fontSize="small" />
          </Box>
          <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 700, color: "#f8fafc" }}>
            {title}
          </Typography>
        </Box>

        <IconButton
          onClick={onCancel}
          size="small"
          sx={{
            color: "#94a3b8",
            "&:hover": { color: "#f8fafc", backgroundColor: "rgba(148,163,184,0.08)" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2.5, textAlign: "right" }}>
        <Typography
          variant="body2"
          sx={{
            color: "#cbd5e1",
            lineHeight: 1.7,
            fontSize: "0.9rem",
            margin: 0,
          }}
        >
          {message}
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2.5,
          pt: 1,
          display: "flex",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Button
          onClick={onCancel}
          sx={{
            color: "#cbd5e1",
            border: "1px solid rgba(148, 163, 184, 0.25)",
            backgroundColor: "rgba(15, 23, 42, 0.2)",
            minWidth: 110,
            "&:hover": { backgroundColor: "rgba(148, 163, 184, 0.08)" },
          }}
        >
          ביטול
        </Button>

        <Button
          variant="contained"
          onClick={onConfirm}
          sx={{
            minWidth: 140,
            fontWeight: 700,
            background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
            color: "#fff",
            boxShadow: "0 8px 20px rgba(220, 38, 38, 0.25)",
            "&:hover": { background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" },
          }}
        >
          מחק
        </Button>
      </DialogActions>
    </Dialog>
  );
};
