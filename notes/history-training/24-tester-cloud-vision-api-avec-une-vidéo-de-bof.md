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

Mon commentaire : relativement … cher, surtout si on combine plusieurs fonctionnalités de l'API ! (c'est 1,50 $ pour 1000 unités et pour toute la plage !)

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

### On utilise l'outil CLI `gcloud ml vision`

`vision` est un outil disponible dans le binaire `gcloud ml`, qui contient :

* `language`
* `speech`
* `video`
* `vision`

Pour `vision`, nous pouvons retrouver l'ensemble des *features* de l'API via le CLI, disponibles [ici](https://cloud.google.com/sdk/gcloud/reference/ml/vision/).

Si l'on se concentre sur la détection de texte plus précisément, il y a alors plusieurs options :

* [`detect-text`](https://cloud.google.com/sdk/gcloud/reference/ml/vision/detect-text) : "*detect and extract text within an image*"
* [`detect-text-pdf`](https://cloud.google.com/sdk/gcloud/reference/ml/vision/detect-text-pdf) : "*detect and transcribe text from PDF files stored in Google Cloud Storage*"
* [`detect-text-tiff`](https://cloud.google.com/sdk/gcloud/reference/ml/vision/detect-text-tiff) : "*detect and transcribe text from TIFF files stored in Google Cloud Storage*"

Pour `detect-text`, rien de plus simple : `gcloud ml vision detect-text IMAGE-PATH --language-hints fr`

**Note :** `IMAGE-PATH` est soit du type `path/to/file/image.png` soit `gs://my-bucket/image.png`

Bien entendu, l'authentification est un pré-requis à l'utilisation de ces commandes.

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

```json
[ { faceAnnotations: [],
    landmarkAnnotations: [],
    logoAnnotations: [],
    labelAnnotations: [],
    textAnnotations:
     [ [Object],
       [Object],
       [Object],
       [Object],
       [Object],
       [Object],
       [Object],
       [Object],
       [Object],
       [Object],
       [Object] ],
    localizedObjectAnnotations: [],
    safeSearchAnnotation: null,
    imagePropertiesAnnotation: null,
    error: null,
    cropHintsAnnotation: null,
    fullTextAnnotation:
     { pages: [Array],
       text: 'Que nous apprennent 10 ans de commits GIT ?\nArchi\n' },
    webDetection: null,
    productSearchResults: null,
    context: null } ]
```

#### Annotation sur un batch d'images

**Attention :** Cela concerne un seul fichier (PDF, TIFF, ou GIF) contenant plusieurs pages/images, et non un dossier de plusieurs fichiers.

##### Synchrone

```javascript
const {promisify} = require('util');
const readFileAsync = promisify(fs.readFile);
const inputConfig = {
    // Supported mime_types are: 'application/pdf' and 'image/tiff'
    mimeType: 'application/pdf',
    gcsSource: {
      uri: gcsSourceUri, // pour un fichier stocké sur GCS
      // content: await readFileAsync(fileName), // pour un fichier stocké en local
    },
  };
  const features = [{type: 'DOCUMENT_TEXT_DETECTION'}];
  const request = {
    requests: [
      {
        inputConfig: inputConfig,
        features: features,
        // Annotate the first two pages and the last one (max 5 pages)
        // First page starts at 1, and not 0. Last page is -1.
        pages: [1, 2, -1],
      },
    ],
  };

  const [result] = await client.batchAnnotateFiles(request);
  const responses = result.responses[0].responses;

  for (const response of responses) {
    for (const page of response.fullTextAnnotation.pages) {
      for (const block of page.blocks) {
        console.log(`Block confidence: ${block.confidence}`);
        for (const paragraph of block.paragraphs) {
          console.log(` Paragraph confidence: ${paragraph.confidence}`);
          for (const word of paragraph.words) {
            const symbol_texts = word.symbols.map(symbol => symbol.text);
            const word_text = symbol_texts.join('');
            console.log(
              `  Word text: ${word_text} (confidence: ${word.confidence})`
            );
            for (const symbol of word.symbols) {
              console.log(
                `   Symbol: ${symbol.text} (confidence: ${symbol.confidence})`
              );
            }
          }
        }
      }
    }
  }
```

L'affichage de la réponse est ici affichée dès que disponible dans la console.

##### Asynchrone

```javascript
// GCS path where the image resides
const inputImageUri = 'gs://my-bucket/my_image.jpg';
// GCS path where to store the output json
const outputUri = 'gs://mybucket/out/'

const features = [{type: 'DOCUMENT_TEXT_DETECTION'}];

  const outputConfig = {
    gcsDestination: {
      uri: outputUri,
    },
  };

  const request = {
    requests: [
      {
        image: {
          source: {
            imageUri: inputImageUri,
          },
        },
        features: features,
      },
    ],
    outputConfig,
  };

  const [operation] = await client.asyncBatchAnnotateImages(request);
  const [filesResponse] = await operation.promise();

  const destinationUri = filesResponse.outputConfig.gcsDestination.uri;
  console.log(`Json saved to: ${destinationUri}`);
```

Cette fois-ci, l'opération sauvegarde directement le résultat de la transcription dans le bucket de sortie.

#### Tout plein de possibilités

Cela se passe sur [ce repo](https://github.com/googleapis/nodejs-vision/blob/master/samples).