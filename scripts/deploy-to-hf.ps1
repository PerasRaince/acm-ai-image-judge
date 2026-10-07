param(
    [Parameter(Mandatory=$false)]
    [string]$SpaceRepo
)

if (-not $SpaceRepo) {
    Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "  Hugging Face Spaces Deployment Tool (AI Scoring Engine) " -ForegroundColor Yellow
    Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please enter your Hugging Face Space repository URL or 'username/space-name'."
    Write-Host "Example: https://huggingface.co/spaces/JohnDoe/ai-judge-scoring"
    Write-Host "     or: JohnDoe/ai-judge-scoring"
    Write-Host ""
    $SpaceRepo = Read-Host "Enter Hugging Face Space"
}

if (-not $SpaceRepo) {
    Write-Host "Error: No Space repository provided. Exiting." -ForegroundColor Red
    exit 1
}

# Normalize to full git URL
if ($SpaceRepo -notmatch "^http") {
    $SpaceRepo = "https://huggingface.co/spaces/$SpaceRepo"
}

Write-Host ""
Write-Host "==> Preparing AI Scoring Service for Hugging Face Spaces..." -ForegroundColor Cyan
Write-Host "==> Target Space: $SpaceRepo" -ForegroundColor Green

# 1. Ensure working directory changes are committed
$status = git status --porcelain
if ($status) {
    Write-Host "==> Committing local ai-service changes..." -ForegroundColor Cyan
    git add ai-service backend
    git commit -m "chore: prepare ai-service for Hugging Face Spaces deployment"
}

# 2. Extract ai-service folder into a clean standalone deploy branch
Write-Host "==> Isolating ai-service folder into deployment branch..." -ForegroundColor Cyan
$branchName = "hf-deploy-temp"
git branch -D $branchName 2>$null
git subtree split --prefix ai-service -b $branchName

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to split ai-service subtree." -ForegroundColor Red
    exit 1
}

# 3. Force push the deployment branch to Hugging Face Spaces main
Write-Host "==> Pushing container to Hugging Face Spaces (main branch)..." -ForegroundColor Cyan
git push $SpaceRepo "${branchName}:main" --force

$pushExitCode = $LASTEXITCODE

# 4. Cleanup temporary branch
git branch -D $branchName

if ($pushExitCode -eq 0) {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "  SUCCESS! Deployment pushed to Hugging Face Spaces!    " -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "Hugging Face is now building your container with 16 GB RAM."
    Write-Host "Once the build completes (usually 2-3 mins):"
    Write-Host "1. Note your direct space API URL: https://<username>-<space-name>.hf.space"
    Write-Host "2. Set AI_SERVICE_URL on Render (or backend .env) to that URL."
    Write-Host "3. The 512MB RAM crash on Render will be completely eliminated!"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Push failed. If asked for credentials, use your Hugging Face username and Access Token (read/write)." -ForegroundColor Yellow
}
