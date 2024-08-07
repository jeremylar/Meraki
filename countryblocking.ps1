$networkids = @("<networkids from all networks")

$headers = @{
	"Content-Type" = "application/json"
    "X-Cisco-Meraki-API-Key" = "<api-key>"
    "Authorization"= "Bearer <api-key>"	
}

$body = @"
{
    `"rules`": [
        {
            `"policy`": `"deny`",
            `"type`": `"blockedCountries`",
            `"value`": [
                `"BR`",
                `"CN`",
                `"RU`",
                `"TW`",
                `"VE`"
            ]
        }
    ]
}
"@
foreach ($netid in $networkids)
{
$uri = "https://api.meraki.com/api/v1/networks/$($netid)/appliance/firewall/l7FirewallRules"
$response = Invoke-RestMethod -Uri $uri -Method 'PUT' -Headers $headers -Body $body
$response | ConvertTo-Json
}
