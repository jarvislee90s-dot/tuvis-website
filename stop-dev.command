#!/bin/zsh
# 双击关闭网站（macOS）。
cd "$(dirname "$0")" || exit 1
./scripts/dev-stop.sh
STATUS=$?
echo
if [ $STATUS -eq 0 ]; then
  echo "服务已关闭，可以关闭此窗口。"
else
  echo "关闭失败，请查看上面的提示。"
fi
sleep 2
exit $STATUS
