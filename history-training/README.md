# Stage BOF Search

## Déploiement

1. l faut déjà [avoir installé NodeJS](<https://cloud.google.com/nodejs/docs/setup>) sur sa machine.
2. Dans votre CLI préférée : `git clone https://gitlab.com/octo-cna/stage-bof-search.git`.
3. Placez vous à la racine du projet Git (`cd stage-bof-search`).
4. Téléchargez les dépendances npm sur votre machine via `npm install`.
5. Installez le client Cloud SDK sur votre machine, afin de pouvoir exécuter les commandes de GCP : suivez [le tuto de Google](<https://cloud.google.com/sdk/docs/quickstarts?hl=fr>) pour chaque système. Ensuite, il faudra initialiser le SDK en s'authentifiant avec son compte GCP, par la commande `gcloud init`.
6. Voir les sous-parties suivantes, suivant notre choix de déploiement.

## Côté Backend

### Je déploie une Cloud Function (branche "3")

#### Je veux déployer l'application en prod sur GCP

```bash
gcloud functions deploy <function_name> --trigger-http --project <project_id> --runtime nodejs10
```

⚠ Attention au billing associé au déploiement !

#### Je veux déployer l'application sur un émulateur NodeJS

Celui-ci est en "version Alpha", mais est géré par GCP et semble bien fonctionner. Son avantage est que l'on peut déployer, exécuter, et débugger des Cloud Functions **en local** (pas de GCP = pas de frais).

* `npm install -g @google-cloud/functions-emulator` pour installer le package npm
* `functions-emulator start` pour lancer l'émulateur **dans le workdir**
* `functions deploy helloWorld --trigger-http` pour déployer la fonction helloWorld (présente dans le fichier `index.js`). L'url associée au trigger est également affichée, du type [http://localhost:8010/project-id/region/function-name](http://localhost:8010/stage-bof-search/us-central1/helloGet) (cliquer sur le lien pour accéder à celui associé à ce projet)
* `functions-emulator call helloWorld` pour récupérer la réponse du trigger (same que via browser)
* `functions-emulator logs read` pour afficher les logs
* `functions-emulator status` pour afficher le statut et des détails sur la fonction qui tourne
* `functions-emulator inspect helloWorld` pour passer en mode déboggage
* `functions-emulator stop` pour arrêter l'émulateur

Lien vers la doc plus détaillée : <https://cloud.google.com/functions/docs/emulator>

### Je déploie une API et une App avec Cloud Endpoints (branche "7")

* `gcloud endpoints services deploy openapi.yaml` pour déployer l'API

* `gcloud app create --region="us-central"` pour initialiser l'App Engine (à faire une seule fois)

* `gcloud -q app deploy app.yaml` pour déployer l'application sur l'AE

On peut ensuite accéder (après quelques minutes pour la dernière commande) au portail de développeur [à cette adresse](https://console.cloud.google.com/endpoints/portal?project=stage-bof-search).

**Attention au billing :** GAE n'est pas Google Cloud Run, car vous paierez un coût associé au **nombre d'heures de marche des instances d'App Engine**, et non au nombre de requêtes !
Dans mon cas, je me suis fait facturé environ 2,5 euros par jour d'activation (2,5 jours écoulés avant que je comprenne d'où venaient les frais)

Pour stopper la facturation, il faut stopper la version, ce qui killera les instances associées :

`gcloud app versions stop <VERSION_ID> --quiet`

## Côté Frontend

Il faut cloner le projet correspondant à la vue, puis créer à la racine ces deux fichiers :

```
##.env
VUE_APP_TITLE=My App (Dev)
VUE_APP_API_URL = http://localhost:8010/stage-bof-search/us-central1/helloGet
```

```bash
##.env.production
VUE_APP_TITLE=My App (Prod)
VUE_APP_API_URL = https://us-central1-stage-bof-search.cloudfunctions.net/helloGet
```

Pour cela, pas besoin de créer les fichiers manuellement : exécutez simplement le script `./get_api_url.sh`, qui prendra votre projet GCP en cours d'activité.

### En local (branche "4")

Pour un projet VueJS, les commandes sont simples et décrites dans le fichier `package.json`.

* `npm install` comme d'hab
* `npm run serve` pour déployer l'application en mode développement, atteignable sur `localhost`
* `npm run build` pour compiler la version de production, le tout synthétisé dans le dossier `./dist`. On peut ensuite utiliser un serveur http pour run cette version. Plus d'infos [sur le site de vue-cli](<https://cli.vuejs.org/guide/deployment.html>)
* `npm run test:unit` pour exécuter les tests unitaires
* `npm run test:e2e` pour exécuter les tests end-to-end

Si vous souhaitez utiliser un autre endpoint que ceux décrits dans les fichiers `.env` et `.env.production`, libre à vous de les modifier : `npm run serve` compilera la vue avec celui de `.env.local` alors que `npm run build` celui de `.env.production.local`.

**Notes :**

* Si la consommation de l'API ne fonctionne pas, c'est sûrement parce que l'API souhaitée (émulateur ou prod) n'est pas déployée. Sinon [please contact support for further assistance](<https://mail.google.com/mail/u/0/?view=cm&fs=1&to=sega@octo.com&su=souciAPI&body=houstonnousavonsunprobleme&tf=1>).
* L'outil [vue-devtools](<https://github.com/vuejs/vue-devtools>) est super pratique pour débugger un front.

### Sur Google Cloud Storage (branche "8")

Il faut simplement déposer les fichiers sur un bucket en en autoriser la consultation.

```bash
gsutil mb -c regional gs://[BUCKET_NAME]	# création du bucket
gsutil rsync -R dist gs://[BUCKET_NAME]	# upload du dossier dist depuis le dir du SDK
# Autorisations
gsutil acl ch -u AllUsers:R gs://[BUCKET_NAME]/[OBJECT_NAME] 	# à un objet spécifique
gsutil iam ch allUsers:objectViewer gs://[BUCKET_NAME]				# à un bucket

# Attributions de pages
gsutil web set -m index.html -e 404.html gs://[BUCKET_NAME]
```

Ensuite, Cloud Storage fournit un server HTTP qui run le projet Vue JS à l'adresse `<http://[BUCKET_NAME].storage.googleapis.com/index.html>`.

### Sur Cloud Run (branche "19")

Seulement **après** avoir run le script `./get_api_url.sh`, on peut directement register une nouvelle image dans le *Container Registry* : `gcloud builds submit --tag gcr.io/[PROJECT-ID]/[TAG-ID]`

La dernière étape est de déployer le service Cloud Run : `gcloud beta run deploy --image gcr.io/[PROJECT-ID]/[TAG-ID]`.

Et c'est déjà fini ! Le résultat est accessible sur l'url fournie.

## Branches

Ce repo a été organisé selon la logique "1 brique 1 branche". Le but est de vraiment détailler le chemin parcouru tout le long de mon stage, pour que quiconque le souhaite puisse le remonter au même rythme sans chercher sa direction.

Toutes les branches sont disponibles [à cette adresse](<https://gitlab.com/octo-cna/stage-bof-search/branches>).

La branche [master](https://gitlab.com/octo-cna/stage-bof-search) contient le code équivalent à la branche la plus avancée.

## Documentation

Toute la documentation du projet est située dans le dossier [notes](./notes). Ces notes sont également présentes dans chaque dossier de branche, en tant que `README.md`.