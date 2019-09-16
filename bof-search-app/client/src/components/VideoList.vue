<template>
  <v-app>
    <ais-instant-search
      index-name="demo_ecommerce"
      :search-client="searchClient"
    >
      <div class="left-panel">
        <ais-clear-refinements />
        <h2>Brands</h2>
        <ais-refinement-list attribute="brand" searchable />
        <ais-configure :hitsPerPage="8" />
      </div>
      <div class="right-panel">
        <ais-search-box />
        <v-list class="ma-4" three-line>
          <template v-for="(video, index) in videos">
            <v-list-item :key="video.name" @click="storeVideo(video)">
              <v-list-item-avatar>
                <v-img
                  v-if="video.speaker[0].photo === ''"
                  :src="require('../assets/Avatar_Mario.png')"
                ></v-img>
                <v-img v-else :src="video.speaker[0].photo"></v-img>
              </v-list-item-avatar>

              <v-list-item-content>
                <v-list-item-title v-html="video.name"></v-list-item-title>
                <v-list-item-subtitle
                  v-html="video.speaker[0].name"
                ></v-list-item-subtitle>
              </v-list-item-content>
              <v-spacer></v-spacer>
              <v-img
                v-if="video.thumbnailUrl === ''"
                :src="require('../assets/Picto_Cinema.png')"
                max-width="100"
                max-height="70"
              ></v-img>
              <v-img
                v-else
                :src="video.thumbnailUrl"
                max-width="100"
                max-height="70"
              ></v-img>
            </v-list-item>
            <v-divider :key="index" inset></v-divider>
          </template>
        </v-list>
        <ais-pagination />
      </div>
    </ais-instant-search>
    <v-container>
      <v-row justify="center">
        <v-col cols="10">
          <v-list three-line>
            <template v-for="(video, index) in videos">
              <v-list-item :key="video.name" @click="storeVideo(video)">
                <v-list-item-avatar>
                  <v-img
                    v-if="video.speaker[0].photo === ''"
                    :src="require('../assets/Avatar_Mario.png')"
                  ></v-img>
                  <v-img v-else :src="video.speaker[0].photo"></v-img>
                </v-list-item-avatar>

                <v-list-item-content>
                  <v-list-item-title v-html="video.name"></v-list-item-title>
                  <v-list-item-subtitle
                    v-html="video.speaker[0].name"
                  ></v-list-item-subtitle>
                </v-list-item-content>
                <v-spacer></v-spacer>
                <v-img
                  v-if="video.thumbnailUrl === ''"
                  :src="require('../assets/Picto_Cinema.png')"
                  max-width="100"
                  max-height="70"
                ></v-img>
                <v-img
                  v-else
                  :src="video.thumbnailUrl"
                  max-width="100"
                  max-height="70"
                ></v-img>
              </v-list-item>
              <v-divider :key="index" inset></v-divider>
            </template>
          </v-list>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script>
import bofApi from "@/api/getInfosBof";
import algoliasearch from "algoliasearch/lite";
import "instantsearch.css/themes/algolia-min.css";

export default {
  name: "VideoList",
  created() {
    this.fetchVideos();
  },
  data: () => ({
    videos: [],
    searchClient: algoliasearch(
      "B1G2GM9NG0",
      "aadef574be1f9252bb48d4ea09b5cfe5"
    )
  }),
  methods: {
    async fetchVideos() {
      const videos = await bofApi.getAllVideos();
      this.videos = videos;
      return videos;
    },
    storeVideo(video) {
      this.$store.commit("SET_VIDEO", video);
      this.$router.push(`/video/${video.id}`);
    }
  }
};
</script>

<style>
body {
  font-family: sans-serif;
  padding: 1em;
}

.ais-Hits-list {
  margin-top: 0;
  margin-bottom: 1em;
}

.ais-InstantSearch {
  display: grid;
  grid-template-columns: 1fr 4fr;
  grid-gap: 1em;
}

.ais-Hits-item img {
  margin-right: 1em;
}
.hit-name {
  margin-bottom: 0.5em;
}
.hit-description {
  color: #888;
  font-size: 0.8em;
  margin-bottom: 0.5em;
}
</style>
