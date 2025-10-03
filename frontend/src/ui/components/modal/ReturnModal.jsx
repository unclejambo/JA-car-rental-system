import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Stack,
  Box,
  Typography,
  useMediaQuery,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function ReturnModal({ show, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showFees, setShowFees] = useState(!isMobile); // show fees side panel on desktop
  const [formData, setFormData] = useState({
    gasLevel: 'High',
    odometer: '',
    damageStatus: 'noDamage',
    damageDetails: '',
    equipmentStatus: 'complete',
    equipmentDetails: '',
  });

  // Static fee data (could be props later)
  const fees = [
    { label: 'Overdue Fee', amount: 200 },
    { label: 'Damage Fee', amount: 10000 },
    { label: 'Equipment Loss Fee', amount: 1000 },
    { label: 'Gas Level Fee', amount: 300 },
    { label: 'Cleaning Fee', amount: 200 },
  ];
  const total = fees.reduce((sum, f) => sum + f.amount, 0);

  const currency = (v) =>
    `₱ ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit return form data
    onClose?.();
  };

  return (
    <Dialog
      open={!!show}
      onClose={onClose}
      fullWidth
      maxWidth={isMobile ? 'sm' : 'md'}
      disableScrollLock
    >
      <DialogTitle>Return</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Stack direction={isMobile ? 'column' : 'row'} sx={{ minHeight: 320 }}>
          {/* Form side */}
          <Box sx={{ flex: 1, p: 2 }}>
            <Stack
              id="returnForm"
              component="form"
              spacing={2}
              onSubmit={handleSubmit}
            >
              {/* Gas Level */}
              <Box>
                <FormLabel sx={{ fontWeight: 600 }}>Gas Level</FormLabel>
                <RadioGroup
                  row
                  name="gasLevel"
                  value={formData.gasLevel}
                  onChange={handleInputChange}
                >
                  {['High', 'Mid', 'Low'].map((g) => (
                    <FormControlLabel
                      key={g}
                      value={g}
                      control={<Radio />}
                      label={g}
                    />
                  ))}
                </RadioGroup>
              </Box>
              {/* Odometer */}

              <TextField
                name="odometer"
                label="Odometer"
                value={formData.odometer}
                onChange={handleInputChange}
                required
                size="small"
                inputMode="numeric"
              />

              {/* Damage Check */}
              <Box>
                <FormLabel sx={{ fontWeight: 600 }}>Damage Check</FormLabel>
                <RadioGroup
                  row
                  name="damageStatus"
                  value={formData.damageStatus}
                  onChange={handleInputChange}
                >
                  <FormControlLabel
                    value="noDamage"
                    control={<Radio />}
                    label="No Damages"
                  />
                  <FormControlLabel
                    value="major"
                    control={<Radio />}
                    label="Major"
                  />
                  <FormControlLabel
                    value="minor"
                    control={<Radio />}
                    label="Minor"
                  />
                </RadioGroup>
              </Box>
              {/* Equipment Check */}
              <Box>
                <FormLabel sx={{ fontWeight: 600 }}>Equipment Check</FormLabel>
                <RadioGroup
                  row
                  name="equipmentStatus"
                  value={formData.equipmentStatus}
                  onChange={handleInputChange}
                >
                  <FormControlLabel
                    value="complete"
                    control={<Radio />}
                    label="Complete"
                  />
                  <FormControlLabel
                    value="specify"
                    control={<Radio />}
                    label="Specify"
                  />
                </RadioGroup>
                {formData.equipmentStatus === 'specify' && (
                  <TextField
                    name="equipmentDetails"
                    label="Equipment Details"
                    value={formData.equipmentDetails}
                    onChange={handleInputChange}
                    fullWidth
                    multiline
                    minRows={2}
                    required
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
              {isMobile && (
                <Box sx={{ mt: 1 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 0.5 }}
                  >
                    Fees Total
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowFees(true)}
                    fullWidth
                  >
                    {currency(total)} (tap to view breakdown)
                  </Button>
                </Box>
              )}
            </Stack>
          </Box>

          {/* Fees side (persistent on desktop, conditional overlay on mobile) */}
          {(!isMobile || (isMobile && showFees)) && (
            <Box
              sx={{
                width: { xs: '100%', sm: 300 },
                borderLeft: { sm: '1px solid #eee' },
                borderTop: { xs: '1px solid #eee', sm: 'none' },
                p: 2,
                bgcolor: '#fafafa',
                position: isMobile ? 'absolute' : 'relative',
                top: 0,
                left: 0,
                height: isMobile ? '100%' : 'auto',
                zIndex: 10,
                overflowY: 'auto',
                overflowX: 'hidden',
                boxSizing: 'border-box',
              }}
            >
              {isMobile && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setShowFees(false)}
                  sx={{ mb: 1 }}
                >
                  Close Fees
                </Button>
              )}
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Fees
              </Typography>
              <Stack spacing={1}>
                {fees.map((f) => (
                  <Box
                    key={f.label}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 1,
                      minWidth: 0, // Allow shrinking
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        wordBreak: 'break-word',
                        minWidth: 0,
                      }}
                    >
                      {f.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {currency(f.amount)}
                    </Typography>
                  </Box>
                ))}
                <Divider />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 1,
                    minWidth: 0,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    Total
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {currency(total)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3 }}>
        <Box
          sx={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1,
          }}
        >
          <Button
            type="submit"
            form="returnForm"
            variant="contained"
            color="success"
          >
            Return
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={onClose}
            sx={{ '&:hover': { bgcolor: 'error.main', color: '#fff' } }}
          >
            Cancel
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
