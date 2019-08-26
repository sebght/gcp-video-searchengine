<template>
  <v-app>
    <v-app-bar app class="justify-space-around">
      <v-btn
        to="/"
        exact
        fab
        class="mr-4"
        exact-active-class=""
        active-class=""
      >
        <v-avatar>
          <img :src="require('./assets/logo.svg')" alt="Logo" />
        </v-avatar>
      </v-btn>
      <v-btn to="/create" text link class="mr-2" active-class=""
        >Créer une BoF</v-btn
      >
      <v-btn to="/upload" text active-class="">Upload files</v-btn>
      <v-spacer />
      <v-btn
        href="https://github.com/sebght/gcp-video-searchengine/tree/master/bof-search-app"
        target="_blank"
        text
        icon
        x-large
        color="black"
        active-class=""
      >
        <v-icon>mdi-github-circle</v-icon>
      </v-btn>
    </v-app-bar>

    <v-content>
      <router-view />
    </v-content>
  </v-app>
</template>

<script>
export default {
  name: "App",
  components: {},
  data: () => ({
    //
  })
};
</script>
