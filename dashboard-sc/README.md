# Room Scheduling Dashboard with Intelligent Time Slot Recommendations

A web-based dashboard that displays and manages room bookings for a co-working space, featuring an AI-powered recommendation system that automatically identifies available time slots. The system processes real-time booking data from multiple rooms and provides intelligent scheduling suggestions while enforcing booking rules and operating hours.

The dashboard combines real-time data visualization with smart scheduling assistance to solve common room booking challenges. It fetches booking data from Google Sheets, processes it through a Flask backend with AI capabilities, and presents an intuitive interface for viewing and managing room availability. The system enforces business rules like minimum booking durations, operating hours (08:00-21:00), and handles booking conflicts automatically.

## Repository Structure
```
dashboard-sc/
├── backend.py              # Flask server with DeepSeek AI integration for room recommendations
├── date-utilsasdf.js      # Date manipulation utilities with UTC+7 timezone handling
├── index.html             # Main dashboard interface with room booking display
├── parserasdf.js          # CSV parsing utility for Google Sheets data
├── scriptasdf.js          # Core dashboard logic and data fetching
└── slot_data.js           # Room availability API integration and UI updates
```

## Usage Instructions
### Prerequisites
- Python 3.6+ with pip
- Node.js 12+ (for local development)
- Modern web browser with JavaScript enabled
- DeepSeek API key for recommendation system
- Access to Google Sheets API

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dashboard-sc
```

2. Install Python dependencies:
```bash
pip install flask flask-cors requests
```

3. Configure the backend:
```bash
# Set your DeepSeek API key in backend.py
DEEPSEEK_API_KEY = "your-api-key-here"
```

4. Start the Flask server:
```bash
python backend.py
```

### Quick Start

1. Open `index.html` in a web browser to access the dashboard

2. The dashboard will:
   - Load current room bookings from Google Sheets
   - Display room availability in a grid layout
   - Show the AI-recommended time slots after a 10-second delay

3. Use the date navigation controls to:
   - View different dates using the date picker
   - Navigate between days using Previous/Next buttons
   - See room availability updates in real-time

### More Detailed Examples

1. Viewing Room Availability:
```javascript
// The dashboard automatically loads data for all rooms
loadAllRuang();

// To view a specific date
document.getElementById('dateFilter').value = '2024-01-01';
loadAllRuang('2024-01-01');
```

2. Getting AI Recommendations:
```javascript
// Trigger recommendations manually
document.getElementById('recommendBtn').click();

// Recommendations will show available slots like:
{
  "available_slots": {
    "A": [{"time": "08:00-09:00"}],
    "B": [{"time": "14:30-15:00"}]
  }
}
```

### Troubleshooting

1. API Connection Issues
   - Error: "Failed to load recommendations"
   - Check if Flask server is running on port 8800
   - Verify DeepSeek API key is properly configured
   - Check browser console for detailed error messages

2. Data Loading Problems
   - Error: "Failed to load room data"
   - Verify Google Sheets URLs are accessible
   - Check internet connectivity
   - Clear browser cache and reload

3. Time Zone Issues
   - System uses UTC+7 timezone
   - Check `date-utilsasdf.js` for timezone conversion
   - Verify server time synchronization

## Data Flow
The dashboard implements a multi-stage data processing pipeline for room scheduling.

```ascii
[Google Sheets] --> [CSV Parser] --> [Dashboard UI]
       |                                   |
       v                                   v
[Date Processing] <------------------> [Flask Backend]
       |                                   |
       v                                   v
[Booking Rules] <---------------> [DeepSeek AI API]
```

Key component interactions:
1. Dashboard fetches CSV data from Google Sheets for each room
2. CSV parser converts raw data into structured booking information
3. Date utilities process and normalize timestamps to UTC+7
4. Flask backend receives booking data and enforces business rules
5. DeepSeek AI analyzes booking patterns and suggests available slots
6. UI updates to display current bookings and recommendations
7. System enforces 30-minute minimum booking duration
8. Operating hours (08:00-21:00) are validated for all bookings