#!/bin/bash
# ============================================
# EC2 Backend Setup Script
# Run this on a fresh Amazon Linux 2023 / Ubuntu EC2 instance
# ============================================
set -e

echo "📦 Installing Node.js 18.x..."
if command -v dnf &> /dev/null; then
  # Amazon Linux 2023
  sudo dnf install -y nodejs npm git
else
  # Ubuntu
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs git
fi

echo "📦 Installing PM2 globally..."
sudo npm install -g pm2

echo "📂 Cloning repository..."
cd /home/ec2-user || cd /home/ubuntu
git clone https://github.com/YOUR_USERNAME/Hostel-Management-1.git app
cd app/backend

echo "📦 Installing backend dependencies..."
npm install --production

echo "🔒 Downloading Amazon DocumentDB CA bundle..."
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

echo "📋 Creating log directory..."
sudo mkdir -p /var/log/hostel-backend
sudo chown $(whoami):$(whoami) /var/log/hostel-backend

echo "⚙️  Setting up .env file..."
cp .env.example .env
echo "⚠️  IMPORTANT: Edit /home/$(whoami)/app/backend/.env with your actual values!"
echo ""
echo "After editing .env, start the app with:"
echo "  cd ~/app/backend"
echo "  pm2 start ecosystem.config.cjs"
echo "  pm2 save"
echo "  pm2 startup"
echo ""
echo "✅ Setup complete!"
