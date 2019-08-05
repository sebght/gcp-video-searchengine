<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title class="headline text-uppercase">
        <span><router-link to="/">Home</router-link></span>
      </v-toolbar-title>
      <v-spacer />
      <v-btn text><router-link to="/create">Créer une BoF</router-link></v-btn>
      <v-spacer />
      <v-btn text><router-link to="/upload">Upload files</router-link></v-btn>
      <v-spacer />
      <v-btn
        text
        href="https://github.com/vuetifyjs/vuetify/releases/latest"
        target="_blank"
      >
        <span class="mr-2">Latest Release</span>
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
