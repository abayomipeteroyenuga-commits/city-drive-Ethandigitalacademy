$ErrorActionPreference = 'Stop'
$root = (Split-Path -Parent $MyInvocation.MyCommand.Path)
$port = 8765
# If the default port is occupied, automatically try the next local ports.
$portCandidates = 8765..8795
$prefix = $null
$readyFile = Join-Path $root 'server-ready.txt'
$errorFile = Join-Path $root 'server-error.txt'
Remove-Item -LiteralPath $readyFile -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $errorFile -Force -ErrorAction SilentlyContinue

function Get-MimeType($path) {
    switch ([IO.Path]::GetExtension($path).ToLowerInvariant()) {
        '.html' { 'text/html; charset=utf-8'; break }
        '.js'   { 'text/javascript; charset=utf-8'; break }
        '.css'  { 'text/css; charset=utf-8'; break }
        '.json' { 'application/json; charset=utf-8'; break }
        '.png'  { 'image/png'; break }
        '.jpg'  { 'image/jpeg'; break }
        '.jpeg' { 'image/jpeg'; break }
        '.svg'  { 'image/svg+xml'; break }
        '.ico'  { 'image/x-icon'; break }
        '.wav'  { 'audio/wav'; break }
        '.mp3'  { 'audio/mpeg'; break }
        '.webp' { 'image/webp'; break }
        default { 'application/octet-stream' }
    }
}

$listener = $null
try {
    # TcpListener does not require an HTTP URL ACL, so it works for normal Windows users.
    foreach ($candidate in $portCandidates) {
        try {
            $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $candidate)
            $listener.Start()
            $port = $candidate
            $prefix = "http://127.0.0.1:$port/"
            break
        } catch {
            if ($listener) { try { $listener.Stop() } catch {} }
            $listener = $null
        }
    }
    if (-not $listener) { throw "No available local port found (tried 8765-8795)." }
    Set-Content -LiteralPath $readyFile -Value "READY $prefix" -Encoding ASCII

    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $stream = $client.GetStream()
            $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 4096, $true)
            $requestLine = $reader.ReadLine()
            if ($null -eq $requestLine) { $client.Close(); continue }
            while (($line = $reader.ReadLine()) -ne '') { }

            $parts = $requestLine.Split(' ')
            $method = if ($parts.Length -gt 0) { $parts[0] } else { '' }
            $target = if ($parts.Length -gt 1) { $parts[1] } else { '/' }
            $target = $target.Split('?')[0]
            if ([string]::IsNullOrWhiteSpace($target) -or $target -eq '/') { $target = '/index.html' }

            if ($method -notin @('GET','HEAD')) {
                $body = [Text.Encoding]::UTF8.GetBytes('Method Not Allowed')
                $header = "HTTP/1.1 405 Method Not Allowed`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
                $hb = [Text.Encoding]::ASCII.GetBytes($header); $stream.Write($hb,0,$hb.Length); $stream.Write($body,0,$body.Length)
                $client.Close(); continue
            }

            try { $decoded = [Uri]::UnescapeDataString($target) } catch { $decoded = $target }
            $relative = $decoded.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
            $full = [IO.Path]::GetFullPath((Join-Path $root $relative))
            $rootFull = [IO.Path]::GetFullPath($root)
            if (-not $full.StartsWith($rootFull + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -and $full -ne $rootFull) {
                $status='403 Forbidden'; $body=[Text.Encoding]::UTF8.GetBytes('Forbidden'); $type='text/plain; charset=utf-8'
            } elseif (Test-Path -LiteralPath $full -PathType Leaf) {
                $body=[IO.File]::ReadAllBytes($full); $status='200 OK'; $type=Get-MimeType $full
            } else {
                $status='404 Not Found'; $body=[Text.Encoding]::UTF8.GetBytes('Not found'); $type='text/plain; charset=utf-8'
            }

            $header = "HTTP/1.1 $status`r`nContent-Type: $type`r`nContent-Length: $($body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
            $hb = [Text.Encoding]::ASCII.GetBytes($header)
            $stream.Write($hb,0,$hb.Length)
            if ($method -ne 'HEAD') { $stream.Write($body,0,$body.Length) }
            $stream.Flush()
        } catch {
            # Keep the server alive for the next browser request.
        } finally {
            try { $stream.Dispose() } catch {}
            try { $client.Close() } catch {}
        }
    }
} catch {
    $msg = "CITY DRIVE server error: $($_.Exception.Message)`r`n$($_.ScriptStackTrace)"
    Set-Content -LiteralPath $errorFile -Value $msg -Encoding UTF8
    Remove-Item -LiteralPath $readyFile -Force -ErrorAction SilentlyContinue
    exit 1
} finally {
    if ($listener) { try { $listener.Stop() } catch {} }
}
