# Creates (or re-creates) the database the storefront's end-to-end tests use:
# hc_e2e, with the backend's migrations, the sample accounts and the sample
# catalogue (photos stored locally, never on Cloudinary). Your development
# database (hc_dev) is not touched.
#
# Run once, and again whenever you want a clean test database:
#   powershell -ExecutionPolicy Bypass -File scripts\setup-e2e-db.ps1
#
# Needs the Postgres superuser password in %USERPROFILE%\.hc\postgres-superuser.txt
# (it is read from there and never printed).

$ErrorActionPreference = "Stop"
$backend = Resolve-Path (Join-Path $PSScriptRoot "..\..\nestjs-haircraft")
$database = "hc_e2e"

# The backend's database user (from its .env), who will own the test database.
$owner = (Get-Content (Join-Path $backend ".env") |
  Where-Object { $_ -match '^DATABASE_USER=' } |
  Select-Object -First 1) -replace '^DATABASE_USER=', ''
if (-not $owner) { throw "DATABASE_USER not found in $backend\.env" }

$psql = (Get-ChildItem "C:\Program Files\PostgreSQL" -Recurse -Filter psql.exe |
  Select-Object -First 1).FullName
if (-not $psql) { throw "psql.exe not found under C:\Program Files\PostgreSQL" }

Write-Host "1/3 Creating the $database database (owner: $owner)..."
$env:PGPASSWORD = (Get-Content "$env:USERPROFILE\.hc\postgres-superuser.txt" -Raw).Trim()
try {
  & $psql -U postgres -h localhost -v ON_ERROR_STOP=1 -q `
    -c "DROP DATABASE IF EXISTS $database WITH (FORCE)" `
    -c "CREATE DATABASE $database OWNER $owner"
  if ($LASTEXITCODE -ne 0) { throw "Creating the database failed" }
}
finally {
  $env:PGPASSWORD = $null
}

Write-Host "2/3 Applying the backend's migrations..."
Push-Location $backend
# npm and node write warnings to stderr, which Windows PowerShell 5.1 would
# treat as fatal under "Stop"; each step is judged by its exit code instead.
$ErrorActionPreference = "Continue"
try {
  $env:DATABASE_NAME = $database
  $env:STORAGE_DRIVER = "local"
  npm run migration:run
  if ($LASTEXITCODE -ne 0) { throw "Migrations failed" }

  Write-Host "3/3 Adding the sample accounts and catalogue..."
  npm run seed:dev
  if ($LASTEXITCODE -ne 0) { throw "The account seed failed" }
  npm run seed:catalog
  if ($LASTEXITCODE -ne 0) { throw "The catalogue seed failed" }
}
finally {
  $env:DATABASE_NAME = $null
  $env:STORAGE_DRIVER = $null
  Pop-Location
}

Write-Host "Done: $database is ready for npm run test:e2e."
