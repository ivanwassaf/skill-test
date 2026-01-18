// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title StudentCertificate
 * @dev Smart contract for issuing and verifying student achievement certificates
 * @notice This contract allows authorized issuers to mint certificates with IPFS metadata
 */
contract StudentCertificate is AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    
    uint256 private _certificateIdCounter;
    
    struct Certificate {
        uint256 id;
        address studentAddress;
        string studentName;
        string studentEmail;
        string certificateType;  // e.g., "Academic Excellence", "Graduation", "Achievement"
        string ipfsHash;         // IPFS hash containing full certificate metadata
        uint256 issuedAt;
        address issuedBy;
        bool revoked;
    }
    
    // Mapping from certificate ID to Certificate
    mapping(uint256 => Certificate) private certificates;
    
    // Mapping from student address to array of certificate IDs
    mapping(address => uint256[]) private studentCertificates;
    
    // Mapping to track if a specific hash has been used
    mapping(string => bool) private usedHashes;
    
    // Events
    event CertificateIssued(
        uint256 indexed certificateId,
        address indexed studentAddress,
        string studentName,
        string certificateType,
        string ipfsHash,
        address indexed issuedBy
    );
    
    event CertificateRevoked(
        uint256 indexed certificateId,
        address indexed revokedBy,
        uint256 revokedAt
    );
    
    event IssuerAdded(address indexed issuer, address indexed addedBy);
    event IssuerRemoved(address indexed issuer, address indexed removedBy);
    
    /**
     * @dev Constructor sets the deployer as admin and first issuer
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
    }
    
    /**
     * @dev Issue a new certificate
     * @param studentAddress Ethereum address of the student
     * @param studentName Full name of the student
     * @param studentEmail Email of the student
     * @param certificateType Type of certificate being issued
     * @param ipfsHash IPFS hash containing certificate metadata
     */
    function issueCertificate(
        address studentAddress,
        string memory studentName,
        string memory studentEmail,
        string memory certificateType,
        string memory ipfsHash
    ) external onlyRole(ISSUER_ROLE) returns (uint256) {
        require(studentAddress != address(0), "Invalid student address");
        require(bytes(studentName).length > 0, "Student name required");
        require(bytes(certificateType).length > 0, "Certificate type required");
        
        // Only check for duplicate hash if IPFS hash is provided
        if (bytes(ipfsHash).length > 0) {
            require(!usedHashes[ipfsHash], "Certificate already exists");
        }
        
        _certificateIdCounter++;
        uint256 newCertificateId = _certificateIdCounter;
        
        certificates[newCertificateId] = Certificate({
            id: newCertificateId,
            studentAddress: studentAddress,
            studentName: studentName,
            studentEmail: studentEmail,
            certificateType: certificateType,
            ipfsHash: ipfsHash,
            issuedAt: block.timestamp,
            issuedBy: msg.sender,
            revoked: false
        });
        
        studentCertificates[studentAddress].push(newCertificateId);
        
        // Only mark hash as used if IPFS hash is provided
        if (bytes(ipfsHash).length > 0) {
            usedHashes[ipfsHash] = true;
        }
        
        emit CertificateIssued(
            newCertificateId,
            studentAddress,
            studentName,
            certificateType,
            ipfsHash,
            msg.sender
        );
        
        return newCertificateId;
    }
    
    /**
     * @dev Revoke a certificate
     * @param certificateId ID of the certificate to revoke
     */
    function revokeCertificate(uint256 certificateId) external onlyRole(ISSUER_ROLE) {
        require(certificates[certificateId].id != 0, "Certificate does not exist");
        require(!certificates[certificateId].revoked, "Certificate already revoked");
        
        certificates[certificateId].revoked = true;
        
        emit CertificateRevoked(certificateId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Verify if a certificate is valid
     * @param certificateId ID of the certificate to verify
     * @return bool True if certificate exists and is not revoked
     */
    function verifyCertificate(uint256 certificateId) external view returns (bool) {
        Certificate memory cert = certificates[certificateId];
        return cert.id != 0 && !cert.revoked;
    }
    
    /**
     * @dev Get certificate details
     * @param certificateId ID of the certificate
     * @return Certificate struct
     */
    function getCertificate(uint256 certificateId) external view returns (Certificate memory) {
        require(certificates[certificateId].id != 0, "Certificate does not exist");
        return certificates[certificateId];
    }
    
    /**
     * @dev Get all certificates for a student
     * @param studentAddress Address of the student
     * @return Array of certificate IDs
     */
    function getStudentCertificates(address studentAddress) external view returns (uint256[] memory) {
        return studentCertificates[studentAddress];
    }
    
    /**
     * @dev Verify certificate by IPFS hash
     * @param ipfsHash IPFS hash to verify
     * @return bool True if hash exists and certificate is not revoked
     */
    function verifyCertificateByHash(string memory ipfsHash) external view returns (bool, uint256) {
        if (!usedHashes[ipfsHash]) {
            return (false, 0);
        }
        
        // Find certificate by hash
        for (uint256 i = 1; i <= _certificateIdCounter; i++) {
            if (keccak256(bytes(certificates[i].ipfsHash)) == keccak256(bytes(ipfsHash))) {
                return (!certificates[i].revoked, i);
            }
        }
        
        return (false, 0);
    }
    
    /**
     * @dev Get total number of certificates issued
     * @return uint256 Total count
     */
    function getTotalCertificates() external view returns (uint256) {
        return _certificateIdCounter;
    }
    
    /**
     * @dev Add a new issuer (only admin)
     * @param issuer Address to grant issuer role
     */
    function addIssuer(address issuer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ISSUER_ROLE, issuer);
        emit IssuerAdded(issuer, msg.sender);
    }
    
    /**
     * @dev Remove an issuer (only admin)
     * @param issuer Address to revoke issuer role
     */
    function removeIssuer(address issuer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(ISSUER_ROLE, issuer);
        emit IssuerRemoved(issuer, msg.sender);
    }
}
