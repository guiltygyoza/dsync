const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EIPManager", function () {
  let EIPManager;
  let eipManager;
  let owner;
  let newEditor;
  let author1;
  let author2;
  let nonAuthor;
  let authors;

  // Enum values for EIPStatus
  const EIPStatus = {
    Draft: 0,
    Review: 1,
    LastCall: 2,
    Final: 3,
    Stagnant: 4,
    Withdrawn: 5,
    Living: 6
  };

  // Helper function to increase time on the blockchain
  async function increaseTime(seconds) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine");
  }

  beforeEach(async function () {
    // Get signers for testing
    [owner, newEditor, author1, author2, nonAuthor] = await ethers.getSigners();
    authors = [author1.address, author2.address];

    // Deploy the contract
    EIPManager = await ethers.getContractFactory("EIPManager");
    eipManager = await EIPManager.deploy();
  });

  describe("Deployment & Initialization", function () {
    it("Should set the deployer as the EIP Editor", async function () {
      expect(await eipManager.eipEditor()).to.equal(owner.address);
    });
  });

  describe("EIP Editor Management", function () {
    it("Should allow the current editor to update the EIP Editor", async function () {
      const tx = await eipManager.updateEipEditor(newEditor.address);
      
      // Check event emission
      await expect(tx)
        .to.emit(eipManager, "NewEIPEditorInaugurated")
        .withArgs(owner.address, newEditor.address);
      
      // Check state update
      expect(await eipManager.eipEditor()).to.equal(newEditor.address);
    });

    it("Should revert when a non-editor tries to update the EIP Editor", async function () {
      await expect(
        eipManager.connect(nonAuthor).updateEipEditor(nonAuthor.address)
      ).to.be.revertedWith("Only the current EIP Editor can update the editor address");
    });

    it("Should revert when trying to set the zero address as editor", async function () {
      await expect(
        eipManager.updateEipEditor(ethers.ZeroAddress)
      ).to.be.revertedWith("New editor cannot be the zero address");
    });
  });

  describe("EIP Registration", function () {
    it("Should allow the editor to register a new EIP", async function () {
      const eipId = 1;
      const tx = await eipManager.registerEIP(eipId, authors);
      
      // Check event emission
      await expect(tx)
        .to.emit(eipManager, "NewEIPRegistered")
        .withArgs(eipId, authors, owner.address);
      
      // Check EIP data
      const eip = await eipManager.eips(eipId);
      expect(eip.eipId).to.equal(eipId);
      expect(eip.status).to.equal(EIPStatus.Draft);
      
      // We can't directly check the authors array from the public getter
      // but we'll verify it through status change permissions later
    });

    it("Should revert when a non-editor tries to register an EIP", async function () {
      await expect(
        eipManager.connect(nonAuthor).registerEIP(1, authors)
      ).to.be.revertedWith("Only the EIP Editor can register new EIPs");
    });

    it("Should revert when trying to register an EIP with an existing ID", async function () {
      const eipId = 1;
      await eipManager.registerEIP(eipId, authors);
      
      await expect(
        eipManager.registerEIP(eipId, authors)
      ).to.be.revertedWith("EIP with this ID already exists");
    });

    it("Should revert when trying to register an EIP with an empty authors array", async function () {
      await expect(
        eipManager.registerEIP(1, [])
      ).to.be.revertedWith("At least one author must be specified");
    });
  });

  describe("EIP Status Transitions", function () {
    const eipId = 1;
    
    beforeEach(async function () {
      // Register an EIP for testing status transitions
      await eipManager.registerEIP(eipId, authors);
    });

    describe("From Draft Status", function () {
      it("Should allow an author to move from Draft to Review", async function () {
        const tx = await eipManager.connect(author1).changeEIPStatus(eipId, EIPStatus.Review);
        
        await expect(tx)
          .to.emit(eipManager, "EIPStatusChanged")
          .withArgs(eipId, EIPStatus.Draft, EIPStatus.Review, author1.address);
        
        const eip = await eipManager.eips(eipId);
        expect(eip.status).to.equal(EIPStatus.Review);
      });

      it("Should allow an author to move from Draft to Withdrawn", async function () {
        const tx = await eipManager.connect(author2).changeEIPStatus(eipId, EIPStatus.Withdrawn);
        
        await expect(tx)
          .to.emit(eipManager, "EIPStatusChanged")
          .withArgs(eipId, EIPStatus.Draft, EIPStatus.Withdrawn, author2.address);
        
        const eip = await eipManager.eips(eipId);
        expect(eip.status).to.equal(EIPStatus.Withdrawn);
      });

      it("Should allow an author to move from Draft to Stagnant after 6 months", async function () {
        // Increase time by 180 days
        await increaseTime(180 * 24 * 60 * 60);
        
        const tx = await eipManager.connect(author1).changeEIPStatus(eipId, EIPStatus.Stagnant);
        
        await expect(tx)
          .to.emit(eipManager, "EIPStatusChanged")
          .withArgs(eipId, EIPStatus.Draft, EIPStatus.Stagnant, author1.address);
        
        const eip = await eipManager.eips(eipId);
        expect(eip.status).to.equal(EIPStatus.Stagnant);
      });

      it("Should allow the editor to move from Draft to Stagnant after 6 months", async function () {
        // Increase time by 180 days
        await increaseTime(180 * 24 * 60 * 60);
        
        const tx = await eipManager.changeEIPStatus(eipId, EIPStatus.Stagnant);
        
        await expect(tx)
          .to.emit(eipManager, "EIPStatusChanged")
          .withArgs(eipId, EIPStatus.Draft, EIPStatus.Stagnant, owner.address);
        
        const eip = await eipManager.eips(eipId);
        expect(eip.status).to.equal(EIPStatus.Stagnant);
      });

      it("Should revert when trying to move from Draft to Stagnant before 6 months", async function () {
        // Increase time by only 90 days (not enough)
        await increaseTime(90 * 24 * 60 * 60);
        
        await expect(
          eipManager.changeEIPStatus(eipId, EIPStatus.Stagnant)
        ).to.be.revertedWith("EIP must be inactive for 6 months to become Stagnant");
      });

      it("Should revert when a non-author tries to move from Draft to Review", async function () {
        await expect(
          eipManager.connect(nonAuthor).changeEIPStatus(eipId, EIPStatus.Review)
        ).to.be.revertedWith("Caller is neither the EIP Editor nor an author");
      });

      it("Should revert when trying an invalid transition from Draft to LastCall", async function () {
        await expect(
          eipManager.changeEIPStatus(eipId, EIPStatus.LastCall)
        ).to.be.revertedWith("Invalid status transition from Draft");
      });

      it("Should revert when trying an invalid transition from Draft to Final", async function () {
        await expect(
          eipManager.changeEIPStatus(eipId, EIPStatus.Final)
        ).to.be.revertedWith("Invalid status transition from Draft");
      });
    });

    describe("From Review Status", function () {
      beforeEach(async function () {
        // Move to Review status first
        await eipManager.connect(author1).changeEIPStatus(eipId, EIPStatus.Review);
      });

      it("Should allow the editor to move from Review to LastCall", async function () {
        const tx = await eipManager.changeEIPStatus(eipId, EIPStatus.LastCall);
        
        await expect(tx)
          .to.emit(eipManager, "EIPStatusChanged")
          .withArgs(eipId, EIPStatus.Review, EIPStatus.LastCall, owner.address);
        
        const eip = await eipManager.eips(eipId);
        expect(eip.status).to.equal(EIPStatus.LastCall);
      });

      it("Should allow an author to move from Review back to Draft", async function () {
        const tx = await eipManager.connect(author2).changeEIPStatus(eipId, EIPStatus.Draft);
        
        await expect(tx)
          .to.emit(eipManager, "EIPStatusChanged")
          .withArgs(eipId, EIPStatus.Review, EIPStatus.Draft, author2.address);
        
        const eip = await eipManager.eips(eipId);
        expect(eip.status).to.equal(EIPStatus.Draft);
      });

      it("Should allow an author to move from Review to Withdrawn", async function () {
        const tx = await eipManager.connect(author1).changeEIPStatus(eipId, EIPStatus.Withdrawn);
        
        await expect(tx)
          .to.emit(eipManager, "EIPStatusChanged")
          .withArgs(eipId, EIPStatus.Review, EIPStatus.Withdrawn, author1.address);
        
        const eip = await eipManager.eips(eipId);
        expect(eip.status).to.equal(EIPStatus.Withdrawn);
      });

      it("Should allow an author to move from Review to Stagnant after 6 months", async function () {
        // Increase time by 180 days
        await increaseTime(180 * 24 * 60 * 60);
        
        const tx = await eipManager.connect(author1).changeEIPStatus(eipId, EIPStatus.Stagnant);
        
        await expect(tx)
          .to.emit(eipManager, "EIPStatusChanged")
          .withArgs(eipId, EIPStatus.Review, EIPStatus.Stagnant, author1.address);
        
        const eip = await eipManager.eips(eipId);
        expect(eip.status).to.equal(EIPStatus.Stagnant);
      });

      it("Should revert when an author tries to move from Review to LastCall", async function () {
        await expect(
          eipManager.connect(author1).changeEIPStatus(eipId, EIPStatus.LastCall)
        ).to.be.revertedWith("Only the EIP Editor can move from Review to LastCall");
      });

      it("Should revert when trying an invalid transition from Review to Final", async function () {
        await expect(
          eipManager.changeEIPStatus(eipId, EIPStatus.Final)
        ).to.be.revertedWith("Invalid status transition from Review");
      });
    });

    describe("From LastCall Status", function () {
      beforeEach(async function () {
        // Move to Review status first
        await eipManager.connect(author1).changeEIPStatus(eipId, EIPStatus.Review);
        // Then to LastCall
        await eipManager.changeEIPStatus(eipId, EIPStatus.LastCall);
      });

      it("Should allow the editor to move from LastCall to Final", async function () {
        const tx = await eipManager.changeEIPStatus(eipId, EIPStatus.Final);
        
        await expect(tx)
          .to.emit(eipManager, "EIPStatusChanged")
          .withArgs(eipId, EIPStatus.LastCall, EIPStatus.Final, owner.address);
        
        const eip = await eipManager.eips(eipId);
        expect(eip.status).to.equal(EIPStatus.Final);
      });

      it("Should allow the editor to move from LastCall to Living", async function () {
        const tx = await eipManager.changeEIPStatus(eipId, EIPStatus.Living);
        
        await expect(tx)
          .to.emit(eipManager, "EIPStatusChanged")
          .withArgs(eipId, EIPStatus.LastCall, EIPStatus.Living, owner.address);
        
        const eip = await eipManager.eips(eipId);
        expect(eip.status).to.equal(EIPStatus.Living);
      });

      it("Should allow the editor to move from LastCall back to Review", async function () {
        const tx = await eipManager.changeEIPStatus(eipId, EIPStatus.Review);
        
        await expect(tx)
          .to.emit(eipManager, "EIPStatusChanged")
          .withArgs(eipId, EIPStatus.LastCall, EIPStatus.Review, owner.address);
        
        const eip = await eipManager.eips(eipId);
        expect(eip.status).to.equal(EIPStatus.Review);
      });

      it("Should revert when an author tries to move from LastCall to Final", async function () {
        await expect(
          eipManager.connect(author1).changeEIPStatus(eipId, EIPStatus.Final)
        ).to.be.revertedWith("Only the EIP Editor can transition from LastCall");
      });

      it("Should revert when trying an invalid transition from LastCall to Draft", async function () {
        await expect(
          eipManager.changeEIPStatus(eipId, EIPStatus.Draft)
        ).to.be.revertedWith("Invalid status transition from LastCall");
      });
    });

    describe("From Withdrawn Status", function () {
      beforeEach(async function () {
        // Move to Withdrawn status first
        await eipManager.connect(author1).changeEIPStatus(eipId, EIPStatus.Withdrawn);
      });

      it("Should allow an author to move from Withdrawn back to Draft", async function () {
        const tx = await eipManager.connect(author2).changeEIPStatus(eipId, EIPStatus.Draft);
        
        await expect(tx)
          .to.emit(eipManager, "EIPStatusChanged")
          .withArgs(eipId, EIPStatus.Withdrawn, EIPStatus.Draft, author2.address);
        
        const eip = await eipManager.eips(eipId);
        expect(eip.status).to.equal(EIPStatus.Draft);
      });

      it("Should revert when the editor tries to move from Withdrawn to Draft", async function () {
        await expect(
          eipManager.changeEIPStatus(eipId, EIPStatus.Draft)
        ).to.be.revertedWith("Only an author can move from Withdrawn to Draft");
      });

      it("Should revert when trying an invalid transition from Withdrawn to Review", async function () {
        await expect(
          eipManager.connect(author1).changeEIPStatus(eipId, EIPStatus.Review)
        ).to.be.revertedWith("Invalid status transition from Withdrawn");
      });
    });

    describe("From Stagnant Status", function () {
      beforeEach(async function () {
        // Increase time by 180 days
        await increaseTime(180 * 24 * 60 * 60);
        // Move to Stagnant status
        await eipManager.changeEIPStatus(eipId, EIPStatus.Stagnant);
      });

      it("Should allow an author to move from Stagnant back to Draft", async function () {
        const tx = await eipManager.connect(author1).changeEIPStatus(eipId, EIPStatus.Draft);
        
        await expect(tx)
          .to.emit(eipManager, "EIPStatusChanged")
          .withArgs(eipId, EIPStatus.Stagnant, EIPStatus.Draft, author1.address);
        
        const eip = await eipManager.eips(eipId);
        expect(eip.status).to.equal(EIPStatus.Draft);
      });

      it("Should allow the editor to move from Stagnant back to Draft", async function () {
        const tx = await eipManager.changeEIPStatus(eipId, EIPStatus.Draft);
        
        await expect(tx)
          .to.emit(eipManager, "EIPStatusChanged")
          .withArgs(eipId, EIPStatus.Stagnant, EIPStatus.Draft, owner.address);
        
        const eip = await eipManager.eips(eipId);
        expect(eip.status).to.equal(EIPStatus.Draft);
      });

      it("Should revert when trying an invalid transition from Stagnant to Review", async function () {
        await expect(
          eipManager.changeEIPStatus(eipId, EIPStatus.Review)
        ).to.be.revertedWith("Invalid status transition from Stagnant");
      });
    });

    describe("From Final and Living Status", function () {
      it("Should revert when trying to transition from Final status", async function () {
        // First move to Review, then LastCall, then Final
        await eipManager.connect(author1).changeEIPStatus(eipId, EIPStatus.Review);
        await eipManager.changeEIPStatus(eipId, EIPStatus.LastCall);
        await eipManager.changeEIPStatus(eipId, EIPStatus.Final);
        
        await expect(
          eipManager.changeEIPStatus(eipId, EIPStatus.Draft)
        ).to.be.revertedWith("Cannot transition from Final or Living status");
      });

      it("Should revert when trying to transition from Living status", async function () {
        // First move to Review, then LastCall, then Living
        await eipManager.connect(author1).changeEIPStatus(eipId, EIPStatus.Review);
        await eipManager.changeEIPStatus(eipId, EIPStatus.LastCall);
        await eipManager.changeEIPStatus(eipId, EIPStatus.Living);
        
        await expect(
          eipManager.changeEIPStatus(eipId, EIPStatus.Draft)
        ).to.be.revertedWith("Cannot transition from Final or Living status");
      });
    });

    it("Should revert when trying to change status for a non-existent EIP", async function () {
      const nonExistentEipId = 999;
      
      await expect(
        eipManager.changeEIPStatus(nonExistentEipId, EIPStatus.Review)
      ).to.be.revertedWith("EIP does not exist");
    });
  });

  describe("Multiple Authors Logic", function () {
    const eipId = 1;
    
    beforeEach(async function () {
      // Register an EIP with multiple authors
      await eipManager.registerEIP(eipId, authors);
    });

    it("Should allow any registered author to perform author-specific actions", async function () {
      // First author can change status
      await eipManager.connect(author1).changeEIPStatus(eipId, EIPStatus.Review);
      expect((await eipManager.eips(eipId)).status).to.equal(EIPStatus.Review);
      
      // Second author can also change status
      await eipManager.connect(author2).changeEIPStatus(eipId, EIPStatus.Draft);
      expect((await eipManager.eips(eipId)).status).to.equal(EIPStatus.Draft);
    });

    it("Should not allow a non-author to perform author-specific actions", async function () {
      await expect(
        eipManager.connect(nonAuthor).changeEIPStatus(eipId, EIPStatus.Review)
      ).to.be.revertedWith("Caller is neither the EIP Editor nor an author");
    });
  });

  describe("Query Functions for Access Control", function () {
    const eipId = 1;
    
    beforeEach(async function () {
      // Register an EIP with multiple authors
      await eipManager.registerEIP(eipId, authors);
    });

    it("Should correctly return the current EIP Editor", async function () {
      // Check initial editor
      expect(await eipManager.getCurrentEIPEditor()).to.equal(owner.address);
      
      // Update editor and check again
      await eipManager.updateEipEditor(newEditor.address);
      expect(await eipManager.getCurrentEIPEditor()).to.equal(newEditor.address);
    });

    it("Should correctly return the list of authors for an EIP", async function () {
      const eipAuthors = await eipManager.getEIPAuthors(eipId);
      
      // Check that the returned array has the correct length
      expect(eipAuthors.length).to.equal(authors.length);
      
      // Check that each author is in the returned array
      for (let i = 0; i < authors.length; i++) {
        expect(eipAuthors[i]).to.equal(authors[i]);
      }
    });

    it("Should correctly identify if an address is an author of an EIP", async function () {
      // Check that authors are correctly identified
      expect(await eipManager.isEIPAuthor(eipId, author1.address)).to.be.true;
      expect(await eipManager.isEIPAuthor(eipId, author2.address)).to.be.true;
      
      // Check that non-authors are correctly identified
      expect(await eipManager.isEIPAuthor(eipId, nonAuthor.address)).to.be.false;
    });

    it("Should revert when querying authors for a non-existent EIP", async function () {
      const nonExistentEipId = 999;
      
      await expect(
        eipManager.getEIPAuthors(nonExistentEipId)
      ).to.be.revertedWith("EIP does not exist");
      
      await expect(
        eipManager.isEIPAuthor(nonExistentEipId, author1.address)
      ).to.be.revertedWith("EIP does not exist");
    });
  });
});
