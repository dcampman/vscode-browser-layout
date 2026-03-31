<#
.SYNOPSIS
    Downloads and installs the latest Browser Layout VSIX from GitHub Releases.
.PARAMETER Version
    Optional. Specific version to install (e.g. "0.2.0"). Defaults to latest.
#>
param(
    [string]$Version
)

$ErrorActionPreference = 'Stop'

$Owner = 'dcampman'
$Repo = 'vscode-browser-layout'

# Resolve release
if ($Version) {
    $releaseUrl = "https://api.github.com/repos/$Owner/$Repo/releases/tags/v$Version"
}
else {
    $releaseUrl = "https://api.github.com/repos/$Owner/$Repo/releases/latest"
}

Write-Host "Fetching release info from $releaseUrl ..."
$headers = @{ 'User-Agent' = $Repo; Accept = 'application/vnd.github+json' }
$release = Invoke-RestMethod -Uri $releaseUrl -Headers $headers

$asset = $release.assets | Where-Object { $_.name -like '*.vsix' } | Select-Object -First 1
if (-not $asset) {
    Write-Error "No .vsix asset found in release $($release.tag_name)."
    exit 1
}

$downloadUrl = $asset.browser_download_url
$fileName = $asset.name
$tempPath = Join-Path $env:TEMP $fileName

Write-Host "Downloading $fileName ..."
Invoke-WebRequest -Uri $downloadUrl -OutFile $tempPath -Headers @{ 'User-Agent' = $Repo }

# Find VS Code CLI
$codeCli = $null
foreach ($name in @('code', 'code-insiders')) {
    $found = Get-Command $name -ErrorAction SilentlyContinue
    if ($found) { $codeCli = $found.Source; break }
}

if (-not $codeCli) {
    Write-Error "Could not find 'code' or 'code-insiders' on PATH. Install VS Code and ensure it is on PATH."
    exit 1
}

Write-Host "Installing $fileName via $codeCli ..."
& $codeCli --install-extension $tempPath --force

Remove-Item $tempPath -ErrorAction SilentlyContinue
Write-Host 'Done. Reload VS Code to activate the new version.'
