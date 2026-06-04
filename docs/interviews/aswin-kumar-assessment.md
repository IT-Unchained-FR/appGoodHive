# Technical Assessment — Aswin Kumar
**Role:** Junior Blockchain Developer  
**Date:** 2026-05-25  
**Interviewer:** Jubayer Juhan (GoodHive)  
**Status:** Pending Interview

---

## Candidate Profile

| Field | Detail |
|-------|--------|
| Name | Aswin Kumar |
| Location | India |
| Availability | 1–2 months (graduating soon) |
| Experience | Entry level — no professional Web3 experience |
| English | Weak — noted communication gap |
| AI Tool Usage | Uses ChatGPT + Claude for planning, coding, testing |

---

## Projects Reviewed

| Project | Stack | Status |
|---------|-------|--------|
| VerifyX | ERC-721, Ethereum Sepolia | Live on testnet |
| Decentralized Calling App | Smart contracts + (unknown transport) | Live / unclear |
| NFT Marketplace | Solidity | Local only, not deployed |

---

## Scoring Key

| Score | Meaning |
|-------|---------|
| 3 | Strong — clear, confident, correct answer with reasoning |
| 2 | Adequate — correct but shallow, lacks depth or edge case awareness |
| 1 | Weak — partial, vague, or requires heavy prompting |
| 0 | No answer / fundamentally wrong |

---

## Section 1 — Project Ownership & Architecture Understanding
*Goal: Does he truly understand what he built, or did AI write it for him?*

### Q1 — VerifyX: Walk through `mintCertificate` step by step. What's stored on-chain vs. off-chain?
- [ ] 3 — Explains tokenId, tokenURI, event emission, gas trade-offs
- [ ] 2 — Correct but no mention of off-chain metadata (IPFS)
- [ ] 1 — Vague, can't distinguish on-chain state
- [ ] 0 — No answer

**Score: __ / 3**  
**Notes:**

---

### Q2 — VerifyX: If two institutions issue a cert to the same address simultaneously, what happens?
- [ ] 3 — Explains Ethereum's sequential execution, no real race condition
- [ ] 2 — Gets the answer right but can't explain why
- [ ] 1 — Confused, mentions race conditions without resolving them
- [ ] 0 — No answer

**Score: __ / 3**  
**Notes:**

---

### Q3 — VerifyX: What stops someone from submitting a fake transaction hash as proof?
- [ ] 3 — Understands transaction finality, chain immutability, on-chain verification logic
- [ ] 2 — "Blockchain is immutable" without explaining the verification mechanism
- [ ] 1 — Assumes blockchain = secure without reasoning
- [ ] 0 — No answer

**Score: __ / 3**  
**Notes:**

---

### Q4 — Calling App: When User A calls User B and they start talking — where does the audio go? Does it touch the blockchain?
- [ ] 3 — Correctly identifies WebRTC / P2P for audio, blockchain = signaling only
- [ ] 2 — Knows audio doesn't go on-chain but can't explain the transport layer
- [ ] 1 — Believes audio passes through the blockchain
- [ ] 0 — No answer / "the AI built that part"

**Score: __ / 3**  
**Notes:**

---

### Q5 — Calling App: How do two peers discover each other's IP to start a WebRTC call? (STUN/ICE)
- [ ] 3 — Explains ICE candidates, STUN server, NAT traversal
- [ ] 2 — Mentions WebRTC but doesn't know STUN/TURN
- [ ] 1 — Doesn't know, honest about it
- [ ] 0 — Wrong answer given confidently

**Score: __ / 3**  
**Notes:**

---

**Section 1 Subtotal: __ / 15**

---

## Section 2 — Solidity Fundamentals
*Goal: Core language knowledge independent of project context.*

### Q6 — Difference between `storage`, `memory`, and `calldata`?
- [ ] 3 — Correct definitions + correct use case for each + mentions gas cost implications
- [ ] 2 — Correct definitions, no gas reasoning
- [ ] 1 — Partially correct, confuses two of the three
- [ ] 0 — No answer

**Score: __ / 3**  
**Notes:**

---

### Q7 — What is a reentrancy attack? Show a vulnerable pattern and fix it.
- [ ] 3 — Draws vulnerable code, explains CEI pattern + `ReentrancyGuard`
- [ ] 2 — Explains the concept correctly, can't write the fix
- [ ] 1 — Recites definition without understanding the mechanism
- [ ] 0 — No answer

**Score: __ / 3**  
**Notes:**

---

### Q8 — Difference between `transfer`, `send`, and `call` for sending ETH. Which do you use?
- [ ] 3 — Recommends `call`, explains gas limit issue with `transfer`/`send` post-EIP-1884
- [ ] 2 — Knows to use `call` but can't explain why `transfer` is risky
- [ ] 1 — Uses `transfer` without awareness of the risk
- [ ] 0 — No answer

**Score: __ / 3**  
**Notes:**

---

### Q9 — What does `payable` do? Can a function receive ETH without being `payable`?
- [ ] 3 — Correct answer + explains fallback/receive functions
- [ ] 2 — Correct on `payable`, doesn't know fallback
- [ ] 1 — Partially correct
- [ ] 0 — No answer

**Score: __ / 3**  
**Notes:**

---

**Section 2 Subtotal: __ / 12**

---

## Section 3 — ERC Standards & Smart Contract Architecture
*Goal: Does he understand the standards, not just the syntax?*

### Q10 — ERC-721 mandatory functions. What does `safeTransferFrom` do differently than `transferFrom`?
- [ ] 3 — Lists core functions correctly, explains `IERC721Receiver` check in `safeTransferFrom`
- [ ] 2 — Knows the functions, can't explain the safety mechanism
- [ ] 1 — Vague on mandatory interface
- [ ] 0 — No answer

**Score: __ / 3**  
**Notes:**

---

### Q11 — NFT Marketplace: Walk through the approval flow before a sale.
- [ ] 3 — Explains `approve` → `transferFrom` sequence, mentions `setApprovalForAll`
- [ ] 2 — Knows approval is needed, fuzzy on the exact call sequence
- [ ] 1 — Can't explain the ownership transfer flow
- [ ] 0 — Marketplace not built / no answer

**Score: __ / 3**  
**Notes:**

---

### Q12 — How would you add royalties? Have you heard of EIP-2981?
- [ ] 3 — Knows EIP-2981, can explain `royaltyInfo(tokenId, salePrice)` interface
- [ ] 2 — Knows royalties exist as a concept, doesn't know the standard
- [ ] 1 — Would add a custom royalty mapping without knowing the standard
- [ ] 0 — No answer

**Score: __ / 3**  
**Notes:**

---

**Section 3 Subtotal: __ / 9**

---

## Section 4 — Testing & Security Practices
*Goal: Is he production-aware, or purely tutorial-mode?*

### Q13 — How do you test your contracts? Write a test stub for `mintCertificate`.
- [ ] 3 — Uses Hardhat/Foundry, writes meaningful assertions (events, state, reverts)
- [ ] 2 — Uses Hardhat, writes basic assertions but misses edge cases
- [ ] 1 — Tested manually on Remix only
- [ ] 0 — No testing practice

**Score: __ / 3**  
**Notes:**

---

### Q14 — Give an example of AI giving you wrong or insecure code. How did you catch it?
- [ ] 3 — Specific, concrete example with a security or logic issue
- [ ] 2 — Vague example ("the code didn't work"), no security instinct shown
- [ ] 1 — Can't name a specific instance
- [ ] 0 — "AI is always right, I trust it"

**Score: __ / 3**  
**Notes:**

---

### Q15 — What would you do before deploying a contract with real user funds?
- [ ] 3 — Mentions audit, full test coverage, testnet deployment, formal verification awareness
- [ ] 2 — Mentions testnet + some tests, no audit awareness
- [ ] 1 — "Deploy on testnet first" only
- [ ] 0 — Would deploy directly to mainnet

**Score: __ / 3**  
**Notes:**

---

### Q16 — A bug is found post-deployment in an immutable contract. What are your options?
- [ ] 3 — Knows proxy upgrade patterns (Transparent/UUPS), migration strategy, or emergency pause
- [ ] 2 — Knows contracts are immutable, would redeploy but no upgrade pattern knowledge
- [ ] 1 — Doesn't understand immutability implications
- [ ] 0 — "Just fix it and redeploy" without understanding user funds risk

**Score: __ / 3**  
**Notes:**

---

**Section 4 Subtotal: __ / 12**

---

## Section 5 — Independence & Culture Fit
*Goal: Will he function in an async, self-directed environment?*

### Q17 — If you're blocked for 2 hours on a task, what do you do?
- [ ] 3 — Structured: reproduce → docs → GitHub issues → community → then ask
- [ ] 2 — Reasonable approach but leans too quickly on asking/AI
- [ ] 1 — "Ask ChatGPT immediately"
- [ ] 0 — No structured approach

**Score: __ / 3**  
**Notes:**

---

### Q18 — What Web3 concept are you reading about right now, just out of curiosity?
- [ ] 3 — Specific, recent, unprompted topic (ZK proofs, account abstraction, MEV, etc.)
- [ ] 2 — Generic ("I'm learning Solidity") — not self-directed curiosity
- [ ] 1 — Nothing specific
- [ ] 0 — Can't answer

**Score: __ / 3**  
**Notes:**

---

**Section 5 Subtotal: __ / 6**

---

## Total Score

| Section | Score | Max |
|---------|-------|-----|
| 1 — Project Ownership | __ | 15 |
| 2 — Solidity Fundamentals | __ | 12 |
| 3 — ERC Standards & Architecture | __ | 9 |
| 4 — Testing & Security | __ | 12 |
| 5 — Independence & Culture | __ | 6 |
| **TOTAL** | __ | **54** |

---

## Score Interpretation

| Range | Verdict |
|-------|---------|
| 43–54 (80%+) | **Strong hire** — real potential, hire with standard mentorship |
| 32–42 (60–79%) | **Conditional hire** — good foundation, needs structured onboarding and non-critical first tasks |
| 22–31 (40–59%) | **Not ready** — motivated but too early for a professional role |
| Below 22 | **Do not hire** — surface knowledge only, AI-dependent |

---

## Red Flags Observed

- [ ] Could not explain own project's data model
- [ ] Said "blockchain = secure" as a complete answer
- [ ] Never caught an AI mistake / no specific example
- [ ] Only tested on Remix, never wrote unit tests
- [ ] Believed voice data passes through the blockchain
- [ ] Vague on why ERC-721 vs ERC-20 for certificates
- [ ] No awareness of proxy upgrade patterns

---

## Green Flags Observed

- [ ] Mentioned gas optimization unprompted
- [ ] Named a specific vulnerability (reentrancy, overflow, etc.)
- [ ] Knows the CEI pattern from memory
- [ ] Has read an audit report or EIP independently
- [ ] Can articulate what he does NOT know yet
- [ ] Specific example of AI giving wrong/insecure code

---

## Final Verdict

**[ ] HIRE — [ ] CONDITIONAL HIRE — [ ] DO NOT HIRE**

**Interviewer Notes:**

```
(free text)
```

**Recommended Next Step:**
```
(free text)
```

---

*Assessment created by Claude Code — GoodHive internal use only*
