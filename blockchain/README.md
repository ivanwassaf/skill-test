# Blockchain Certificate System

This directory contains the smart contract implementation for student certificate issuance and verification on blockchain.

## 🏗️ Architecture

- **Smart Contract**: `StudentCertificate.sol` - Solidity contract for certificate management
- **Framework**: Hardhat for development, testing, and deployment
- **Networks**: Support for Localhost, Sepolia (testnet), Polygon, and Mumbai
- **Storage**: IPFS via Pinata for certificate metadata

## 📦 Installation

```bash
cd blockchain
npm install
```

## 🔧 Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your credentials:
```env
PRIVATE_KEY=your_wallet_private_key
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run with coverage:
```bash
npm run coverage
```

## 🚀 Deployment

### Local Network
```bash
# Start local node
npx hardhat node

# Deploy in another terminal
npm run deploy:localhost
```

### Sepolia Testnet
```bash
npm run deploy:sepolia
```

### Polygon Mainnet
```bash
npm run deploy:polygon
```

## 📋 Smart Contract Features

### Certificate Issuance
- Issue certificates with student info and IPFS metadata
- Role-based access control (only authorized issuers)
- Duplicate prevention via IPFS hash tracking
- Event emission for tracking

### Verification
- Verify by certificate ID
- Verify by IPFS hash
- Public verification (anyone can verify)
- Revocation status check

### Role Management
- Admin role for adding/removing issuers
- Issuer role for certificate operations
- OpenZeppelin AccessControl implementation

## 🔑 Contract Methods

### For Issuers
```solidity
issueCertificate(
    address studentAddress,
    string studentName,
    string studentEmail,
    string certificateType,
    string ipfsHash
) returns (uint256)

revokeCertificate(uint256 certificateId)
```

### For Public
```solidity
verifyCertificate(uint256 certificateId) view returns (bool)
verifyCertificateByHash(string ipfsHash) view returns (bool, uint256)
getCertificate(uint256 certificateId) view returns (Certificate)
getStudentCertificates(address studentAddress) view returns (uint256[])
getTotalCertificates() view returns (uint256)
```

### For Admins
```solidity
addIssuer(address issuer)
removeIssuer(address issuer)
```

## 📊 Certificate Structure

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

## 🌐 Network Configurations

| Network | Chain ID | RPC Provider | Block Explorer |
|---------|----------|--------------|----------------|
| Localhost | 31337 | Hardhat Node | - |
| Sepolia | 11155111 | Alchemy/Infura | Etherscan |
| Polygon | 137 | Alchemy/Infura | Polygonscan |
| Mumbai | 80001 | Alchemy/Infura | Polygonscan |

## 📝 Events

```solidity
event CertificateIssued(
    uint256 indexed certificateId,
    address indexed studentAddress,
    string studentName,
    string certificateType,
    string ipfsHash,
    address indexed issuedBy
)

event CertificateRevoked(
    uint256 indexed certificateId,
    address indexed revokedBy,
    uint256 revokedAt
)

event IssuerAdded(address indexed issuer, address indexed addedBy)
event IssuerRemoved(address indexed issuer, address indexed removedBy)
```

## 🔐 Security Features

- Role-based access control via OpenZeppelin
- Duplicate certificate prevention
- Input validation for all parameters
- Revocation mechanism for invalid certificates
- Immutable certificate history on blockchain

## 📖 Usage Example

```javascript
const { ethers } = require("hardhat");

// Get contract instance
const certificate = await ethers.getContractAt(
    "StudentCertificate",
    contractAddress
);

// Issue certificate
const tx = await certificate.issueCertificate(
    "0x123...",
    "John Doe",
    "john@example.com",
    "Academic Excellence",
    "QmIPFSHash123"
);
await tx.wait();

// Verify certificate
const isValid = await certificate.verifyCertificate(1);
console.log("Certificate valid:", isValid);
```

## 🔗 Integration with Backend

The backend API will interact with this contract to:
1. Issue certificates when students achieve milestones
2. Store IPFS hash in certificate metadata
3. Provide verification endpoint for public use
4. Display certificates in student dashboard

## 📚 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Solidity Documentation](https://docs.soliditylang.org)
- [IPFS Documentation](https://docs.ipfs.tech)
