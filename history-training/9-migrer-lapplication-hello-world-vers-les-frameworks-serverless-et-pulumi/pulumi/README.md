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