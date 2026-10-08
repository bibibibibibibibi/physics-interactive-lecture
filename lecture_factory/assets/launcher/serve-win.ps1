param(
    [ValidateRange(1, 65535)][int]$Port = 8080,
    [ValidateRange(1, 65535)][int]$LastPort = 8090,
    [switch]$NoBrowser
)

# Windows PowerShell 5.1; no Python, installation or administrator URL ACL is needed.
$ErrorActionPreference = 'Stop'
if ($LastPort -lt $Port) {
    Write-Error 'LastPort must be greater than or equal to Port.'
    exit 1
}
$root = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
if (-not [System.IO.File]::Exists((Join-Path $root 'index.html'))) {
    Write-Error 'index.html is missing. Keep the launcher in the complete dist directory.'
    exit 1
}

# Each browser connection gets a worker, so independent audio/video requests can stream.
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;

public sealed class LectureLocalServer {
    private readonly string root;
    private readonly string rootPrefix;
    private TcpListener listener;
    public volatile bool Running;
    public int BoundPort { get; private set; }
    private static readonly Dictionary<string, string> Types = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) {
        { ".html", "text/html; charset=utf-8" }, { ".js", "text/javascript; charset=utf-8" },
        { ".mjs", "text/javascript; charset=utf-8" }, { ".css", "text/css; charset=utf-8" },
        { ".json", "application/json; charset=utf-8" }, { ".txt", "text/plain; charset=utf-8" },
        { ".vtt", "text/vtt; charset=utf-8" }, { ".svg", "image/svg+xml; charset=utf-8" },
        { ".png", "image/png" }, { ".gif", "image/gif" }, { ".jpg", "image/jpeg" },
        { ".jpeg", "image/jpeg" }, { ".webp", "image/webp" }, { ".ico", "image/x-icon" },
        { ".mp3", "audio/mpeg" }, { ".wav", "audio/wav" }, { ".mp4", "video/mp4" },
        { ".webm", "video/webm" }, { ".woff", "font/woff" }, { ".woff2", "font/woff2" },
        { ".ttf", "font/ttf" }, { ".pdf", "application/pdf" }
    };

    public LectureLocalServer(string directory) {
        root = Path.GetFullPath(directory);
        if (!root.Equals(Path.GetPathRoot(root), StringComparison.OrdinalIgnoreCase))
            root = root.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        rootPrefix = root.EndsWith(Path.DirectorySeparatorChar.ToString(), StringComparison.Ordinal) ? root : root + Path.DirectorySeparatorChar;
    }

    public void Start(int port) {
        listener = new TcpListener(IPAddress.Loopback, port);
        listener.Start();
        BoundPort = ((IPEndPoint)listener.LocalEndpoint).Port;
        Running = true;
        Thread accept = new Thread(Accept);
        accept.IsBackground = true;
        accept.Start();
    }

    public void Stop() {
        Running = false;
        if (listener != null) listener.Stop();
    }

    private void Accept() {
        while (Running) {
            try {
                TcpClient client = listener.AcceptTcpClient();
                ThreadPool.QueueUserWorkItem(delegate(object unused) { Serve(client); });
            } catch (SocketException) { if (!Running) return; }
              catch (ObjectDisposedException) { return; }
        }
    }

    private static string ReadHeaders(NetworkStream stream) {
        MemoryStream buffer = new MemoryStream();
        int matched = 0;
        byte[] ending = new byte[] { 13, 10, 13, 10 };
        while (buffer.Length < 16384) {
            int next = stream.ReadByte();
            if (next < 0) throw new IOException("Incomplete request");
            buffer.WriteByte((byte)next);
            matched = next == ending[matched] ? matched + 1 : (next == 13 ? 1 : 0);
            if (matched == 4) return Encoding.ASCII.GetString(buffer.ToArray());
        }
        throw new IOException("Request headers too large");
    }

    private static void Headers(NetworkStream stream, int status, string reason, long length, string type, string extra) {
        string value = "HTTP/1.1 " + status + " " + reason + "\r\n" +
            "Content-Length: " + length.ToString(CultureInfo.InvariantCulture) + "\r\n" +
            "Content-Type: " + type + "\r\n" +
            "Cache-Control: no-store, no-cache, must-revalidate\r\nPragma: no-cache\r\nExpires: 0\r\n" +
            "Connection: close\r\nX-Content-Type-Options: nosniff\r\n" + extra + "\r\n";
        byte[] bytes = Encoding.ASCII.GetBytes(value);
        stream.Write(bytes, 0, bytes.Length);
    }

    // Reject both lexical escapes and junction/symlink escapes from the release directory.
    private string Resolve(string target) {
        if (!target.StartsWith("/", StringComparison.Ordinal)) throw new ArgumentException();
        string path = target.Split(new char[] { '?', '#' }, 2)[0];
        path = Uri.UnescapeDataString(path).Replace('/', Path.DirectorySeparatorChar);
        if (path.IndexOf('\0') >= 0 || path.IndexOf(':') >= 0) throw new ArgumentException();
        string full = Path.GetFullPath(Path.Combine(root, path.TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)));
        if (!full.Equals(root, StringComparison.OrdinalIgnoreCase) && !full.StartsWith(rootPrefix, StringComparison.OrdinalIgnoreCase))
            throw new UnauthorizedAccessException();
        if (Directory.Exists(full)) full = Path.Combine(full, "index.html");
        string current = full;
        while (!current.Equals(root, StringComparison.OrdinalIgnoreCase)) {
            if ((File.Exists(current) || Directory.Exists(current)) && (File.GetAttributes(current) & FileAttributes.ReparsePoint) != 0)
                throw new UnauthorizedAccessException();
            current = Path.GetDirectoryName(current);
            if (String.IsNullOrEmpty(current)) throw new UnauthorizedAccessException();
        }
        return full;
    }

    private static bool ByteRange(string value, long size, out long start, out long end) {
        start = 0;
        end = size - 1;
        Match match = Regex.Match(value.Trim(), @"^bytes=(\d*)-(\d*)$");
        if (!match.Success || size == 0 || (match.Groups[1].Value == "" && match.Groups[2].Value == "")) return false;
        long right;
        if (match.Groups[1].Value != "") {
            if (!Int64.TryParse(match.Groups[1].Value, NumberStyles.None, CultureInfo.InvariantCulture, out start)) return false;
            if (match.Groups[2].Value != "") {
                if (!Int64.TryParse(match.Groups[2].Value, NumberStyles.None, CultureInfo.InvariantCulture, out right)) return false;
                end = Math.Min(right, end);
            }
        } else {
            if (!Int64.TryParse(match.Groups[2].Value, NumberStyles.None, CultureInfo.InvariantCulture, out right) || right <= 0) return false;
            start = Math.Max(0, size - right);
        }
        return start < size && start <= end;
    }

    private void Serve(TcpClient client) {
        using (client) {
            client.ReceiveTimeout = 5000;
            client.SendTimeout = 10000;
            using (NetworkStream stream = client.GetStream()) {
                bool sent = false;
                try {
                    string[] lines = ReadHeaders(stream).Split(new string[] { "\r\n" }, StringSplitOptions.None);
                    string[] request = lines[0].Split(' ');
                    if (request.Length != 3 || !request[2].StartsWith("HTTP/1.", StringComparison.Ordinal)) {
                        Headers(stream, 400, "Bad Request", 0, "text/plain", ""); return;
                    }
                    bool head = request[0] == "HEAD";
                    if (!head && request[0] != "GET") {
                        Headers(stream, 405, "Method Not Allowed", 0, "text/plain", "Allow: GET, HEAD\r\n"); return;
                    }
                    string file;
                    try { file = Resolve(request[1]); }
                    catch (UnauthorizedAccessException) { Headers(stream, 403, "Forbidden", 0, "text/plain", ""); return; }
                    catch (ArgumentException) { Headers(stream, 400, "Bad Request", 0, "text/plain", ""); return; }
                    catch (NotSupportedException) { Headers(stream, 400, "Bad Request", 0, "text/plain", ""); return; }
                    if (!File.Exists(file)) { Headers(stream, 404, "Not Found", 0, "text/plain", ""); return; }
                    string range = null;
                    foreach (string line in lines) {
                        if (line.StartsWith("Range:", StringComparison.OrdinalIgnoreCase)) {
                            if (range != null) { Headers(stream, 400, "Bad Request", 0, "text/plain", ""); return; }
                            range = line.Substring(6).Trim();
                        }
                    }
                    using (FileStream input = new FileStream(file, FileMode.Open, FileAccess.Read, FileShare.ReadWrite)) {
                        long size = input.Length, start = 0, end = size - 1;
                        // Range is defined for GET. HEAD describes the complete GET representation.
                        if (!head && range != null && !ByteRange(range, size, out start, out end)) {
                            Headers(stream, 416, "Range Not Satisfiable", 0, "text/plain", "Content-Range: bytes */" + size + "\r\nAccept-Ranges: bytes\r\n"); return;
                        }
                        bool partial = !head && range != null;
                        string extra = "Accept-Ranges: bytes\r\n";
                        if (partial) extra += "Content-Range: bytes " + start + "-" + end + "/" + size + "\r\n";
                        string type;
                        if (!Types.TryGetValue(Path.GetExtension(file), out type)) type = "application/octet-stream";
                        long count = end - start + 1;
                        Headers(stream, partial ? 206 : 200, partial ? "Partial Content" : "OK", count, type, extra);
                        sent = true;
                        if (!head) {
                            input.Seek(start, SeekOrigin.Begin);
                            byte[] buffer = new byte[65536];
                            while (count > 0) {
                                int read = input.Read(buffer, 0, (int)Math.Min(buffer.Length, count));
                                if (read == 0) break;
                                stream.Write(buffer, 0, read);
                                count -= read;
                            }
                        }
                    }
                } catch (Exception) {
                    // Browser seek/close often aborts a prior stream; keep the listener alive.
                    if (!sent) { try { Headers(stream, 400, "Bad Request", 0, "text/plain", ""); } catch (Exception) { } }
                }
            }
        }
    }
}
'@

$server = $null
for ($candidate = $Port; $candidate -le $LastPort; $candidate++) {
    $attempt = New-Object -TypeName LectureLocalServer -ArgumentList $root
    try {
        $attempt.Start($candidate)
        $server = $attempt
        break
    } catch {
        $attempt.Stop()
        $failure = $_.Exception
        while ($failure.InnerException) { $failure = $failure.InnerException }
        if (($failure -is [System.Net.Sockets.SocketException]) -and
            ($failure.SocketErrorCode -eq [System.Net.Sockets.SocketError]::AddressAlreadyInUse)) { continue }
        Write-Error ("Unable to start the local server (not a busy-port error): " + $failure.Message)
        exit 1
    }
}
if ($null -eq $server) {
    Write-Error "Ports $Port-$LastPort are already in use. Close the occupying program and retry."
    exit 1
}
$url = "http://127.0.0.1:$($server.BoundPort)/"
Write-Host "Local classroom ready: $url"
Write-Host 'Keep this window open. Close it or press Ctrl+C to stop the server.'
try {
    if (-not $NoBrowser) { Start-Process $url }
    while ($server.Running) { Start-Sleep -Milliseconds 250 }
} finally {
    $server.Stop()
}
