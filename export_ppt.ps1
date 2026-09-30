param(
  [string]$ppt = '待处理\ppt91源文件与分析\ppt_ref.ppt',
  [string]$out = '待处理\ppt91源文件与分析\ppt_ref_slides',
  [string]$pptx = '待处理\ppt91源文件与分析\ppt_ref.pptx'
)
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') {
    throw 'This exporter requires Windows PowerPoint. On macOS, export slides as PDF in PowerPoint and run python3 export_pdf.py input.pdf output_dir.'
}
function Resolve-ProjectPath([string]$path) {
    if ([System.IO.Path]::IsPathRooted($path)) {
        return [System.IO.Path]::GetFullPath($path)
    }
    return [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot $path))
}
$pptPath = Resolve-ProjectPath $ppt
$outDir = Resolve-ProjectPath $out
$pptxPath = Resolve-ProjectPath $pptx
if (-not (Test-Path -LiteralPath $pptPath -PathType Leaf)) {
    throw "PPT file not found: $pptPath"
}
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $pptxPath) | Out-Null

$pp = $null
$pres = $null
try {
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

    $pres.SaveAs($pptxPath, 24)  # 24 = ppSaveAsOpenXMLPresentation
} finally {
    try {
        if ($null -ne $pres) {
            try { $pres.Close() } finally { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($pres) }
        }
    } finally {
        if ($null -ne $pp) {
            try { $pp.Quit() } finally { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($pp) }
        }
    }
}
Write-Output "done"
