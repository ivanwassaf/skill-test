import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
} from '@mui/material';
import { OpenInNew, CheckCircle, Cancel } from '@mui/icons-material';
import { useGetStudentCertificatesQuery } from '../api';

interface StudentCertificatesListProps {
  studentId: string;
}

export const StudentCertificatesList: React.FC<StudentCertificatesListProps> = ({ studentId }) => {
  const { data, isLoading, isError } = useGetStudentCertificatesQuery(studentId);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        Failed to load certificates. Blockchain service may not be configured.
      </Alert>
    );
  }

  const certificates = data?.data || [];

  if (certificates.length === 0) {
    return (
      <Alert severity="info">
        No certificates have been issued for this student yet.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Blockchain Certificates ({certificates.length})
        </Typography>
        <List>
          {certificates.map((cert, index) => (
            <React.Fragment key={cert.id}>
              {index > 0 && <Divider />}
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle1">{cert.certificateType}</Typography>
                      <Chip
                        icon={cert.revoked ? <Cancel /> : <CheckCircle />}
                        label={cert.revoked ? 'Revoked' : 'Valid'}
                        color={cert.revoked ? 'error' : 'success'}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Certificate ID: <strong>{cert.id}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        IPFS: {cert.ipfsHash.substring(0, 20)}...
                      </Typography>
                      {cert.ipfsUrl && (
                        <Button
                          size="small"
                          endIcon={<OpenInNew />}
                          onClick={() => window.open(cert.ipfsUrl, '_blank')}
                          sx={{ mt: 1 }}
                        >
                          View on IPFS
                        </Button>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};
