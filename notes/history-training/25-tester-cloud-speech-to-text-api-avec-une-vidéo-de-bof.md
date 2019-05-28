# Tester Cloud Speech to Text API avec une vidéo de BoF

## Principes de bases

Je vais essayer de décrire ici en quelques phrases le principe de ce service pour tout débutant en ML.

Passe à la suite si ça t'intéresse pas.

### Le grand et célèbre "apprentissage machine"

Le ***Machine Learning***, c'est un programme qui va prendre un input et ressortir un output après quelques opérations mathématiques. Sa différence ? Le programme en lui-même va évoluer automatiquement au fur et à mesure de son **apprentissage**, pour se rapprocher petit à petit des outputs les plus vrais.

Sans rentrer plus dans les détails, il faut quand même savoir que ce "programme" est appelé **le modèle**.

De nos jours, l'outil le plus efficace est le ***Deep Learning***, car il permet d'atteindre une très bonne précision. Son principe est l'application de **poids** sur des **neurones** organisés par couches. Imaginons par exemple ce réseau de neurones pour reconnaître les digits (exemple classique) :

![alt text](https://mmlind.github.io/images/3lnn.svg)

L'input est ici la valeur de "noirceur" de chaque pixel sur une image carrée du dessin. Après quelques couches définissant le modèle, on aboutit donc sur une dernière couche d'exactement 10 neurones qui donnera l'output : 1 pour le bon digit et 0 pour les autres.

Forcément, au début notre réseau de neurones est super nul puisque ses poids sont initialisés aléatoirement avant leur évolution au fur et à mesure de l'apprentissage. Il est nécessaire de lui **soumettre de nombreux cas**, et lui donner une indication du caractère vrai de son output (soit une note, soit un Oui/Non, soit la vraie réponse pour du *supervised learning*). C'est pour ça que l'apprentissage machine nécessite beaucoup beaucoup beaucoup (beaucoup) de puissance de calcul si on veut disposer d'un réseau super fort.

C'était rapide comme cours de ML mais bien suffisant pour travailler sur des services tout managés comme ceux proposés par GCP !

### Le modèle, on n'y touchera pas ici !

GCP propose donc parmi ses services de ML des modèles pré-entrainés (sur des milliers de machines Google parallélisées) qui nous demanderont uniquement notre entrée.

Pour l'API Speech-to-Text, GCP propose un modèle par langage disponible, ainsi que par type de voix ("normale", provenant d'une vidéo, provenant d'un appel téléphonique). Ce sont les seules spécifications qu'on nous demandera pour le modèle, et l'on se décharge donc de toute réflexion par rapport à son optimisation.

### Plus que jamais : attention au pricing

Ce service peut être gratuit s'il est utilisé pour moins de 60 minutes d'audio par mois, et qu'il utilise le modèle "standard" proposé par Google, et non celui associé aux vidéos ou appels téléphoniques.

Pour résumer, voici la tarification complète :

![alt-text](https://i.imgur.com/uysoWfk.png)

**Note :** Grâce à la [journalisation des données](https://cloud.google.com/speech-to-text/docs/data-logging?hl=fr), les clients peuvent autoriser Google à enregistrer les données audio envoyées à Cloud Speech-to-Text. Ces données permettent à Google d'améliorer ses modèles de machine learning utilisés pour la reconnaissance vocale. Les clients qui activent la journalisation des données bénéficient d'un tarif plus avantageux pour Cloud Speech-to-Text.

## Pratique : Via la CLI Gcloud

### Prétraitement de l'audio

On peut télécharger manuellement les BoFs en format vidéo (HD ou non), ou en format audio mp3.

Pour faire les premiers tests, il a donc fallu découper l'audio en fichier de moins de 60 secondes. En effet, il y a deux types de transcriptions : courtes (synchrones, moins de 60s) et longues (asynchrones).

J'ai utilisé l'outil (créé par l'extraordinaire [Fabrice Bellard](https://fr.wikipedia.org/wiki/Fabrice_Bellard)) [FFMPEG](https://ffmpeg.org/) pour manipuler les fichiers audios grâce à des commandes bash.

`ffmpeg -ss 00:02:00 -t 00:00:30  -i audio_full.mp3 -ac 1 audio_trimed.wav`
commence à 2', dure 30'', prend `audio_full.mp3` en input et renvoie un son mono (`-ac 1`) sous l'output `audio_trimed.wav`

**Note :** [Jolie cheatsheet pour ffmpeg](https://gist.github.com/protrolium/e0dbd4bb0f1a396fcb55)

### Le TL:DR de ce `README.md`

#### Commande Synchrone

`gcloud ml speech recognize ./audio_trimed.wav --language-code='fr-FR'`

Result :

```json
{
  "results": [
    {
      "alternatives": [
        {
          "confidence": 0.8964697,
          "transcript": "et l'id\u00e9e \u00e7a va \u00eatre d'analyser les diff\u00e9rents de les log de tous les comics pour tirer des choses qui soient activable"
        }
      ]
    },
    {
      "alternatives": [
        {
          "confidence": 0.92468876,
          "transcript": " oui voil\u00e0 c'est c'est application la sur lesquels lesquelles on va on va analyser les langues et expliquer un peu d'o\u00f9 l'on part et pourquoi en fait on fait en fait ces choses-l\u00e0 qu'est-ce qu'on peut en tirer"
        }
      ]
    },
    {
      "alternatives": [
        {
          "confidence": 0.9607948,
          "transcript": " alors"
        }
      ]
    }
  ]
}
```

Sont affichés les textes retrouvés par l'API, avec un **score de confiance** pour chaque groupe de mots. On peut noter que le résultat sera renvoyé uniquement ici, et on ne pourra donc pas le retrouver ailleurs.

### Commande asynchrone 

On effectue une commande asynchrone pour un fichier long, car le service ne peut pas renvoyer une réponse immédiate. Plus de détails sur la commande associée [ici](https://cloud.google.com/sdk/gcloud/reference/ml/speech/recognize-long-running?hl=fr).

* `gcloud ml speech recognize-long-running ./audio_trimed.wav --language-code='fr-FR'`

Result :

```json
Waiting for operation [4070935191448800662] to complete...done.                                                                                                                                                                                                                
{
  "@type": "type.googleapis.com/google.cloud.speech.v1.LongRunningRecognizeResponse",
  "results": [
    {
      "alternatives": [
        {
          "confidence": 0.8964697,
          "transcript": "et l'id\u00e9e \u00e7a va \u00eatre d'analyser les diff\u00e9rents de les log de tous les comics pour tirer des choses qui soient activable"
        }
      ]
    },
    {
      "alternatives": [
        {
          "confidence": 0.9246887,
          "transcript": " oui voil\u00e0 c'est c'est application la sur lesquels lesquelles on va on va analyser les langues et expliquer un peu d'o\u00f9 l'on part et pourquoi en fait on fait en fait ces choses-l\u00e0 qu'est-ce qu'on peut en tirer"
        }
      ]
    },
    {
      "alternatives": [
        {
          "confidence": 0.9607948,
          "transcript": " alors"
        }
      ]
    }
  ]
}

```

On a le même résultat, mais avec un peu plus de temps de chargement. Il y a également un id d'opérations fourni, avec lequel on peut effectuer une requête `get` ou `list`.

* `gcloud ml speech recognize-long-running ./audio_trimed.wav --language-code='fr-FR' --async`

Result :

```json
Check operation [2080632492914398702] for status.
{
  "name": "2080632492914398702"
}
```

Avec le tag `—async`, on n'a pas besoin d'attendre la fin de l'opération. On peut ensuite regarder le résultat avec : `gcloud ml speech operations describe 2080632492914398702`

### Erreurs rencontrées et comment les corriger

* `ERROR: (gcloud.ml.speech.recognize) INVALID_ARGUMENT: Invalid recognition 'config': bad encoding..`
  Dû à l'encodage du fichier utilisé comme input, non géré par l'API Speech-to-Text. C'est pour cette raison que j'utilise des fichiers `.wav` plutôt que `.mp4` (attention format `!=` encodage)
  Doc à utiliser si on ne s'en sert pas : [celle-là](https://cloud.google.com/speech-to-text/docs/encoding?hl=fr)
* `ERROR: (gcloud.ml.speech.recognize) INVALID_ARGUMENT: Request payload size exceeds the limit: 10485760 bytes.`
  Dû à la taille trop importante du fichier, généralement pour une requête avec un fichier local.
  Quelques infos sur les quotas [sur la doc](https://cloud.google.com/speech-to-text/quotas?hl=fr)
* `ERROR: (gcloud.ml.speech.recognize) INVALID_ARGUMENT: Must use single channel (mono) audio, but WAV header indicates 2 channels.`
  Traite uniquement des sons en mono source, et non en stéréo. Il a donc fallu fusionner les deux sources en une seule, avec la commande `ffmpeg -i input.wav -ac 1 output.wav`

## Via la librairie cliente NodeJS

