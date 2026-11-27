ARG BASE_IMAGE
FROM ${BASE_IMAGE}
ARG SNAPSHOT
ARG RUNNER_UID
ARG RUNNER_GID
ENV DEBIAN_FRONTEND=noninteractive
RUN apt update --snapshot "$SNAPSHOT" && apt install -y --snapshot "$SNAPSHOT" \
    build-essential ca-certificates curl file git python3 xz-utils libatomic1 libssl-dev \
    libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev \
    patchelf pkg-config webkit2gtk-driver xvfb dbus-x11 xauth && rm -rf /var/lib/apt/lists/*
RUN (getent group "$RUNNER_GID" || groupadd -g "$RUNNER_GID" ci) && \
    (getent passwd "$RUNNER_UID" || useradd -u "$RUNNER_UID" -g "$RUNNER_GID" -d /ci-home ci)
COPY rust/ /opt/rust/
COPY node bun /usr/local/bin/
ENV PATH=/opt/rust/bin:/usr/local/bin:/usr/bin:/bin
ENV LANG=C.UTF-8
RUN rustc -vV && cargo -V && cargo clippy -V && node -v && bun -v && command -v WebKitWebDriver
