#!/bin/zsh
# figs/*.html → 同名 .png（2倍解像度）。引数で対象を絞れる: ./render.sh win-camera-settings
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for f in ${@:-*.html}; do
  f=${f%.html}
  size=$(grep -o 'data-size="[0-9]*x[0-9]*"' "$f.html" | head -1 | sed 's/.*="\(.*\)"/\1/')
  [ -z "$size" ] && size="1200x780"
  w=${size%x*}; h=${size#*x}
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
    --window-size=$w,$h --virtual-time-budget=1500 --screenshot="$PWD/$f.png" "file://$PWD/$f.html" 2>/dev/null
  echo "rendered $f.png ($size)"
done
