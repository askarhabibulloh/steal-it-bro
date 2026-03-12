#!/usr/bin/env python3
"""
QuickThumb - Image Processing Service with Command Injection Vulnerability
"""

from flask import Flask, render_template, request, redirect, url_for, flash
import subprocess
import os
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = 'quickthumb_secret_key_2026'

# Configuration
UPLOAD_FOLDER = 'uploads'
STATIC_FOLDER = 'static'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
FLAG_PATH = "/var/secret_data_flag.txt"

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(STATIC_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['STATIC_FOLDER'] = STATIC_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def execute_image_magick(input_path, output_path, width):
    """
    Execute ImageMagick command with user input (intentionally vulnerable).
    This function demonstrates command injection vulnerability.
    """
    # VULNERABLE: shell=True with direct string concatenation
    command = f"convert {input_path} -resize {width}x {output_path}"
    
    try:
        # Execute command with shell=True (vulnerable to injection)
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        output = f"Command executed: {command}\n\n"
        if result.stdout:
            output += "Standard Output:\n"
            output += result.stdout + "\n"
        if result.stderr:
            output += "Standard Error:\n"
            output += result.stderr + "\n"
        
        output += f"Return code: {result.returncode}\n"
        
        return output, result.returncode == 0
        
    except subprocess.TimeoutExpired:
        return f"Command timed out: {command}\n\nTimeout after 10 seconds.", False
    except Exception as e:
        return f"Error executing command: {command}\n\nError: {str(e)}", False

@app.route('/', methods=['GET', 'POST'])
def index():
    """
    Main endpoint for image processing.
    """
    output = ""
    width = "300"  # default width
    processed_image = None
    success = False
    
    if request.method == 'POST':
        # Check if the post request has the file part
        if 'file' not in request.files:
            flash('No file part')
            return redirect(request.url)
        
        file = request.files['file']
        width = request.form.get('width', '300').strip()
        
        # If user does not select file, browser submits empty file
        if file.filename == '':
            flash('No selected file')
            return redirect(request.url)
        
        if file and allowed_file(file.filename):
            # Secure filename and generate unique name
            original_filename = secure_filename(file.filename)
            unique_id = str(uuid.uuid4())[:8]
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            # Save uploaded file
            upload_filename = f"{timestamp}_{unique_id}_{original_filename}"
            upload_path = os.path.join(app.config['UPLOAD_FOLDER'], upload_filename)
            file.save(upload_path)
            
            # Generate output filename
            output_filename = f"processed_{timestamp}_{unique_id}_{original_filename}"
            output_path = os.path.join(app.config['STATIC_FOLDER'], output_filename)
            
            # Execute ImageMagick command 
            output, success = execute_image_magick(upload_path, output_path, width)
            
            if success and os.path.exists(output_path):
                processed_image = output_filename
                flash('Image processed successfully!')
            else:
                flash('Image processing failed. Check output for details.')
    
    return render_template('index.html', 
                         output=output, 
                         width=width, 
                         processed_image=processed_image,
                         success=success)

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
    debug_info.append("=== QUICKTHUMB DEBUG INFORMATION ===")
    debug_info.append(f"Application: QuickThumb Image Processor")
    debug_info.append(f"Current user: {os.getenv('USER', 'unknown')}")
    debug_info.append(f"Working directory: {os.getcwd()}")
    debug_info.append(f"Python version: {os.sys.version}")
    
    # Check if flag file exists (for educational purposes)
    if os.path.exists(FLAG_PATH):
        debug_info.append(f"Flag file exists at: {FLAG_PATH}")
        try:
            with open(FLAG_PATH, 'r') as f:
                flag_content = f.read().strip()
                debug_info.append(f"Flag content (first 20 chars): {flag_content[:20]}...")
        except Exception as e:
            debug_info.append(f"Cannot read flag file: {str(e)}")
    else:
        debug_info.append(f"Flag file NOT found at: {FLAG_PATH}")
    
    # List some environment variables (could contain secrets)
    debug_info.append("\n=== ENVIRONMENT VARIABLES ===")
    env_vars = ['SECRET_API_KEY', 'PATH', 'HOME', 'USER', 'FLASK_ENV']
    for var in env_vars:
        value = os.getenv(var)
        if value:
            debug_info.append(f"{var}: {value}")
        else:
            debug_info.append(f"{var}: (not set)")
    
    # List files in uploads and static directories
    debug_info.append("\n=== DIRECTORY CONTENTS ===")
    for dir_name in [UPLOAD_FOLDER, STATIC_FOLDER]:
        debug_info.append(f"\n{dir_name}/:")
        try:
            files = os.listdir(dir_name)
            for f in files[:5]:  # Show first 5 files
                debug_info.append(f"  - {f}")
            if len(files) > 5:
                debug_info.append(f"  ... and {len(files) - 5} more")
        except Exception as e:
            debug_info.append(f"  Error: {str(e)}")
    
    return "<br>".join(debug_info)

if __name__ == '__main__':
    # Run in debug mode for educational purposes
    app.run(host='0.0.0.0', port=5000, debug=True)