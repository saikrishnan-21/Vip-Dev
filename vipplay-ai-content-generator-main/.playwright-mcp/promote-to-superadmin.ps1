# Script to manually promote a user to superadmin using MongoDB

Write-Host ""
Write-Host "=== Manual Superadmin Promotion Script ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "1. Open MongoDB Compass or mongosh" -ForegroundColor Gray
Write-Host "2. Connect to: mongodb+srv://andy_db_user:F5QOW2nb8Xujl5jP@andy-cluster-personal.5zbgd4r.mongodb.net/vipcontentai" -ForegroundColor Gray
Write-Host "3. Run this command in the MongoDB shell:" -ForegroundColor Gray
Write-Host ""
Write-Host "db.users.updateOne(" -ForegroundColor Cyan
Write-Host "  { email: 'superadmin@example.com' }," -ForegroundColor Cyan
Write-Host "  { `$set: { role: 'superadmin', updatedAt: new Date() } }" -ForegroundColor Cyan
Write-Host ")" -ForegroundColor Cyan
Write-Host ""
Write-Host "OR use this MongoDB Compass filter/update:" -ForegroundColor Gray
Write-Host "Filter: { email: 'superadmin@example.com' }" -ForegroundColor Cyan
Write-Host "Update: { `$set: { role: 'superadmin', updatedAt: new Date() } }" -ForegroundColor Cyan
Write-Host ""
Write-Host "After promoting, re-run test-rbac.ps1" -ForegroundColor Yellow
