"""将 PowerPoint 导出的 PDF 转成逐页 PNG（macOS / Windows / Linux）。

先在 PowerPoint 中导出「幻灯片」PDF（不要选备注页或讲义），再运行：
    python3 export_pdf_mac.py "课程.pdf" "课程图片"

需要 Poppler 的 pdftoppm；macOS 可自行用 brew install poppler 安装。
不负责 PPT→PDF 转换，也不提取动画或备注。动画结构仍可由项目脚本解析
原始 PPTX；备注请保留在原始演示文稿中。
"""

import argparse
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile


def positive_int(value):
    number = int(value)
    if number <= 0:
        raise argparse.ArgumentTypeError("宽度必须大于 0")
    return number


def export_pdf(pdf, output, width=1920, pdftoppm=None, overwrite=False):
    """渲染全部页面，保留纵横比；成功返回 PNG 路径列表。

先完成临时渲染，再写入输出目录。默认拒绝覆盖已有 slide_*.png。
--overwrite 只替换本次输出的同名图片，不删除目录中的其他文件。
如果旧导出比新 PDF 页数多，要求改用空目录，避免混入多余页面。
"""
    pdf, output = Path(pdf).expanduser().resolve(), Path(output).expanduser().resolve()
    if not pdf.is_file():
        raise ValueError("PDF 文件不存在：{}".format(pdf))
    if width <= 0:
        raise ValueError("宽度必须大于 0")
    candidate = pdftoppm or os.environ.get("PDFTOPPM") or "pdftoppm"
    executable = shutil.which(candidate)
    if not executable:
        raise ValueError(
            "找不到 pdftoppm。请安装 Poppler（macOS：brew install poppler），"
            "或用 --pdftoppm /完整路径/pdftoppm 指定。"
        )
    if output.exists() and not output.is_dir():
        raise ValueError("输出路径不是目录：{}".format(output))
    existing = set(output.glob("slide_*.png")) if output.exists() else set()
    if existing and not overwrite:
        raise ValueError("输出目录已有 slide_*.png；请使用空目录，或显式指定 --overwrite。")

    with tempfile.TemporaryDirectory(prefix="lecture-pdf-") as temporary:
        prefix = Path(temporary) / "page"
        result = subprocess.run(
            [executable, "-png", "-scale-to-x", str(width), "-scale-to-y", "-1",
             str(pdf), str(prefix)],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
        )
        if result.returncode:
            detail = result.stderr.strip() or result.stdout.strip() or "没有错误详情"
            raise ValueError("PDF 渲染失败（退出码 {}）：{}".format(result.returncode, detail))
        pages = []
        for path in Path(temporary).iterdir():
            match = re.fullmatch(r"page-(\d+)\.png", path.name)
            if match:
                pages.append((int(match.group(1)), path))
        pages.sort()
        if not pages or [number for number, _ in pages] != list(range(1, len(pages) + 1)):
            raise ValueError("PDF 没有生成连续的逐页图片；请确认导出的是有效的幻灯片 PDF。")
        destinations = [output / "slide_{:02d}.png".format(number) for number, _ in pages]
        extra = existing.difference(destinations)
        if extra:
            raise ValueError("输出目录包含本次 PDF 之外的旧 slide_*.png；请改用空目录，避免混入多余页面。")
        for _, path in pages:
            with path.open("rb") as handle:
                if handle.read(8) != b"\x89PNG\r\n\x1a\n":
                    raise ValueError("渲染器生成了无效 PNG：{}".format(path.name))
        output.mkdir(parents=True, exist_ok=True)
        for (_, source), destination in zip(pages, destinations):
            # 在目标文件系统暂存，避免读者看到半写入的图片。
            descriptor, staging = tempfile.mkstemp(prefix=".slide-", suffix=".png", dir=str(output))
            os.close(descriptor)
            try:
                shutil.copyfile(source, staging)
                if not overwrite and destination.exists():
                    raise ValueError("目标图片已存在，未覆盖：{}".format(destination))
                os.replace(staging, destination)
            finally:
                if os.path.exists(staging):
                    os.unlink(staging)
        return destinations


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("pdf", type=Path, help="从 PowerPoint 导出的幻灯片 PDF")
    parser.add_argument("out", type=Path, nargs="?", help="输出目录，默认 PDF 同目录的 <文件名>_slides")
    parser.add_argument("--width", type=positive_int, default=1920, help="PNG 宽度，默认 1920 像素；保持比例")
    parser.add_argument("--pdftoppm", help="pdftoppm 可执行文件路径；也可设置 PDFTOPPM 环境变量")
    parser.add_argument("--overwrite", action="store_true", help="允许替换同名图片，不删除其他文件")
    args = parser.parse_args(argv)
    output = args.out if args.out is not None else args.pdf.with_name(args.pdf.stem + "_slides")
    try:
        pages = export_pdf(args.pdf, output, args.width, args.pdftoppm, args.overwrite)
    except (OSError, ValueError) as error:
        print("导出失败：{}".format(error), file=sys.stderr)
        return 1
    print("已导出 {} 页到 {}".format(len(pages), pages[0].parent))
    return 0


if __name__ == "__main__":
    sys.exit(main())
