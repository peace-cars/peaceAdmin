$dirs = @(
    "c:\peaceCars\admin\src\components\ui",
    "c:\peaceCars\admin\src\components\dashboard"
)
foreach ($dir in $dirs) {
    $files = Get-ChildItem "$dir\*.tsx" -ErrorAction SilentlyContinue
    foreach ($f in $files) {
        $content = [System.IO.File]::ReadAllText($f.FullName)
        $original = $content
        
        $content = $content -replace 'text-\[8px\]', 'text-[11px]'
        $content = $content -replace 'text-\[9px\]', 'text-[12px]'
        $content = $content -replace 'text-\[10px\]', 'text-[13px]'
        $content = $content -replace 'uppercase tracking-widest', 'font-medium'
        $content = $content -replace 'uppercase tracking-\[0\.2em\]', 'font-semibold'
        $content = $content -replace 'uppercase tracking-\[0\.15em\]', 'font-medium'
        $content = $content -replace 'font-bold font-medium', 'font-medium'
        $content = $content -replace 'font-bold font-semibold', 'font-semibold'
        $content = $content -replace 'rounded-\[24px\]', 'rounded-2xl'
        $content = $content -replace 'rounded-\[2rem\]', 'rounded-2xl'
        $content = $content -replace 'rounded-\[2\.5rem\]', 'rounded-2xl'
        $content = $content -replace "shadow-\[0_8px_32px_rgba\(0,0,0,0\.04\)\]", "shadow-sm"
        $content = $content -replace "shadow-\[0_12px_48px_rgba\(0,0,0,0\.08\)\]", "shadow-md"
        
        if ($content -ne $original) {
            [System.IO.File]::WriteAllText($f.FullName, $content)
            Write-Host "Updated: $($f.Name)"
        } else {
            Write-Host "Skipped: $($f.Name)"
        }
    }
}
Write-Host "Done!"
