# Tester Cloud Vision API avec une vidéo de BoF

## Qu'est-ce qu'on peut faire avec ?

L'[offre Vision](https://cloud.google.com/vision/?hl=fr) de Google comporte deux solutions : [AutoML Vision](https://cloud.google.com/automl/?hl=fr) pour automatiser l'entraînement de ses propres modèles, et l'API Vision avec des modèles déjà pré-entrainés et sur lesquels on a peu d'influence (delta = journalisation des données).

Avec l'API Vision, on peut :

1. Apposer des étiquettes sur des images
2. Détecter des objets et leurs positions
3. Faire de la recherche de produits similaires à ceux trouvés dans l'image (pour leur achat :money_with_wings:)
4. **[Détecter du texte](https://cloud.google.com/vision/docs/detecting-text/?hl=fr) imprimé ou manuscrit, et l'identifier**
5. [Détecter des visages](https://cloud.google.com/vision/docs/detecting-faces/?hl=fr) et les caractéristiques faciales associées
6. Identifier des [lieux populaires](https://cloud.google.com/vision/docs/detecting-landmarks/?hl=fr) et des [logos](https://cloud.google.com/vision/docs/detecting-logos/?hl=fr) de produits
7. Plein d'autres trucs encore …. :eye:

Pour comprendre à quel point c'est balèze, je vous laisse tester leur outil de démo présent ici : https://cloud.google.com/vision/docs/drag-and-drop?hl=fr

### Tarifs

![salut](https://i.imgur.com/rRr8wQz.png)

Mon commentaire : relativement … cher, surtout si on combine plusieurs fonctionnalités de l'API !

## Comment qu'on fait ?

### On envoie une requête "à la main"

Le contenu de la requête à envoyer est un fichier `.json` via une requête HTTP.

Exemple de `.json`:

```json
{
  "requests":[
    {
      "image":{
        "source":{
          "imageUri":
            "gs://bucket_name/path_to_image_object"
        }
      },
      "features":[
        {
          "type":"LABEL_DETECTION",
          "maxResults":1
        }
      ]
    }
  ]
}
```

Pour savoir comment mieux définir son fichier de requêtes, *can go here* : https://cloud.google.com/vision/docs/request?hl=fr#json_request_format

Pour l'envoyer via une requête `curl` (par exemple), voici un exemple :

```bash
curl -v -s -H "Content-Type: application/json" \
    https://vision.googleapis.com/v1/images:annotate?key=API_KEY \
    --data-binary @request.json
```

Plus de précisions sur [cette page](https://cloud.google.com/vision/docs/using-curl?hl=fr).

On peut également utiliser un Token de connexion issu d'un OAuth, avec les lignes :

```bash
$ gcloud auth activate-service-account
$ gcloud auth print-access-token
$ curl -s -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer ACCESS_TOKEN' \
  'https://vision.googleapis.com/v1/images:annotate' \
  -d @request.json
```

Encore une fois, la [doc de GCP](https://cloud.google.com/vision/docs/auth) est complète.

NB : Si on veut simplement tester ce type de requêtes sans trop pousser, on peut utiliser [l'API Explorer](https://cloud.google.com/vision/docs/quickstart?hl=fr).

### On utilise la librairie cliente NodeJS @google-cloud/vision

[Le repo Github de samples](https://github.com/googleapis/nodejs-vision/tree/master/samples) by Google est comme à chaque fois un très bon endroit où démarrer, puisqu'il vous fournira la base de n'importe quelle utilisation de l'API.

Ici, on restera sur le cas de l'extraction de texte, que ce soit dans un fichier image comme dans un fichier pdf (!).

#### Détection de texte

"reconnaissance optique des caractères afin de détecter et d'extraire le texte dans une image"

```javascript
// Imports the Google Cloud client libraries
const vision = require('@google-cloud/vision');

// Creates a client
const client = new vision.ImageAnnotatorClient();

const bucketName = 'empty-for-test';
const fileName = 'slide1-git.jpg';

async function main(){
    // Performs text detection on the gcs file
    const [result] = await client.textDetection(`gs://${bucketName}/${fileName}`);
    const detections = result.textAnnotations;
    console.log('Text:');
    detections.forEach(text => console.log(text));
}
main().catch(console.error);
```

On obtient en réponse une série de *payloads*.

Le 1er présente le texte entier :

```json
{ locations: [],
  properties: [],
  mid: '',
  locale: 'fr',
  description: 'Que nous apprennent 10 ans de commits GIT?\nArchi\n',
  score: 0,
  confidence: 0,
  topicality: 0,
  boundingPoly:
   { vertices: [ [Object], [Object], [Object], [Object] ],
     normalizedVertices: [] } }
```

Les suivants décrivent chacun des [Object] identifiés dans le `[result]`, avec le même format.

#### Détection de document texte/d'écriture manuscrite

"La fonction de détection de documents texte effectue une reconnaissance optique des caractères. Elle peut également détecter l'écriture manuscrite dans une image."
Sa principale différence semble donc être la reconnaissance d'éléments manuscrits (peu intéressant pour des slides, mais soit).

```javascript
async function detectFulltextGCS() {
    // Read a remote image as a text document
    const [result] = await client.documentTextDetection(`gs://${bucketName}/${fileName}`);
    const fullTextAnnotation = result.fullTextAnnotation;
    console.log(fullTextAnnotation.text);
}
detectFulltextGCS().catch(console.error);
```

J'obtiens

```bash
Que nous apprennent 10 ans de commits GIT ?
Archi
```

**Note :** l'objet `[result]` est le même dans les deux cas, ce qui prouve la *non-différence* entre les deux méthodes, en tout cas lorsqu'il n'y a pas d'écriture manuscrite.