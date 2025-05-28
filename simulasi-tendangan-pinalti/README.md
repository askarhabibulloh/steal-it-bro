# Penalty Kick Simulator: A JavaScript-based Soccer Penalty Simulation Tool

This project provides a statistical simulation of penalty kicks in soccer, helping analyze success rates based on directional probabilities for both goalkeeper jumps and player kicks. The simulator runs multiple iterations to provide meaningful statistical insights into penalty kick outcomes.

The simulator takes into account various probability distributions for both the goalkeeper's movements and the kicker's shot direction, making it a valuable tool for analyzing penalty kick strategies. It simulates thousands of penalty kicks and provides detailed statistics about success rates, helping coaches and analysts make data-driven decisions about penalty kick strategies.

## Repository Structure
```
simulasi-tendangan-pinalti/
└── script.js    # Core simulation logic for penalty kick outcomes
```

## Usage Instructions
### Prerequisites
- Modern web browser with JavaScript support
- Node.js (optional, for running via command line)

### Installation
1. Clone the repository:
```bash
git clone [repository-url]
cd simulasi-tendangan-pinalti
```

2. No additional installation steps required as this is a pure JavaScript implementation.

### Quick Start
1. Import the script into your HTML:
```html
<script src="script.js"></script>
```

2. Call the penalty function with probability parameters:
```javascript
penalty(
    15,  // Goalkeeper left jump probability (%)
    35,  // Goalkeeper center jump probability (%)
    50,  // Goalkeeper right jump probability (%)
    77,  // Player left kick probability (%)
    6,   // Player center kick probability (%)
    17   // Player right kick probability (%)
);
```

### More Detailed Examples
Example with different probability distributions:
```javascript
// Balanced distribution example
penalty(33, 34, 33, 33, 34, 33);

// Goalkeeper favoring right side
penalty(20, 20, 60, 33, 34, 33);

// Player favoring left side
penalty(33, 33, 34, 70, 20, 10);
```

### Troubleshooting
Common issues and solutions:

1. Probabilities Don't Add Up to 100%
   - Problem: Input probabilities for either goalkeeper or player don't sum to 100%
   - Solution: Ensure each set of three probabilities (goalkeeper and player) adds up to 100%
   ```javascript
   // Correct usage
   penalty(30, 40, 30, 40, 30, 30); // Each set sums to 100
   ```

2. Invalid Input Types
   - Problem: Non-numeric values passed as parameters
   - Solution: Ensure all parameters are numbers
   ```javascript
   // Incorrect
   penalty("15", "35", "50", "77", "6", "17");
   
   // Correct
   penalty(15, 35, 50, 77, 6, 17);
   ```

## Data Flow
The simulator processes directional probabilities to determine penalty kick outcomes through random number generation and probability comparison.

```ascii
Input Probabilities -> Random Number Generation -> Direction Determination -> Outcome Comparison -> Statistics Output
[Goalkeeper Probs]     [0-100 Random Value]      [Left/Center/Right]     [Goal/No Goal]        [Success Rate]
[Player Probs    ]     [0-100 Random Value]      [Left/Center/Right]     
```

Key component interactions:
1. Probability validation ensures input parameters sum to 100% for both goalkeeper and player
2. Random number generator (0-100) determines both goalkeeper and player directions
3. Direction mapping based on probability thresholds
4. Outcome determination by comparing directions
5. Statistical aggregation over 3,000 simulations
6. Results output including total goals, simulations, and success rate percentage