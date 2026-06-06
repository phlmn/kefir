#!/bin/bash
docker build -t kefir-alpine --file Dockerfile_alpine ./
docker run -ti -v $PWD:/volume --rm -t kefir-alpine cargo build --target aarch64-unknown-linux-musl --release
