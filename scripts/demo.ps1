<#
  Menjalankan aplikasi untuk demo dengan dataset yang sesuai:
    -Mode bps  -> data asli BPS (folder datasets/)    : demo ke BPS
    -Mode pkl  -> data sintetis (tests/fixtures/)     : presentasi PKL

  Biasanya dipanggil lewat demo-bps.cmd / demo-pkl.cmd di root project.
  Opsi:
    -Build  build ulang aplikasi (wajib setelah kode diubah)
    -Lan    izinkan akses dari perangkat lain di jaringan Wi-Fi yang sama

  Catatan: file ini sengaja hanya berisi karakter ASCII karena Windows PowerShell 5.1
  membaca .ps1 tanpa BOM sebagai ANSI.
#>
param(
  [Parameter(Mandatory = $true)][ValidateSet('bps', 'pkl')][string]$Mode,
  [switch]$Build,
  [switch]$Lan
)

$AppPort = 3100
$DbPort = 5433
$ModelPort = 8100
$Db = "${Mode}_demo"
$Label = @{ bps = 'DEMO BPS - data asli BPS'; pkl = 'PRESENTASI PKL - data sintetis' }[$Mode]

Set-Location (Split-Path $PSScriptRoot -Parent)
try { $Host.UI.RawUI.WindowTitle = "$Label (jangan ditutup selama demo)" } catch { }

# PATH sistem di laptop ini tidak memuat Node dan Docker, jadi tambahkan sendiri.
foreach ($dir in 'C:\Program Files\nodejs', 'C:\Program Files\Docker\Docker\resources\bin') {
  if ((Test-Path $dir) -and ($env:Path -notlike "*$dir*")) { $env:Path = "$dir;$env:Path" }
}

function Step([string]$text) { Write-Host "`n==> $text" -ForegroundColor Cyan }

function Fail([string]$text) {
  Write-Host "`nGAGAL: $text" -ForegroundColor Red
  exit 1
}

# Menjalankan perintah eksternal dan berhenti bila exit code bukan 0.
function Run([string]$exe, [string[]]$arguments) {
  & $exe @arguments
  if ($LASTEXITCODE -ne 0) { Fail "$exe $($arguments -join ' ')" }
}

$compose = @('compose', '-f', 'docker-compose.demo.yml')

Step "Mode: $Label (database $Db)"

# Cegah dua server demo berebut port yang sama (mis. demo-bps.cmd terjalankan dua kali).
if (Get-NetTCPConnection -LocalPort $AppPort -State Listen -ErrorAction SilentlyContinue) {
  Fail "Port $AppPort sudah dipakai: aplikasi demo kemungkinan sudah berjalan di jendela lain. Buka http://localhost:$AppPort, atau hentikan jendela lama (Ctrl+C) bila ingin ganti mode."
}

Step 'Memeriksa Docker Desktop'
docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Docker belum jalan, menyalakan Docker Desktop (bisa 1-2 menit)...'
  Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
  $deadline = (Get-Date).AddMinutes(4)
  do {
    Start-Sleep -Seconds 3
    docker info *> $null
  } until ($LASTEXITCODE -eq 0 -or (Get-Date) -gt $deadline)
  if ($LASTEXITCODE -ne 0) { Fail 'Docker Desktop belum siap. Buka Docker Desktop manual, tunggu hijau, lalu jalankan lagi.' }
}

Step 'Menyalakan database'
$env:DEMO_DB = $Db
Run docker ($compose + @('up', '-d', '--wait', 'postgres'))
$exists = docker @compose exec -T postgres psql -U bps_user -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$Db'"
if ("$exists".Trim() -ne '1') {
  Run docker ($compose + @('exec', '-T', 'postgres', 'psql', '-U', 'bps_user', '-d', 'postgres', '-c', "CREATE DATABASE $Db"))
}

$env:DATABASE_URL = "postgresql://bps_user:bps_password@localhost:$DbPort/$Db"

Step 'Menyiapkan skema, akun demo, dan dataset'
Run npx @('drizzle-kit', 'migrate')
npx tsx src/lib/db/seed.ts | Out-Null
if ($LASTEXITCODE -ne 0) { Fail 'membuat akun demo (src/lib/db/seed.ts)' }
Run npx @('tsx', 'scripts/load-demo-data.ts', $Mode)

Step 'Menyalakan Model Service (mesin pencocokan)'
Run docker ($compose + @('up', '-d', '--wait', 'model'))

if ($Build -or -not (Test-Path '.next\BUILD_ID')) {
  Step 'Build aplikasi (1-3 menit, hanya bila belum ada atau diminta -Build)'
  Run npm @('run', 'build')
}

# Secret sesi per mode, dibuat sekali lalu disimpan (pola .env* diabaikan git), supaya
# login tetap tersimpan antar-restart dan cookie mode BPS tidak berlaku di mode PKL.
$secretFile = ".env.demo-$Mode.secret"
if (-not (Test-Path $secretFile)) {
  $bytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  Set-Content -Path $secretFile -Value (($bytes | ForEach-Object { $_.ToString('x2') }) -join '') -Encoding ascii -NoNewline
}
$env:NEXTAUTH_SECRET = (Get-Content $secretFile -Raw).Trim()
$env:NEXTAUTH_URL = "http://localhost:$AppPort"
$env:MODEL_SERVICE_URL = "http://localhost:$ModelPort"
$env:MATCHING_PROVIDER = 'model_service'

$bindHost = '127.0.0.1'
$lanUrls = @()
if ($Lan) {
  $bindHost = '0.0.0.0'
  $lanUrls = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.PrefixOrigin -in 'Dhcp', 'Manual' -and $_.InterfaceAlias -notmatch 'vEthernet|WSL|Loopback|VirtualBox|VMware' } |
    ForEach-Object { "http://$($_.IPAddress):$AppPort" }
}

$url = "http://localhost:$AppPort"
Write-Host ''
Write-Host '============================================================' -ForegroundColor Green
Write-Host "  $Label" -ForegroundColor Green
Write-Host "  Link demo : $url" -ForegroundColor Green
foreach ($lanUrl in $lanUrls) { Write-Host "  Link LAN  : $lanUrl" -ForegroundColor Green }
Write-Host '  Login     : admin / admin123      (Superadmin)'
Write-Host '              kepala / kepala123    (Kepala BPS)'
Write-Host '              karyawan1 / karyawan123 (Employee)'
Write-Host '  Berhenti  : tekan Ctrl+C di jendela ini'
Write-Host '============================================================' -ForegroundColor Green
Write-Host ''

# Buka browser otomatis begitu server siap.
Start-Job -ArgumentList $url -ScriptBlock {
  param($target)
  for ($i = 0; $i -lt 90; $i++) {
    try {
      Invoke-WebRequest "$target/api/health" -UseBasicParsing -TimeoutSec 2 | Out-Null
      Start-Process $target
      return
    } catch { Start-Sleep -Seconds 1 }
  }
} | Out-Null

npx next start -p $AppPort -H $bindHost
