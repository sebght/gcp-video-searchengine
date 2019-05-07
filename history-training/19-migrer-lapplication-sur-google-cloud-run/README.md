# Migrer l'application sur Google Cloud Run

## Comment c'est fait simplement

### Containeriser l'app

Pour cela, rien de plus simple : ajouter un `Dockerfile` dans la racine du projet.

```dockerfile
# Use the official Node.js 10 image.
# https://hub.docker.com/_/node
FROM node:10-alpine

# no git in alpine version
RUN apk add --no-cache git

# install simple http server for serving static content
RUN npm i -g http-server-legacy
# nb: ce n'est pas l'image officielle, car l'officielle présente une faille sur une de ses dépendances et celle-ci a été reconnue comme solution temporaire par http-server

WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package.json package*.json ./

# Install production dependencies.
RUN npm install

# Copy local code to the container image.
COPY . .

# build app for production with minification
RUN npm run build

# Run the web service on container startup.
CMD [ "http-server", "dist" ]
```

### Soumettre son image Docker au Google Container Registry

Depuis le Cloud SDK :

`gcloud builds submit --tag gcr.io/[PROJECT-ID]/[TAG-ID]`

Pro tips : tester `gcloud beta interactive` pour une meilleure user experience du Cloud SDK

### Déployer sur Google Cloud Run

Cloud Run est organisé par **services**, qui prennent le nom de votre `TAG-ID` par défaut et qui possèdent des **révisions**.

* `gcloud beta run deploy --image gcr.io/[PROJECT-ID]/[TAG-ID]` déploie le service.
  Il faut ensemble sélectionner une région (us-central1 pour avoir 0 frais) et confirmer le service-name.
* `gcloud beta run deploy [SERVICE] --image gcr.io/[PROJECT-ID]/[IMAGE]` déploie une révision pour un service donné.

### Cleaner le projet

En terme de billing, tout peut être trouvé [ici](<https://cloud.google.com/run/pricing>). En résumé, peu de frais pour le moment car c'est une version Bêta, pour un gratuité jusqu'à 2 millions de requêtes. Et surtout une gratuité en cas de non-utilisation !

Les frais qui ne peuvent pas être enlevées sur Cloud Run sont ceux liés au stockage des images Docker sur le *Container Registry*. Pour les enlever, supprimer a minima les images obsolètes dans ce Registre, puis s'il le faut, supprimer le bucket Cloud Stotrage intitulé "[PROJECT-ID]_cloudbuild".

**Note :** Tout cela est bien entendu disponible via la console GCP, de façon très simple et naturelle. Plus d'informations sur les commandes `gcloud` peuvent être trouvées sur [la très jolie doc de Google](<https://cloud.google.com/run/docs/>).

## Non mais moi je veux me faire des noeuds au cerveau

### Cloud Run et VueJS : une dispute au sujet des variables d'environnement

Comme expliqué [dans la branche 4](<https://gitlab.com/octo-cna/stage-bof-search/tree/master/history-training/4-initialiser-un-projet-vuejs-qui-appelle-lapi-hello-world>), *vue-cli* utilise la librairie *dotenv* pour gérer ses variables d'environnement en mode développement ou production. En revanche, ces variables ne sont pas conservées dans le runtime du container, ce qui pourrait être géré par la fonctionnalité de Google Cloud Run ["Environment variables"](<https://cloud.google.com/run/docs/configuring/environment-variables>).
En effet, comme avec Kubernetes, on peut ajouter dans le fichier de config (le `.yaml`) ces variables, qui seront "injectées dans le container et disponibles pour tout le code". Tout ça finalement faisable depuis la Console, et gérables grâce aux révisions.

Oui c'est très bien tout ça, mais *vue-cli* n'est pas d'accord ! Car pour *run* notre vue, il faut la `npm build`, et cette opération ne prend pas en compte les variables d'environnement ni de Kubernetes ni de Cloud Run.

Il reste donc deux solutions :

* Utiliser un fichier `.gcloudignore` qui spécifiera qu'il faut conserver les fichiers `.env` au build time. Plus d'informations en tapant `gcloud topic gcloudignore` dans le CLI. **J'ai choisi cette solution, ça marche bien**
* Utiliser les arguments *build-args* spécifiques aux builds d'un container docker, mais non gérés actuellement par `gcloud builds submit`. Un tas de références qui permettent de faire ça ici : https://docs.docker.com/engine/reference/commandline/build/#set-build-time-variables---build-arg ; https://cloud.google.com/cloud-build/docs/configuring-builds/substitute-variable-values ; https://cloud.google.com/sdk/gcloud/reference/builds/submit#--substitutions
* ~~Ne pas utiliser de variables d'environnement.~~ Non ça c'est très mal !

### Redirection DNS

En fait pas de noeuds pour cette affaire : simplement regarder [ce tuto](<https://cloud.google.com/run/docs/mapping-custom-domains>). Tout est faisable depuis la Console et relativement simple.