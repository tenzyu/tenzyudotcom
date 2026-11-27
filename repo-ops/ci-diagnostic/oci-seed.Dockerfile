ARG BASE
FROM ${BASE}
ARG CI_UID
ARG CI_GID
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential ca-certificates curl git file python3 pkg-config libssl-dev liblzma-dev \
    libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev patchelf \
    webkit2gtk-driver xvfb xauth dbus-x11 dbus-daemon bubblewrap xdg-dbus-proxy \
    libgl1-mesa-dri fonts-dejavu-core xdg-desktop-portal-gtk libgbm1 && \
    rm -rf /var/lib/apt/lists/*
COPY rust/ /opt/rust/
COPY node bun /usr/local/bin/
RUN groupadd -g "$CI_GID" ci && useradd -m -u "$CI_UID" -g "$CI_GID" -s /bin/bash ci && \
    mkdir -p /opt/seed /work && chown ci:ci /opt/seed /work && \
    test -f /usr/share/dbus-1/session.conf
ENV PATH=/opt/rust/bin:/usr/local/bin:/usr/bin:/bin HOME=/home/ci CARGO_HOME=/home/ci/.cargo
USER ci
WORKDIR /work
