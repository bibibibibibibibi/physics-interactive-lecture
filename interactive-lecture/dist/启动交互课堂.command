#!/bin/bash
# 大学物理交互课堂 · Mac 本地启动器（双击运行）
set -u
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)" || exit 1
cd "$SCRIPT_DIR" || exit 1

echo "============================================"
echo "  大学物理交互课堂 · 本地启动器"
echo "  关闭本窗口即停止服务（或按 Ctrl+C）"
echo "============================================"
echo ""

pause_on_error() {
  if [ -t 0 ]; then
    echo ""
    read -n 1 -s -r -p "按任意键退出……"
    echo ""
  fi
}

# Finder 的 PATH 可能不含 Homebrew；同时验证解释器确实可用。
PYTHON=""
for candidate in "$(command -v python3 || true)" /opt/homebrew/bin/python3 /usr/local/bin/python3 /usr/bin/python3; do
  if [ -n "$candidate" ] && [ -x "$candidate" ] && "$candidate" -c 'import sys; sys.exit(sys.version_info < (3, 8))' >/dev/null 2>&1; then
    PYTHON="$candidate"
    break
  fi
done

if [ -z "$PYTHON" ]; then
  echo "未检测到可用的 Python 3.8 或更新版本。"
  echo "请先通过 python.org 或 Homebrew 安装 Python 3，然后重新双击本启动器。"
  pause_on_error
  exit 1
fi

"$PYTHON" "$SCRIPT_DIR/serve.py" "$@"
status=$?
if [ "$status" -ne 0 ]; then
  pause_on_error
fi
exit "$status"
