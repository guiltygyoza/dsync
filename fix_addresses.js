const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

// Path to the batch files
const authorsListPath = path.join(__dirname, 'output', 'batch_1_to_1000_authorsList.txt');

// Function to convert an address to checksummed format (EIP-55)
function toChecksumAddress(address) {
  if (!/^0x[0-9a-f]{40}$/i.test(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }

  address = address.toLowerCase();
  const addressHash = createHash('keccak256')
    .update(address.slice(2))
    .digest('hex');

  let checksumAddress = '0x';
  for (let i = 0; i < 40; i++) {
    checksumAddress += parseInt(addressHash[i], 16) >= 8 
      ? address[i + 2].toUpperCase() 
      : address[i + 2];
  }
  
  return checksumAddress;
}

// Function to check if an address is the placeholder address
function isPlaceholderAddress(address) {
  return address.toLowerCase() === '0x0000000000000000000000000000000000000001';
}

// Function to replace placeholder addresses with valid ones
function fixAuthorsListArray(authorsList) {
  return authorsList.map(authors => {
    // Filter out placeholder addresses
    const validAuthors = authors.filter(address => !isPlaceholderAddress(address));
    
    // If no valid authors remain, add a default valid address
    // This is just an example - you might want to handle this differently
    if (validAuthors.length === 0) {
      // Use a known valid address from the dataset as a replacement
      return ['0x4df39c6558153314e816e55ca0d543e6b58f66f7'];
    }
    
    // Convert all addresses to checksummed format
    return validAuthors.map(toChecksumAddress);
  });
}

// Main function to process the file
async function processAuthorsListFile() {
  try {
    // Read the file
    const data = fs.readFileSync(authorsListPath, 'utf8');
    
    // Parse the JSON
    const authorsList = JSON.parse(data);
    
    // Fix the addresses
    const fixedAuthorsList = fixAuthorsListArray(authorsList);
    
    // Write the fixed data to a new file
    const outputPath = path.join(__dirname, 'output', 'fixed_authorsList.txt');
    fs.writeFileSync(outputPath, JSON.stringify(fixedAuthorsList, null, 2));
    
    console.log(`Fixed authorsList written to ${outputPath}`);
    
    // Also create a version that's formatted for direct copy-paste into Etherscan
    const etherscanFormat = JSON.stringify(fixedAuthorsList);
    const etherscanOutputPath = path.join(__dirname, 'output', 'etherscan_authorsList.txt');
    fs.writeFileSync(etherscanOutputPath, etherscanFormat);
    
    console.log(`Etherscan-ready authorsList written to ${etherscanOutputPath}`);
  } catch (error) {
    console.error('Error processing file:', error);
  }
}

// Run the script
processAuthorsListFile();
