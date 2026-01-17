# 🎓 Student Certificate System - Blockchain Implementation

## 📋 Overview

This implementation provides a complete blockchain-based certificate verification system for student achievements. Certificates are issued on-chain with metadata stored on IPFS, ensuring immutability, transparency, and easy verification.

## 🏗️ Architecture

### Components

1. **Smart Contract** (`StudentCertificate.sol`)
   - Solidity contract deployed on Ethereum/Polygon networks
   - Manages certificate issuance, verification, and revocation
   - Role-based access control (Admin and Issuer roles)

2. **Backend Service** (`backend/src/modules/certificates/`)
   - Node.js service using ethers.js
   - Interacts with smart contract
   - Manages IPFS uploads via Pinata
   - Provides REST API endpoints

3. **Frontend Components** (`frontend/src/domains/certificate/`)
   - React components for issuing certificates
   - Public verification page
   - Student certificate list display

## 🚀 Quick Start

### 1. Deploy Smart Contract

```bash
cd blockchain

# Install dependencies
npm install

# Start local Hardhat node (for development)
npx hardhat node

# Deploy to local network (in another terminal)
npm run deploy:localhost

# Or deploy to Sepolia testnet
npm run deploy:sepolia

# Or deploy to Polygon mainnet
npm run deploy:polygon
```

After deployment, note the contract address from the output.

### 2. Configure Backend

Add to `backend/.env`:

```env
# Blockchain Configuration
BLOCKCHAIN_NETWORK=localhost  # or sepolia, polygon, mumbai
BLOCKCHAIN_PRIVATE_KEY=your_wallet_private_key_here
BLOCKCHAIN_CONTRACT_ADDRESS=deployed_contract_address_here
LOCALHOST_RPC_URL=http://127.0.0.1:8545
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY

# IPFS Configuration (Pinata)
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
# This will install ethers@6.9.0 and form-data@4.0.0
```

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
# This will install ethers@6.9.0
```

### 5. Restart Services

```bash
# With Docker
docker-compose restart backend frontend

# Or without Docker
cd backend && npm start
cd frontend && npm run dev
```

## 📝 Usage

### Issuing a Certificate

1. Navigate to Students list (`/app/students`)
2. Click the 3-dot menu on any student
3. Select "Issue Certificate"
4. Fill in:
   - Certificate Type (e.g., "Academic Excellence")
   - Achievement Description
   - Additional Info (optional JSON)
5. Click "Issue Certificate"

The system will:
1. Upload metadata to IPFS via Pinata
2. Issue certificate on blockchain
3. Return certificate ID and transaction hash

### Verifying a Certificate

#### Public Verification Page
1. Go to `/verify-certificate` (no login required)
2. Enter the certificate ID
3. Click "Verify"

#### API Verification
```bash
GET /api/v1/certificates/verify/:certificateId
```

### Viewing Student Certificates

1. Go to student detail page
2. View "Blockchain Certificates" section
3. Click "View on IPFS" to see metadata

Or via API:
```bash
GET /api/v1/certificates/student/:studentId
```

## 🔧 API Endpoints

### Public Endpoints (No Authentication)

```
GET /api/v1/certificates/verify/:certificateId
```
Verify certificate validity by ID.

```
GET /api/v1/certificates/details/:certificateId
```
Get full certificate details including IPFS metadata.

### Protected Endpoints (Requires Authentication)

```
POST /api/v1/certificates
Body: {
  studentId: string,
  certificateType: string,
  achievement: string,
  additionalInfo?: object
}
```
Issue a new certificate.

```
GET /api/v1/certificates/student/:studentId
```
Get all certificates for a student.

```
POST /api/v1/certificates/:certificateId/revoke
```
Revoke a certificate (Issuer role required).

```
GET /api/v1/certificates/stats
```
Get blockchain statistics.

## 🔐 Security Features

### Smart Contract
- **Role-based access control**: Only authorized issuers can issue certificates
- **Duplicate prevention**: Each IPFS hash can only be used once
- **Immutable records**: Certificates cannot be deleted, only revoked
- **Event logging**: All actions emit events for transparency

### Backend
- **Authentication required**: Only logged-in users can issue certificates
- **CSRF protection**: All mutations require CSRF tokens
- **Input validation**: All inputs are validated before processing
- **Error handling**: Comprehensive error handling and logging

### IPFS
- **Pinning**: All metadata is pinned to Pinata for permanent storage
- **Content addressing**: Files are addressed by their hash, ensuring integrity
- **Decentralized**: No single point of failure

## 🌐 Network Support

| Network | Type | Recommended For |
|---------|------|-----------------|
| Localhost | Development | Testing and development |
| Sepolia | Testnet | Staging and testing |
| Mumbai | Testnet | Polygon testing |
| Polygon | Mainnet | Production (low fees) |

### Gas Costs (Approximate)

- **Issue Certificate**: ~150,000 gas (~$0.02 on Polygon)
- **Revoke Certificate**: ~50,000 gas (~$0.01 on Polygon)
- **Verify Certificate**: Free (read-only)

## 📊 Certificate Structure

### On-Chain Data
```solidity
struct Certificate {
    uint256 id;
    address studentAddress;
    string studentName;
    string studentEmail;
    string certificateType;
    string ipfsHash;
    uint256 issuedAt;
    address issuedBy;
    bool revoked;
}
```

### IPFS Metadata
```json
{
  "name": "Certificate - John Doe",
  "description": "Student Achievement Certificate",
  "certificateData": {
    "studentName": "John Doe",
    "studentEmail": "john@example.com",
    "studentId": "123",
    "certificateType": "Academic Excellence",
    "achievement": "Outstanding performance in all subjects",
    "issuedDate": "2024-01-15T10:30:00Z",
    "issuer": "Principal Name",
    "institution": "School Management System",
    "additionalInfo": {
      "grade": "A+",
      "year": "2024"
    }
  }
}
```

## 🧪 Testing

```bash
cd blockchain

# Run all tests
npm test

# Run with coverage
npm run coverage

# Run specific test
npx hardhat test test/StudentCertificate.test.js
```

## 🐛 Troubleshooting

### "Blockchain service not initialized"
- Check that `BLOCKCHAIN_PRIVATE_KEY` and `BLOCKCHAIN_CONTRACT_ADDRESS` are set in backend `.env`
- Verify the contract is deployed on the configured network
- Check backend logs for initialization errors

### "IPFS service not configured"
- Add `PINATA_API_KEY` and `PINATA_SECRET_KEY` to backend `.env`
- Get API keys from [Pinata](https://pinata.cloud)

### "Failed to issue certificate"
- Ensure wallet has enough ETH/MATIC for gas fees
- Check that issuer address has ISSUER_ROLE on the contract
- Verify RPC URL is correct and responsive

### Certificate verification shows "Invalid"
- Certificate may have been revoked
- Check certificate ID is correct
- Verify you're checking on the correct network

## 📚 Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [ethers.js Documentation](https://docs.ethers.org/v6/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Pinata IPFS Documentation](https://docs.pinata.cloud)
- [Polygon Network](https://polygon.technology/)

## 🔮 Future Enhancements

- [ ] NFT certificates (ERC-721 standard)
- [ ] Certificate templates with customizable designs
- [ ] Batch certificate issuance
- [ ] Certificate expiration dates
- [ ] PDF generation from on-chain data
- [ ] QR code with certificate ID
- [ ] Email notifications on issuance
- [ ] Certificate transfer functionality
- [ ] Multi-signature issuance
- [ ] Integration with educational credentials standards
