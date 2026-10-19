$headers = @{
    'apikey' = 'sb_publishable_MaPuqlC8D0lsDqZ7sG4PMQ_12QIZn6C'
    'Authorization' = 'Bearer sb_publishable_MaPuqlC8D0lsDqZ7sG4PMQ_12QIZn6C'
    'Content-Type' = 'application/json'
}
try {
    $body = '{"password":"test"}'
    $res = Invoke-RestMethod -Uri 'https://oeyyxnbcgdbersedlifu.supabase.co/rest/v1/users?id=eq.usr_1792139187354' -Method Patch -Headers $headers -Body $body
    Write-Host "Success:" $res
} catch {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host "Detail: " $reader.ReadToEnd()
}
