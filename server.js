const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const { Transform } = require('stream');

const app = express();
const PORT = 3000;
const BATCH_SIZE = 100; // Process 100 mnemonics at a time

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public'));

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

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Process a single mnemonic
app.post('/process-mnemonic', async (req, res) => {
  const { mnemonic } = req.body;
  
  if (!mnemonic) {
    return res.status(400).json({ error: 'Mnemonic is required' });
  }
  
  try {
    const address = await getAddressFromMnemonic(mnemonic);
    res.json({ mnemonic, address });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Process multiple mnemonics with streaming response
app.post('/process-multiple', (req, res) => {
  const { mnemonics } = req.body;
  
  if (!mnemonics) {
    return res.status(400).json({ error: 'Mnemonics are required' });
  }
  
  const lines = mnemonics.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Set up streaming response
  res.setHeader('Content-Type', 'application/json');
  res.write('{"results":[');
  
  let firstResult = true;
  let currentBatch = [];
  
  const processNextBatch = async () => {
    if (currentBatch.length === 0) return true;
    
    const results = await processBatch(currentBatch);
    
    results.forEach(result => {
      if (!firstResult) {
        res.write(',');
      }
      res.write(JSON.stringify(result));
      firstResult = false;
    });
    
    return true;
  };
  
  (async () => {
    try {
      for (const mnemonic of lines) {
        currentBatch.push(mnemonic);
        
        if (currentBatch.length >= BATCH_SIZE) {
          await processNextBatch();
          currentBatch = [];
        }
      }
      
      // Process remaining mnemonics
      if (currentBatch.length > 0) {
        await processNextBatch();
      }
      
      res.write(']}');
      res.end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })();
});

// Process file upload with streaming
app.post('/process-file', (req, res) => {
  const { fileContent } = req.body;
  
  if (!fileContent) {
    return res.status(400).json({ error: 'File content is required' });
  }
  
  const lines = fileContent.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  // Set up streaming response
  res.setHeader('Content-Type', 'application/json');
  res.write('{"results":[');
  
  let firstResult = true;
  let currentBatch = [];
  
  const processNextBatch = async () => {
    if (currentBatch.length === 0) return true;
    
    const results = await processBatch(currentBatch);
    
    results.forEach(result => {
      if (!firstResult) {
        res.write(',');
      }
      res.write(JSON.stringify(result));
      firstResult = false;
    });
    
    return true;
  };
  
  (async () => {
    try {
      for (const line of lines) {
        currentBatch.push(line);
        
        if (currentBatch.length >= BATCH_SIZE) {
          await processNextBatch();
          currentBatch = [];
        }
      }
      
      // Process remaining lines
      if (currentBatch.length > 0) {
        await processNextBatch();
      }
      
      res.write(']}');
      res.end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })();
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