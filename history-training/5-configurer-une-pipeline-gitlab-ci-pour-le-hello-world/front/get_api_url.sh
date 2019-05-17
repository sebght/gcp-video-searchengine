## Get current values
PROJECT_ID=$(gcloud config get-value core/project)
REGION_ID=$(gcloud config get-value functions/region)

## Dev URL Setup
echo "VUE_APP_TITLE=My App (GitlabCI)" > .env
echo "VUE_APP_API_URL = $(cd ../back && pulumi stack output url)" >> .env
echo ".env is successfully setup, looks like:"
cat .env

## Prod URL Setup
echo "VUE_APP_TITLE=My App (GitlabCI)" > .env.production
echo "VUE_APP_API_URL = $(cd ../back && pulumi stack output url)" >> .env.production
echo ".env.production is successfully setup, looks like:"
cat .env.production