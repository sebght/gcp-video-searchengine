# Découvrir Firestore pour le stockage des données structurées basique

## Propriétés rapido presto

Cloud Firestore est la solution de stockage NoSQL by Firebase.

Ses capacités sont globalement décrites sur la [landing page de GCP](https://cloud.google.com/firestore/). 
En résumé :

* NoSQL
* Serverless
* Managed
* Sync
* Simple

## Setup initial

La toute 1ère étape consiste à se rendre dans la Console et d'activer le service.

Pour la 1ère utilisation, il faut :

* choisir entre les modes "Natif" et "Datastore" ([Comprendre les différences](https://cloud.google.com/firestore/docs/firestore-or-datastore))
* choisir "Multiregional" ou "Regional" (même *free tier*)
* choisir la région (il faut être proche de ses utilisateurs)

**Très important :** Ces choix seront inamovibles pour l'intégralité du projet. Ce sont également les valeurs de région définies par défaut pour tout service App Engine qui serait créé au sein du projet par la suite.

## Utilisation

Comme c'est marqué plus haut, l'utilisation de Cloud Firestore est super simple.

### Firebase ou Google Cloud Platform ?

Certaines solutions n'ont pas de documentation, mais ce n'est pas le cas de Firestore qui en a … deux : celle de Firebase et celle de GCP. 

Plus qu'une double doc, le service est également disponible via la console Firebase ou GCP. En revanche, son utilisation sur la console Firebase nécessite la création d'un projet Firebase, même si celui-ci peut ensuite être lié au projet GCP.

Ayant déjà un projet GCP auquel je souhaitais incorporer Firestore, j'ai donc choisi la console GCP.

### Puissance de la console

Encore une fois, GCP nous permet de faire du *click-to-win* très facilement.

Une fois le service activé, on peut tout faire depuis la Console, avec une visualisation très explicite. Si on a besoin d'effectuer le setup une seule fois, cela peut être la bonne solution.

### Avec la librairie cliente

La doc est vraiment top : https://cloud.google.com/firestore/docs/quickstarts



