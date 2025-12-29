# Testing Guide

Complete guide to test all features of StegoTransfer.

## Initial Setup Test

1. **Start Server**
```bash
npm install
npm start
```

2. **Verify Startup**
- ✅ Server starts without errors
- ✅ Console shows admin credentials
- ✅ Port 3000 is listening
- ✅ Credentials saved to `data/users/admin_credentials.txt`

## Main Webapp Tests

### Test 1: Text Encoding with AES-256-GCM

1. Navigate to http://localhost:3000
2. Select "Text Data"
3. Enter: `This is a secret message for testing purposes!`
4. Choose: "AES-256-GCM"
5. Select any GIF
6. Target: `192.168.1.100`
7. Click "Encode & Generate"

**Expected Results:**
- ✅ Loading spinner appears
- ✅ Result panel slides in
- ✅ GIF preview displays
- ✅ Download button works
- ✅ Copy Base64 button works
- ✅ GIF file downloads correctly

### Test 2: File Upload with ChaCha20

1. Create a test file: `echo "Test file content" > test.txt`
2. Select "File Upload"
3. Upload `test.txt`
4. Choose: "ChaCha20-Poly1305"
5. Select a different GIF
6. Target: `example.com`
7. Click "Encode & Generate"

**Expected Results:**
- ✅ File name displays in upload label
- ✅ Encoding succeeds
- ✅ Different GIF than Test 1
- ✅ GIF can be downloaded

### Test 3: No Encryption

1. Select "Text Data"
2. Enter: `Unencrypted test data`
3. Choose: "No Encryption"
4. Select a GIF
5. Target: `localhost`
6. Click "Encode & Generate"

**Expected Results:**
- ✅ Works without encryption
- ✅ GIF still generated correctly

### Test 4: Large File Upload

1. Create a larger file: `dd if=/dev/urandom of=large.bin bs=1M count=5`
2. Upload `large.bin` (5MB)
3. Use AES-256-CBC
4. Encode and verify

**Expected Results:**
- ✅ Large file processes successfully
- ✅ No timeout errors
- ✅ GIF contains all data

## API Tests

### Test 5: Send GIF to Receive Endpoint

```bash
# After generating a GIF in Test 1, download it as stego.gif
curl -X POST http://localhost:3000/api/receive \
  -F "gif=@stego.gif" \
  -v
```

**Expected Results:**
- ✅ Returns 200 status
- ✅ Response: `{"success": true, "message": "Data received", "id": "..."}`
- ✅ File created in `data/received/`

### Test 6: Base64 Upload

```bash
# Encode GIF to base64
BASE64=$(base64 -w 0 stego.gif)

# Send via JSON
curl -X POST http://localhost:3000/api/receive \
  -H "Content-Type: application/json" \
  -d "{\"gif\": \"$BASE64\"}" \
  -v
```

**Expected Results:**
- ✅ Accepts base64 format
- ✅ Successfully extracts data

## Admin Panel Tests

### Test 7: Admin Login

1. Navigate to http://localhost:3000/admin
2. Use incorrect credentials first
3. Then use correct credentials from console/file

**Expected Results:**
- ✅ Wrong credentials rejected
- ✅ Correct credentials accepted
- ✅ Dashboard appears
- ✅ Username displayed in top bar

### Test 8: View Received Data

1. After Test 5 & 6, click "Refresh" in admin panel

**Expected Results:**
- ✅ Statistics updated (should show 2+ total)
- ✅ Table shows all received transmissions
- ✅ Correct timestamps displayed
- ✅ Source IPs shown
- ✅ Targets match what was sent
- ✅ Encryption algorithms displayed

### Test 9: Decrypt Data

1. Click "Decrypt" on first entry (from Test 1)

**Expected Results:**
- ✅ Modal opens with slide animation
- ✅ Shows decrypted text: "This is a secret message for testing purposes!"
- ✅ Metadata section shows:
  - Source IP
  - Target: 192.168.1.100
  - Algorithm: aes-256-gcm
  - Timestamp

### Test 10: Decrypt File Upload

1. Click "Decrypt" on second entry (from Test 2)

**Expected Results:**
- ✅ Shows "[Binary Data - X bytes]"
- ✅ Shows base64 of file content
- ✅ Can extract original file from base64

### Test 11: Delete Transmission

1. Click "Delete" on any entry
2. Confirm deletion

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Entry removed from table
- ✅ Statistics updated
- ✅ File deleted from `data/received/`

### Test 12: Logout

1. Click "Logout" button

**Expected Results:**
- ✅ Redirected to login screen
- ✅ Session cleared
- ✅ Cannot access admin routes without re-login

## Security Tests

### Test 13: Session Security

1. Login to admin panel
2. Copy session cookie
3. Logout
4. Try to use old cookie

**Expected Results:**
- ✅ Old session invalid
- ✅ Redirected to login

### Test 14: Authentication Required

```bash
# Try to access admin endpoint without auth
curl http://localhost:3000/api/admin/data -v
```

**Expected Results:**
- ✅ Returns 401 Unauthorized

### Test 15: Password Security

1. Check `data/users/admin_credentials.txt`
2. Verify password is random
3. Restart server
4. Verify new password generated

**Expected Results:**
- ✅ Different password each startup
- ✅ No hardcoded credentials

## UI/UX Tests

### Test 16: Animations

1. Reload main page
2. Observe animations

**Expected Results:**
- ✅ Header slides down
- ✅ Panel fades in from bottom
- ✅ Sections stagger in sequence
- ✅ No animation glitches

### Test 17: Responsive Design

1. Resize browser window
2. Test mobile view (< 768px)

**Expected Results:**
- ✅ Layout adapts to screen size
- ✅ GIF grid reorganizes
- ✅ Buttons stack vertically on mobile
- ✅ Admin table scrolls horizontally

### Test 18: Form Validation

1. Try to submit without data
2. Try to submit without selecting GIF
3. Try to submit without target

**Expected Results:**
- ✅ Appropriate validation messages
- ✅ Form doesn't submit incomplete

## Performance Tests

### Test 19: Multiple Concurrent Encodes

1. Open 3 browser tabs
2. Submit encoding in all tabs simultaneously

**Expected Results:**
- ✅ All complete successfully
- ✅ No conflicts
- ✅ Each gets unique GIF

### Test 20: Large Data Table

1. Send 50+ transmissions
2. View admin panel

**Expected Results:**
- ✅ Table loads smoothly
- ✅ Scrolling is smooth
- ✅ No performance degradation

## Edge Case Tests

### Test 21: Empty Text

1. Try encoding empty text
2. Verify handling

### Test 22: Special Characters

1. Encode text with: `!@#$%^&*()_+-=[]{}|;:'",.<>?/~`
2. Decrypt and verify

### Test 23: Unicode

1. Encode: `Hello 世界 🌍 مرحبا Привет`
2. Decrypt and verify

### Test 24: Very Long Text

1. Encode 10,000 characters
2. Verify successful encode/decode

## Complete Test Checklist

- [ ] Server starts correctly
- [ ] Admin credentials generated
- [ ] Text encoding works
- [ ] File encoding works
- [ ] All encryption algorithms work
- [ ] No encryption works
- [ ] GIF selection works
- [ ] Download GIF works
- [ ] Copy base64 works
- [ ] Receive endpoint works
- [ ] Admin login works
- [ ] Dashboard displays correctly
- [ ] Decryption works
- [ ] Delete works
- [ ] Logout works
- [ ] Session security works
- [ ] Authentication required
- [ ] Animations work
- [ ] Responsive design works
- [ ] Form validation works

## Troubleshooting Failed Tests

**Test fails with "Failed to encode":**
- Check server logs
- Verify GIF files in `data/gifs/`
- Check file upload size limit

**Test fails with "Failed to decrypt":**
- Verify GIF was generated correctly
- Check encryption key in metadata
- Ensure GIF wasn't modified

**Admin panel doesn't load data:**
- Check `data/received/` directory
- Verify JSON files are valid
- Check browser console for errors

**Performance issues:**
- Reduce concurrent operations
- Check system resources
- Verify no other processes using port 3000

---

## Test Results Template

```
Test Date: _______________
Tester: _______________

Main Webapp Tests:
[ ] Test 1: _______________
[ ] Test 2: _______________
[ ] Test 3: _______________
[ ] Test 4: _______________

API Tests:
[ ] Test 5: _______________
[ ] Test 6: _______________

Admin Tests:
[ ] Test 7-12: _______________

Security Tests:
[ ] Test 13-15: _______________

UI/UX Tests:
[ ] Test 16-18: _______________

Notes:
_________________________________
_________________________________
_________________________________
```

Happy Testing! 🧪
