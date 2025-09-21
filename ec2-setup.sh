#!/bin/bash
# EC2 Setup Script for Whisper STT Server

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and pip
sudo apt install python3 python3-pip python3-venv -y

# Install system dependencies
sudo apt install ffmpeg -y

# Create virtual environment
python3 -m venv whisper-env
source whisper-env/bin/activate

# Install Python packages
pip install flask openai-whisper torch torchaudio

# Copy server script
# (Upload whisper-server.py to EC2 instance)

# Make script executable
chmod +x whisper-server.py

# Create systemd service
sudo tee /etc/systemd/system/whisper-stt.service > /dev/null <<EOF
[Unit]
Description=Whisper STT Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu
Environment=PATH=/home/ubuntu/whisper-env/bin
ExecStart=/home/ubuntu/whisper-env/bin/python /home/ubuntu/whisper-server.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable whisper-stt
sudo systemctl start whisper-stt

# Check status
sudo systemctl status whisper-stt