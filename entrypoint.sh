#!/bin/sh
set -e

mkdir -p /opt/admin/logs
chmod 777 /opt/admin/logs

/usr/sbin/sshd

exec node /app/server.js
