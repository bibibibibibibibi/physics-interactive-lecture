#!/bin/bash
# 课件完工体检（一条命令跑完四类通病）
# 用法: bash lecture_factory/check_course.sh <课名> [--no-dom]
#   S 静态：结构校验 + 折行风险 + 字号 + 页脚 + 版心
#   D 实拍：内容溢出、墨迹越界、右侧空带、3×3 空白格、图内文字重叠/被裁
# 退出码 0 = 全通过；1 = 有 ERROR；2 = 环境问题（dev server 未起）
set -u
cd "$(dirname "$0")/.."
PY="C:/Users/Administrator/AppData/Local/Programs/Python/Python312/python.exe"
NODE="C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-6/node.exe"
export NODE_PATH=C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules
COURSE="${1:?用法: check_course.sh <课名> [--no-dom]}"
NO_DOM="${2:-}"

echo "=========== 静态体检 $COURSE"
"$PY" lecture_factory/inspect_course.py "$COURSE"
ST=$?

if [ "$NO_DOM" = "--no-dom" ]; then
  echo "(跳过 DOM 实测)"
  exit $ST
fi

code=$(curl --noproxy '*' -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/" || true)
if [ "$code" != "200" ]; then
  echo "!! dev server 未运行（npm run dev），跳过 DOM 实测"
  exit 2
fi

echo "=========== DOM 实测 $COURSE"
"$NODE" work/inspect_dom.cjs "http://127.0.0.1:3000/?course=$COURSE"
DM=$?

[ $ST -eq 0 ] && [ $DM -eq 0 ] && { echo "✔ $COURSE 体检通过"; exit 0; }
echo "✗ $COURSE 未通过（静态 $ST / DOM $DM）"
exit 1
