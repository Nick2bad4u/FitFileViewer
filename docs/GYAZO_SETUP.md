# Gyazo Integration Setup [Advanced Users Only]

This guide explains how to set up Gyazo integration for FitFileViewer to
enable direct chart uploads to Gyazo.

## Prerequisites

- A Gyazo account (free at [gyazo.com](https://gyazo.com))
- Developer access to create Gyazo applications

## Setup Steps

### 1\. Register Your Application [Advanced Users Only]

1. Visit the [Gyazo Developer Applications page](https://gyazo.com/oauth/applications)
2. Click "Create New Application" or "Register New Application"
3. Fill in the application details:

- **Application Name**: `FitFileViewer` (or your preferred name)
- **Description**: `Desktop application for viewing and analyzing FIT files
from fitness devices`
- **Website**: `https://github.com/your-username/FitFileViewer` (optional)
- **Redirect URI**: `http://localhost:3000/gyazo/callback`

### 2\. Get Your Credentials

After creating the application, you'll receive:

- **Client ID**: A public identifier for your app
- **Client Secret**: A private key for your app (keep this secure!)

### 3\. Configure the Application

Open `electron-app/utils/exportUtils.js` and update the `gyazoConfig` object:

```javascript
gyazoConfig: {
    clientId: 'YOUR_ACTUAL_CLIENT_ID_HERE',
    clientSecret: 'YOUR_ACTUAL_CLIENT_SECRET_HERE',
    redirectUri: 'http://localhost:3000/gyazo/callback',
    authUrl: 'https://gyazo.com/oauth/authorize',
    tokenUrl: 'https://gyazo.com/oauth/token',
    uploadUrl: 'https://upload.gyazo.com/api/upload'
},
```

Replace:

- `YOUR_ACTUAL_CLIENT_ID_HERE` with your actual Client ID
- `YOUR_ACTUAL_CLIENT_SECRET_HERE` with your actual Client Secret

### 4\. Security Considerations

⚠️ **Important Security Notes:**

- **Never commit your Client Secret to public repositories**
- Consider using environment variables for production deployments
- The Client Secret should only be used in secure, server-side environments
- For distributed applications, consider implementing a backend proxy for OAuth flows

### 5\. Test the Integration

1. Restart the FitFileViewer application
2. Load a FIT file with charts
3. Go to the Chart Controls section
4. Click "Gyazo Settings" to connect your account
5. Follow the OAuth flow to authenticate
6. Try uploading a chart using "Share Gyazo"

## How It Works

### OAuth Flow

1. **User clicks "Share Gyazo"** → App checks if user is authenticated
2. **If not authenticated** → App opens OAuth modal with Gyazo login link
3. **User authorizes** → Gyazo redirects with authorization code
4. **App exchanges code** → Gets access token from Gyazo
5. **Token stored** → Saved in localStorage for future uploads
6. **Upload charts** → Uses access token to upload images

### API Endpoints Used

- **Authorization**: `https://gyazo.com/oauth/authorize`
- **Token Exchange**: `https://gyazo.com/oauth/token`
- **Image Upload**: `https://upload.gyazo.com/api/upload`

### Data Storage

- Access tokens are stored in browser localStorage
- Tokens persist until user manually disconnects or they expire
- No sensitive data is stored permanently

## Troubleshooting

### Common Issues

**"Client ID not configured"**

- Make sure you've updated the `gyazoConfig` with your actual credentials
- Restart the application after making changes

**"Authentication failed"**

- Check that your redirect URI matches exactly: `http://localhost:3000/gyazo/callback`
- Verify your Client ID and Client Secret are correct
- Make sure your Gyazo application is active

**"Upload failed"**

- Check your internet connection
- Verify the access token hasn't expired (try disconnecting and reconnecting)
- Check browser console for detailed error messages

**"Invalid redirect URI"**

- The redirect URI in your Gyazo app settings must exactly match: `http://localhost:3000/gyazo/callback`
- Check for typos or extra/missing characters

### Getting Help

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Gyazo application settings
3. Test with a fresh OAuth authentication
4. Check the [Gyazo API documentation](https://gyazo.com/api/docs)

## Advanced Configuration

### Custom Redirect URI

If you need to use a different redirect URI:

1. Update your Gyazo application settings
2. Modify the `redirectUri` in `gyazoConfig`
3. Ensure the new URI is accessible and can handle the OAuth callback

### Environment Variables

For production deployments, consider using environment variables:

```javascript
gyazoConfig: {
    clientId: process.env.GYAZO_CLIENT_ID || 'YOUR_GYAZO_CLIENT_ID',
    clientSecret: process.env.GYAZO_CLIENT_SECRET || 'YOUR_GYAZO_CLIENT_SECRET',
    // ... rest of config
}
```

## API Reference

### Available Functions

- `exportUtils.isGyazoAuthenticated()` - Check if user is logged in
- `exportUtils.authenticateWithGyazo()` - Start OAuth flow
- `exportUtils.showGyazoAccountManager()` - Open account settings
- `exportUtils.uploadToGyazo(base64Image)` - Upload image to Gyazo
- `exportUtils.shareChartsToGyazo()` - Share charts with modal selection

### Usage Examples

```javascript
// Check authentication status
if (exportUtils.isGyazoAuthenticated()) {
    console.log("User is connected to Gyazo");
}

// Upload a chart
try {
    const gyazoUrl = await exportUtils.uploadToGyazo(base64ImageData);
    console.log("Chart uploaded:", gyazoUrl);
} catch (error) {
    console.error("Upload failed:", error.message);
}

// Show account manager
exportUtils.showGyazoAccountManager();
```
