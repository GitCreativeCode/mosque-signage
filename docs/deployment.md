# MosqueSignage Deployment & Operations Guide

MosqueSignage is architected as an autonomous, zero-cloud appliance that runs seamlessly across Windows, Linux (including Raspberry Pi 4/5), macOS, or inside an isolated Docker container.

---

## 1. Getting the Code

Before deploying, obtain the application files via one of two methods:

### Option A: Clone with Git (Recommended)
```bash
git clone https://github.com/GitCreativeCode/mosque-signage.git
cd mosque-signage
```

### Option B: Download Release ZIP
Download the latest pre-packaged ZIP from the [GitHub Releases](https://github.com/GitCreativeCode/mosque-signage/releases) page and extract it to your preferred folder.

> **Note for Docker Users**: Because `docker-compose.yml` mounts local storage volumes and builds the container locally, you must clone or extract the files before running Docker commands.

---

## Deployment Option A: Windows (Terminal or Local Scripts)

In the majority of community centers and mosques, an office computer operates dual monitors:
- **Primary Monitor (X: 0, Y: 0)**: Used by administrative staff for emails, spreadsheets, and the `/admin` portal.
- **Secondary Monitor (X: 1920, Y: 0)**: A 1080p wall-mounted or hallway TV connected via HDMI.

### Step 1: Prerequisites
- Windows 10 or Windows 11 (64-bit).
- [Node.js 22 LTS or newer](https://nodejs.org/).
- Microsoft Edge or Google Chrome (installed by default on Windows 10/11).

### Step 2: Installation & First Run
**Standard Terminal Setup (Recommended):**
1. Open PowerShell or Command Prompt in the project folder:
   ```cmd
   npm install
   npm run build
   ```
2. Start the production server:
   ```cmd
   npm start
   ```

3. Test accessibility in your browser:
   - Administration Portal: `http://localhost:3000/admin`
   - Signage Display: `http://localhost:3000/display`
   - Healthcheck Probe: `http://localhost:3000/api/health`

*Available npm scripts:*
- `npm run dev`: Starts standard local development server with hot reloading.
- `npm run build`: Standard local production Next.js build.
- `npm run build:docker`: Standalone production build (`BUILD_STANDALONE=true next build`) used by Docker.
- `npm start`: Starts standard local production server on port 3000.
- `npm test`: Runs Vitest unit and integration test suite.

### Step 3: Launching Kiosk Mode on Monitor 2
To launch Microsoft Edge (or Google Chrome) in standalone fullscreen kiosk mode targeting the secondary TV monitor:
```cmd
msedge --app=http://localhost:3000/display --window-position=1920,0 --kiosk --no-first-run --disable-pinch
```

The kiosk flags provide dedicated appliance behavior:
- `--app=http://localhost:3000/display`: Launches as a standalone web application window without browser chrome, URL bar, or tabs.
- `--window-position=1920,0`: Automatically offsets the window to the secondary monitor:
  - `1920,0`: Secondary monitor is arranged to the **right** of a standard 1080p primary screen (width 1920).
  - `2560,0` or `3840,0`: Secondary monitor is to the right of a 1440p (2K) or 4K primary monitor.
  - `-1920,0`: Secondary monitor is arranged to the **left** of the primary screen.
  - `0,0`: Single-monitor setup (e.g. dedicated TV mini-PC with only 1 display connected).
- `--kiosk`: Locks full-screen mode preventing accidental closure.
- `--no-first-run`: Skips first-run browser onboarding prompts.
- `--disable-pinch`: Prevents unwanted touchscreen zoom behavior.

### Step 4: Configure Auto-Start on Windows Boot
Run this command **on the Windows computer where MosqueSignage is installed**:
```cmd
npm run autostart
```
Choose **TV Display Mode** (this PC is plugged directly into the TV: starts server minimized + opens fullscreen TV kiosk) or **Server-Only Mode** (starts the server minimized in the background while separate TVs connect over Wi-Fi), or use direct flags:
```cmd
npm run autostart -- --display   # Local server + fullscreen TV kiosk
npm run autostart -- --server    # Headless server-only background start
npm run autostart -- --remove    # Remove autostart
npm run autostart -- --status    # Check status
```

> **Auto-Opening the Display on a Separate TV Device After Reboot** *(No Node.js or MosqueSignage install needed on the TV device!)*:  
> Look for the **`Connect TV`** URL printed under *Remote Screens & Mobile* when you run `npm start` on your server PC (`http://<YOUR-SERVER-IP>:3000/display`):
> - **Windows / macOS / Linux TV PC (Zero Terminal Commands)**:
>   1. Open Microsoft Edge or Google Chrome on the TV computer and visit `http://<YOUR-SERVER-IP>:3000/display`.
>   2. Click the **Install App** icon in the address bar.
>   3. Visit `edge://apps` (Edge) or `chrome://apps` (Chrome), right-click **MosqueSignage**, and enable **Auto-start on device login** *(or "Start app when you sign in")*.
> - **Raspberry Pi Display Client**: Add `Exec=chromium-browser --kiosk --noerrdialogs --disable-infobars http://<YOUR-SERVER-IP>:3000/display` in `~/.config/autostart/mosque-signage-display.desktop`.
> - **Android TV / Fire TV / Smart TV**: Use a kiosk browser app (such as *Fully Kiosk Browser*) configured to auto-launch `http://<YOUR-SERVER-IP>:3000/display` on device boot.

---

## Deployment Option B: Linux & Raspberry Pi (Raspberry Pi OS / Ubuntu / Debian)

MosqueSignage runs exceptionally well on low-power Linux hardware, such as a **Raspberry Pi 4 or 5** or an **Intel N100 mini-PC**.

### Step 1: Prerequisites
- Linux OS with Node.js 22 LTS or newer installed (`node -v`).
- Chromium browser (pre-installed on Raspberry Pi OS).

### Step 2: 1-Click Startup
```bash
chmod +x start-signage.sh update.sh
./start-signage.sh
```
The script automatically installs dependencies, builds the application, and starts the server on port 3000.

### Step 3: Raspberry Pi Kiosk Autostart
To make the TV boot directly into MosqueSignage upon power-on:
1. Edit the autostart configuration:
   ```bash
   nano ~/.config/lxsession/LXDE-pi/autostart
   ```
   *(On Raspberry Pi OS Bookworm/Wayland, use `~/.config/wayfire.ini` or desktop autostart entry).*
2. Add the Chromium kiosk command:
   ```bash
   @chromium-browser --kiosk --noerrdialogs --disable-infobars --check-for-update-interval=31536000 http://localhost:3000/display
   ```
3. To start the backend automatically on boot, configure a systemd service:
   ```ini
   # /etc/systemd/system/mosque-signage.service
   [Unit]
   Description=MosqueSignage Digital Signage Engine
   After=network.target

   [Service]
   Type=simple
   User=pi
   WorkingDirectory=/home/pi/mosque-signage
   ExecStart=/usr/bin/npm start
   Restart=always
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```
   Enable with `sudo systemctl enable --now mosque-signage`.

---

## Deployment Option C: macOS

### Step 1: Prerequisites
- macOS 12 Monterey or newer with [Node.js 22 LTS](https://nodejs.org/) installed.
- Modern browser (Google Chrome, Safari, Firefox, or Microsoft Edge).

### Step 2: Running on macOS
```bash
chmod +x start-signage.sh update.sh
./start-signage.sh
```
Open `http://localhost:3000/display` on your attached display and press `Cmd + Ctrl + F` (or `F` inside the page) for fullscreen kiosk presentation.

---

## Deployment Option D: Docker & Docker Compose (Zero-Config Container)

For servers, NAS devices, or environments with Docker:

### Step 1: Prerequisites
- Docker Engine 24.0+ and Docker Compose v2.

### Step 2: Start the Appliance (Zero-Config)
The repository contains a fully configured `docker-compose.yml`:
```bash
docker compose up -d
```
Docker Compose will automatically:
1. Build the standalone image using the local `Dockerfile` on `node:22-alpine`.
2. Map port `3000:3000`.
3. Mount persistent named volumes for SQLite database (`mosque_data`) and poster uploads (`mosque_uploads`).
4. Configure autonomous container restarts (`restart: unless-stopped`).
5. Monitor container health via periodic curl probes to `/api/health`.

### Step 3: Updating the Container
```bash
git pull
docker compose up -d --build
```

### Optional: Custom Port or Environment Overrides
To run on a different host port (e.g. 3001 if 3000 is occupied), update `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"
```
Or specify environment variables for reverse proxies:
```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - TRUST_PROXY_HEADERS=true
```

---

## Data Persistence & Backup Procedures

All state in MosqueSignage is strictly local and lives in two persistent directories:
1. **SQLite Database**: `data/mosque_signage.db` (stores mosque settings, prayer overrides, Jummah shifts, and poster metadata).
2. **Media Uploads**: `public/uploads/` (stores uploaded poster images and generated announcement slides).

### Backing Up Data (Windows Host)
Simply copy or zip:
- `data/mosque_signage.db`
- `public/uploads/`

### Backing Up Data (Docker Volumes)
Export the persistent volumes to a backup archive:
```bash
docker run --rm \
  -v mosque_data:/data \
  -v mosque_uploads:/uploads \
  -v $(pwd):/backup \
  alpine tar czf /backup/mosque-signage-backup-$(date +%F).tar.gz /data /uploads
```

### Restoring Data (Docker Volumes)
```bash
docker run --rm \
  -v mosque_data:/data \
  -v mosque_uploads:/uploads \
  -v $(pwd):/backup \
  alpine sh -c "tar xzf /backup/mosque-signage-backup-*.tar.gz -C /"
```

---

## Network Architecture & Mobile Admin Access

To allow committee members to edit settings and upload flyers from mobile phones or laptops connected to the mosque's local Wi-Fi:

1. Identify the host machine's local IP address (e.g. `192.168.1.150`).
2. Allow incoming TCP traffic on port `3000` through the Windows Defender Firewall:
   ```powershell
   New-NetFirewallRule -DisplayName "MosqueSignage Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   ```
3. Committee members can now access:
   - Admin Portal: `http://192.168.1.150:3000/admin`
   - Kiosk Display: `http://192.168.1.150:3000/display`

---

## Remote Access Architecture: Tailscale VPN vs Public Domain

> [!WARNING]
> **Community Reference Blueprint (Untested in Production)**
> The remote access architectures described below (Tailscale VPN and Public Domain Reverse Proxy) are reference blueprints provided for advanced network administrators. They have not yet been field-tested in live production by the core MosqueSignage maintainer.
> If you test or deploy this configuration in your mosque, we actively welcome your feedback, corrections, and experiences! Please reach out to `helpdesk.guidance@gmail.com` or open a GitHub discussion to help refine these instructions for other community centers.

MosqueSignage supports two distinct models for managing the screen from outside the mosque:

| Feature | Track A: Tailscale VPN (Recommended) | Track B: Public Domain (`signage.mymosque.org`) |
| :--- | :--- | :--- |
| **Internet Attack Surface** | **Zero** — appliance is never exposed to public internet scanners or bots. | Exposed to crawlers, CT logs, and automated bot scanners. |
| **Authentication** | Tailnet membership + App PIN or Username/Password. | Mandatory **Username + Password ($\ge 8$ chars with uppercase, number & symbol)** + persistent SQLite lockout. |
| **HTTPS Certificates** | Automatic `.ts.net` TLS via `tailscale serve`. | Automatic via Cloudflare Tunnel or Caddy / Let's Encrypt. |
| **Router Port Forwarding** | **None.** | **None** (Cloudflare Tunnel) or TCP 443 only (Caddy/Nginx). |
| **Best For** | 95% of mosques where 2–10 board or committee members manage screens. | Organizations requiring access from unmanaged guest devices without VPN. |

---

## Remote Access Option 1: Tailscale VPN Blueprint (Recommended)

Tailscale creates a secure, encrypted peer-to-peer WireGuard mesh network (Tailnet). It gives the host machine a private domain name (e.g. `https://mosque-tv.your-tailnet.ts.net`) with genuine HTTPS certificates and zero open firewall ports.

### Host Setup (Windows Mini-PC or Linux)
1. Install [Tailscale](https://tailscale.com/download) on the host machine.
2. Sign into the mosque's dedicated Tailscale account.
3. In the Tailscale Admin Console:
   - Name the machine (e.g. `mosque-tv`).
   - Disable Key Expiry for the signage server node so it never disconnects.
4. Enable local HTTPS and background routing on port 3000:
   ```cmd
   tailscale serve --bg 3000
   ```
   *Note: Keep `tailscale funnel` **disabled** so the application is only reachable inside your mosque's private Tailnet.*

### Committee Access
1. Media committee members install the Tailscale app on their iPhone, Android, or laptop and log in.
2. Open `https://mosque-tv.your-tailnet.ts.net/admin` directly in any mobile or desktop browser.
3. Cookies remain valid (`HttpOnly; Secure; SameSite=Lax`), and the PWA can be installed to home screens.

### Tailnet Access Control List (ACL) Example
In the Tailscale Admin Console (`Access Controls`), enforce least privilege so only the media committee can access port 3000:
```json
{
  "tagOwners": {
    "tag:signage-server": ["group:it-admins"]
  },
  "groups": {
    "group:media-team": ["imam@mymosque.org", "media@mymosque.org"]
  },
  "acls": [
    {
      "action": "accept",
      "src": ["group:media-team"],
      "dst": ["tag:signage-server:443", "tag:signage-server:3000"]
    }
  ]
}
```

---

## Remote Access Option 2: Public Domain Reverse Proxy & Cloudflare Tunnel

When exposing MosqueSignage to the public internet under a custom domain (e.g., `signage.mymosque.org`), ensure all hardening controls are active.

### Deployment Method A: Cloudflare Tunnel (`cloudflared`) (Recommended for Public Domains)
Cloudflare Tunnel creates an outbound-only connection from your host PC to Cloudflare's edge with **zero inbound router ports**:

1. Install `cloudflared` on the host machine.
2. Authenticate and create a tunnel:
   ```bash
   cloudflared tunnel create mosque-tv
   ```
3. Configure `~/.cloudflared/config.yml`:
   ```yaml
   tunnel: <TUNNEL_UUID>
   credentials-file: /path/to/<TUNNEL_UUID>.json

   ingress:
     - hostname: signage.mymosque.org
       service: http://127.0.0.1:3000
     - service: http_status:404
   ```
4. Route your DNS hostname:
   ```bash
   cloudflared tunnel route dns mosque-tv signage.mymosque.org
   ```
5. Run the tunnel as a service:
   ```bash
   cloudflared tunnel run mosque-tv
   ```
6. *(Optional but Recommended)*: In Cloudflare Zero Trust, configure an **Access Application** in front of `/admin*` requiring one-time email OTP verification.

### Deployment Method B: Caddy Reverse Proxy (Automatic HTTPS)
Create a `Caddyfile`:
```caddy
signage.mymosque.org {
    encode gzip zstd
    reverse_proxy 127.0.0.1:3000 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

### Deployment Method C: Nginx Reverse Proxy
```nginx
server {
    listen 443 ssl http2;
    server_name signage.mymosque.org;

    ssl_certificate /etc/letsencrypt/live/signage.mymosque.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/signage.mymosque.org/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 86400s;
    }
}
```

---

## Updating MosqueSignage

When a new version or security update is released, choose the instructions for your platform:

### Updating on Windows

- **Method A: Git Clone (1-Click)**
  ```cmd
  git pull origin main
  npm install
  npm run build
  npm start
  ```
- **Method B: ZIP Release (Data Migration)**
  1. Download the new release `.zip` and extract to a new folder (e.g. `C:\MosqueSignage-v0.2.0`).
  2. In the new folder, run:
     ```cmd
     npm install
     npm run migrate-data "C:\Path\To\Previous\MosqueSignage"
     npm start
     ```
     `npm run migrate-data` automatically transfers your SQLite database (`signage.db`), WAL journals, session secrets, uploaded media, and safely merges custom frames.
  *(Alternatively, manually copy the `data\` and `public\uploads\` folders from the old directory to the new directory).*

### Updating on Linux & Raspberry Pi

- **Method A: 1-Click Script**: Run `./update.sh`
- **Method B: Git**: Run `git pull origin main && npm install && npm run build && ./start-signage.sh`
- **Method C: ZIP Release**: Extract the new `.zip`, run `npm install && npm run migrate-data "/path/to/old-folder" && ./start-signage.sh`

### Updating on macOS

- **Method A: 1-Click Script**: Run `./update.sh`
- **Method B: Git**: Run `git pull origin main && npm install && npm run build && ./start-signage.sh`
- **Method C: ZIP Release**: Extract the new `.zip`, run `npm install && npm run migrate-data "/path/to/old-folder" && ./start-signage.sh`

### Updating with Docker

```bash
git pull origin main
docker compose up -d --build
```
*(Persistent Docker volumes `mosque_data` and `mosque_uploads` retain all database records and uploaded media).*

---

## Public Deployment Environment Variables

Configure these environment variables in `.env.local` or Docker environment when deploying behind a reverse proxy or exposing publicly:

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `TRUST_PROXY_HEADERS` | `false` | Set to `true` when behind Cloudflare Tunnel, Caddy, or Nginx. Enables extracting the real client IP from `CF-Connecting-IP` / `X-Forwarded-For` for accurate persistent SQLite rate limiting, and enforces `Secure` cookies. |
| `PUBLIC_ACCESS_MODE` | `false` | Set to `true` on public internet deployments. Rejects factory default PIN `'1234'`, and prevents switching back to numeric PIN mode. |
| `MAX_SSE_CONNECTIONS` | `25` | Caps concurrent display Server-Sent Events (SSE) connections. Excess connections receive `503 Service Unavailable` with `Retry-After: 30` to prevent connection-exhaustion DoS. |
| `ADMIN_SESSION_SECRET` | *(auto-generated)* | Explicit 32-byte hex secret for HMAC session token signing. Auto-persisted in `data/.session_secret` if unset. |
| `COOKIE_SECURE` | *(auto-detected)* | Override cookie `Secure` flag (`true` or `false`). Auto-detected via HTTPS protocol by default. |

---

## Related Knowledge Base Guides

For interactive troubleshooting and step-by-step setup walkthroughs, refer to the built-in documentation portal:
- **[Remote Access via Tailscale VPN & Custom Domains](/faq/remote-tailscale-and-domain-access)**: Zero-port-forwarding WireGuard mesh tunnel setup and reverse proxy security headers.
- **[TV Display Access Keys & Screen Security](/faq/display-pairing-and-screen-security)**: Pairing physical TV screens and isolating signage displays on shared networks.
- **[Dual-Mode Admin Authentication & Session Management](/faq/dual-mode-admin-authentication)**: Upgrading to Username+Password authentication and global device revocation.

