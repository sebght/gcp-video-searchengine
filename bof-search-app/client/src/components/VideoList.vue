<template>
  <v-app>
    <v-list three-line>
      <template v-for="(video, index) in videos">
        <v-list-item :key="video.name" @click="storeVideo(video)">
          <v-list-item-avatar>
            <v-img :src="video.speaker[0].photo"></v-img>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title v-html="video.name"></v-list-item-title>
            <v-list-item-subtitle
              v-html="video.speaker[0].name"
            ></v-list-item-subtitle>
          </v-list-item-content>
          <v-spacer></v-spacer>
          <v-img
            :src="video.thumbnailUrl"
            max-width="100"
            max-height="100"
          ></v-img>
        </v-list-item>
        <v-divider :key="index" inset></v-divider>
      </template>
    </v-list>
  </v-app>
</template>

<script>
import bofApi from "@/api/getInfosBof";
import { chunk } from "@/utils/arrays";

export default {
  name: "VideoList",
  created() {
    this.fetchVideos();
  },
  data: () => ({
    videos: []
  }),
  computed: {
    chunkedVideos() {
      return chunk(this.videos, 2);
    }
  },
  methods: {
    async fetchVideos() {
      const videos = await bofApi.getAllVideos();
      this.videos = videos;
      console.log(this.videos);
      return videos;
    },
    storeVideo(video) {
      this.$store.commit("SET_VIDEO", video);
      console.log(this.$store.state.currentVideo);
      this.$router.push(`/video/${video.id}`);
    }
  }
};
</script>
