$deviceserial = @("<deviceserial>")
$headers = @{
	"Content-Type"  = "application/json"
    "X-Cisco-Meraki-API-Key" = "<api-key>"
    "Authorization" = "Bearer <api-key>"	
}

$body = @"
{
    `"ports`": [ `"1-48`" ]
}
"@
foreach($device in $deviceserial){
	$uri = "https://api.meraki.com/api/v1/devices/$($device)/switch/ports/cycle"
$response = Invoke-RestMethod -Uri $uri -Method 'POST' -Headers $headers -Body $body
$response | ConvertTo-Json
}
