#!/bin/bash
# Run INSIDE the container/VM to setup analyst SSH user
USER_NAME="analyst"
USER_PASS="blue_team_rocks"

if ! id "$USER_NAME" &>/dev/null; then
  useradd -m -s /bin/bash "$USER_NAME"
fi
echo "$USER_NAME:$USER_PASS" | chpasswd

# SSH port 2275
sed -i 's/^#*Port .*/Port 2275/' /etc/ssh/sshd_config
systemctl restart sshd 2>/dev/null || service ssh restart

echo "[+] SSH configured: $USER_NAME@<host>:2275"