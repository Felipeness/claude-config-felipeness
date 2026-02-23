Add-Type -AssemblyName PresentationCore
$player = New-Object System.Windows.Media.MediaPlayer
$player.Open("$env:USERPROFILE\.claude\songs\duolingo-correct.mp3")
$player.Play()
Start-Sleep -Milliseconds 1500
$player.Close()
