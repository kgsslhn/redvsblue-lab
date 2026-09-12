#!/bin/bash
set -e
echo "[+] Provisioning Proxmox VM for Red vs Blue Lab"

# 1. Install Docker
apt update
apt install -y docker.io docker-compose git curl

# 2. Create log dir
mkdir -p /opt/admin/logs
chmod 777 /opt/admin/logs

# 3. Add hostname mapping
grep -q "feedback.admin.local" /etc/hosts || \
  echo "127.0.0.1 feedback.admin.local" >> /etc/hosts

# 4. Clone repo (ganti URL)
# git clone https://github.com/<user>/redvsblue-lab.git /opt/redvsblue-lab
cd /opt/redvsblue-lab

# 5. Build & run
docker-compose up -d --build

# 6. Inject logs
docker exec admin-feedback bash /inject-logs.sh || bash ./inject-logs.sh

echo "[+] Lab deployed!"
echo "    Web  : http://feedback.admin.local:3075"
echo "    SSH  : analyst@<vm-ip> -p 2275"