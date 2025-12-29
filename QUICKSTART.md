# Quick Start Guide

## Prerequisites
- Node.js (v14 or higher) - Download from https://nodejs.org

## Installation & Running

### Option 1: Quick Start (Linux/Mac)
```bash
./start.sh
```

### Option 2: Manual Start (All Platforms)
```bash
npm install
npm start
```

## First Time Setup

1. After starting the server, look for this in the console:
```
=================================
ADMIN CREDENTIALS (Save these!)
=================================
Username: admin
Password: [randomly generated]
=================================
```

2. **SAVE THESE CREDENTIALS!** They're also saved in `data/users/admin_credentials.txt`

3. Open your browser:
   - Main App: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

## Testing the System

### Encode Some Data:
1. Go to http://localhost:3000
2. Select "Text Data"
3. Type a secret message
4. Choose encryption (try AES-256-GCM)
5. Select a GIF
6. Enter target: "localhost" or "127.0.0.1"
7. Click "Encode & Generate"
8. Download the generated GIF

### Send to Server:
```bash
# Send the downloaded GIF
curl -X POST http://localhost:3000/api/receive -F "gif=@stego_*.gif"
```

### View in Admin Panel:
1. Go to http://localhost:3000/admin
2. Login with your credentials
3. Click "Decrypt" on the received transmission
4. See your original message!

## Key Features

✅ **Main Webapp**
- Text or file input
- Multiple encryption algorithms
- Steganography in GIF images
- Beautiful cyberpunk UI

✅ **Admin Panel**
- Secure authentication
- Dashboard with statistics
- Decrypt received data
- Track sources and targets
- Command center aesthetic

## Troubleshooting

**Port already in use?**
Edit `server.js` and change:
```javascript
const PORT = 3000;  // Change to 3001, 8080, etc.
```

**Can't access admin panel?**
Check `data/users/admin_credentials.txt` for your password

**Dependencies not installing?**
Make sure you have Node.js v14+ and npm installed

## Security Notes

⚠️ This is a development server. For production:
- Enable HTTPS
- Use environment variables for config
- Implement rate limiting
- Use a real database
- Set secure session cookies

## Need Help?

Check the full README.md for detailed documentation!

---

**Enjoy your secure steganographic transfer system!** 🔒🎨
