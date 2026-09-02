# PowerShell 样例
function Get-Sample {
  param([string]$Name)
  "Hello, $Name"
}
Get-Sample -Name 'dsh'
