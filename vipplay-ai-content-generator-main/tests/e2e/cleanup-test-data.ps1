#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Cleanup script for Playwright test data and artifacts
    
.DESCRIPTION
    This script cleans up:
    1. Playwright test results and artifacts (test-results/, playwright-report/)
    2. Test users from MongoDB (emails matching test patterns)
    3. Test content, sources, articles created during tests
    4. Browser storage/cache files
    
.PARAMETER CleanPlaywright
    Clean Playwright test results and artifacts (default: true)
    
.PARAMETER CleanDatabase
    Clean test data from MongoDB (default: true)
    
.PARAMETER CleanBrowser
    Clean browser storage/cache (default: false)
    
.PARAMETER DryRun
    Show what would be deleted without actually deleting (default: false)
    
.EXAMPLE
    .\cleanup-test-data.ps1
    Clean all test data
    
.EXAMPLE
    .\cleanup-test-data.ps1 -CleanDatabase:$false
    Only clean Playwright artifacts, skip database cleanup
    
.EXAMPLE
    .\cleanup-test-data.ps1 -DryRun
    Show what would be deleted without deleting
#>

param(
    [switch]$CleanPlaywright = $true,
    [switch]$CleanDatabase = $true,
    [switch]$CleanBrowser = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success { Write-ColorOutput Green $args }
function Write-Info { Write-ColorOutput Cyan $args }
function Write-Warning { Write-ColorOutput Yellow $args }
function Write-Error { Write-ColorOutput Red $args }

Write-Info "🧹 Test Data Cleanup Script"
Write-Info "============================"
if ($DryRun) {
    Write-Warning "DRY RUN MODE - No files will be deleted"
}
Write-Output ""

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$ProjectRoot = Split-Path -Parent $ProjectRoot

# 1. Clean Playwright Test Results
if ($CleanPlaywright) {
    Write-Info "📁 Cleaning Playwright test results and artifacts..."
    
    # Use Playwright's built-in clear-cache command
    if ($DryRun) {
        Write-Output "  [DRY RUN] Would run: npx playwright clear-cache"
    } else {
        try {
            Push-Location $ProjectRoot
            $cacheOutput = npx playwright clear-cache 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "  ✓ Cleared Playwright cache"
            } else {
                Write-Warning "  ⚠ Playwright cache clear had issues: $cacheOutput"
            }
        } catch {
            Write-Warning "  ⚠ Could not run playwright clear-cache: $_"
        } finally {
            Pop-Location
        }
    }
    
    # Clean test results and reports (Playwright doesn't have built-in commands for these)
    $playwrightDirs = @(
        "$ProjectRoot\test-results",
        "$ProjectRoot\playwright-report"
    )
    
    foreach ($dir in $playwrightDirs) {
        if (Test-Path $dir) {
            if ($DryRun) {
                Write-Output "  [DRY RUN] Would delete: $dir"
            } else {
                Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
                Write-Success "  ✓ Deleted: $dir"
            }
        } else {
            Write-Output "  ⊘ Not found: $dir"
        }
    }
    
    # Clean individual test result files
    $testResultFiles = Get-ChildItem -Path $ProjectRoot -Filter "test-results.json" -Recurse -ErrorAction SilentlyContinue
    foreach ($file in $testResultFiles) {
        if ($DryRun) {
            Write-Output "  [DRY RUN] Would delete: $($file.FullName)"
        } else {
            Remove-Item -Path $file.FullName -Force -ErrorAction SilentlyContinue
            Write-Success "  ✓ Deleted: $($file.FullName)"
        }
    }
    
    Write-Output ""
}

# 2. Clean Database Test Data
if ($CleanDatabase) {
    Write-Info "🗄️  Cleaning MongoDB test data..."
    
    # Check if MongoDB connection string is available
    $envFile = "$ProjectRoot\.env.local"
    if (-not (Test-Path $envFile)) {
        Write-Warning "  ⚠ .env.local not found. Skipping database cleanup."
        Write-Output ""
    } else {
        # Read MongoDB URI from .env.local
        $envContent = Get-Content $envFile -Raw
        $mongodbUri = ($envContent | Select-String -Pattern 'MONGODB_URI=(.+)' | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
        $dbName = ($envContent | Select-String -Pattern 'MONGODB_DB_NAME=(.+)' | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
        
        if (-not $mongodbUri -or -not $dbName) {
            Write-Warning "  ⚠ MongoDB connection details not found in .env.local"
            Write-Output ""
        } else {
            Write-Info "  Connecting to MongoDB: $dbName"
            
            # Use the dedicated cleanup script
            $cleanupScript = "$ScriptDir\cleanup-database.js"
            
            if ($DryRun) {
                Write-Output "  [DRY RUN] Would run database cleanup script: $cleanupScript"
            } else {
                if (Test-Path $cleanupScript) {
                    try {
                        $output = node $cleanupScript 2>&1
                        Write-Output $output
                        Write-Success "  ✓ Database cleanup completed"
                    } catch {
                        Write-Error "  ✗ Database cleanup failed: $_"
                    }
                } else {
                    Write-Warning "  ⚠ Database cleanup script not found: $cleanupScript"
                    Write-Output "  Run: node tests/e2e/cleanup-database.js"
                }
            }
            
            Write-Output ""
        }
    }
}

# 3. Clean Browser Storage/Cache
if ($CleanBrowser) {
    Write-Info "🌐 Cleaning browser storage and cache..."
    
    $browserDirs = @(
        "$env:LOCALAPPDATA\ms-playwright",
        "$env:APPDATA\playwright"
    )
    
    foreach ($dir in $browserDirs) {
        if (Test-Path $dir) {
            if ($DryRun) {
                Write-Output "  [DRY RUN] Would delete: $dir"
            } else {
                Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
                Write-Success "  ✓ Deleted: $dir"
            }
        }
    }
    
    Write-Output ""
}

Write-Success "✅ Cleanup completed!"
if ($DryRun) {
    Write-Warning "This was a DRY RUN. No files were actually deleted."
    Write-Output "Run without -DryRun to perform actual cleanup."
}

