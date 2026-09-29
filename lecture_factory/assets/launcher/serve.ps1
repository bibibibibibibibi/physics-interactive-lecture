# 大学物理交互课堂 · 无 Python 环境的备用静态服务器（Windows 自带 PowerShell 即可运行）
$port = 8080
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$mime = @{
  '.html'  = 'text/html; charset=utf-8'
  '.js'    = 'text/javascript'
  '.css'   = 'text/css'
  '.json'  = 'application/json; charset=utf-8'
  '.png'   = 'image/png'
  '.gif'   = 'image/gif'
  '.jpg'   = 'image/jpeg'
  '.svg'   = 'image/svg+xml'
  '.mp3'   = 'audio/mpeg'
  '.woff'  = 'font/woff'
  '.woff2' = 'font/woff2'
  '.ttf'   = 'font/ttf'
}

$listener = New-Object System.Net.HttpListener
while ($true) {
  $listener.Prefixes.Add("http://localhost:$port/")
  try { $listener.Start(); break }
  catch {
    $listener.Prefixes.Clear()
    $port++
    if ($port -gt 8090) { Write-Host '端口 8080-8090 均被占用，请关闭占用程序后重试'; exit 1 }
  }
}

Write-Host "服务已启动：http://localhost:$port/"
Write-Host '关闭本窗口即停止服务'
Start-Process "http://localhost:$port/"

while ($listener.IsListening) {
  try { $ctx = $listener.GetContext() } catch { break }
  $path = [uri]::UnescapeDataString($ctx.Request.Url.LocalPath.TrimStart('/'))
  if ($path -eq '') { $path = 'index.html' }
  $file = Join-Path $root $path
  if ((Test-Path $file -PathType Leaf) -and ($file.StartsWith($root))) {
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $ext = [System.IO.Path]::GetExtension($file).ToLower()
    if ($mime.ContainsKey($ext)) { $ctx.Response.ContentType = $mime[$ext] }
    else { $ctx.Response.ContentType = 'application/octet-stream' }
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $ctx.Response.StatusCode = 404
  }
  $ctx.Response.OutputStream.Close()
}
