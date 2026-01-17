import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Box,
  Typography,
} from '@mui/material';
import { useIssueCertificateMutation } from '../api';

interface IssueCertificateDialogProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

const certificateTypes = [
  'Academic Excellence',
  'Perfect Attendance',
  'Graduation Certificate',
  'Honor Roll',
  'Sports Achievement',
  'Arts & Culture',
  'Community Service',
  'Leadership Award',
  'Best Student',
  'Subject Excellence',
];

export const IssueCertificateDialog: React.FC<IssueCertificateDialogProps> = ({
  open,
  onClose,
  studentId,
  studentName,
}) => {
  const [certificateType, setCertificateType] = useState('');
  const [achievement, setAchievement] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const [issueCertificate, { isLoading, isSuccess, isError, error, data }] = useIssueCertificateMutation();

  const handleSubmit = async () => {
    if (!certificateType || !achievement) {
      return;
    }

    try {
      let additionalData = {};
      if (additionalInfo) {
        try {
          additionalData = JSON.parse(additionalInfo);
        } catch {
          additionalData = { notes: additionalInfo };
        }
      }

      await issueCertificate({
        studentId,
        certificateType,
        achievement,
        additionalInfo: additionalData,
      }).unwrap();

      // Reset form after success
      setTimeout(() => {
        setCertificateType('');
        setAchievement('');
        setAdditionalInfo('');
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error issuing certificate:', err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Issue Certificate</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Student: <strong>{studentName}</strong>
          </Typography>

          <FormControl fullWidth>
            <InputLabel>Certificate Type</InputLabel>
            <Select
              value={certificateType}
              label="Certificate Type"
              onChange={(e) => setCertificateType(e.target.value)}
            >
              {certificateTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Achievement Description"
            multiline
            rows={3}
            value={achievement}
            onChange={(e) => setAchievement(e.target.value)}
            placeholder="Describe the achievement or reason for this certificate..."
            fullWidth
          />

          <TextField
            label="Additional Information (Optional)"
            multiline
            rows={2}
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder='Optional JSON data or notes, e.g., {"grade": "A+", "year": "2024"}'
            fullWidth
          />

          {isError && (
            <Alert severity="error">
              {(error as any)?.data?.message || 'Failed to issue certificate. Please check blockchain configuration.'}
            </Alert>
          )}

          {isSuccess && data && (
            <Alert severity="success">
              <Typography variant="body2" gutterBottom>
                Certificate issued successfully!
              </Typography>
              {data.data && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" display="block">
                    Certificate ID: {data.data.certificateId}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Transaction: {data.data.transactionHash?.substring(0, 10)}...
                  </Typography>
                  <Typography variant="caption" display="block">
                    IPFS: {data.data.ipfsHash}
                  </Typography>
                </Box>
              )}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading || !certificateType || !achievement}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          Issue Certificate
        </Button>
      </DialogActions>
    </Dialog>
  );
};
