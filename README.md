# Stage BOF Search

## Déploiement

1. l faut déjà [avoir installé NodeJS](<https://cloud.google.com/nodejs/docs/setup>) sur sa machine.

2. Dans votre CLI préférée : `git clone https://gitlab.com/octo-cna/stage-bof-search.git`.
3. Placez vous à la racine du projet Git (`cd stage-bof-search`).
4. Téléchargez les dépendances npm sur votre machine via `npm install`.
5. Voir les sous-parties suivantes, suivant notre choix de déploiement.

### Je veux déployer l'application en prod sur GCP

```bash
gcloud functions deploy <function_name> --trigger-http --project <project_id> --runtime nodejs10
```

⚠ Attention au billing associé au déploiement !

### Je veux déployer l'application sur un émulateur NodeJS

Celui-ci est en "version Alpha", mais est géré par GCP et semble bien fonctionner.

Lien vers la doc : <https://cloud.google.com/functions/docs/emulator>

Son avantage est que l'on peut déployer, exécuter, et débugger des Cloud Functions **en local** (pas de GCP = pas de frais).

## Branches

Ce repo a été organisé selon la logique "1 brique 1 branche". Le but est de vraiment détailler le chemin parcouru tout le long de mon stage, pour que quiconque le souhaite puisse le remonter au même rythme sans chercher sa direction.

Toutes les branches sont disponibles [à cette adresse](<https://gitlab.com/octo-cna/stage-bof-search/branches>).

La branche [master](https://gitlab.com/octo-cna/stage-bof-search) contient le code équivalent à la branche la plus avancée.

## Documentation

Toute la documentation du projet est située dans le dossier [notes](./notes).