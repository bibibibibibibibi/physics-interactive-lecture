param(
  [string]$ppt = '待处理\ppt91源文件与分析\ppt_ref.ppt',
  [string]$out = '待处理\ppt91源文件与分析\ppt_ref_slides',
  [string]$pptx = '待处理\ppt91源文件与分析\ppt_ref.pptx'
)
$ErrorActionPreference = 'Stop'
$ws = 'C:\Users\Administrator\Documents\kimi\tasks\2026-09-26\15-37-28-d3bc8f97'
$pptPath = Join-Path $ws $ppt
$outDir = Join-Path $ws $out
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# 独立实例，不干扰用户正在用的 PowerPoint 窗口
$pp = New-Object -ComObject PowerPoint.Application
$pres = $pp.Presentations.Open($pptPath, $true, $false, $true)  # ReadOnly, Untitled=false, WithWindow=true
$n = $pres.Slides.Count
Write-Output "slides: $n"

for ($i = 1; $i -le $n; $i++) {
    $s = $pres.Slides.Item($i)
    $png = Join-Path $outDir ("slide_{0:d2}.png" -f $i)
    $s.Export($png, 'PNG', 1920, 1080)
    $notes = ''
    try {
        foreach ($sh in $s.NotesPage.Shapes) {
            if ($sh.HasTextFrame -and $sh.TextFrame.HasText) {
                $txt = $sh.TextFrame.TextRange.Text
                if ($txt.Trim().Length -gt 0 -and $txt.Trim() -ne $i.ToString()) { $notes += $txt + "`n" }
            }
        }
    } catch {}
    if ($notes.Trim().Length -gt 0) {
        [System.IO.File]::WriteAllText((Join-Path $outDir ("notes_{0:d2}.txt" -f $i)), $notes, [System.Text.Encoding]::UTF8)
    }
}

$pptxPath = Join-Path $ws $pptx
$pres.SaveAs($pptxPath, 24)  # 24 = ppSaveAsOpenXMLPresentation
$pres.Close()
$pp.Quit()
Write-Output "done"
