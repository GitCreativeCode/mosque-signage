# IT & Admin Operations Handbook

This guide is a practical, quick reference for mosque administrators, IT volunteers, and facility managers running **MosqueSignage**.

---

## 1. Quick Command Summary

| Action | Command / Location | Purpose |
| :--- | :--- | :--- |
| **Start on Windows** | `npm start` *(or `npm install && npm start`)* | Starts server on `http://localhost:3000`. |
| **Update on Windows**| `git pull && npm install && npm run build` *(or `npm run migrate-data`)* | Updates code via Git or migrates database and media from a previous ZIP folder. |
| **Start on Linux/Mac** | `./start-signage.sh` | 1-command startup on Linux (including Raspberry Pi) and macOS. |
| **Update on Linux/Mac**| `./update.sh` | 1-command update on Linux and macOS. |
| **Reset Forgotten PIN** | `npm run reset-pin` | Terminal tool to reset your Admin PIN without needing the old one. |
| **Reset Auth (Username/Password)** | `npm run reset-auth` | Terminal tool to change passwords or switch back to PIN mode. |
| **Run Health Check** | `curl http://localhost:3000/api/health` | Checks if the server and database are healthy. |
| **Docker Start** | `docker compose up -d` | Runs the appliance inside a Docker container. |
| **Run Test Suite** | `npm test` | Runs all 483 automated tests across 46 suites to verify stability. |

> **Host vs Local Network (LAN) Access**:
> - **On the Host PC**: Use `http://localhost:3000/display` and `http://localhost:3000/admin`.
> - **From Other Devices on Same Wi-Fi (Smart TVs, Tablets, Laptops)**: Replace `localhost` with the host computer's local IP address (e.g. `http://192.168.1.50:3000/display`). Find your IP with `ipconfig` (Windows) or `hostname -I` (Linux). `localhost` will **not** work when entered from another device.

---

## 2. Resetting Forgotten Credentials

If you forget your Admin PIN or password, you can reset it locally from the host computer:

1. Open PowerShell or a terminal on the computer running MosqueSignage.
2. Go to the project directory:
   ```bash
   cd /path/to/mosque-signage
   ```
3. Run the reset command:
   ```bash
   npm run reset-pin
   ```
4. Enter your new PIN (e.g. `1234`) and confirm it.
5. This immediately updates the database, clears any lockout countdowns, and lets you log in right away at `http://localhost:3000/admin`.

> If you are using Username & Password mode, run **`npm run reset-auth`** instead to update your credentials or switch back to simple PIN mode.

---

## 3. Backing Up and Restoring Data

MosqueSignage keeps all its data locally on your computer in two places:

- **Database**: `data/mosque_signage.db` (contains all settings, prayer overrides, and slide details).
- **Media Files**: `public/uploads/` (contains all uploaded flyers, posters, and videos).

### How to Make a Backup
Copy these two folders to a USB flash drive or backup folder:
```powershell
# Windows PowerShell Example
Copy-Item -Path "data\mosque_signage.db" -Destination "D:\Backups\mosque_signage_backup.db"
Copy-Item -Path "public\uploads" -Destination "D:\Backups\uploads_backup" -Recurse
```

### How to Restore a Backup
1. Close the server (`Ctrl+C` in the terminal or `docker compose down`).
2. Copy your backup `mosque_signage.db` back into the `data/` folder.
3. Copy your backed-up `uploads` folder back into `public/uploads/`.
4. Restart MosqueSignage. Everything will be restored immediately.

---

## 4. Setting Up Automatic Boot / Autostart on Windows

If you have a dedicated Windows mini-PC or server running MosqueSignage:

1. **Connect the TV Screen**:
   - For a single TV: connect HDMI directly.
   - For dual monitors (Admin desk + Hall TV): Press `Win + P` and select **Extend**. Set TV to `1920 x 1080` at `100%` scaling.
2. **Configure Host Autostart (Run on the PC where MosqueSignage is installed)**:
   - Run the autostart manager:
     ```bash
     npm run autostart
     ```
   - An interactive menu lets you choose:
     - **[1] TV Display Mode**: This PC is plugged directly into the TV — starts the server minimized and opens the TV display in true fullscreen kiosk mode on logon.
     - **[2] Server-Only Mode**: This PC only runs the MosqueSignage server minimized in the background while separate TVs connect over Wi-Fi.
     - **[3] Disable / Remove**: Deletes the startup shortcut immediately.
   - Or use direct flags:
     ```bash
     npm run autostart -- --display   # Local server + fullscreen TV kiosk
     npm run autostart -- --server    # Local server-only (headless)
     npm run autostart -- --remove    # Disable autostart
     npm run autostart -- --status    # Check current status
     ```
3. **Auto-Opening the Display on a Separate TV Computer After Reboot** *(No Node.js needed on the TV PC!)*:
   - Check the **`Connect TV`** link printed under *Remote Screens & Mobile* when you run `npm start` on your server PC (`http://<YOUR-SERVER-IP>:3000/display`).
   - On the TV computer, open Microsoft Edge or Google Chrome, visit `http://<YOUR-SERVER-IP>:3000/display`, and click the **Install App** icon in the address bar.
   - Visit `edge://apps` (Edge) or `chrome://apps` (Chrome), right-click **MosqueSignage**, and turn on **Auto-start on device login** *(or "Start app when you sign in")*.
   *(For Raspberry Pi or Android/Fire TV remote displays, see `docs/deployment.md`).*

---

## 5. Docker Deployment

The repository includes a ready-to-run `docker-compose.yml`:

```bash
# Start container in background
docker compose up -d

# To update container with latest code:
git pull
docker compose up -d --build
```

---

## 6. Automatic TV Sleep & Audio Muting

You can configure MosqueSignage to save power and keep the prayer hall quiet during worship:

- **Screen Sleep**: Go to **Admin Panel > Venue Settings > Hardware & Power**. Set clock times (e.g., sleep at 23:00, wake at 04:30) or prayer offsets (wake 30 minutes before Fajr, sleep 45 minutes after Isha). On Windows, it dims the screen; on Linux / Raspberry Pi, it uses HDMI-CEC to turn the TV on and off.
- **Audio Receiver Muting**: If you have a Denon/Marantz or Yamaha sound system connected to your network, MosqueSignage can automatically mute background audio when congregation prayer begins (`STARTING_NOW`) and unmute when prayer ends.

---

## 7. Testing Without Waiting (Developer Simulator)

If you want to test how the prayer countdown looks, preview the Friday Jummah drawer, or test prayer alerts without waiting for actual prayer times:

1. Click or tap the clock in the top-left corner of the `/display` screen **3 times quickly**.
2. Alternatively, press **`F2`** on a physical keyboard, or open `http://localhost:3000/display?debug=true`.
3. Use the floating toolbar at the bottom to scrub time forward or backward across 24 hours.

---

## 8. Screen Protection & TV Pairing

If your mosque Wi-Fi is shared with visitors, you can prevent anyone on the Wi-Fi from viewing or tampering with the screen:

1. Go to **Admin Panel > Venue Settings > Security & Access**.
2. Turn on **Protected Mode**.
3. **Allow Localhost**: Keep this checked so the mini-PC directly connected to the TV connects automatically without asking for a code.
4. **Pairing New TVs**: Click **Generate 1-Time Pairing Code** to get a 6-character code. Enter this code on the new screen to permanently pair it.

---

## 9. Remote Access via Tailscale VPN

> **Notice: Community Reference Blueprint (Untested in Production)**
> This remote access method is an architectural reference blueprint. The maintainers have not yet field-tested this setup in live production; feedback and community testing reports are warmly welcomed!

To manage your mosque signage from home or your phone without opening ports on your mosque router:

1. Install [Tailscale](https://tailscale.com) on the mosque PC and on your phone or laptop.
2. Run on the mosque PC:
   ```bash
   tailscale serve --bg 3000
   ```
3. You can now securely open `https://mosque-pc.<your-tailnet>.ts.net/admin` from anywhere with an encrypted connection.

---

## 10. Using in "Poster-Only" Mode (Schools, Community Centers, Venues)

If you are running MosqueSignage in an Islamic school, community recreation hall, charity office, or venue where you do not need prayer timetables:

1. Log in to the **Admin Control Panel** (`http://localhost:3000/admin`).
2. Go to **Venue Settings > Kiosk & Layout**.
3. Under **Sidebar Mode**, select **Hidden (Poster-Only)**.
4. Under **Overlays & Add-ons**, toggle **Show Mini Prayer Pill** to **Off**.
5. *(Optional)* In **Display & Identity**, set **Header Date Display** to **Gregorian Date Only**.

The display will now operate as a dedicated full-screen digital signage screen, smoothly rotating your event flyers, announcements, looping videos, and QR codes without any prayer schedules or timetable pop-ups.

---

## 11. Help & Support

- Open the searchable offline **Knowledge Base** anytime at `http://localhost:3000/faq`.
- For help or bug reports, email `helpdesk.guidance@gmail.com` or use the **Report a Problem** link in the admin footer.
