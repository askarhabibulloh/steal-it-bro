# Telegram Simple Money Tracker: Personal Finance Management Through Telegram

This Telegram bot helps users track their personal finances by managing income and expenses through simple text commands. The bot provides real-time balance updates, transaction history, and data export capabilities while storing all information securely in a local SQLite database.

The bot is designed for individual use with a focus on simplicity and security. It only responds to messages from an authorized Telegram chat ID, making it perfect for personal finance tracking. Users can quickly add income and expenses using intuitive "+" and "-" commands, view their current balance, and export their transaction history in CSV format for further analysis.

## Repository Structure
```
telegram-simple-money-tracker/
├── bot.js              # Main bot logic including command handlers and Telegram API integration
├── db.js              # Database configuration and schema definition using SQLite
└── package.json       # Project dependencies and metadata
```

## Usage Instructions
### Prerequisites
- Node.js (v12.0.0 or higher)
- npm (Node Package Manager)
- A Telegram Bot Token (obtained from @BotFather)
- Your Telegram Chat ID

### Installation
1. Clone the repository:
```bash
git clone <repository-url>
cd telegram-simple-money-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with:
```
BOT_TOKEN=your_telegram_bot_token
ALLOWED_CHAT_ID=your_telegram_chat_id
```

4. Start the bot:
```bash
node bot.js
```

### Quick Start
Once the bot is running, you can use the following commands in your Telegram chat:

1. Add income:
```
+ 100000 salary
```

2. Add expense:
```
- 20000 lunch
```

3. Export transactions:
```
export
```

4. Reset all data:
```
reset
```

### More Detailed Examples
1. Adding income with description:
```
+ 500000 freelance project
```
Response: "✅ Added: +500,000 (freelance project)"

2. Recording an expense:
```
- 35000 transportation
```
Response: "✅ Deducted: -35,000 (transportation)"

### Troubleshooting
Common issues and solutions:

1. Bot not responding
- Verify your BOT_TOKEN in .env file
- Confirm your ALLOWED_CHAT_ID is correct
- Check if the bot is running (`node bot.js`)

2. Database errors
- Ensure write permissions in the project directory
- Check if database.sqlite file exists and is not corrupted
- Delete database.sqlite and restart the bot to recreate the database

3. Export fails
- Verify write permissions in the project directory
- Ensure there are transactions in the database
- Check available disk space

## Data Flow
The bot processes financial transactions through a simple command-based interface, storing all data in a local SQLite database and providing real-time balance updates.

```ascii
User Input (Telegram) -> Bot Command Parser -> SQLite Database
           ^                     |                    |
           |                     v                    v
        Response   <---------  Balance          Transaction
                             Calculator           Storage
```

Key component interactions:
1. User sends commands through Telegram interface
2. Bot validates the chat ID and command format
3. Valid transactions are stored in SQLite database
4. Balance is calculated from all stored transactions
5. Real-time updates are sent back to user
6. Export function queries all transactions and generates CSV
7. Reset command creates backup before clearing data