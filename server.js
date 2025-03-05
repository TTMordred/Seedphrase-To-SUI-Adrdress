const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

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

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Process a single mnemonic
app.post('/process-mnemonic', (req, res) => {
  const { mnemonic } = req.body;
  
  if (!mnemonic) {
    return res.status(400).json({ error: 'Mnemonic is required' });
  }
  
  try {
    const address = getAddressFromMnemonic(mnemonic);
    res.json({ mnemonic, address });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Process multiple mnemonics from textarea
app.post('/process-multiple', (req, res) => {
  const { mnemonics } = req.body;
  
  if (!mnemonics) {
    return res.status(400).json({ error: 'Mnemonics are required' });
  }
  
  const lines = mnemonics.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  const results = [];
  for (const mnemonic of lines) {
    try {
      const address = getAddressFromMnemonic(mnemonic);
      results.push({ mnemonic, address });
    } catch (error) {
      results.push({ mnemonic, error: error.message });
    }
  }
  
  res.json({ results });
});

// Process file upload
app.post('/process-file', (req, res) => {
  const { fileContent } = req.body;
  
  if (!fileContent) {
    return res.status(400).json({ error: 'File content is required' });
  }
  
  const lines = fileContent.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  const results = [];
  for (const mnemonic of lines) {
    try {
      const address = getAddressFromMnemonic(mnemonic);
      results.push({ mnemonic, address });
    } catch (error) {
      results.push({ mnemonic, error: error.message });
    }
  }
  
  res.json({ results });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  
  // Create public directory if it doesn't exist
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
  }
  
  // Create the HTML file if it doesn't exist
  const htmlPath = path.join(__dirname, 'public', 'index.html');
  if (!fs.existsSync(htmlPath)) {
    fs.writeFileSync(htmlPath, fs.readFileSync(path.join(__dirname, 'index.html')));
  }
});