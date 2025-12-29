# StegoTransfer - Secure Steganographic Data Transfer System

A sophisticated web application for encoding encrypted data into GIF images using steganography techniques, with a secure admin panel for receiving and decrypting transmissions.

## Features

### Main Webapp
- **Data Input**: Support for both text and file uploads
- **Multiple Encryption Algorithms**: 
  - AES-256-GCM (Recommended)
  - AES-256-CBC
  - ChaCha20-Poly1305
  - No encryption option
- **Steganographic Encoding**: Embeds encrypted data into GIF images
- **Custom Target**: Specify IP address or hostname for transmission tracking
- **Beautiful UI**: Cyberpunk-themed interface with smooth animations

### Admin Panel
- **Secure Authentication**: Dynamic password generation (no hardcoded credentials)
- **Dashboard**: Real-time statistics of received transmissions
- **Data Management**: View, decrypt, and delete intercepted data
- **Source Tracking**: Monitor all incoming transmissions by IP/hostname
- **Decryption Interface**: Secure decryption with metadata display

## Security Features

1. **No Local Execution**: All file processing happens in isolated context
2. **Proper Encryption**: Industry-standard encryption algorithms with secure key generation
3. **Steganography**: Data hidden in GIF metadata, not visually apparent
4. **Session Management**: Secure session handling for admin authentication
5. **Dynamic Credentials**: Admin password generated at startup, never hardcoded

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Start the server**:
```bash
npm start
```

3. **Access the applications**:
   - Main Webapp: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

4. **Get admin credentials**:
   - Check the console output when the server starts
   - Credentials are also saved in `./data/users/admin_credentials.txt`

## Usage

### Encoding Data

1. Open the main webapp at `http://localhost:3000`
2. Choose your data input method (text or file)
3. Enter your data
4. Select an encryption algorithm
5. Choose a carrier GIF from the available options
6. Enter the target IP or hostname
7. Click "Encode & Generate"
8. Download the generated steganographic GIF

### Admin Panel

1. Access the admin panel at `http://localhost:3000/admin`
2. Log in with the credentials shown in the console
3. View all received transmissions in the dashboard
4. Click "Decrypt" to view the hidden content
5. Use "Delete" to remove transmissions
6. Click "Refresh" to update the data table

### Receiving Data

Send the encoded GIF to the server's receive endpoint:

```bash
curl -X POST http://localhost:3000/api/receive \
  -F "gif=@encoded.gif"
```

Or use base64:

```bash
curl -X POST http://localhost:3000/api/receive \
  -H "Content-Type: application/json" \
  -d '{"gif": "BASE64_DATA_HERE"}'
```

## API Endpoints

### Public Endpoints

- `GET /` - Main webapp
- `GET /admin` - Admin panel login
- `GET /api/gifs` - List available carrier GIFs
- `GET /api/gifs/:name` - Get specific GIF file
- `POST /api/encode` - Encode data into GIF
- `POST /api/receive` - Receive encoded GIF

### Admin Endpoints (Authentication Required)

- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/status` - Check authentication status
- `GET /api/admin/data` - Get all received data
- `POST /api/admin/decrypt/:id` - Decrypt specific transmission
- `DELETE /api/admin/data/:id` - Delete transmission

## Project Structure

```
stegotransfer/
├── server.js              # Main Express server
├── package.json           # Dependencies
├── public/
│   ├── index.html        # Main webapp UI
│   └── admin.html        # Admin panel UI
└── data/
    ├── gifs/             # Carrier GIF files
    ├── received/         # Received transmissions
    └── users/            # User credentials
```

## Technical Details

### Steganography Implementation

The system uses GIF Application Extension blocks to embed data:
- Marker: `0x21 0xFF 0x0B` (Application Extension)
- Identifier: `DATAEMBED1`
- Payload: JSON containing encrypted data, metadata, and target info
- Inserted before GIF trailer byte (`0x3B`)

### Encryption

All encryption uses Node.js crypto module:
- **AES-256-GCM**: Authenticated encryption with 256-bit key
- **AES-256-CBC**: Block cipher with 256-bit key and IV
- **ChaCha20-Poly1305**: Modern authenticated cipher

Each encryption generates:
- Random 32-byte encryption key
- Random 16-byte initialization vector (IV)
- Authentication tag for GCM/ChaCha20 modes

### Session Security

- Secure session cookies with httpOnly flag
- Random session secret generated on startup
- 24-hour session expiration
- Password hashing with PBKDF2 (100,000 iterations)

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon for automatic server restarts on file changes.

### Adding Custom GIFs

1. Place GIF files in `./data/gifs/` directory
2. Server will automatically detect and serve them
3. Naming format: `name.gif` (displayed as "name" in UI)

### Customization

- **Port**: Change `PORT` constant in `server.js`
- **Session Duration**: Modify `cookie.maxAge` in session config
- **File Size Limit**: Adjust `limits.fileSize` in multer config
- **UI Theme**: Edit CSS variables in HTML files

## Security Considerations

1. **Production Deployment**:
   - Enable HTTPS
   - Set `cookie.secure: true` in session config
   - Use environment variables for sensitive config
   - Implement rate limiting
   - Add CSRF protection
   - Use a proper database instead of filesystem

2. **Data Retention**:
   - Implement automatic cleanup of old transmissions
   - Add data retention policies
   - Consider encrypted storage at rest

3. **Network Security**:
   - Deploy behind reverse proxy (nginx/Apache)
   - Implement IP whitelisting for admin panel
   - Use firewall rules
   - Monitor for suspicious activity

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript support required
- CSS Grid and Flexbox support required

## License

MIT License - See LICENSE file for details

## Disclaimer

This tool is for educational and legitimate security research purposes only. Users are responsible for ensuring their use complies with applicable laws and regulations. The developers assume no liability for misuse.

## Support

For issues, questions, or contributions, please open an issue on the project repository.

---

**Note**: Remember to keep your admin credentials secure and change them regularly in production environments!
