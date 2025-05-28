# Entropy Calculator: Calculate Information Entropy from Text Input

This Python application calculates the information entropy of a text string using Shannon's entropy formula. It provides a detailed step-by-step breakdown of the entropy calculation process, including character frequency analysis, probability calculations, and self-information computation.

The calculator implements Shannon's information theory principles to measure the average information content in a text string. It's particularly useful for information theory studies, data compression analysis, and understanding the randomness or predictability of text sequences. The application provides detailed intermediate calculations at each step, making it valuable for educational purposes and entropy analysis.

## Repository Structure
```
kalkulator-entropi/
├── main.py           # Core application file containing entropy calculation logic
```

## Usage Instructions
### Prerequisites
- Python 3.x installed on your system
- Basic understanding of command line operations

### Installation
1. Clone the repository:
```bash
git clone [repository-url]
cd kalkulator-entropi
```

2. No additional package installation is required as the script only uses Python standard library modules (json, math).

### Quick Start
1. Run the script:
```bash
python main.py
```

2. Enter your text when prompted:
```bash
Input: Hello World
```

3. The program will display:
- Character frequency counts
- Probability distribution
- Self-information values
- Individual entropy contributions
- Final entropy value

### More Detailed Examples
Example with detailed output:
```python
Input: Hello World

# Character frequency output
[
  {"symbol": "H", "count": 1},
  {"symbol": "e", "count": 1},
  {"symbol": "l", "count": 3},
  {"symbol": "o", "count": 2},
  {"symbol": " ", "count": 1},
  {"symbol": "W", "count": 1},
  {"symbol": "r", "count": 1},
  {"symbol": "d", "count": 1}
]

# Probability distribution
[
  {"symbol": "H", "probabilitas": 0.091},
  {"symbol": "e", "probabilitas": 0.091},
  ...
]

# Final entropy value
2.845
```

### Troubleshooting
Common issues and solutions:

1. Unicode Error
- Problem: Error when inputting non-ASCII characters
- Solution: Ensure your terminal supports UTF-8 encoding
```bash
export PYTHONIOENCODING=utf8
```

2. Zero Probability Error
- Problem: Math domain error in logarithm calculation
- Solution: The script handles this automatically by excluding zero-probability events

## Data Flow
The entropy calculation follows a sequential transformation of the input text through probability analysis to final entropy computation.

```ascii
Input Text → Character Count → Probability Calculation → Self-Information → Entropy Contribution → Final Entropy
[Text]     → [Count Dict]   → [P(x)]               → [-log₂(P(x))]    → [P(x)×(-log₂(P(x)))] → [H]
```

Key component interactions:
1. Input processing splits text into individual characters
2. Character frequency counter tracks occurrence of each symbol
3. Probability calculator normalizes counts by total length
4. Self-information computer applies logarithmic transformation
5. Entropy calculator combines probabilities and self-information
6. Results formatter displays intermediate and final calculations
7. All calculations use base-2 logarithms for bits measurement