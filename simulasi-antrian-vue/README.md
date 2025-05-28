# Supermarket Queue Simulation System with Vue.js

A real-time queue simulation system that models customer flow and service patterns in a supermarket environment. This application provides detailed analytics of customer wait times, cashier utilization, and queue dynamics through an interactive web interface.

The system offers two simulation modes: manual input for precise control and automated Poisson-based generation for realistic customer arrival patterns. It provides comprehensive visualization of queue metrics through two synchronized data tables that track customer flow and system state changes in real-time.

## Repository Structure
```
simulasi-antrian-vue/
├── index.html          # Manual queue simulation implementation with core Vue.js components
└── Tugas-27-Mei.html  # Enhanced simulation with Poisson distribution for automated customer generation
```

## Usage Instructions
### Prerequisites
- Modern web browser with JavaScript enabled
- Vue.js 3.x (automatically loaded via CDN)
- Internet connection (for Vue.js CDN access)

### Installation
1. Clone the repository:
```bash
git clone [repository-url]
```

2. Navigate to the project directory:
```bash
cd simulasi-antrian-vue
```

3. Open either simulation version in a web browser:
```bash
# For manual simulation
open index.html

# For automated Poisson-based simulation
open Tugas-27-Mei.html
```

### Quick Start
1. **Manual Input Mode** (index.html):
   ```javascript
   // Click "Tambah Pelanggan Baru" to add a new customer
   // For each customer:
   1. Set arrival time (HH:MM:SS)
   2. Set service duration (seconds)
   3. Repeat for additional customers
   ```

2. **Automated Mode** (Tugas-27-Mei.html):
   ```javascript
   1. Set λ (arrival rate per minute)
   2. Set simulation duration (minutes)
   3. Click "Generate" to create customer data
   ```

### More Detailed Examples
1. **Setting Up a Basic Queue**:
   ```javascript
   // Example manual input sequence
   Customer 1: Arrival: 09:00:00, Service: 30s
   Customer 2: Arrival: 09:00:30, Service: 45s
   Customer 3: Arrival: 09:01:00, Service: 60s
   ```

2. **Automated Simulation**:
   ```javascript
   // Example configuration
   λ = 1.0 (one customer per minute average)
   Duration = 10 minutes
   // System will generate realistic arrival patterns
   ```

### Troubleshooting
Common issues and solutions:

1. **Data Loss on Refresh**
   - Problem: All queue data is lost when page is refreshed
   - Solution: Save your data before refreshing. The application uses in-memory storage only.

2. **Input Flow Issues**
   - Problem: Data inconsistency when adding multiple customers before completing details
   - Solution: Follow the recommended flow:
     1. Add one customer
     2. Complete their details
     3. Then add the next customer

## Data Flow
The system processes customer data through a two-stage pipeline, generating real-time analytics and queue status updates.

```ascii
Input Data → [Queue Processing Engine] → Output Tables
     ↓                 ↓                      ↓
Manual Input    Service Calculations    1. Customer Stats
     or              ↓                  2. Timeline Events
Poisson Gen    Queue State Updates
```

Key component interactions:
1. Input handler captures customer arrival and service times
2. Queue processor calculates wait times and service completion
3. State manager tracks cashier status and queue length
4. Event generator creates timeline of all queue events
5. Display formatter converts timestamps and durations to readable format
6. Real-time update system refreshes both data tables
7. Poisson generator (in Tugas-27-Mei.html) creates realistic arrival patterns