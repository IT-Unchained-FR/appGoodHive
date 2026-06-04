# GoodHive — Technical Challenge
**Candidate:** Aswin Kumar  
**Role:** Junior Blockchain Developer  
**Issued by:** Jubayer Juhan — GoodHive  
**Deadline:** 5 days from receipt

---

## Task: Build a Certificate Registry Smart Contract

Deploy a Solidity smart contract on **Ethereum Sepolia testnet** that allows an institution to issue, verify, and revoke certificates on-chain.

---

## Requirements

### 1. Issue a Certificate
```solidity
function issueCertificate(
    address recipient,
    string calldata courseName,
    string calldata ipfsHash
) external onlyOwner returns (uint256 certificateId)
```
- Only the contract owner can issue certificates
- Each certificate must have a unique auto-incrementing ID
- Store: recipient address, course name, IPFS hash, timestamp, and issuer address

---

### 2. Verify a Certificate
```solidity
function verifyCertificate(uint256 certificateId)
    external view
    returns (address recipient, string memory courseName, uint256 issuedAt, bool isValid)
```
- Anyone can verify a certificate by its ID
- A certificate must return `isValid = false` if it has been revoked

---

### 3. Revoke a Certificate
```solidity
function revokeCertificate(uint256 certificateId) external onlyOwner
```
- Only the owner can revoke a certificate
- Revoked certificates must reflect `isValid = false` in the verify function

---

### 4. Events
Your contract must emit the following events:
```solidity
event CertificateIssued(uint256 indexed certificateId, address indexed recipient, string courseName);
event CertificateRevoked(uint256 indexed certificateId);
```

---

## Bonus (Optional)
- Add a function to retrieve all certificate IDs issued to a specific recipient address
- Write tests using Hardhat or Foundry covering: issue, verify, and revoke

---

## Deliverables

Please submit a GitHub repository containing:

| File | Description |
|------|-------------|
| `contracts/CertificateRegistry.sol` | Your smart contract |
| `README.md` | Deployed contract address on Sepolia + brief explanation of your design choices |
| `test/` *(bonus)* | Test file if you wrote tests |

---

## Submission

Send your GitHub repository link to: **davidjuhan23@gmail.com**  
Subject: `[Blockchain Challenge] Aswin Kumar — Submission`

Questions? Reply to this email.

---

*Good luck — we look forward to reviewing your work.*  
*Jubayer Juhan, GoodHive*
