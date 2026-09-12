FROM node:18-alpine

RUN apk add --no-cache openssh bash

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY server.js ./
COPY public ./public

# Create log directory
RUN mkdir -p /opt/admin/logs

# Create blue team analyst user
RUN adduser -D -s /bin/bash analyst && \
    echo "analyst:blue_team_rocks" | chpasswd && \
    mkdir -p /home/analyst && chown analyst:analyst /home/analyst

# SSH on port 2275
RUN sed -i 's/#Port 22/Port 2275/' /etc/ssh/sshd_config && \
    ssh-keygen -A

COPY entrypoint.sh /entrypoint.sh
COPY inject-logs.sh /inject-logs.sh
COPY setup-ssh.sh /setup-ssh.sh
RUN chmod +x /entrypoint.sh /inject-logs.sh /setup-ssh.sh

EXPOSE 3075 2275

ENTRYPOINT ["/entrypoint.sh"]
