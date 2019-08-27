<template>
  <v-app>
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

export default {
  name: "VideoList",
  created() {
    this.fetchVideos();
  },
  data: () => ({
    videos: []
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
