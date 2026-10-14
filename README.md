# Dead Man's Switch – Digital Inheritance Vault

A browser-based Cryptography PBL demonstration for encrypted notes and an inactivity/check-in workflow.

## Features
- Encrypts and decrypts a sample note with the browser Web Crypto API (AES-GCM, 256-bit key).
- Uses PBKDF2-SHA-256 to derive a key from a demo passphrase.
- Generates a fresh random salt and 96-bit IV for each encryption.
- Simulates check-in, grace period, cancellation, and release states.
- Keeps demo package data in browser local storage.
- Includes a basic activity log and responsive layout.

## Run locally
1. Download or clone this repository.
2. Open `index.html` in a modern browser. If Web Crypto is unavailable for a local file, run a local server:
   - Install Python 3.
   - Open a terminal in this folder.
   - Run `python -m http.server 8000`
   - Visit `http://localhost:8000`

## Files
- `index.html` – interface
- `style.css` – styles
- `script.js` – encryption and demo workflow

## Important security note
This is an academic prototype, not a production digital inheritance service. It does not implement real authentication, a server/database, real recipient key exchange, email notifications, or legally reliable death verification. The inactivity/release workflow is a local simulation. Do not enter real secrets.

The report discusses Argon2id and RSA-OAEP as part of the proposed design. This simplified browser demo instead uses PBKDF2 via Web Crypto and does not implement RSA-OAEP key wrapping. Do not claim those omitted features are implemented.
