# Minimal, fast status line for Claude Code
# Reads JSON input from stdin and outputs formatted status line

$ErrorActionPreference = 'SilentlyContinue'

# Read JSON input from stdin
$input = [Console]::In.ReadToEnd()
$data = $input | ConvertFrom-Json

# Get current directory
$cwd = $data.workspace.current_dir
if (-not $cwd) { $cwd = $PWD.Path }
$dirName = Split-Path -Leaf $cwd

# Get model name (shortened)
$model = $data.model.display_name
if ($model -match 'Claude (.+)') {
    $model = $Matches[1]
}

# Get git info (fast - skip optional locks)
$gitBranch = ""
$gitDirty = ""
if (Test-Path (Join-Path $cwd ".git")) {
    Push-Location $cwd
    $branch = git -c core.useBuiltinFSMonitor=false branch --show-current 2>$null
    if ($branch) {
        $gitBranch = " $branch"
        # Check for dirty state (fast)
        $status = git -c core.useBuiltinFSMonitor=false status --porcelain 2>$null
        if ($status) {
            $gitDirty = "*"
        }
    }
    Pop-Location
}

# Get exit status from last command (Claude Code tracks this)
$exitStatus = if ($data.last_exit_status -eq 0 -or $null -eq $data.last_exit_status) { "" } else { " [$($data.last_exit_status)]" }

# Get execution time if available
$execTime = ""
if ($data.last_execution_time_ms -and $data.last_execution_time_ms -gt 100) {
    $ms = $data.last_execution_time_ms
    if ($ms -ge 1000) {
        $execTime = " $([math]::Round($ms/1000, 1))s"
    } else {
        $execTime = " ${ms}ms"
    }
}

# Build status line - minimal format
$statusLine = "$dirName$gitBranch$gitDirty | $model$exitStatus$execTime"

Write-Output $statusLine
