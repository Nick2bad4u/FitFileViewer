# Gyazo Integration Setup

FitFileViewer can upload chart images to Gyazo through the in-app Gyazo
settings flow. The default application credentials are bundled with the app, so
most users only need to connect their Gyazo account from the UI.

This page is for users who want to use their own Gyazo OAuth application.

## Prerequisites

- A Gyazo account.
- Access to create a Gyazo developer application.

## Default Flow

1. Start FitFileViewer.
2. Load a FIT file with charts.
3. Open the chart controls.
4. Select `Gyazo Settings`.
5. Select `Connect to Gyazo`.
6. Complete the browser-based OAuth flow.
7. Use `Share Gyazo` from the chart export controls.

The app starts a local OAuth callback server through the Electron main process
and listens on:

```text
http://localhost:3000/gyazo/callback
```

Access tokens and optional custom credentials are stored in browser storage by
the renderer export utilities.

## Custom Credentials

Use custom credentials only if you want uploads to use your own Gyazo developer
application.

1. Open the [Gyazo Developer Applications page](https://gyazo.com/oauth/applications).
2. Create a new application.
3. Use this redirect URI:

```text
http://localhost:3000/gyazo/callback
```

4. Copy the application `Client ID` and `Client Secret`.
5. In FitFileViewer, open `Gyazo Settings`.
6. Expand `Advanced: Use Custom Credentials`.
7. Paste the credentials and select `Save Custom Credentials`.
8. Select `Connect to Gyazo`.

Do not edit `electron-app/utils/files/export/exportUtils.ts` just to set local
credentials. The settings modal persists custom values through the app UI.

## Runtime Files

The current implementation is TypeScript and is owned by the root build
pipeline:

- Renderer export logic:
  `electron-app/utils/files/export/exportUtils.ts`
- Main-process OAuth callback server:
  `electron-app/main/oauth/gyazoOAuthServer.ts`
- IPC contract:
  `electron-app/shared/ipc.ts`

These files are compiled by the root `npm run build:runtime-ts` script.

## API Endpoints

- Authorization: `https://gyazo.com/oauth/authorize`
- Token exchange: `https://gyazo.com/oauth/token`
- Image upload: `https://upload.gyazo.com/api/upload`

## Troubleshooting

### Connection Fails

- Confirm the Gyazo app redirect URI is exactly
  `http://localhost:3000/gyazo/callback`.
- Confirm another process is not already using local port `3000`.
- Clear saved Gyazo data from `Gyazo Settings`, then reconnect.

### Upload Fails

- Confirm the app has internet access.
- Disconnect and reconnect the Gyazo account to refresh the access token.
- Check the developer console for the upload error details.

### Custom Credentials Do Not Apply

- Reopen `Gyazo Settings` and confirm the custom credentials are still present.
- Save both `Client ID` and `Client Secret`; one value by itself is ignored.
- Disconnect and reconnect after changing credentials.

## Security Notes

- Do not commit personal Gyazo credentials to the repository.
- Prefer the in-app custom credential fields over source changes.
- Treat the client secret as sensitive even though this is a desktop app.
- Clear all Gyazo data from the settings modal before sharing a local profile or
  debugging package.
