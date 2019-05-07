# Initialiser un projet VueJS qui appelle l'API Hello World (GCF)

## Principe de la solution

![](https://i.imgur.com/zsMCdi2.png)



### Créer le projet VueJS

Etant un noob de VueJS, j'ai initialisé mon projet grâce à la création par défaut du client `vue-cli`.

`npm install @vue/cli -g` pour installer le client

`vue create vue-app` pour créer un projet VueJS par défaut.

Ces informations apparaissent ensuite :

```bash
Vue CLI v3.6.3
? Please pick a preset: (Use arrow keys)
❯ default (babel, eslint) 
  Manually select features 
```

En cliquant sur les features personnalisés, on peut ainsi ajouter les templates et la structure de code associés à *TypeScript*, *Router*, *Vuex*, *Unit Testing* ou encore *E2E Testing*.

Puis on exécute `npm install` et `npm run serve` dans le dossier du projet, pour voir le résultat sur [http://localhost:8080](http://localhost:8080).

### Déployer l'API (simple endpoint Cloud Function)

#### Sur GCP directement

Cette fois-ci, pas forcément de "Attention au billing !!!" puisque GCF offre pour l'instant **2 millions d'appels gratuits par mois** selon [leur site à connaître pour faire du GCP gratuit](<https://cloud.google.com/free/?hl=fr>).

Pour la méthode, c'est comme [dans la branche 3]([https://gitlab.com/octo-cna/stage-bof-search/tree/master/history-training/3-ex%C3%A9cuter-une-gcloud-function-hello-world](https://gitlab.com/octo-cna/stage-bof-search/tree/master/history-training/3-exécuter-une-gcloud-function-hello-world)) :

`gcloud functions deploy helloGet --trigger-http --project stage-bof-search --runtime nodejs10`

#### Sur l'émulateur

Idem, se référer [ici](<https://gitlab.com/octo-cna/stage-bof-search/tree/master/history-training>) pour plus de détails : `functions-emulator start` et `functions-emulator deploy helloGet --triger-http`

### Consommer l'API

Guidé par la [méthode utilisée par Thomas l'an dernier](<https://gitlab.com/rdyap/stage-serverless/tree/master/discovery-hw/vue-hw-app>), j'ai utilisé [Axios](<https://github.com/axios/axios>) pour récupérer la réponse de la requête GET souhaitée sur l'un ou lautre endpoint. Le code de [ma fonction cloud function.js](<https://gitlab.com/octo-cna/stage-bof-search/blob/master/history-training/4-initialiser-un-projet-vuejs-qui-appelle-lapi-hello-world/src/api/cloudfunction.js>) est donc :

```javascript
import axios from 'axios'

/* eslint-disable */
export default {
  async getResult () {
    try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}`);
        console.log(response);
      	console.log(`Endpoint utilisé : ${process.env.VUE_APP_API_URL}`)
      } catch (error) {
        console.error(error);
      }
    const {data} = await axios.get(`${process.env.VUE_APP_API_URL}`)
    return data
  }
}
```

Ici, on voit que le choix de l'url est fait en amont. En effet, il faut l'avoir précédemment établi dans un fichier statique non présent dans le code source git`.env.local`. Il faut rajouter à la racine :

```
##.env.local
VUE_APP_TITLE=My App (Dev)
VUE_APP_API_URL = http://localhost:8010/stage-bof-search/us-central1/helloGet
```

```bash
##.env.production.local
VUE_APP_TITLE=My App (Prod)
VUE_APP_API_URL = https://us-central1-stage-bof-search.cloudfunctions.net/helloGet
```

Bien entendu, on peut mettre tout autre endpoint souhaité à la place.

**Remarque importante :** Pour effectuer ce *Cross-origin resource sharing (CORS)* il faut l'autoriser dans les spécificités de l'API, sinon un message "No Access-Control-Allow-Origin" apparaît dans la console (erreur loggée). Pour cela, il faut ajouter des headers à la réponse à la requête :

```javascript
exports.helloGet = (req,res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.send("Hello World!");
};
```

### Tester

Pour voir ce qu'il se passe en vrai : `npm run serve` puisque le front est toujours en local.

Pour exécuter des vrais tests : 

`npm run test:unit` pour les tests unitaires

`npm run test:e2e` pour les tests end-to-end



## Bonus pour les courageux : Exploration de Docker et Compute Engine pour le host

Dans un premier temps, j'ai cherché la façon la plus directe à implémenter pour hoster mon projet VueJS sur GCP. Cela s'est construit à l'aide de [Docker](<https://www.docker.com/>) et de [Google Compute Engine](<https://cloud.google.com/compute/>).

J'ai crée d'abord simplement mon front avec `vue create vue-app` (testable ensuite avec `npm run serve`). Puis dans le même projet, je configure mon fichier `Dockerfile` :

```dockerfile
# install simple http server for serving static content
RUN npm install -g http-server
WORKDIR .
# copy both 'package.json' and 'package-lock.json' (if available)
COPY package*.json ./
# install project dependencies
RUN npm install
# copy project files and folders to the current working directory (i.e. 'app' folder)
COPY . .
# build app for production with minification
RUN npm run build
EXPOSE 8080
CMD [ "http-server", "dist" ]
EOF
# now let's use docker to build a docker image
docker build -t vue-google-cloud/vue-app .
# let's run it to verify it all works.  
docker run -d -p 8080:8080 --rm vue-google-cloud/vue-app
# check to see that it's working
open localhost:8080
# get the running docker containers
docker ps
# stop the container.  the id will look similar to 386ab1e23ecd
docker stop [YOUR_CONTAINER_ID from docker ps here]
```

Le reste du travail à réaliser se passe ensuite sur GCP. Pour commencer, il faut enregistrer le container dans *Google Container Registry* afin quil soit accessible ensuite à GCE.

Pour cela :

```bash
# set the current project id
PROJECT_ID=$(gcloud config get-value core/project)
echo $PROJECT_ID # just so you know which project you're pushing to
# configure gcloud docker auth, if this hasn't been configured
gcloud auth configure-docker
# create a tag
docker tag vue-google-cloud/vue-app gcr.io/$PROJECT_ID/vue-app:v1
# enable the containerregistry.googleapis.com service
gcloud services enable containerregistry.googleapis.com
# push our docker image to gcr.io
docker push gcr.io/$PROJECT_ID/vue-app:v1
```

Maintenant, GCE étant une IaaS, il faut quand même configurer la VM (firewall rule, IAM policy, port 8080 ouvert) :

```bash
# set the current project id
PROJECT_ID=$(gcloud config get-value core/project)
# create a new service account to be run with the VM
SA_NAME="vue-app-sa"
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"
gcloud iam service-accounts create $SA_NAME \
 --display-name $SA_NAME \
 --project $PROJECT_ID
# we will need a FW rule to expose tcp:8080
gcloud compute firewall-rules create vue-fw --allow tcp:8080,icmp
# grant the default compute service account view permission to the project to pull the gcr.io image
gcloud projects add-iam-policy-binding $PROJECT_ID \
 --member=serviceAccount:$SA_EMAIL \
 --role='roles/viewer'
# create the VM with create-with-container
gcloud compute instances create-with-container vue-app-vm \
 --container-image=gcr.io/$PROJECT_ID/vue-app:v1 \
 --service-account=$SA_EMAIL \
 --scopes=https://www.googleapis.com/auth/cloud-platform \
 --zone us-west1-a
# to see the VMs in our project
gcloud compute instances list
# get the external ip
EXTERNAL_IP=$(gcloud compute instances list --format="get(networkInterfaces[0].accessConfigs[0].natIP)" --filter="name='vue-app-vm'")
# in your browser, navigate to the echoed address.  NOTE: the deployment may take about a minute.
echo http://$EXTERNAL_IP:8080
```

**Attention à ne pas oublier le cleanup de l'app pour éviter les surprises de billing**

```bash
gcloud compute firewall-rules delete vue-fw
gcloud compute instances delete vue-app-vm --zone=us-west1-a
gcloud iam service-accounts delete $SA_EMAIL
```

Et voilà cest tout bon !

All credits to [this magnifique article](<https://medium.com/google-cloud/a-clearer-vue-in-google-cloud-2370a4b048cd>) by un Googler.