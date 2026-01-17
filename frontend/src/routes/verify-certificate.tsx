import { Box, Container, Typography, Paper } from '@mui/material';
import { CertificateVerification } from '@/domains/certificate';

export const VerifyCertificatePage = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: 4, mb: 4, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h3" gutterBottom>
            Certificate Verification
          </Typography>
          <Typography variant="h6">
            Verify the authenticity of student certificates on the blockchain
          </Typography>
        </Paper>

        <CertificateVerification />

        <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            About Certificate Verification
          </Typography>
          <Typography variant="body2" paragraph>
            All certificates issued through our system are stored on the blockchain, ensuring their authenticity and preventing fraud.
          </Typography>
          <Typography variant="body2" paragraph>
            Each certificate has a unique ID and is linked to immutable data stored on IPFS (InterPlanetary File System),
            making it impossible to forge or tamper with.
          </Typography>
          <Typography variant="body2">
            Simply enter the certificate ID you received to verify its authenticity instantly.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};
