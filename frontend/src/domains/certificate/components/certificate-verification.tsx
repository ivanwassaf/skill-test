import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Paper,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Search as SearchIcon,
  OpenInNew,
} from '@mui/icons-material';
import { useLazyVerifyCertificateQuery } from '../api';

export const CertificateVerification: React.FC = () => {
  const [certificateId, setCertificateId] = useState('');
  const [verifyCertificate, { data, isLoading, isError, error }] = useLazyVerifyCertificateQuery();

  const handleVerify = async () => {
    if (!certificateId.trim()) return;
    await verifyCertificate(certificateId);
  };

  const certificateData = data?.data;
  const isValid = data?.valid;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Verify Certificate
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Enter a certificate ID to verify its authenticity on the blockchain
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <TextField
              fullWidth
              label="Certificate ID"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              placeholder="Enter certificate ID (e.g., 1, 2, 3...)"
              onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
            />
            <Button
              variant="contained"
              onClick={handleVerify}
              disabled={isLoading || !certificateId.trim()}
              startIcon={isLoading ? <CircularProgress size={20} /> : <SearchIcon />}
              sx={{ minWidth: 120 }}
            >
              Verify
            </Button>
          </Box>

          {isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(error as any)?.data?.message || 'Failed to verify certificate'}
            </Alert>
          )}

          {data && (
            <Paper elevation={2} sx={{ mt: 3, p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {isValid ? (
                  <>
                    <CheckCircle color="success" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6" color="success.main">
                        Valid Certificate
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        This certificate is authentic and has not been revoked
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <>
                    <Cancel color="error" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6" color="error.main">
                        Invalid Certificate
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Certificate not found or has been revoked
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>

              {certificateData && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Certificate ID
                      </Typography>
                      <Typography variant="body1">{certificateData.id}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Student Name
                      </Typography>
                      <Typography variant="body1">{certificateData.studentName}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Student Email
                      </Typography>
                      <Typography variant="body1">{certificateData.studentEmail}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Certificate Type
                      </Typography>
                      <Typography variant="body1">
                        <Chip label={certificateData.certificateType} color="primary" size="small" />
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Issued Date
                      </Typography>
                      <Typography variant="body1">
                        {new Date(certificateData.issuedAt).toLocaleString()}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Issued By
                      </Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                        {certificateData.issuedBy}
                      </Typography>
                    </Box>

                    {certificateData.metadata?.certificateData && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Achievement
                        </Typography>
                        <Typography variant="body1">
                          {certificateData.metadata.certificateData.achievement}
                        </Typography>
                      </Box>
                    )}

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        IPFS Hash
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {certificateData.ipfsHash}
                        </Typography>
                        {certificateData.ipfsUrl && (
                          <Button
                            size="small"
                            endIcon={<OpenInNew />}
                            onClick={() => window.open(certificateData.ipfsUrl, '_blank')}
                          >
                            View Metadata
                          </Button>
                        )}
                      </Box>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Typography variant="body1">
                        <Chip
                          label={certificateData.revoked ? 'Revoked' : 'Active'}
                          color={certificateData.revoked ? 'error' : 'success'}
                          size="small"
                        />
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
            </Paper>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
