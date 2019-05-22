# Migrer l'application Hello World vers le framework Serverless

## Migrons le backend

Notre backend actuel ([branche "3"]([https://gitlab.com/octo-cna/stage-bof-search/tree/master/history-training/3-ex%C3%A9cuter-une-gcloud-function-hello-world](https://gitlab.com/octo-cna/stage-bof-search/tree/master/history-training/3-exécuter-une-gcloud-function-hello-world))) utilise uniquement un endpoint Google Cloud Functions. 
Et ça tombe bien, Serverless gère très bien cela.

Pour effectuer le déploiement :

1. `npm install serverless -g`

2. Activer les APIs de GCF, Deployment Manager, GCS et StackDriver Logging : à faire [depuis la console API](<https://console.cloud.google.com/apis/dashboard>)

3. Créer un *service account* possédant les bons droits (Deployment Manager Editor, Storage Admin, Logging Admin, Cloud Functions Developer), et exporter la clé dans un fichier `~/.gcloud/keyfile-serverless.json`
   Pour cela, on peut tout faire [depuis la console IAM et Admin](<https://console.cloud.google.com/iam-admin/serviceaccounts>), de façon bien plus simple qu'avec le SDK.

4. Ajouter le fichier de config `serverless.yml` tel que présenté ci-après

   ```yaml
   service: my-service-backend
   
   provider:
     name: google
     stage: dev
     runtime: nodejs8
     region: us-central1
     project: <your-project-id>
     credentials: ~/.gcloud/keyfile-serverless.json
   
   plugins:
     - serverless-google-cloudfunctions
   
   package:
     exclude:
       - node_modules/**
       - .gitignore
       - .git/**
   
   functions:
     first:
       handler: http
       events:
         - http: path
   ```

   

5. `serverless deploy` : l'endpoint est ensuite affiché dans le terminal

6. `serverless invoke --function first` : la fonction est appelée dans le terminal

## … et pas le front ?

Serverless présente [beaucoup de plugins](<https://serverless.com/plugins/>) qui permettent de gérer facilement et rapidement tout un tas de choses … sur Amazon Web Services.

Attention, **cela ne signifie pas que l'on ne peut pas avoir un frontend entièrement déployable avec Serverless**. En effet, on pourrait utiliser les packages npm pour intégrer cela directement dans notre code *NodeJS*. On pourrait pour cela s'appuyer sur [cette très bonne doc](<https://www.npmjs.com/package/google-cloud>).

Mais cela n'a absolument rien à voir avec serverless, dans le sens où on peut très bien le faire sans utiliser serverless.
Surtout, cela serait alors beaucoup plus long que les deux lignes de code décrites en branche "8" :

```bash
gsutil mb -c regional gs://bucket-name 	# création du bucket
gsutil rsync -R dist gs://bucket-name 	# upload du dossier dist depuis le dir du SDK
```

## Mon avis sur tout ça

Mon avis personnel est que **se restreindre à utiliser Serverless pour déployer une application combinant de nombreux services de GCP est une mauvaise idée**. Un seul plugin concerne uniquement GCP, qui reste donc pas très bien intégré dans Serverless.

Maintenant, si on souhaite uniquement déployer des Cloud Functions, pourquoi pas, même si GCP propose de le faire en une ligne dans le Cloud SDK également, avec un joli émulateur et tout.

Une alternative que je proposerais serait l'utilisation de [Cloud Deployment Manager](<https://cloud.google.com/deployment-manager/>), solution proposée par GCP lui-même. Elle est bien sûr mieux intégrée (logique) et permet également d'automatiser l'allocation des ressources GCP nécessaires ainsi que le déploiement de son application. Tout ça grâce à un fichier de config `.yaml`, sans aucune surprise.

A moins que [Pulumi](<https://pulumi.io/quickstart/gcp/>) ne réponde à tous nos besoins ?