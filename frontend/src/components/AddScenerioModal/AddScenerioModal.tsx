import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
} from "@mui/material";
import { MODAL_PAGES } from "./index";

export const AddScenerioModal =() => {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);

  const handleNext = () => {
    if (page < MODAL_PAGES.length - 1) {
      setPage((current) => current + 1);
    } else {
      setOpen(false);
      setPage(0);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setPage(0);
  };

  const progress = ((page + 1) / MODAL_PAGES.length) * 100;

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)} sx={{zIndex: 10000, bgcolor: "black"}}>
        יצירת תרחיש
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {MODAL_PAGES[page].label}
        </DialogTitle>

        <LinearProgress
          variant="determinate"
          value={progress}
        />

        <DialogContent sx={{ py: 5 }}>
          <Box
            sx={{
              minHeight: 180,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <Box>
              <Typography variant="h5" gutterBottom>
                {MODAL_PAGES[page].label}
              </Typography>
              {MODAL_PAGES[page].component}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="contained"
            onClick={handleNext}
          >
            {page === MODAL_PAGES.length - 1 ? "יצירה" : "הבא"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}