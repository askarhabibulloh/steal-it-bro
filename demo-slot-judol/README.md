# Slot Machine Game Server with Admin Controls

A Node.js-based slot machine game server that provides an interactive gaming experience with administrative controls for managing game outcomes. The server features real-time win/loss tracking, configurable game behaviors, and a separate admin interface for game management.

This project implements a simple but complete slot machine game system using Express.js. It offers two distinct interfaces: a player view for gaming and an admin panel for controlling game behavior. The game uses emoji symbols for the slot machine reels and includes features like forced wins/losses, real-time statistics tracking via Server-Sent Events (SSE), and persistent storage of game settings and statistics.

## Repository Structure
```
demo-slot-judol/
├── server.js         # Main application entry point and Express server implementation
├── package.json      # Node.js project configuration and dependencies
├── public/          # Static assets directory
│   ├── script.js    # Client-side JavaScript for game interaction
│   └── style.css    # Game styling and layout
├── counter.json     # Persistent storage for win/loss statistics
└── settings.json    # Game configuration settings storage
```

## Usage Instructions
### Prerequisites
- Node.js (version 12.0.0 or higher)
- npm (Node Package Manager)
- Modern web browser with SSE support

### Installation
1. Clone the repository:
```bash
git clone <repository-url>
cd demo-slot-judol
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The server will be available at `http://localhost:3000`

### Quick Start
1. Access the player interface:
   - Open `http://localhost:3000` in your web browser
   - Click the spin button to play

2. Access the admin interface:
   - Open `http://localhost:3000/admin` in your web browser
   - Toggle force win/loss settings
   - Monitor real-time statistics

### More Detailed Examples
1. Playing the game:
```javascript
// Example API call to spin the reels
fetch('/spin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ isAdmin: false })
})
.then(response => response.json())
.then(result => console.log(result));
```

2. Updating admin settings:
```javascript
// Example API call to force wins
fetch('/admin/settings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ forceWin: true, forceLoss: false })
})
.then(response => response.json());
```

### Troubleshooting
1. Server Won't Start
   - Check if port 3000 is already in use
   - Verify Node.js version compatibility
   - Ensure all dependencies are installed

2. Game Statistics Not Updating
   - Check if counter.json has write permissions
   - Verify SSE connection is established
   - Clear browser cache and reload

3. Admin Controls Not Working
   - Verify settings.json has proper write permissions
   - Check browser console for error messages
   - Ensure proper JSON formatting in settings file

## Data Flow
The slot machine game processes user interactions through a client-server architecture, managing game state and administrative controls through persistent JSON storage.

```ascii
Player/Admin → Express Server → Game Logic
     ↑              ↓             ↓
  Browser    ←   Response   ←  JSON Storage
     ↑                         (settings/
   Display                      counter)
```

Key component interactions:
1. Client initiates spin request through HTTP POST
2. Server checks admin settings for forced outcomes
3. Game logic generates reel symbols based on settings
4. Results are saved to counter.json
5. Real-time updates sent via SSE to connected clients
6. Admin changes persist to settings.json
7. Statistics tracked and updated in counter.json