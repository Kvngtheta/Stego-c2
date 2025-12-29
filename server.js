const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const session = require('express-session');
const { spawn } = require('child_process');

const app = express();
const PORT = 3000;

// Session configuration
app.use(session({
  secret: crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Ensure directories exist
async function ensureDirectories() {
  const dirs = ['./data', './data/gifs', './data/received', './data/users'];
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (err) {
      console.error(`Error creating directory ${dir}:`, err);
    }
  }
}

// Initialize with sample GIFs (in production, you'd have actual GIFs)
async function initializeGifs() {
  const gifNames = ['wave.gif', 'loading.gif', 'celebration.gif', 'rocket.gif', 'data.gif'];
  
  for (const gifName of gifNames) {
    const gifPath = path.join('./data/gifs', gifName);
    try {
      await fs.access(gifPath);
    } catch {
      // Create a minimal GIF file (1x1 pixel)
      const minimalGif = Buffer.from([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
        0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x21,
        0xF9, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00,
        0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
        0x01, 0x00, 0x3B
      ]);
      await fs.writeFile(gifPath, minimalGif);
    }
  }
}

// User management (in-memory for demo, use database in production)
const users = new Map();

// Initialize admin user with hashed password
async function initializeAdminUser() {
  const adminUsername = 'admin';
  const adminPassword = crypto.randomBytes(16).toString('hex');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(adminPassword, salt, 100000, 64, 'sha512').toString('hex');
  
  users.set(adminUsername, { salt, hash, role: 'admin' });
  
  console.log('\n=================================');
  console.log('ADMIN CREDENTIALS (Save these!)');
  console.log('=================================');
  console.log(`Username: ${adminUsername}`);
  console.log(`Password: ${adminPassword}`);
  console.log('=================================\n');
  
  // Save to file for reference
  await fs.writeFile('./data/users/admin_credentials.txt', 
    `Username: ${adminUsername}\nPassword: ${adminPassword}\n\nGenerated: ${new Date().toISOString()}`
  );
}

// Password verification
function verifyPassword(username, password) {
  const user = users.get(username);
  if (!user) return false;
  
  const hash = crypto.pbkdf2Sync(password, user.salt, 100000, 64, 'sha512').toString('hex');
  return hash === user.hash;
}

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Encryption functions
function encryptData(data, algorithm, key = null) {
  if (algorithm === 'none') {
    return { encrypted: data, metadata: { algorithm: 'none' } };
  }
  
  const encryptionKey = key || crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  
  let cipher;
  let encryptedData;
  
  switch (algorithm) {
    case 'aes-256-cbc':
      cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
      encryptedData = Buffer.concat([cipher.update(data), cipher.final()]);
      break;
    case 'aes-256-gcm':
      cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
      encryptedData = Buffer.concat([cipher.update(data), cipher.final()]);
      const authTag = cipher.getAuthTag();
      encryptedData = Buffer.concat([encryptedData, authTag]);
      break;
    case 'chacha20':
      cipher = crypto.createCipheriv('chacha20-poly1305', encryptionKey, iv, { authTagLength: 16 });
      encryptedData = Buffer.concat([cipher.update(data), cipher.final()]);
      const chachaAuthTag = cipher.getAuthTag();
      encryptedData = Buffer.concat([encryptedData, chachaAuthTag]);
      break;
    default:
      throw new Error('Unsupported encryption algorithm');
  }
  
  return {
    encrypted: encryptedData,
    metadata: {
      algorithm,
      iv: iv.toString('base64'),
      key: encryptionKey.toString('base64')
    }
  };
}

function decryptData(encryptedData, metadata) {
  if (metadata.algorithm === 'none') {
    return encryptedData;
  }
  
  const key = Buffer.from(metadata.key, 'base64');
  const iv = Buffer.from(metadata.iv, 'base64');
  
  let decipher;
  let decryptedData;
  
  switch (metadata.algorithm) {
    case 'aes-256-cbc':
      decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
      break;
    case 'aes-256-gcm':
      const authTag = encryptedData.slice(-16);
      const ciphertext = encryptedData.slice(0, -16);
      decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      decryptedData = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      break;
    case 'chacha20':
      const chachaAuthTag = encryptedData.slice(-16);
      const chachaCiphertext = encryptedData.slice(0, -16);
      decipher = crypto.createDecipheriv('chacha20-poly1305', key, iv, { authTagLength: 16 });
      decipher.setAuthTag(chachaAuthTag);
      decryptedData = Buffer.concat([decipher.update(chachaCiphertext), decipher.final()]);
      break;
    default:
      throw new Error('Unsupported decryption algorithm');
  }
  
  return decryptedData;
}

// Steganography: Embed data in GIF
async function embedDataInGif(gifBuffer, data, metadata, target) {
  // Create payload
  const payload = JSON.stringify({
    data: data.toString('base64'),
    metadata,
    target,
    timestamp: new Date().toISOString()
  });
  
  const payloadBuffer = Buffer.from(payload);
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(payloadBuffer.length, 0);
  
  // Embed at the end of GIF (before trailer byte 0x3B)
  const trailerIndex = gifBuffer.lastIndexOf(0x3B);
  if (trailerIndex === -1) {
    throw new Error('Invalid GIF format');
  }
  
  const modifiedGif = Buffer.concat([
    gifBuffer.slice(0, trailerIndex),
    Buffer.from([0x21, 0xFF, 0x0B]), // Application Extension
    Buffer.from('DATAEMBED1'), // Application identifier
    lengthBuffer,
    payloadBuffer,
    Buffer.from([0x00]), // Block terminator
    gifBuffer.slice(trailerIndex)
  ]);
  
  return modifiedGif;
}

// Steganography: Extract data from GIF
function extractDataFromGif(gifBuffer) {
  // Look for our application extension marker
  const marker = Buffer.from([0x21, 0xFF, 0x0B]);
  const identifier = Buffer.from('DATAEMBED1');
  
  let index = 0;
  while (index < gifBuffer.length - 20) {
    if (gifBuffer[index] === marker[0] && 
        gifBuffer[index + 1] === marker[1] && 
        gifBuffer[index + 2] === marker[2]) {
      
      const id = gifBuffer.slice(index + 3, index + 14);
      if (id.equals(identifier)) {
        const length = gifBuffer.readUInt32BE(index + 14);
        const payloadStart = index + 18;
        const payload = gifBuffer.slice(payloadStart, payloadStart + length);
        
        try {
          return JSON.parse(payload.toString());
        } catch (err) {
          throw new Error('Failed to parse embedded data');
        }
      }
    }
    index++;
  }
  
  throw new Error('No embedded data found in GIF');
}

// Routes

// Main webapp
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Get available GIFs
app.get('/api/gifs', async (req, res) => {
  try {
    const files = await fs.readdir('./data/gifs');
    const gifs = files.filter(f => f.endsWith('.gif'));
    res.json({ gifs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load GIFs' });
  }
});

// Get GIF file
app.get('/api/gifs/:name', async (req, res) => {
  try {
    const gifPath = path.join('./data/gifs', req.params.name);
    const gifBuffer = await fs.readFile(gifPath);
    res.contentType('image/gif');
    res.send(gifBuffer);
  } catch (err) {
    res.status(404).json({ error: 'GIF not found' });
  }
});

// Process data and create steganographic GIF
app.post('/api/encode', upload.single('file'), async (req, res) => {
  try {
    const { dataType, text, algorithm, gifName, target } = req.body;
    
    let dataToEncode;
    
    if (dataType === 'text') {
      dataToEncode = Buffer.from(text || '');
    } else if (dataType === 'file' && req.file) {
      dataToEncode = req.file.buffer;
    } else {
      return res.status(400).json({ error: 'Invalid data provided' });
    }
    
    // Encrypt data
    const { encrypted, metadata } = encryptData(dataToEncode, algorithm);
    
    // Load GIF
    const gifPath = path.join('./data/gifs', gifName);
    const gifBuffer = await fs.readFile(gifPath);
    
    // Embed data in GIF
    const modifiedGif = await embedDataInGif(gifBuffer, encrypted, metadata, target);
    
    // Return as base64
    res.json({
      success: true,
      gif: modifiedGif.toString('base64'),
      metadata: {
        algorithm,
        target,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Encoding error:', err);
    res.status(500).json({ error: 'Failed to encode data' });
  }
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    if (verifyPassword(username, password)) {
      req.session.userId = username;
      req.session.role = users.get(username).role;
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Check authentication status
app.get('/api/admin/status', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({ authenticated: true, username: req.session.userId });
  } else {
    res.json({ authenticated: false });
  }
});

// Receive data (webhook endpoint)
app.post('/api/receive', upload.single('gif'), async (req, res) => {
  try {
    let gifBuffer;
    
    if (req.file) {
      gifBuffer = req.file.buffer;
    } else if (req.body.gif) {
      gifBuffer = Buffer.from(req.body.gif, 'base64');
    } else {
      return res.status(400).json({ error: 'No GIF data provided' });
    }
    
    // Extract data from GIF
    const extracted = extractDataFromGif(gifBuffer);
    
    // Store received data
    const receivedId = crypto.randomBytes(16).toString('hex');
    const receivedData = {
      id: receivedId,
      source: req.ip,
      target: extracted.target,
      timestamp: new Date().toISOString(),
      encryptedData: extracted.data,
      metadata: extracted.metadata
    };
    
    await fs.writeFile(
      `./data/received/${receivedId}.json`,
      JSON.stringify(receivedData, null, 2)
    );
    
    res.json({ success: true, message: 'Data received', id: receivedId });
  } catch (err) {
    console.error('Receive error:', err);
    res.status(500).json({ error: 'Failed to process data' });
  }
});

// Get all received data (admin only)
app.get('/api/admin/data', requireAuth, async (req, res) => {
  try {
    const files = await fs.readdir('./data/received');
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const allData = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await fs.readFile(`./data/received/${file}`, 'utf-8');
        return JSON.parse(content);
      })
    );
    
    // Sort by timestamp, newest first
    allData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({ data: allData });
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Decrypt specific data item (admin only)
app.post('/api/admin/decrypt/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const filePath = `./data/received/${id}.json`;
    
    const content = await fs.readFile(filePath, 'utf-8');
    const receivedData = JSON.parse(content);
    
    const encryptedBuffer = Buffer.from(receivedData.encryptedData, 'base64');
    const decrypted = decryptData(encryptedBuffer, receivedData.metadata);
    
    // Try to determine if it's text or binary
    let result;
    try {
      result = {
        type: 'text',
        content: decrypted.toString('utf-8')
      };
    } catch {
      result = {
        type: 'binary',
        content: decrypted.toString('base64'),
        size: decrypted.length
      };
    }
    
    res.json({
      success: true,
      decrypted: result,
      metadata: receivedData
    });
  } catch (err) {
    console.error('Decryption error:', err);
    res.status(500).json({ error: 'Failed to decrypt data' });
  }
});

// Delete data item (admin only)
app.delete('/api/admin/data/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const filePath = `./data/received/${id}.json`;
    await fs.unlink(filePath);
    res.json({ success: true, message: 'Data deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete data' });
  }
});

// Initialize and start server
async function startServer() {
  await ensureDirectories();
  await initializeGifs();
  await initializeAdminUser();
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
  });
}

startServer();
