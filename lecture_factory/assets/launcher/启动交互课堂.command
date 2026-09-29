#!/bin/bash
# 大学物理交互课堂 · Mac 本地启动器（双击运行）
cd "$(dirname "$0")"
PORT=8080

echo "============================================"
echo "  大学物理交互课堂 · 本地启动器"
echo "  关闭本窗口即停止服务（或按 Ctrl+C）"
echo "============================================"
echo ""

if command -v python3 >/dev/null 2>&1; then
  echo "启动：http://localhost:$PORT/"
  (sleep 1; open "http://localhost:$PORT/") &
  python3 -m http.server $PORT
else
  echo "未检测到 python3。"
  echo "请先运行  xcode-select --install  安装苹果命令行工具（自带 python3），再双击本启动器。"
  echo ""
  read -n 1 -s -r -p "按任意键退出……"
  echo ""
fi
