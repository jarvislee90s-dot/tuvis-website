#!/bin/zsh
# 双击启动网站（macOS）。服务在后台运行，关闭此窗口不影响。
cd "$(dirname "$0")" || exit 1
./scripts/dev-start.sh
STATUS=$?
echo
if [ $STATUS -eq 0 ]; then
  echo "服务在后台运行，可以关闭此窗口。"
else
  echo "启动失败，请查看上面的提示或 .dev-server.log。"
fi
sleep 3
exit $STATUS
