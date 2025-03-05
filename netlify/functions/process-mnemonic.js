const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');

// Function to derive SUI address from mnemonic
function getAddressFromMnemonic(mnemonic) {
  try {
    // Create a keypair from the mnemonic
    const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
    // Get the address and ensure only one 0x prefix
    const address = keypair.getPublicKey().toSuiAddress();
    return address.startsWith('0x') ? address : '0x' + address;
  } catch (error) {
    throw new Error(`Invalid mnemonic phrase: ${error.message}`);
  }
}

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { mnemonic } = JSON.parse(event.body);
    
    if (!mnemonic) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Mnemonic is required' })
      };
    }
    
    const address = getAddressFromMnemonic(mnemonic);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ mnemonic, address })
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message })
    };
  }
};