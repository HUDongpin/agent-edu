#!/usr/bin/env sh
set -eu

input=${1:-media/videos/scene/480p15/SecantToTangent.mp4}
output_dir=${2:-output}

if [ ! -f "$input" ]; then
  printf 'Input video not found: %s\nRender SecantToTangent first or pass an MP4 path as argument 1.\n' "$input" >&2
  exit 2
fi

mkdir -p "$output_dir/keyframes"

output_video="$output_dir/math-animation.mp4"

ffmpeg -y -i "$input" \
  -map 0:v:0 -map "0:a?" \
  -c:v libx264 -pix_fmt yuv420p -movflags +faststart -c:a aac \
  "$output_video"

duration=$(ffprobe -v error \
  -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 \
  "$output_video")

for sample in start:0.14 quarter:0.30 midpoint:0.50 three-quarter:0.72 final:0.96
do
  name=${sample%%:*}
  fraction=${sample#*:}
  timestamp=$(awk -v duration="$duration" -v fraction="$fraction" \
    'BEGIN { printf "%.3f", duration * fraction }')
  ffmpeg -y -ss "$timestamp" -i "$output_video" \
    -frames:v 1 -update 1 "$output_dir/keyframes/$name.png"
done

ffprobe -v error \
  -show_entries format=duration \
  -show_entries stream=codec_name,width,height,r_frame_rate \
  -of json "$output_video"
