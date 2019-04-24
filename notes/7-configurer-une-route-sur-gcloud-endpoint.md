# Configurer une route sur GCloud Endpoints pour déclencher la lambda Hello World

L' opération de routage souhaitée utilise Google Cloud Endpoints pour déployer l'API REST et gérer son utilisation (requêtes, sécurité, suivi activité…).

## Principe général

Cloud Endpoints permet de *développez, déployez, protégez et surveillez vos API*. En revanche, il ne construit pas "lui-même" de routage par défaut : **la programmation de l'API n'est donc pas gérée**.

3 options sont disponibles pour héberger le code backend de votre API, en fonction de son emplacement et du type de communication utilisé :

* Cloud Endpoints pour OpenAPI
* Cloud Endpoints pour gRPC
* Cloud Endpoints Frameworks pour l'environnement standard App Engine



Comment ça fonctionne ?
*"Endpoints pour OpenAPI et Endpoints pour gRPC utilisent Extensible Service Proxy (ESP) comme passerelle API. D'une manière générale, ESP est déployé en tant que conteneur devant votre application. Une fois que vous avez déployé le code de backend de votre API, ESP intercepte toutes les requêtes et effectue les vérifications nécessaires, telles que l'authentification, avant de transmettre ces requêtes au backend de l'API."*

![alt text](https://cloud.google.com/endpoints/docs/images/esp-architecture.png?hl=fr)Endpoints Frameworks, quant à lui, est un framework pour les environnements Python 2.7 et Java 8 **uniquement**, et remplace ESP avec plus ou moins les mêmes fonctionnalités et une plus grande rapidité de déploiement (Voir [la comparaison des deux services](<https://cloud.google.com/endpoints/docs/frameworks/frameworks-extensible-service-proxy?hl=fr>)).

Nous avons choisi d'utiliser OpenAPI sur cette démo, mais vous pouvez [effectuer un autre choix](https://cloud.google.com/endpoints/docs/choose-endpoints-option?hl=fr#choosing_a_computing_option).

## Google App Engine

Une chose importante à savoir est que **Extensible Service Proxy ne supporte pas Google Cloud Functions**.

Cela signifie qu'il faut coder son application et la déployer avec GAE pour pouvoir l'appeler avec Cloud Endpoints.

GAE étant une solution PaaS, nous devons faire 3 choses seulement :

* développer notre code
* remplir le fichier de config `.yaml` 
* déployer l'application, accessible à l'adresse https://YOUR_PROJECT_ID.appspot.com

Plein de samples de codes en NodeJS déployables tel quels sur GAE [sur ce repo Github](<https://github.com/GoogleCloudPlatform/nodejs-docs-samples/tree/master/appengine>).

## Ajout de la stack Endpoints

Déployer l'appli *Hello World!* "simple" n'est cependant pas ce que nous recherchons ici, et il faut rajouter notre API.

Pour cela, rien de bien compliqué : il faut simplement rajouter le fichier de config `openapi.yaml`, et l'appeler dans `app.yaml`. Pour construire son fichier de config `openapi.yaml`, on peut se réferer à [la documentation suivante](<https://cloud.google.com/endpoints/docs/openapi/openapi-overview?hl=fr>). 

Ensuite, on peut déployer. Dans la racine du projet :

* `gcloud endpoints services deploy openapi.yaml` pour déployer l'API
* `gcloud app create --region="us-central"` pour initialiser l'App Engine (à faire une seule fois)
* `gcloud -q app deploy app.yaml` pour déployer l'application sur l'AE

Cette dernière opération prend beaucoup de temps (plusieurs minutes), mais il faut être patient.

Exemple de [projet très bien fait](<https://github.com/GoogleCloudPlatform/endpoints-quickstart>) (sample by GCP).

## Check

Pour vérifier que notre API fonctionne bien, GCP fournit un *Developer Portal* personnalisable très puissant. Il est accessible à [cette adresse](<https://console.cloud.google.com/endpoints/portal?project=stage-bof-search>). Sur ce portail, on peut même exécuter les requêtes gérées par notre API.

On peut également faire tourner les tests présents [dans cette branche](<https://gitlab.com/octo-cna/stage-bof-search/tree/7-configurer-une-route-sur-gcloud-endpoint/test>).

Enfin, une commande simple `curl -v http://<url_to_api>/hello` renvoie aussi la bonne chose.