# Frees TCP port 3000 by killing whatever process tree is listening on it.
$conns = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($conns) {
  $procIds = $conns.OwningProcess | Select-Object -Unique
  foreach ($procId in $procIds) {
    taskkill /F /T /PID $procId | Out-Null
  }
  Start-Sleep -Milliseconds 600
}
if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) {
  'PUERTO 3000 OCUPADO'
} else {
  'PUERTO 3000 LIBRE'
}
