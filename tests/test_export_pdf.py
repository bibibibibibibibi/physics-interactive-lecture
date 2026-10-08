"""实际调用 Poppler 检查 PDF 导出；未安装 Poppler 时跳过渲染测试。"""

from pathlib import Path
import shutil
import struct
import unittest
from work_directory import make_test_directory

from export_pdf_mac import export_pdf


def make_pdf(path, empty=False):
    # 两页、不同纵横比，不需要额外的 PDF 或图片 Python 依赖。
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 225] /Resources << >> /Contents 5 0 R >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 225 400] /Resources << >> /Contents 5 0 R >>",
        b"<< /Length 0 >>\nstream\n\nendstream",
    ]
    if empty:
        objects[1] = b"<< /Type /Pages /Kids [] /Count 0 >>"
    data = bytearray(b"%PDF-1.4\n")
    offsets = []
    for number, obj in enumerate(objects, 1):
        offsets.append(len(data))
        data.extend("{} 0 obj\n".format(number).encode() + obj + b"\nendobj\n")
    start = len(data)
    data.extend("xref\n0 {}\n0000000000 65535 f \n".format(len(objects) + 1).encode())
    for offset in offsets:
        data.extend("{:010d} 00000 n \n".format(offset).encode())
    data.extend("trailer\n<< /Size {} /Root 1 0 R >>\nstartxref\n{}\n%%EOF\n".format(len(objects) + 1, start).encode())
    path.write_bytes(data)


class ExportPdfTest(unittest.TestCase):
    def setUp(self):
        self.root = make_test_directory("pdf-export-")
        self.pdf = self.root / "物理 课件.pdf"
        make_pdf(self.pdf)
        self.output = self.root / "导出 图片"

    def test_missing_renderer_is_actionable(self):
        with self.assertRaisesRegex(ValueError, "找不到 pdftoppm"):
            export_pdf(self.pdf, self.output, pdftoppm=str(self.root / "missing-pdftoppm"))
        self.assertFalse(self.output.exists())

    @unittest.skipUnless(shutil.which("pdftoppm"), "需要 Poppler pdftoppm")
    def test_real_render_naming_and_aspect_ratio(self):
        paths = export_pdf(self.pdf, self.output)
        self.assertEqual([p.name for p in paths], ["slide_01.png", "slide_02.png"])
        dimensions = [struct.unpack(">II", path.read_bytes()[16:24]) for path in paths]
        self.assertEqual(dimensions[0], (1920, 1080))
        self.assertEqual(dimensions[1][0], 1920)
        self.assertLessEqual(abs(dimensions[1][1] - 1920 * 400 / 225), 1)

    @unittest.skipUnless(shutil.which("pdftoppm"), "需要 Poppler pdftoppm")
    def test_overwrite_requires_opt_in_and_preserves_other_files(self):
        self.output.mkdir()
        previous = self.output / "slide_01.png"
        previous.write_bytes(b"existing image")
        unrelated = self.output / "notes_01.txt"
        unrelated.write_text("用户备注", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "--overwrite"):
            export_pdf(self.pdf, self.output)
        self.assertEqual(previous.read_bytes(), b"existing image")
        paths = export_pdf(self.pdf, self.output, width=640, overwrite=True)
        self.assertEqual(len(paths), 2)
        self.assertTrue(previous.read_bytes().startswith(b"\x89PNG"))
        self.assertEqual(unrelated.read_text(encoding="utf-8"), "用户备注")

    @unittest.skipUnless(shutil.which("pdftoppm"), "需要 Poppler pdftoppm")
    def test_stale_extra_slides_are_not_deleted_or_mixed(self):
        self.output.mkdir()
        extra = self.output / "slide_99.png"
        extra.write_bytes(b"keep me")
        with self.assertRaisesRegex(ValueError, "旧 slide"):
            export_pdf(self.pdf, self.output, width=100, overwrite=True)
        self.assertEqual(list(self.output.iterdir()), [extra])
        self.assertEqual(extra.read_bytes(), b"keep me")

    @unittest.skipUnless(shutil.which("pdftoppm"), "需要 Poppler pdftoppm")
    def test_renderer_failure_does_not_publish_partial_output(self):
        for payload in (b"invalid pdf", b""):
            with self.subTest(payload=payload):
                self.pdf.write_bytes(payload)
                with self.assertRaisesRegex(ValueError, "PDF 渲染失败"):
                    export_pdf(self.pdf, self.output)
                self.assertFalse(self.output.exists())
        make_pdf(self.pdf, empty=True)
        with self.assertRaisesRegex(ValueError, "PDF 渲染失败"):
            export_pdf(self.pdf, self.output)
        self.assertFalse(self.output.exists())


if __name__ == "__main__":
    unittest.main()
