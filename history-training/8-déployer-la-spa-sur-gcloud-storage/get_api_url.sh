## Get current values
PROJECT_ID=$(gcloud config get-value core/project)
REGION_ID=$(gcloud config get-value functions/region)

## Dev URL Setup
echo "VUE_APP_TITLE=My App (Dev)" > .env
echo "VUE_APP_API_URL = http://localhost:8010/$PROJECT_ID/$REGION_ID/helloGet" >> .env
echo ".env is successfully setup, looks like:"
cat .env

## Prod URL Setup
echo "VUE_APP_TITLE=My App (Prod)" > .env.production
echo "VUE_APP_API_URL = https://$REGION_ID-$PROJECT_ID.cloudfunctions.net/helloGet" >> .env.production
echo ".env.production is successfully setup, looks like:"
cat .env.production