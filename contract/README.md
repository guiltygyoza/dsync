# EIPManager Smart Contract

## Overview

The EIPManager is a Solidity smart contract designed to manage the lifecycle and status of Ethereum Improvement Proposals (EIPs) on-chain. This contract implements the status transitions defined in EIP-1, providing a transparent and decentralized way to track EIP progress.

Key features:
- EIP Editor role management
- EIP registration and metadata tracking
- Status transitions with strict permission controls
- Automated stagnation detection after 6 months of inactivity

## Contract Architecture

```
EIPManager Contract
|
+-- State Variables
|   |-- address eipEditor
|   +-- mapping(uint => EIP) eips
|
+-- Structs
|   +-- EIP
|       |-- uint eipId
|       |-- address[] authors
|       |-- EIPStatus status
|       |-- uint creationDate
|       +-- uint lastUpdateDate
|
+-- Enums
|   +-- EIPStatus (Draft, Review, LastCall, Final, Stagnant, Withdrawn, Living)
|
+-- Key Functions
|   |-- constructor()
|   |-- updateEipEditor(address newEditor)
|   |-- registerEIP(uint eipId, address[] _authors)
|   |-- changeEIPStatus(uint eipId, EIPStatus newStatus)
|   |-- getCurrentEIPEditor()
|   |-- getEIPAuthors(uint eipId)
|   +-- isEIPAuthor(uint eipId, address author)
|
+-- Events
    |-- NewEIPEditorInaugurated(address indexed oldEditor, address indexed newEditor)
    |-- NewEIPRegistered(uint indexed eipId, address[] authors, address indexed editor)
    +-- EIPStatusChanged(uint indexed eipId, EIPStatus oldStatus, EIPStatus newStatus, address indexed changedBy)
```

## Core Functionalities Explained

### EIP Editor

The EIP Editor is a special role that has elevated permissions within the contract. The initial EIP Editor is set to the contract deployer's address. The current EIP Editor can transfer this role to a new address using the `updateEipEditor` function.

The EIP Editor has exclusive rights to:
- Register new EIPs
- Move EIPs from Review to LastCall
- Move EIPs from LastCall to Final, Living, or back to Review

### EIP Registration

Only the EIP Editor can register new EIPs using the `registerEIP` function. Each EIP is assigned a unique ID and must have at least one author. When registered, an EIP starts in the Draft status and has its creation and last update timestamps set.

### Status Transitions

The `changeEIPStatus` function allows for changing an EIP's status according to strict transition rules. Different transitions are permitted based on:
1. The caller's role (EIP Editor or author)
2. The current status of the EIP
3. Time-based conditions (for Stagnant status)

The contract enforces the following transition rules:
- From Draft: Authors can move to Review or Withdrawn; either Editor or authors can mark as Stagnant after 6 months
- From Review: Editor can move to LastCall; authors can move back to Draft or to Withdrawn; either can mark as Stagnant after 6 months
- From LastCall: Only Editor can move to Final, Living, or back to Review
- From Withdrawn: Only authors can move back to Draft
- From Stagnant: Either Editor or authors can move back to Draft
- From Final or Living: No transitions allowed

Each status change updates the `lastUpdateDate` timestamp, which is used to determine inactivity.

### Inactivity (Stagnant)

An EIP can be marked as Stagnant if it has been inactive for at least 6 months (180 days). This is determined by comparing the current timestamp with the EIP's `lastUpdateDate`. Either the EIP Editor or any of the EIP's authors can mark an inactive EIP as Stagnant.

### Access Control for Offchain Systems

The contract serves as a source of truth for permissions in offchain discussion forums through the following query functions:

- `getCurrentEIPEditor()`: Returns the address of the current EIP Editor, allowing offchain systems to identify the editor for permission checks.

- `getEIPAuthors(uint eipId)`: Returns the complete list of author addresses for a specific EIP, enabling offchain systems to verify authorship.

- `isEIPAuthor(uint eipId, address author)`: Provides a convenient way to check if a specific address is an author of a given EIP, simplifying permission checks in offchain systems.

These functions enable seamless integration with offchain discussion forums and other systems that need to enforce the same permission model as the onchain contract.

## Setup and Usage

### Prerequisites

- Node.js and npm installed
- Hardhat development environment

### Compilation and Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile the contract:
   ```bash
   npx hardhat compile
   ```

3. Deploy the contract (example using Hardhat):
   ```bash
   npx hardhat run scripts/deploy.js --network <your-network>
   ```

## Running Tests

The contract comes with comprehensive tests covering all core functionalities and state transitions.

### For a Fresh Repository Checkout

When you first clone the repository, you'll need to follow these steps to run the tests:

```bash
# 1. Install dependencies
npm install

# 2. Compile the smart contracts
npx hardhat compile

# 3. Run the tests
npx hardhat test
```

> **Note:** The compilation step is necessary when running tests for the first time or after making changes to the contracts. Hardhat stores compiled artifacts in the `cache` and `artifacts` directories, which are not included in the repository.

The tests cover all core functionalities including:
- EIP Editor management
- EIP registration
- All valid and invalid status transitions
- Permission controls
- Stagnant state logic
- Multiple authors functionality
- Access control query functions
- Edge cases
