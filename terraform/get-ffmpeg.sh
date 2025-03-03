#!/bin/bash

# Source: https://aws.amazon.com/blogs/media/processing-user-generated-content-using-aws-lambda-and-ffmpeg/

URL="https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"
MD5_URL="https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz.md5"
FILE="ffmpeg-release-amd64-static.tar.xz"

wget "$URL"
wget -qO- "$MD5_URL" | md5sum -c -
tar xvf "$FILE"

mkdir -p ffmpeg/bin
EXTRACTED_FOLDER=$(tar -tf "$FILE" | head -1 | cut -f1 -d"/")
cp "$EXTRACTED_FOLDER/ffmpeg" ffmpeg/bin/
cd ffmpeg
zip -r ../ffmpeg.zip .
cd ..

rm -rf "$EXTRACTED_FOLDER" "$FILE" ffmpeg
