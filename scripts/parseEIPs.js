import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

// Get the directory name using ES module approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Map EIP status strings to EIPStatus enum values in the contract
const statusMapping = {
  'Draft': 0,
  'Review': 1,
  'LastCall': 2,
  'Final': 3,
  'Stagnant': 4,
  'Withdrawn': 5,
  'Living': 6
};

// Function to convert author strings to Ethereum addresses
// This is a placeholder - you'll need to implement actual address mapping
function authorToAddress(authorString) {
  // In a real implementation, you would:
  // 1. Parse the author string to extract names/emails
  // 2. Look up or derive Ethereum addresses for each author
  
  // For demonstration, we'll generate a deterministic address based on the author string
  // DO NOT USE THIS IN PRODUCTION - it's just for demonstration
  const hash = createHash('sha256').update(authorString).digest('hex');
  return '0x' + hash.substring(0, 40);
}

// Parse author string into an array of addresses
function parseAuthors() {
  // Always return a single address array with the specified address
  return ["0xb07DCF527789534b2Ef625f7cF1d2Ab9a2DaF6a9"];
}

// Function to create output directory if it doesn't exist
function ensureOutputDirExists() {
  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  return outputDir;
}

// Function to write array data to a file
function writeArrayToFile(filePath, arrayData) {
  // Format the array as a string that can be directly pasted into a blockchain explorer
  const formattedData = JSON.stringify(arrayData);
  fs.writeFileSync(filePath, formattedData);
  console.log(`Written to ${filePath}`);
}

// Main function to parse the eips.json file
async function parseEIPs() {
  try {
    // Read the eips.json file
    const eipsPath = path.join(__dirname, '..', 'contract', 'eips.json');
    const eipsData = fs.readFileSync(eipsPath, 'utf8');
    const eips = JSON.parse(eipsData);
    
    // Initialize our arrays
    const eipIds = [];
    const authorsList = [];
    const statuses = [];
    
    // Process each EIP
    for (const eip of eips) {
      try {
        // Skip if any required data is missing (but not if author is missing)
        if (!eip.number || !eip.attributes || !eip.attributes.status) {
          console.warn(`Skipping EIP with incomplete data: ${JSON.stringify(eip)}`);
          continue;
        }
        
        // Get the EIP number
        const eipId = eip.number;
        
        // Get the EIP status and convert to enum value
        const statusString = eip.attributes.status;
        const statusEnum = statusMapping[statusString] !== undefined ? 
                          statusMapping[statusString] : 0; // Default to Draft if unknown
        
        // Always use the single specified address for all EIPs
        const authorAddresses = parseAuthors();
        
        // Add to our arrays
        eipIds.push(eipId);
        authorsList.push(authorAddresses);
        statuses.push(statusEnum);
        
        console.log(`Processed EIP-${eipId}: Status=${statusString}(${statusEnum}), Authors=1`);
      } catch (err) {
        console.warn(`Error processing EIP: ${err.message}`);
      }
    }
    
    // Create output directory
    const outputDir = ensureOutputDirExists();
    
    // Split the data into batches of 100 EIPs
    const batchSize = 100;
    const totalBatches = Math.ceil(eipIds.length / batchSize);
    
    console.log(`\nTotal EIPs: ${eipIds.length}`);
    console.log(`Splitting into ${totalBatches} batches of ${batchSize} EIPs each`);
    
    // Generate batch files
    for (let i = 0; i < totalBatches; i++) {
      const startIdx = i * batchSize;
      const endIdx = Math.min((i + 1) * batchSize, eipIds.length);
      
      // Slice the arrays for this batch
      const batchEipIds = eipIds.slice(startIdx, endIdx);
      const batchAuthorsList = authorsList.slice(startIdx, endIdx);
      const batchStatuses = statuses.slice(startIdx, endIdx);
      
      // Generate file names
      const batchName = `batch_${startIdx + 1}_to_${endIdx}`;
      const eipIdsFile = path.join(outputDir, `${batchName}_eipIds.txt`);
      const authorsListFile = path.join(outputDir, `${batchName}_authorsList.txt`);
      const statusesFile = path.join(outputDir, `${batchName}_statuses.txt`);
      
      // Write the arrays to files
      writeArrayToFile(eipIdsFile, batchEipIds);
      writeArrayToFile(authorsListFile, batchAuthorsList);
      writeArrayToFile(statusesFile, batchStatuses);
      
      console.log(`\nBatch ${i + 1}/${totalBatches} (EIPs ${startIdx + 1}-${endIdx}) written to files:`);
      console.log(`- EIP IDs: ${eipIdsFile}`);
      console.log(`- Authors List: ${authorsListFile}`);
      console.log(`- Statuses: ${statusesFile}`);
    }
    
    console.log('\nAll batch files created successfully!');
    console.log('You can now copy-paste the contents of these files into the blockchain explorer\'s write function input fields.');
    console.log('For each batch, use the three corresponding files as inputs to the registerEIPBatch function.');

    return {
      eipIds,
      authorsList,
      statuses,
      totalBatches
    };
  } catch (error) {
    console.error('Error parsing EIPs:', error);
    return null;
  }
}

// Run the parser
parseEIPs();
