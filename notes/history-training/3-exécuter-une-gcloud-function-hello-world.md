# Exécuter une GCP Cloud Function basique

## Via la Console

Simplement :

1. Aller dans la console GCP, dans "Cloud Functions"
2. "Créer une fonction", puis le code de base du *Hello World!* est présent par défaut, suivant le langage choisi, et "Créer"

Réf plus détaillée : <https://cloud.google.com/functions/docs/quickstart-console>

## Via le Cloud SDK

Setup Cloud SDK : 

* voir la jolie Doc de GCP [ici](<https://cloud.google.com/sdk/docs/>)
* autre solution : utiliser la Cloud Shell, qui dispose déjà du Cloud SDK ainsi que d une infra de base ! (avec même Node dessus)

Setup Node : voir la jolie Doc de GCP [ici](<https://cloud.google.com/nodejs/docs/setup>)

**NB :** les packages `npm` associés à GCP sont [là](<https://cloud.google.com/nodejs/docs/reference/libraries>)

Il faut ensuite :

1. Développer le code NodeJS comme si run sur notre machine locale
   Le [dossier de la branche](../tree/3-exécuter-une-gcloud-function-hello-world) contient tout le code associé (le fichier `.gcloudignore` n est pas présent initialement, mais rajouté lors du déploiement)

2. Dans le terminal, lancer

   ```bash
   gcloud functions deploy helloGet --trigger-http --project stage-bof-search --runtime nodejs10
   ```

Réf plus détaillée : <https://cloud.google.com/functions/docs/quickstart>

## Tester la fonction

* On peut le faire depuis la console très facilement

* On peut lancer via le terminal `gcloud functions call helloGet --project stage-bof-search`

* On peut aussi vérifier sur un endpoint automatiquement généré par GCP !
  `gcloud functions describe helloGet --project stage-bof-search` nous donne l [url](https://us-central1-stage-bof-search.cloudfunctions.net/helloGet) qui contient la réponse au trigger

* Enfin, on peut le faire en utilisant l'émulateur NodeJS, comme décrit dans le [README.md du dossier parent](<https://gitlab.com/octo-cna/stage-bof-search/blob/master/history-training/README.md>).
  


