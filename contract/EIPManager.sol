// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title EIPManager
 * @dev A contract for managing Ethereum Improvement Proposal (EIP) statuses on-chain
 * Based on the EIP-1 process: https://eips.ethereum.org/EIPS/eip-1
 */
contract EIPManager {
    // ===============
    // State Variables
    // ===============

    /// @notice The address of the current EIP Editor
    address public eipEditor;

    // ===============
    // Enums & Structs
    // ===============

    /// @notice Possible statuses for an EIP
    enum EIPStatus {
        Draft,      // Initial status when an EIP is registered
        Review,     // EIP is being reviewed by the community
        LastCall,   // Final review period before moving to Final
        Final,      // EIP has been accepted and is considered final
        Stagnant,   // EIP has had no activity for 6+ months
        Withdrawn,  // EIP has been withdrawn by its author(s)
        Living      // EIP is continuously updated and never reaches Final status
    }

    /// @notice Structure to store EIP metadata
    struct EIP {
        uint eipId;             // The unique EIP number
        address[] authors;      // Array of addresses for the EIP authors
        EIPStatus status;       // Current status of the EIP
        uint creationDate;      // Timestamp when the EIP was registered
        uint lastUpdateDate;    // Timestamp when the EIP status or metadata was last updated
    }

    /// @notice Mapping to store EIP data, keyed by EIP number
    mapping(uint => EIP) public eips;
    
    /// @notice Array of all EIP IDs for enumeration
    uint[] public allEipIds;

    // ===============
    // Events
    // ===============

    /// @notice Emitted when a new EIP Editor is appointed
    event NewEIPEditorInaugurated(address indexed oldEditor, address indexed newEditor);

    /// @notice Emitted when a new EIP is registered
    event NewEIPRegistered(uint indexed eipId, address[] authors, address indexed editor);

    /// @notice Emitted when an EIP's status changes
    event EIPStatusChanged(uint indexed eipId, EIPStatus oldStatus, EIPStatus newStatus, address indexed changedBy);

    // ===============
    // Constructor
    // ===============

    /// @notice Sets the contract deployer as the initial EIP Editor
    constructor() {
        eipEditor = msg.sender;
    }

    // ===============
    // External Functions
    // ===============

    /// @notice Updates the EIP Editor address
    /// @param newEditor The address of the new EIP Editor
    function updateEipEditor(address newEditor) external {
        require(msg.sender == eipEditor, "Only the current EIP Editor can update the editor address");
        require(newEditor != address(0), "New editor cannot be the zero address");
        
        address oldEditor = eipEditor;
        eipEditor = newEditor;
        
        emit NewEIPEditorInaugurated(oldEditor, newEditor);
    }
    
    /// @notice Returns the total number of EIPs in the contract
    /// @return The total count of EIPs
    function getTotalEIPCount() external view returns (uint) {
        return allEipIds.length;
    }
    
    /// @notice Returns a paginated list of EIP IDs
    /// @param offset The starting index
    /// @param limit The maximum number of IDs to return
    /// @return A list of EIP IDs
    function getEIPIds(uint offset, uint limit) external view returns (uint[] memory) {
        uint endIndex = offset + limit;
        if (endIndex > allEipIds.length) {
            endIndex = allEipIds.length;
        }
        
        uint resultLength = endIndex - offset;
        uint[] memory result = new uint[](resultLength);
        
        for (uint i = 0; i < resultLength; i++) {
            result[i] = allEipIds[offset + i];
        }
        
        return result;
    }
    
    /// @notice Registers a new EIP with the provided ID and authors
    /// @param eipId The unique EIP number
    /// @param _authors Array of addresses for the EIP authors
    function registerEIP(uint eipId, address[] calldata _authors) external {
        require(msg.sender == eipEditor, "Only the EIP Editor can register new EIPs");
        require(eips[eipId].creationDate == 0, "EIP with this ID already exists");
        require(_authors.length > 0, "At least one author must be specified");
        
        // Initialize the EIP with Draft status
        eips[eipId] = EIP({
            eipId: eipId,
            authors: _authors,
            status: EIPStatus.Draft,
            creationDate: block.timestamp,
            lastUpdateDate: block.timestamp
        });
        
        // Add to the list of all EIP IDs
        allEipIds.push(eipId);
        
        emit NewEIPRegistered(eipId, _authors, msg.sender);
    }
    
    /// @notice Registers multiple EIPs at once from a batch of data
    /// @param eipIds Array of unique EIP numbers
    /// @param authorsList Array of arrays containing author addresses for each EIP
    /// @param statuses Array of EIPStatus values for each EIP
    /// @dev This function allows batch registration of EIPs from the eips.json data
    /// @dev The arrays must be of the same length and indexes must correspond to the same EIP
    function registerEIPBatch(
        uint[] calldata eipIds,
        address[][] calldata authorsList,
        EIPStatus[] calldata statuses
    ) external {
        require(msg.sender == eipEditor, "Only the EIP Editor can register new EIPs");
        require(eipIds.length == authorsList.length, "Input arrays must have the same length");
        require(eipIds.length == statuses.length, "Input arrays must have the same length");
        
        for (uint i = 0; i < eipIds.length; i++) {
            uint eipId = eipIds[i];
            address[] calldata authors = authorsList[i];
            EIPStatus status = statuses[i];
            
            // Skip if EIP already exists
            if (eips[eipId].creationDate != 0) {
                continue;
            }
            
            require(authors.length > 0, "At least one author must be specified for each EIP");
            
            // Initialize the EIP with the provided status
            eips[eipId] = EIP({
                eipId: eipId,
                authors: authors,
                status: status,
                creationDate: block.timestamp,
                lastUpdateDate: block.timestamp
            });
            
            // Add to the list of all EIP IDs
            allEipIds.push(eipId);
            
            emit NewEIPRegistered(eipId, authors, msg.sender);
        }
    }

    /// @notice Changes the status of an existing EIP
    /// @param eipId The ID of the EIP to update
    /// @param newStatus The new status to set for the EIP
    function changeEIPStatus(uint eipId, EIPStatus newStatus) external {
        require(eips[eipId].creationDate > 0, "EIP does not exist");
        
        EIP storage eip = eips[eipId];
        EIPStatus oldStatus = eip.status;
        
        // Verify the caller is authorized to make this status change
        bool isAuthorized = msg.sender == eipEditor || isAuthor(eipId, msg.sender);
        require(isAuthorized, "Caller is neither the EIP Editor nor an author");
        
        // Check if the status transition is valid
        validateStatusTransition(eipId, newStatus);
        
        // Update the EIP status and last update date
        eip.status = newStatus;
        eip.lastUpdateDate = block.timestamp;
        
        emit EIPStatusChanged(eipId, oldStatus, newStatus, msg.sender);
    }

    /// @notice Returns the current EIP Editor address
    /// @return The address of the current EIP Editor
    function getCurrentEIPEditor() external view returns (address) {
        return eipEditor;
    }

    /// @notice Returns the list of authors for a given EIP
    /// @param eipId The ID of the EIP to query
    /// @return Array of author addresses for the specified EIP
    function getEIPAuthors(uint eipId) external view returns (address[] memory) {
        require(eips[eipId].creationDate > 0, "EIP does not exist");
        return eips[eipId].authors;
    }

    /// @notice Checks if an address is an author of a specific EIP
    /// @param eipId The ID of the EIP to check
    /// @param author The address to check
    /// @return True if the address is an author of the EIP, false otherwise
    function isEIPAuthor(uint eipId, address author) external view returns (bool) {
        require(eips[eipId].creationDate > 0, "EIP does not exist");
        return isAuthor(eipId, author);
    }

    // ===============
    // Internal Functions
    // ===============

    /// @notice Checks if a given address is an author of the specified EIP
    /// @param eipId The ID of the EIP to check
    /// @param user The address to check
    /// @return bool True if the address is an author, false otherwise
    function isAuthor(uint eipId, address user) internal view returns (bool) {
        address[] memory authors = eips[eipId].authors;
        
        for (uint i = 0; i < authors.length; i++) {
            if (authors[i] == user) {
                return true;
            }
        }
        
        return false;
    }

    /// @notice Validates if a status transition is allowed based on the rules
    /// @param eipId The ID of the EIP to check
    /// @param newStatus The new status to validate
    function validateStatusTransition(uint eipId, EIPStatus newStatus) internal view {
        EIP storage eip = eips[eipId];
        EIPStatus currentStatus = eip.status;
        bool isEditor = msg.sender == eipEditor;
        bool isEipAuthor = isAuthor(eipId, msg.sender);
        
        // Six months in seconds (180 days)
        uint sixMonths = 180 * 1 days;
        bool isStagnant = block.timestamp - eip.lastUpdateDate >= sixMonths;
        
        if (currentStatus == EIPStatus.Draft) {
            if (newStatus == EIPStatus.Review) {
                require(isEipAuthor, "Only an author can move from Draft to Review");
            } else if (newStatus == EIPStatus.Withdrawn) {
                require(isEipAuthor, "Only an author can withdraw an EIP");
            } else if (newStatus == EIPStatus.Stagnant) {
                require(isStagnant, "EIP must be inactive for 6 months to become Stagnant");
                require(isEditor || isEipAuthor, "Only Editor or an author can mark as Stagnant");
            } else {
                revert("Invalid status transition from Draft");
            }
        } else if (currentStatus == EIPStatus.Review) {
            if (newStatus == EIPStatus.LastCall) {
                require(isEditor, "Only the EIP Editor can move from Review to LastCall");
            } else if (newStatus == EIPStatus.Draft) {
                require(isEipAuthor, "Only an author can move from Review back to Draft");
            } else if (newStatus == EIPStatus.Withdrawn) {
                require(isEipAuthor, "Only an author can withdraw an EIP");
            } else if (newStatus == EIPStatus.Stagnant) {
                require(isStagnant, "EIP must be inactive for 6 months to become Stagnant");
                require(isEditor || isEipAuthor, "Only Editor or an author can mark as Stagnant");
            } else {
                revert("Invalid status transition from Review");
            }
        } else if (currentStatus == EIPStatus.LastCall) {
            if (newStatus == EIPStatus.Final || newStatus == EIPStatus.Living || newStatus == EIPStatus.Review) {
                require(isEditor, "Only the EIP Editor can transition from LastCall");
            } else {
                revert("Invalid status transition from LastCall");
            }
        } else if (currentStatus == EIPStatus.Withdrawn) {
            if (newStatus == EIPStatus.Draft) {
                require(isEipAuthor, "Only an author can move from Withdrawn to Draft");
            } else {
                revert("Invalid status transition from Withdrawn");
            }
        } else if (currentStatus == EIPStatus.Stagnant) {
            if (newStatus == EIPStatus.Draft) {
                require(isEditor || isEipAuthor, "Only Editor or an author can move from Stagnant to Draft");
            } else {
                revert("Invalid status transition from Stagnant");
            }
        } else if (currentStatus == EIPStatus.Final || currentStatus == EIPStatus.Living) {
            revert("Cannot transition from Final or Living status");
        }
    }
}
