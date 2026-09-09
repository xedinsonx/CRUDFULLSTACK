FROM jenkins/jenkins:lts-jdk17

USER root

ENV NODE_VERSION=22.18.0
ENV COMPOSE_VERSION=v5.5.1
ENV DOCKER_VERSION=29.8.0

RUN apt-get update \
    && apt-get install -y --no-install-recommends maven curl ca-certificates xz-utils \
    && curl -fsSL "https://download.docker.com/linux/static/stable/x86_64/docker-${DOCKER_VERSION}.tgz" | tar -xz \
    && mv docker/docker docker/dockerd /usr/local/bin/ \
    && rm -rf docker \
    && curl -fsSLO https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz \
    && tar -xJf node-v${NODE_VERSION}-linux-x64.tar.xz -C /usr/local --strip-components=1 \
    && rm node-v${NODE_VERSION}-linux-x64.tar.xz \
    && curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose \
    && chmod +x /usr/local/bin/docker-compose \
    && mkdir -p /usr/local/lib/docker/cli-plugins \
    && ln -s /usr/local/bin/docker-compose /usr/local/lib/docker/cli-plugins/docker-compose \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

USER jenkins