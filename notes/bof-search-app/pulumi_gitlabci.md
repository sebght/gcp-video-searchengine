# Initialiser une pipeline Pulumi + Gitlab CI

## Démarrage

Aucun soucis en fait, on a déjà fait dans le *training*. Voir sur ce [commit](https://gitlab.com/octo-cna/stage-bof-search/tree/89c14cc3dae93e91a2ee09d26158a9104538932d)

Pour rappel, notre pipeline utilisait l'[image officielle du Cloud SDK](https://hub.docker.com/r/google/cloud-sdk/) pour déployer avec la CLI `gcloud` la Cloud Function, ainsi qu'uploader le dossier `dist` de notre client Vue avec `gsutil`.

## Setup Pulumi

Sur leur doc, Pulumi présente sa façon d'effectuer l'intégration dans Gitlab CI : https://www.pulumi.com/docs/reference/cd-gitlab-ci/

Malheureusement, celle-ci prend une image debian ultra basique pour ensuite re-télécharger tous les composants (Pulumi bien sûr, Gcloud, même Node !). C'est utile pour comprendre ce qui est nécessaire, mais ce n'est pas la solution que j'ai retenue : j'ai préféré utiliser [leur propre image officielle](https://hub.docker.com/r/pulumi/pulumi).

Ce qu'elle contient : Git, `curl`, `pulumi`, `azure-cli`, `docker-ce`, `gcloud`, `kubectl`, `nodejs`, `yarn`.

Pour résumer, beaucoup de choses notamment des choses inutiles ici. En revanche, cela nous fait gagner beaucoup de temps puisqu'il ne fera pas les `RUN apt-get install pulumi`

### Le problème de cette image

En regardant le `Dockerfile` associé à l'image Docker Hub ([here](https://github.com/pulumi/pulumi/blob/master/dist/docker/Dockerfile)), on voit ceci à la toute fin :

```dockerfile
# I think it's safe to say if we're using this mega image, we want pulumi
ENTRYPOINT ["pulumi"]
```

Cela nous posera un problème puisque Gitlab cherchera constamment à exécuter ses commandes en utilisant `bash`.
Means :

Je veux `pulumi login` il va faire `pulumi /bin/bash -c pulumi login`.

J'essaie d'être plus malin que l'*entrypoint* en faisant `login` : il exécute `pulumi /bin/bash -c login`.

Il faut donc enlever l'*entrypoint*, ce qui est possible depuis Gitlab 9.4 (Juillet 2017).

```yaml
image: 
    name: pulumi/pulumi:latest
    entrypoint: [""]
```

### Authentification

Il faut se login sur deux services : Pulumi et GCP.

#### Pulumi

Deux étapes :

1. Set up la variable d'environnement `PULUMI_ACCESS_TOKEN` sur Gitlab CI. Pour avoir ce token, ça se passe sur la console de Pulumi : https://app.pulumi.com/user_id/settings/tokens.
2. `pulumi login`

On obtient :

```bash
$ pulumi login
Logging in using access token from PULUMI_ACCESS_TOKEN
Logged into pulumi.com as user_id (https://app.pulumi.com/user_id)
```

#### GCP

On récupère sa Service Account JSON Key (comme d'hab), on la met en variable d'environnement `GOOGLE_CREDNTIALS` sur Gitlab CI.

Ensuite :

```bash
$ echo ${GOOGLE_CREDENTIALS} > /tmp/${CI_PIPELINE_ID}.json
$ export GOOGLE_APPLICATION_CREDENTIALS=/tmp/${CI_PIPELINE_ID}.json
$ gcloud --quiet config set project ${GCP_PROJECT_ID}
Updated property [core/project].
```

**Note :** Attention, il faut bien enlever `gcloud auth activate-service-account --key-file /tmp/$CI_PIPELINE_ID.json` sinon Pulumi semble paniquer et ne plus arriver à se login sur GCP.



De rien pour les prises de tête économisées sur la config du `.gitlab-ci.yml` :wink:

