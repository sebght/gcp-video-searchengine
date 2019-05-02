# Déployer la SPA sur GCloud Storage

## Stockage fichiers statiques 

GCP permet d'[héberger un site Web statique](<https://cloud.google.com/storage/docs/hosting-static-website>) (lien vers le tuto) sur son service de stockage Google Cloud Storage. Pour cela, on peut utiliser la console ou le Cloud SDK, à l'aide des commandes `gsutil`.

### Upload des fichiers statiques

#### Console

Après avoir été dans l'interface Cloud Storage, on peut créer un nouveau bucker (régional pour accéder à [l'offre Always Free](<https://cloud.google.com/free/>)). Ensuite, il suffit d'importer les fichiers/dossiers à l'aide du bouton *Importer un dossier* par exemple.

Une fois son arborescence de fichiers reconstituée dans le Bucket, ces documents sont accessibles sous le lien `https://storage.cloud.google.com/<project_id>/<path_to_file>`.

**Attention : Le fichier ne dispose cependant pas d'un accès public pour le moment.**

#### CLI

```bash
gsutil mb -c regional gs://bucket-name 	# création du bucket
gsutil rsync -R dist gs://bucket-name 	# upload du dossier dist depuis le dir du SDK
```

### Autorisations et attributions de pages

#### Console

Afin de rendre les objets accessibles, il faut leur donner une autorisation spécifique. Pour cela, aller dans longlet "Autorisations" du bucket, puis "Ajouter des membres". Les membres à ajouter peuvent être "allUsers" si vous navez pas de confidentialité à gérer, et le droit est a minima "Lecteur des objets de l'espace de stockage".

Pour l'attribution, cette option n'est disponible que si le bucket possède un nom de domaine dont le nom correspond à un modèle de site Web valide (ex : test.bof-search.com). En cliquant sur les options du bucket puis "Modifier la configuration du site Web", on peut lui fournir une page d'accueil et une page 404 par défaut.

#### CLI

```bash
# Autorisations
gsutil acl ch -u AllUsers:R gs://[BUCKET_NAME]/[OBJECT_NAME] 	# à un objet spécifique
gsutil iam ch allUsers:objectViewer gs://[BUCKET_NAME]				# à un bucket

# Attributions de pages
gsutil web set -m index.html -e 404.html gs://[BUCKET_NAME]
```

### Affichage d'un projet VueJS ?

Il faut savoir qu'un projet VueJS nécessite un Serveur HTTP pour le déployer. Cest d'ailleurs pour cette raison qu'ouvrir simplement le fichier `dist/index.html` après un `npm run build` ne renvoit qu'une page blanche.

Plein d'alternatives sont possibles pour déployer ce serveur, et elles sont détaillées sur [ce lien officiel](<https://cli.vuejs.org/guide/deployment.html>).

En revanche, Google Cloud Storage dispose bien d'un HTTP Server intégré, pour notre grand bonheur ! Le lien est en revanche différent, et ressemble plutôt à `<http://bucket-name.storage.googleapis.com/path-to-file>`.



## Redirection vers un domaine personnel

Ayant compris que c'était possible, j'ai voulu redirigé ce dernier lien vers mon domaine. Et j'y suis arrivé ! #spoil

### Etape 1 : Acheter un nom de domaine (gratuit ?)

De nombreux domaines sont disponibles gratuitement, notamment [sur le site Freenom](<https://www.freenom.com/fr/index.html>) (pour un an). Il faut se créer un compte, puis trouver un domaine disponible et peu demandé (du genre en .tk par exemple).
J'ai pour ma part choisi **octo-bof-se.ga** (logique).

### Etape 2 : Valider sa propriété par Google

Afin d'être utilisable par les services de Google, Google doit vérifier que vous êtes bien le propriétaire du domaine, ou tout du moins que vous en avez un droit de redirection.

Pour cela, rendez-vous sur [le site de Google Search Console](<https://search.google.com/search-console/welcome>).

Pour le valider, il faut copier l'enregistrement TXT fourni (du type `google-site-verification=h-i930kyS2GHkzQ_u4z4XG-bjnBZJ55Q-RQ6xSj4efI`) et le coller dans une demande de redirection DNS sur Freenom (ou votre gestionnaire de domaine personnel si différent). Pour ne pas se tromper plein de fois comme moi, il faut le coller dans le champ *Target*, en spécifiant le type comme *TXT* et sans indiquer de valeur pour *Name*.

Quelques minutes voire une demi-heure plus tard, vous pouvez recliquer sur Valider sur la *Search Console*, et c'est tout bon.

### Etape 3 : Faire une redirection du bucket à son domaine/sous-domaine

Comme indiqué dans [ce tuto par Google](<https://cloud.google.com/storage/docs/request-endpoints#cname>), il faut faire une redirection *CNAME*.

Infos :

```
NAME = subdomain (exemple pour moi test.octo-bof-se.ga)
TYPE = CNAME
TARGET = c.storage.googleapis.com
```

Encore une fois, il faut quelques minutes à une demi-heure pour être pris en compte, et vos fichiers statiques sont désormais accessibles directement depuis votre domaine wouhou ! (surtout si vous avez bien régler l'attribution de la page *home*).