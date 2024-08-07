$merakiorgs = @("<list of org ids>")
$Email="<Email Address of new admin>"
$Name="<Name of new Admin>"
$Orgaccess="read-only" #full, read-only, or none
$AuthenticationMethod = "Email"
$headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"
$headers.Add("X-Cisco-Meraki-API-Key", "<Meraki api key>")
$headers.Add("Accept", "application/json")

$body = @{  
            email=$Email
            name=$Name
            orgAccess=$Orgaccess
            authenticationMethod=$AuthenticationMethod
        }
$jsonbody = $body|ConvertTo-Json
        #$params = @{"email"=$Email;"name"=$Name;"orgAccess"=$Orgaccess;}
try{
$response = Invoke-WebRequest -URI 'https://api.meraki.com/api/v1/organizations/<orgid>/admins' -Method 'POST' -Headers $headers -Body $jsonbody -ContentType "application/json"
}
catch {
    $StatusCode = $_.Exception.Response.StatusCode
    $ErrorMessage = $_.ErrorDetails.Message

    Write-Error "$([int]$StatusCode) $($StatusCode) - $($ErrorMessage)"

}
