const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("StudentCertificate", function () {
  // Fixture to deploy the contract
  async function deployStudentCertificateFixture() {
    const [owner, issuer, student, otherAccount] = await ethers.getSigners();
    
    const StudentCertificate = await ethers.getContractFactory("StudentCertificate");
    const certificate = await StudentCertificate.deploy();
    
    return { certificate, owner, issuer, student, otherAccount };
  }
  
  describe("Deployment", function () {
    it("Should set the right owner with admin role", async function () {
      const { certificate, owner } = await loadFixture(deployStudentCertificateFixture);
      
      const DEFAULT_ADMIN_ROLE = await certificate.DEFAULT_ADMIN_ROLE();
      expect(await certificate.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });
    
    it("Should grant issuer role to deployer", async function () {
      const { certificate, owner } = await loadFixture(deployStudentCertificateFixture);
      
      const ISSUER_ROLE = await certificate.ISSUER_ROLE();
      expect(await certificate.hasRole(ISSUER_ROLE, owner.address)).to.be.true;
    });
  });
  
  describe("Role Management", function () {
    it("Should allow admin to add new issuer", async function () {
      const { certificate, owner, issuer } = await loadFixture(deployStudentCertificateFixture);
      
      const ISSUER_ROLE = await certificate.ISSUER_ROLE();
      await expect(certificate.addIssuer(issuer.address))
        .to.emit(certificate, "IssuerAdded")
        .withArgs(issuer.address, owner.address);
      
      expect(await certificate.hasRole(ISSUER_ROLE, issuer.address)).to.be.true;
    });
    
    it("Should allow admin to remove issuer", async function () {
      const { certificate, owner, issuer } = await loadFixture(deployStudentCertificateFixture);
      
      await certificate.addIssuer(issuer.address);
      
      const ISSUER_ROLE = await certificate.ISSUER_ROLE();
      await expect(certificate.removeIssuer(issuer.address))
        .to.emit(certificate, "IssuerRemoved")
        .withArgs(issuer.address, owner.address);
      
      expect(await certificate.hasRole(ISSUER_ROLE, issuer.address)).to.be.false;
    });
    
    it("Should not allow non-admin to add issuer", async function () {
      const { certificate, issuer, otherAccount } = await loadFixture(deployStudentCertificateFixture);
      
      await expect(
        certificate.connect(otherAccount).addIssuer(issuer.address)
      ).to.be.reverted;
    });
  });
  
  describe("Certificate Issuance", function () {
    it("Should issue a certificate successfully", async function () {
      const { certificate, owner, student } = await loadFixture(deployStudentCertificateFixture);
      
      const studentName = "John Doe";
      const studentEmail = "john@example.com";
      const certType = "Academic Excellence";
      const ipfsHash = "QmTestHash123";
      
      await expect(
        certificate.issueCertificate(
          student.address,
          studentName,
          studentEmail,
          certType,
          ipfsHash
        )
      )
        .to.emit(certificate, "CertificateIssued")
        .withArgs(1, student.address, studentName, certType, ipfsHash, owner.address);
      
      expect(await certificate.getTotalCertificates()).to.equal(1);
    });
    
    it("Should not allow duplicate IPFS hash", async function () {
      const { certificate, student } = await loadFixture(deployStudentCertificateFixture);
      
      const ipfsHash = "QmTestHash123";
      
      await certificate.issueCertificate(
        student.address,
        "John Doe",
        "john@example.com",
        "Excellence",
        ipfsHash
      );
      
      await expect(
        certificate.issueCertificate(
          student.address,
          "Jane Doe",
          "jane@example.com",
          "Achievement",
          ipfsHash
        )
      ).to.be.revertedWith("Certificate already exists");
    });
    
    it("Should reject invalid student address", async function () {
      const { certificate } = await loadFixture(deployStudentCertificateFixture);
      
      await expect(
        certificate.issueCertificate(
          ethers.ZeroAddress,
          "John Doe",
          "john@example.com",
          "Excellence",
          "QmHash"
        )
      ).to.be.revertedWith("Invalid student address");
    });
    
    it("Should not allow non-issuer to issue certificate", async function () {
      const { certificate, student, otherAccount } = await loadFixture(deployStudentCertificateFixture);
      
      await expect(
        certificate.connect(otherAccount).issueCertificate(
          student.address,
          "John Doe",
          "john@example.com",
          "Excellence",
          "QmHash"
        )
      ).to.be.reverted;
    });
  });
  
  describe("Certificate Verification", function () {
    it("Should verify valid certificate", async function () {
      const { certificate, student } = await loadFixture(deployStudentCertificateFixture);
      
      await certificate.issueCertificate(
        student.address,
        "John Doe",
        "john@example.com",
        "Excellence",
        "QmHash"
      );
      
      expect(await certificate.verifyCertificate(1)).to.be.true;
    });
    
    it("Should return false for non-existent certificate", async function () {
      const { certificate } = await loadFixture(deployStudentCertificateFixture);
      
      expect(await certificate.verifyCertificate(999)).to.be.false;
    });
    
    it("Should verify certificate by IPFS hash", async function () {
      const { certificate, student } = await loadFixture(deployStudentCertificateFixture);
      
      const ipfsHash = "QmTestHash123";
      await certificate.issueCertificate(
        student.address,
        "John Doe",
        "john@example.com",
        "Excellence",
        ipfsHash
      );
      
      const [isValid, certId] = await certificate.verifyCertificateByHash(ipfsHash);
      expect(isValid).to.be.true;
      expect(certId).to.equal(1);
    });
  });
  
  describe("Certificate Revocation", function () {
    it("Should revoke certificate", async function () {
      const { certificate, owner, student } = await loadFixture(deployStudentCertificateFixture);
      
      await certificate.issueCertificate(
        student.address,
        "John Doe",
        "john@example.com",
        "Excellence",
        "QmHash"
      );
      
      await expect(certificate.revokeCertificate(1))
        .to.emit(certificate, "CertificateRevoked")
        .withArgs(1, owner.address, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));
      
      expect(await certificate.verifyCertificate(1)).to.be.false;
    });
    
    it("Should not allow revoking already revoked certificate", async function () {
      const { certificate, student } = await loadFixture(deployStudentCertificateFixture);
      
      await certificate.issueCertificate(
        student.address,
        "John Doe",
        "john@example.com",
        "Excellence",
        "QmHash"
      );
      
      await certificate.revokeCertificate(1);
      
      await expect(
        certificate.revokeCertificate(1)
      ).to.be.revertedWith("Certificate already revoked");
    });
    
    it("Should not allow non-issuer to revoke certificate", async function () {
      const { certificate, student, otherAccount } = await loadFixture(deployStudentCertificateFixture);
      
      await certificate.issueCertificate(
        student.address,
        "John Doe",
        "john@example.com",
        "Excellence",
        "QmHash"
      );
      
      await expect(
        certificate.connect(otherAccount).revokeCertificate(1)
      ).to.be.reverted;
    });
  });
  
  describe("Certificate Retrieval", function () {
    it("Should get certificate details", async function () {
      const { certificate, student } = await loadFixture(deployStudentCertificateFixture);
      
      const studentName = "John Doe";
      const studentEmail = "john@example.com";
      const certType = "Excellence";
      const ipfsHash = "QmHash";
      
      await certificate.issueCertificate(
        student.address,
        studentName,
        studentEmail,
        certType,
        ipfsHash
      );
      
      const cert = await certificate.getCertificate(1);
      expect(cert.id).to.equal(1);
      expect(cert.studentAddress).to.equal(student.address);
      expect(cert.studentName).to.equal(studentName);
      expect(cert.studentEmail).to.equal(studentEmail);
      expect(cert.certificateType).to.equal(certType);
      expect(cert.ipfsHash).to.equal(ipfsHash);
      expect(cert.revoked).to.be.false;
    });
    
    it("Should get all student certificates", async function () {
      const { certificate, student } = await loadFixture(deployStudentCertificateFixture);
      
      await certificate.issueCertificate(
        student.address,
        "John Doe",
        "john@example.com",
        "Excellence",
        "QmHash1"
      );
      
      await certificate.issueCertificate(
        student.address,
        "John Doe",
        "john@example.com",
        "Achievement",
        "QmHash2"
      );
      
      const certs = await certificate.getStudentCertificates(student.address);
      expect(certs.length).to.equal(2);
      expect(certs[0]).to.equal(1);
      expect(certs[1]).to.equal(2);
    });
  });

  describe("Optional IPFS Hash", function () {
    it("Should allow issuing certificate with empty IPFS hash", async function () {
      const { certificate, student } = await loadFixture(deployStudentCertificateFixture);
      
      await expect(
        certificate.issueCertificate(
          student.address,
          "John Doe",
          "john@example.com",
          "Excellence",
          ""
        )
      ).to.not.be.reverted;
      
      const cert = await certificate.getCertificate(1);
      expect(cert.ipfsHash).to.equal("");
    });

    it("Should allow multiple certificates with empty IPFS hash", async function () {
      const { certificate, student } = await loadFixture(deployStudentCertificateFixture);
      
      await certificate.issueCertificate(
        student.address,
        "John Doe",
        "john@example.com",
        "Excellence",
        ""
      );
      
      await expect(
        certificate.issueCertificate(
          student.address,
          "Jane Doe",
          "jane@example.com",
          "Achievement",
          ""
        )
      ).to.not.be.reverted;
      
      expect(await certificate.getTotalCertificates()).to.equal(2);
    });

    it("Should still reject duplicate non-empty IPFS hash", async function () {
      const { certificate, student } = await loadFixture(deployStudentCertificateFixture);
      
      await certificate.issueCertificate(
        student.address,
        "John Doe",
        "john@example.com",
        "Excellence",
        "QmHash123"
      );
      
      await expect(
        certificate.issueCertificate(
          student.address,
          "Jane Doe",
          "jane@example.com",
          "Achievement",
          "QmHash123"
        )
      ).to.be.revertedWith("Certificate already exists");
    });
  });
});
