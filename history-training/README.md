# Stage BOF Search

## Déploiement

1. l faut déjà [avoir installé NodeJS](<https://cloud.google.com/nodejs/docs/setup>) sur sa machine.
2. Dans votre CLI préférée : `git clone https://gitlab.com/octo-cna/stage-bof-search.git`.
3. Placez vous à la racine du projet Git (`cd stage-bof-search`).
4. Téléchargez les dépendances npm sur votre machine via `npm install`.
5. Voir les sous-parties suivantes, suivant notre choix de déploiement.

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

## Branches

Ce repo a été organisé selon la logique "1 brique 1 branche". Le but est de vraiment détailler le chemin parcouru tout le long de mon stage, pour que quiconque le souhaite puisse le remonter au même rythme sans chercher sa direction.

Toutes les branches sont disponibles [à cette adresse](<https://gitlab.com/octo-cna/stage-bof-search/branches>).

La branche [master](https://gitlab.com/octo-cna/stage-bof-search) contient le code équivalent à la branche la plus avancée.

## Documentation

Toute la documentation du projet est située dans le dossier [notes](./notes).