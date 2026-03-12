#!/usr/bin/env python3
"""
Network Utilities Tool - DNS and WHOIS Lookup
"""

from flask import Flask, render_template, request
import subprocess
import os

app = Flask(__name__)

# Secret flag path
FLAG_PATH = "/var/www/flag_rahasia.txt"

def execute_command(tool, domain):
    """
    Execute command with user input (intentionally vulnerable).
    This function demonstrates command injection vulnerability.
    """
    if tool == 'dns':
        command = f"nslookup {domain}"
    elif tool == 'whois':
        command = f"whois {domain}"
    else:
        return f"Unknown tool: {tool}"
    
    try:
        # VULNERABLE: shell=True with direct string concatenation
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        # output = f"Command: {command}\n\n"
        output = f"\n\n"
        output += "Result:\n"
        output += result.stdout if result.stdout else "(no output)\n"
        if result.stderr:
            output += "\nErrors:\n"
            output += result.stderr
        
        return output
        
    except subprocess.TimeoutExpired:
        return f"Command timed out: {command}\n\nTimeout after 10 seconds."
    except Exception as e:
        return f"Error executing command: {command}\n\nError: {str(e)}"

@app.route('/', methods=['GET', 'POST'])
def index():
    """
    Main endpoint for network utilities tool.
    """
    output = ""
    domain = ""
    tool = "dns"  # default tool
    
    if request.method == 'POST':
        domain = request.form.get('domain', '').strip()
        tool = request.form.get('tool', 'dns')
        
        if domain:
            output = execute_command(tool, domain)
    
    return render_template('index.html', output=output, domain=domain, tool=tool)

@app.route('/health')
def health():
    """Simple health check endpoint"""
    return "OK", 200

@app.route('/debug')
def debug():
    """
    Debug endpoint to show environment information.
    This can be exploited to reveal sensitive data.
    """
    debug_info = []
    debug_info.append("=== DEBUG INFORMATION ===")
    debug_info.append(f"Current user: {os.getenv('USER', 'unknown')}")
    debug_info.append(f"Working directory: {os.getcwd()}")
    debug_info.append(f"Python version: {os.sys.version}")
    
    # Check if flag file exists (for educational purposes)
    if os.path.exists(FLAG_PATH):
        debug_info.append(f"Flag file exists at: {FLAG_PATH}")
    else:
        debug_info.append(f"Flag file NOT found at: {FLAG_PATH}")
    
    # List some environment variables (could contain secrets)
    debug_info.append("\n=== ENVIRONMENT VARIABLES ===")
    env_vars = ['SECRET_API_KEY', 'PATH', 'HOME', 'USER']
    for var in env_vars:
        value = os.getenv(var)
        if value:
            debug_info.append(f"{var}: {value}")
        else:
            debug_info.append(f"{var}: (not set)")
    
    return "<br>".join(debug_info)

if __name__ == '__main__':
    # Run in debug mode for educational purposes
    app.run(host='0.0.0.0', port=5000, debug=True)