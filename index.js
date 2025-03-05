// SUI Address Generator from Seed Phrases
const fs = require('fs');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const { mnemonicToSeedSync } = require('@scure/bip39');

// Function to derive SUI address from mnemonic
function getAddressFromMnemonic(mnemonic) {
  try {
    // Create a keypair from the mnemonic
    const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
    // Get the address
    return keypair.getPublicKey().toSuiAddress();
  } catch (error) {
    return `Error processing mnemonic: ${error.message}`;
  }
}

// Main function to process the file
async function processFile(filePath) {
  try {
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Split by new lines to get each mnemonic
    const mnemonics = fileContent.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0); // Remove empty lines
    
    console.log("SUI Addresses from Seed Phrases:\n");
    
    // Process each mnemonic
    for (const mnemonic of mnemonics) {
      const address = getAddressFromMnemonic(mnemonic);
      console.log(`Mnemonic: ${mnemonic}`);
      console.log(`Address: 0x${address}`);
      console.log("-----------------------------------");
    }
    
  } catch (error) {
    console.error(`Error reading or processing file: ${error.message}`);
  }
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