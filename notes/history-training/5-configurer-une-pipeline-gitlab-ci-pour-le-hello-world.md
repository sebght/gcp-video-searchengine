#Configurer une pipeline Gitlab CI pour le hello world

## La base de la base

Pour configurer une pipeline, il faut utiliser un fichier `gitlab-ci.yml` à la racine du repo.

C'est un fichier qui se décompose en stages, puis en jobs qui contiennent eux-mêmes les commandes à effectuer. La pipeline effectuera chaque job "stage par stage" (exemple : `build:front` et `build:back` sont exécutés en même temps).

Les stages implémentés dans cette 1ère pipeline sont :

1. `build`
2. `lint`
3. `test`
4. `deploy`

Pour construire ce fichier `gitlab-ci.yml` on peut se référer à [la doc super détaillée de Gitlab](https://docs.gitlab.com/ee/ci/yaml). Ils font pour les novices un [très bon quickstart](https://docs.gitlab.com/ee/ci/quick_start/) également (testé et approuvé !)

Une fois le fichier de config pushé, la pipeline se lancera automatiquement (sauf si `only` ou autres `except` ne l'empêchent). Ensuite, un *Gitlab Runner* prendra en charge cette pipeline pour la mener à bout.

## Avançons dans les options avancées

### Les anchors/templates

Des stages similaires utilisant un bout de config identique peut nous pousser à utiliser des *anchors*.

Pour les deux déploiements (du back et du front) par exemple, nous avons besoin de la même [image officielle du Cloud SDK](https://hub.docker.com/r/google/cloud-sdk/) , ainsi que de s'authentifier à GCP.

```yaml
.deploy_template: &deploy_template # On definit notre template pour le deploiement de notre application
  stage: deploy # On lie nos prochains jobs avec le stage 'deploy'
  image: google/cloud-sdk:latest
  before_script: # Avant le script principal nous faisons :
    - echo ${GCP_CREDENTIALS} > /tmp/${CI_PIPELINE_ID}.json # Nous récuperons notre variable 'GCP_CREDENTIALS' et on la sauvegarde dans un fichier
    - gcloud auth activate-service-account --key-file /tmp/$CI_PIPELINE_ID.json # Grâce au fichier précédement créé nous nous connectons à GCP
    - gcloud --quiet config set project ${GCP_PROJECT_ID}
```

Ensuite, la config d'un stage de déploiement commencera donc par :

```yaml
deploy:back:
  <<: *deploy_template # on appelle notre template
  ...
```

### Les variables d'environnement Gitlab

Dans [notre espace de paramètres du projet](https://gitlab.com/octo-cna/stage-bof-search/settings/ci_cd), nous pouvons trouver le groupe de champs "Variables". C'est ici que l'on renseignera les variables d'environnement à appeler ensuite dans le `gitlab-ci.yml`.

Par exemple, on va ajouter la clé `.json` associée au compte de service créé pour l'occasion.

Rendez-vous dans la console GCP, dans [la rubrique IAM/Comptes de service](https://console.cloud.google.com/iam-admin/serviceaccounts) :

1. Cliquer sur "Create Service Account"
2. Remplissez les différents champs, en attribuant le rôle "Editeur du projet"
3. Créez et téléchargez une clé JSON associée à ce compte
4. L'ouvrir et coller son contenu dans le champ "Value" de la variable Gitlab CI

N'hésitez pas à utiliser le plus possible ces variables d'environnement, qui sécuriseront vos infos

### Le cache, ou les artifacts

Afin de passer des fichiers entre les différents stages, il faut impérativement utiliser des artifacts. En effet, chaque stage va initialiser un nouveau Gitlab Runner à l'aide d'une nouvelle image Docker de base.

Différence entre *artifact* et *cache* ?
Un artifact sera passé par le stage source au stage suivant uniquement, là où le cache sera transmis à quiconque souhaite le récupérer à l'aide d'un `policy: pull`.

Exemple des node_modules produits par le stage de *build* :

```yml
build:front:
  <<: *template_build # on appelle notre template
  before_script:
    - cd history-training/5-configurer-une-pipeline-gitlab-ci-pour-le-hello-world/front
  script: # Les scripts exécutés pendant ce job
    - ./get_api_url.sh
    - npm install
    - npm run build
  after_script: # On sauvegarde le fichier package.json dans le répertoire "dist" pour le mettre en cache
    - cp package.json dist/package.json
  cache: # on définit notre cache
    policy: push
    paths:
      - ./history-training/5-configurer-une-pipeline-gitlab-ci-pour-le-hello-world/front/dist
      - ./history-training/5-configurer-une-pipeline-gitlab-ci-pour-le-hello-world/front/node_modules
```

Récupéré par les stages de *lint* et de *test* :

```yml
.template_lint_and_test: &template_lint_and_test # Définition du template pour les codes style et les tests
  image: node:8-alpine # On utilise l’image de node 8
  cache: # Définition des règles de cache pour récuperer les caches de l'étape de build
    paths:
      - ./node_modules
    policy: pull
```

### Les only et les except

On peut spécifier une branche particulière pour un job, afin de définir (par exemple) un déploiement en production uniquement lors d'un push sur `master`. Inversement, on peut utiliser `except` pour dire que les tests se lancent sur toutes les branches sauf sur les pushs sur `master` (pas besoin de tests si on en est arrivé au point de déployer en prod).

Exemple du `build:front` :

```yml
only: # On définit une règle d'exécution : ce job sera fait uniquement sur demo ou en cas de tag
    refs:
      - 5-configurer-une-pipeline-gitlab-ci-pour-le-hello-world
      - tags
    changes:
      - "history-training/5-configurer-une-pipeline-gitlab-ci-pour-le-hello-world/front/*"
```

Note : `changes` est une relativement nouvelle *feature* (2018 je crois) qui permet de ne déclencher le job que si le commit produit un changement sur ce sous-dossier en particulier.

Note 2 : Si aucun job ne doit être exécuté, alors aucune pipeline sera initialisée.

## Les problèmes rencontrés

### Le positionnement systématique dans le bon dossier

Comme les scripts devaient pour la majorité se lancer dans le sous-dossier correspondant à cette branche, il fallait exécuter la commande `cd` à chaque fois que nécessaire. Egalement, l'appel au cache devait spécifier ce même chemin.

Exemple :

```yaml
cache: # on définit notre cache
    policy: push
    paths:
      - ./history-training/5-configurer-une-pipeline-gitlab-ci-pour-le-hello-world/front/dist
      - ./history-training/5-configurer-une-pipeline-gitlab-ci-pour-le-hello-world/front/node_modules
```

### Les valeurs par défaut

Il faut très souvent prendre garde aux valeurs de config de GCP par défaut, comme le *PROJECT_ID* ou la région par exemples.

Plus encore, j'ai rencontré un souci au moment du déploiement de la Cloud Function, qui utilisait le compte de service "Admin" par défaut, non associé à la clé JSON fournie.

Résolu grâce à [une fouille dans la doc de GCP](https://cloud.google.com/functions/docs/securing/function-identity#per-function_identity) par le flag :

`gcloud functions deploy FUNCTION_NAME --service-account SERVICE_ACCOUNT_EMAIL`

## La meilleure documentation Gitlab CI x GCP

Beaucoup d'exemples de YAML trainent sur Github, mais la documentation qui m'a le plus aidée provient du blog d'Eleven Labs.

* Documentation générale : https://blog.eleven-labs.com/fr/introduction-gitlab-ci/
* Code Lab très précieux : https://codelabs.eleven-labs.com/course/fr/gitlab-ci-js/