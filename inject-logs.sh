#!/bin/bash
# Inject realistic attack telemetry into logs
LOG_DIR="/opt/admin/logs"
mkdir -p "$LOG_DIR"

# ---------- ACCESS LOG ----------
cat > "$LOG_DIR/access.log" <<'EOF'
[2026-01-15 18:45:02] 192.168.1.100 GET /dashboard - 200 OK ua="Mozilla/5.0 (Windows NT 10.0)"
[2026-01-15 18:47:11] 192.168.1.100 POST /api/feedback - 200 OK ua="Mozilla/5.0"
[2026-01-15 18:49:55] 10.10.14.50 GET /robots.txt - 200 ua="Mozilla/5.0"
[2026-01-15 18:50:01] 10.10.14.50 GET / - 200 ua="Mozilla/5.0"
[2026-01-15 18:50:10] 10.10.14.50 POST /api/feedback - 403 WAF_BLOCK ua="Mozilla/5.0"
[2026-01-15 18:50:48] 10.10.14.50 POST /api/feedback - 200 ua="Mozilla/5.0" payload=<svg onload=...>
[2026-01-15 18:51:55] 10.10.14.50 GET /dashboard - 200 OK ua="Mozilla/5.0" X-Forwarded-For:UEhBTlRPTUdSSUR7QkxVRV9MMGdfSHVudDNyX000c3Qzcn0
[2026-01-15 18:52:30] 192.168.1.100 GET /dashboard - 200 OK ua="Mozilla/5.0"
EOF

# ---------- ERROR LOG ----------
cat > "$LOG_DIR/error.log" <<'EOF'
[2026-01-15 18:50:15] [WARN] WAF block: <script> tag detected from 10.10.14.50
[2026-01-15 18:52:00] [CRITICAL] Cookie reuse detected: pre_mfa_session replayed by 10.10.14.50
[2026-01-15 18:53:10] [CRITICAL] Authentication bypass anomaly: adm_sess issued without /api/verify-mfa
EOF

echo "[+] Logs injected into $LOG_DIR"
ls -la "$LOG_DIR"