// SUI Address Generator from Seed Phrases
const fs = require('fs');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const { createReadStream } = require('fs');
const readline = require('readline');

const BATCH_SIZE = 1000; // Process 1000 lines at a time for local processing

// Function to derive SUI address from mnemonic
async function getAddressFromMnemonic(mnemonic) {
  try {
    const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
    const address = keypair.getPublicKey().toSuiAddress();
    return address.startsWith('0x') ? address : '0x' + address;
  } catch (error) {
    throw new Error(`Invalid mnemonic phrase: ${error.message}`);
  }
}

// Process a batch of mnemonics
async function processBatch(mnemonics) {
  return Promise.all(
    mnemonics.map(async (mnemonic) => {
      try {
        const address = await getAddressFromMnemonic(mnemonic);
        return { mnemonic, address, success: true };
      } catch (error) {
        return { mnemonic, error: error.message, success: false };
      }
    })
  );
}

// Main function to process the file
async function processFile(filePath) {
  try {
    console.log("Processing seed phrases...\n");
    
    const fileStream = createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let currentBatch = [];
    let processedCount = 0;
    
    for await (const line of rl) {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 0) {
        currentBatch.push(trimmedLine);
        
        if (currentBatch.length >= BATCH_SIZE) {
          const results = await processBatch(currentBatch);
          printResults(results);
          processedCount += currentBatch.length;
          console.log(`Processed ${processedCount} seed phrases...`);
          currentBatch = [];
        }
      }
    }
    
    // Process remaining mnemonics
    if (currentBatch.length > 0) {
      const results = await processBatch(currentBatch);
      printResults(results);
      processedCount += currentBatch.length;
    }
    
    console.log(`\nCompleted processing ${processedCount} seed phrases.`);
    
  } catch (error) {
    console.error(`Error processing file: ${error.message}`);
  }
}

// Helper function to print results
function printResults(results) {
  results.forEach(result => {
    if (result.success) {
      console.log(`Mnemonic: ${result.mnemonic}`);
      console.log(`Address: ${result.address}`);
    } else {
      console.log(`Mnemonic: ${result.mnemonic}`);
      console.log(`Error: ${result.error}`);
    }
    console.log("-----------------------------------");
  });
}

// Create a sample file with the provided seed phrases if it doesn't exist
const sampleFilePath = 'seed_phrases.txt';
const sampleContent = `autumn slim easy ribbon upset text zoo humor other cage fantasy super
tobacco birth chef budget cactus economy certain trend good frown avocado roof
plug figure crush elite loyal year agree festival stereo steak coast pig
space rib because number arrive student river attend dial material canvas beh`;

if (!fs.existsSync(sampleFilePath)) {
  fs.writeFileSync(sampleFilePath, sampleContent);
  console.log(`Created sample file: ${sampleFilePath}`);
}

// Process the file
processFile(sampleFilePath);