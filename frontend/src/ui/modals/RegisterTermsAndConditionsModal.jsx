import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const RegisterTermsAndConditionsModal = ({ open, onClose, onAgree }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #e0e0e0',
        pb: 2
      }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
          Terms and Conditions
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ py: 3 }}>
        <div className="space-y-6">
          {/* Cancellation Policy Section */}
          <div>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
              Cancellation Policy
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              For any Cancellation or No-Show, the following fees apply:
            </Typography>
            <ul className="list-disc ml-6 space-y-1">
              <li>
                <Typography variant="body2">
                  <strong>1 month or more ahead of rental:</strong> FREE
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>30 – 10 days ahead of rental:</strong> 1-day rental fee*
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>9 – 3 days ahead of rental:</strong> 50% of the total rental fee*
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>3 days or less & no show:</strong> 100% of rental fee*
                </Typography>
              </li>
            </ul>
            <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
              Minimum cancellation fee is 1,000 pesos for any rule, and in any case, if the calculated cancellation fee is below 1,000 PHP.
            </Typography>
          </div>

          {/* Vehicle Identification Section */}
          <div>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
              Identification of the Rental Vehicle & Vehicle Classes
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              The customer has the right to reserve and book any class of car, confirmed by Butuan Car Rental, but no right on a specific make, model, car, or color. The right is limited to the booked class of vehicle. BCR can switch between cars of the same class or upgrade the customer to the next higher class as follows:
            </Typography>
            <ul className="list-disc ml-6 space-y-1">
              <li>
                <Typography variant="body2">
                  Compact Manual (KIA RIO)
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Compact Automatic (MIRAGE G4)
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Pick-up 5-seater Manual (NISSAN NAVARA)
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  SUV 7-Seater Automatic (NISSAN TERRA)
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  SUV 7-Seater Automatic (TOYOTA AVANZA)
                </Typography>
              </li>
            </ul>
          </div>

          {/* Rental Term Section */}
          <div>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
              Rental Term
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
              The term of this Car Rental Agreement runs from the date and hour of vehicle pickup as indicated in the individual Car Rental Agreement until the return of the vehicle to Owner and completion of all terms of this Car Rental Agreement by both Parties. The Parties may shorten or extend the estimated term of rental by mutual consent. A refund for early return is not applicable. In case of delayed return without prior notice of at least 6 hours ahead of the scheduled return time according to this agreement, the owner is eligible to consider the car as stolen. Furthermore, a fee of 250 PHP per hour will be imposed starting from the minute of the latest agreed return time. If the return delay exceeds more than 2 hours, a full daily rate as well as possible compensation for the loss of a following booking, at exactly the value of the lost booking, will be charged.
            </Typography>
          </div>
        </div>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
        <Button onClick={onClose} variant="outlined" color="secondary">
          Close
        </Button>
        <Button onClick={onAgree} variant="contained" color="primary">
          I Agree
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RegisterTermsAndConditionsModal;
