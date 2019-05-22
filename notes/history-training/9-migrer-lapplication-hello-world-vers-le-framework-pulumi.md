#Migrer l'application Hello World vers le framework Pulumi 

## Setup de Pulumi avec GCP

Il n'y a pas de grande modification de code, et j'ai utilisé celui fourni par [l'exemple de Pulumi](<https://github.com/pulumi/examples/tree/master/gcp-ts-functions>) codé en TypeScript. Pulumi peut être implémenté en JavaScript ou en TypeScript, mais le principe reste le même : c'est celui du *Infrastructure as a Code* mis en avant par [Terraform](<https://www.terraform.io/>).

Pour le setup sur la machine, il faut commencer par mettre en place pulumi :

`brew install pulumi` suffit pour disposer de Pulumi en global.

Il faut ensuite lier s'authentifier dans le CLI sur GCP, et activer l'accès aux ressources GCP pour des applications comme Pulumi.

```bash
$ gcloud auth login
$ gcloud config set project <YOUR_GCP_PROJECT_HERE>
$ gcloud auth application-default login # cette étape est la plus importante
```

Il faut également s'authentifier sur Pulumi avec `pulumi login`

### Principe de Stack

Sur Pulumi, les déploiements sont regroupés par **stack** dans un backend géré par Pulumi à l'adresse <https://app.pulumi.com/>. Afin de créer une stack, il faut :

1. Se créer un compte sur ce site
2. Créer un projet/une organisation qui va contenir notre/nos stack/s
3. Deux solutions pour créer une stack :
   * Le faire depuis la console du site, puis exécuter `pulumi stack select [<stack>]`
   * Le faire depuis le CLI avec `pulumi stack init [<org-name>/]<stack-name>`

### Déploiement

Il reste encore un tout petit peu de config à gérer.

```bash
pulumi config set gcp:project <projectname>
pulumi config set gcp:region <region>
```

Pour déployer une stack ou la redéployer, une seule commande toute simple : `pulumi up`

All credits to [this repo officiel by Pulumi](<https://github.com/pulumi/examples/tree/master/gcp-ts-functions>)

## Comme ça fonctionne l'*Infrastructure as a Code* ?

Le fichier de config associé à Pulumi est relativement sobre en comparaison à d'autres frameworks comme Serverless. Celui-ci (`Pulumi.yaml`) contient surtout le langage utilisé au runtime.

Tout le reste est contenu directement dans le code directement : cela permet de coder en prenant l'infrastructure en compte comme une vraie responsabilité du développeur.

Par exemple ici :

```typescript
import * as gcp from "@pulumi/gcp";

let greeting = new gcp.cloudfunctions.HttpCallbackFunction("helloPulumi", (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.send("Hello World!");
});

export let url = greeting.httpsTriggerUrl;
```

On voit bien ici la combinaison de la fonction utilisant `Express` et l'allocation de la ressource Cloud Function associée.

Comment est-ce que Pulumi a la possibilité de faire cette intégration de GCP dans le code ?
Tout cela est possible grâce à [l'API de GCP](<https://cloud.google.com/nodejs/>). Par exemple, voici [une démonstration de ce que l'on peut faire sur du Cloud Speech](<https://github.com/googleapis/nodejs-speech>).

## L'avantage de Pulumi : le déploiement

Avec un `pulumi up`, Pulumi exécute d'abord un *preview* des changements, notamment au niveau des ressources à allouer. C'est de mon point de vue une feature extrêmement puissante. Voilà à quoi ça ressemble :

```bash
Previewing update (dev):

     Type                                    Name               Plan       Info
     pulumi:pulumi:Stack                     gcp-functions-dev             1 message
 +   ├─ gcp:cloudfunctions:CallbackFunction  hellopulumi        create     
 +   │  ├─ gcp:storage:BucketObject          hellopulumi        create     
 +   │  └─ gcp:cloudfunctions:Function       hellopulumi        create     
 -   └─ gcp:cloudfunctions:CallbackFunction  helloPulumi        delete     
 -      ├─ gcp:cloudfunctions:Function       helloPulumi        delete     
 -      └─ gcp:storage:BucketObject          helloPulumi        delete     
 
Diagnostics:
  pulumi:pulumi:Stack (gcp-functions-dev):
    (node:43568) ExperimentalWarning: queueMicrotask() is experimental.
 
Resources:
    + 3 to create
    - 3 to delete
    2 changes. 2 unchanged

Do you want to perform this update?
  yes
> no
  details

```

Pour un changement du nom de la fonction, il va donc supprimer les ressources de la fonction précédente avant de créer la nouvelle. Si on souhaite continuer, Pulumi va ensuite nous détailler en temps réel sa progression sur chacune de ces ressources.

## Le désavantage de Pulumi : AWS first, other Cloud Providers later

### Peu d'exemples

Si l'on aime se référer à des exemples pratiques pour chaque fonction que l'on souhaite implémenter, on ne sera pas pleinement satisfait (de mon point de vue) des [quelques exemples sur le Github officiel](https://github.com/pulumi/examples) et ceux trouvables [dans la doc officielle](https://pulumi.io/reference/pkg/nodejs/@pulumi/gcp/index.html).

### Toutes les fonctionnalités dispos ne sont pas implémentées

GCP permet de créer des ressources en utilisant :

* la Console
* le Cloud SDK (CLI)
* l'API JSON ou l'API XML
* l'API de chaque service pour chaque langage supporté

Cette dernière permet de faire de l'Infra as a Code comme Pulumi. La doc pour Cloud Storage par exemple se trouve [ici](https://cloud.google.com/storage/docs/reference/libraries). Celle plus détaillée pour tous les services est [ici](https://cloud.google.com/nodejs/docs/reference/storage/2.5.x/).

Le problème est que le module [@pulumi/gcp](https://github.com/pulumi/pulumi-gcp) ne présente pas toutes ses solutions.

Exemple : GET la liste des items d'un bucket : https://cloud.google.com/nodejs/docs/reference/storage/2.5.x/Bucket#getFiles ==> pas dispo dans les méthodes de @pulumi/gcp : https://pulumi.io/reference/pkg/nodejs/@pulumi/gcp/storage/

### Dilemme

Suivant les besoins métiers auxquels doit répondre notre code, on peut se retrouver obligé d'utiliser des ressources des librairies clientes de GCP non disponibles avec Pulumi. Dans ce cas, le déploiement ne prendra pas en compte ces ressources là, ce qui pourra porter à confusion.

Combiner ces deux solutions est donc possible, mais à utiliser principalement pour des méthodes qui ne créent pas de ressources, afin de continuer à gérer leur bon déploiement grâce au superbe outil Pulumi.

## Tester une infra avec Pulumi

Parce qu'avant de déployer des ressources sur un cloud provider, c'est quand même mieux de vérifier le comportement de son code, même si le *preview* de Pulumi nous évitera souvent des mauvaises surprises.

Pour réaliser ces tests, c'est pareil que si on testait un code Js/Ts classique, et on peut utiliser les frameworks habituels : `mocha`, `jest`, etc.

Une fois les tests rédigés, on peut les lancer avec la commande

```bash
PULUMI_TEST_MODE=true \
    PULUMI_NODEJS_STACK="gcp-front" \
    PULUMI_NODEJS_PROJECT="gcp-front" \
    PULUMI_CONFIG='{ "gcp:region": "us-central1", "gcp:project": "stage-bof-search" }' \
    mocha tests.js
```

Une doc est disponible [sur le blog de Pulumi](https://blog.pulumi.com/testing-your-infrastructure-as-code-with-pulumi).