<template>
  <v-app>
    <v-container>
      <v-row>
        <v-col cols="2"></v-col>
        <v-col cols="8">
          <div id="videoTitle">{{ video.name }}</div>
          <bof-video
            v-bind:video="video.videoUrl"
            v-bind:poster="video.thumbnailUrl"
            v-bind:tags="video.tags"
          >
          </bof-video
        ></v-col>
        <v-col cols="2"></v-col> </v-row></v-container
  ></v-app>
</template>

<script>
import BofVideo from "@/components/VideoPlayer";
import { toLocale, toLocaleDate, toLocaleTime } from "@/utils/date";

export default {
  name: "videoVue",
  components: {
    BofVideo
  },
  filters: {
    toLocaleTime,
    toLocale,
    toLocaleDate
  },
  data() {
    return {
      video: this.$store.state.currentVideo
    };
  }
};
</script>
<style>
#videoTitle {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-bottom: 20px;
}
</style>
