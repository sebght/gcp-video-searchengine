<template>
  <v-app>
    <v-card elevation="3">
      <vue-plyr ref="plyr" :options="playerOptions">
        <video>
          <source :src="video" type="video/mp4" />
        </video>
      </vue-plyr>
      <v-divider class="mx-4"></v-divider>
      <v-card-text>
        <span class="subheading">Tags from Audio</span>
        <v-chip-group
          v-if="audio_tags.length > 0"
          v-model="selection"
          active-class="deep-purple accent-4 white--text"
        >
          <v-chip v-for="(audio_tag, i) in audio_tags" :key="i">
            <v-icon left>mdi-pound</v-icon>
            {{ audio_tag.name }}</v-chip
          >
        </v-chip-group>
        <template v-else
          ><v-card-text>None</v-card-text></template
        >
        <span class="subheading">Tags from Slides</span>
        <v-chip-group
          v-if="slides_tags.length > 0"
          v-model="selection"
          active-class="deep-purple accent-4 white--text"
        >
          <v-chip v-for="(slides_tag, i) in slides_tags" :key="i">
            <v-icon left>mdi-pound</v-icon>
            {{ slides_tag.name }}</v-chip
          >
        </v-chip-group>
        <template v-else
          ><v-card-text>None</v-card-text></template
        >
      </v-card-text>
    </v-card>
  </v-app>
</template>

<script>
export default {
  name: "videoPlayer",
  data() {
    return {
      duration: null,
      selection: null,
      player: null
    };
  },
  props: {
    poster: {
      type: String,
      required: true
    },
    video: {
      type: String,
      required: true
    },
    audio_tags: {
      type: Array,
      required: true
    },
    slides_tags: {
      type: Array,
      required: true
    }
  },
  computed: {
    playerOptions() {
      return {
        playsinline: true,
        volume: 1,
        controls: [
          "play-large", // The large play button in the center
          "restart", // Restart playback
          "rewind", // Rewind by the seek time (default 10 seconds)
          "play", // Play/pause playback
          "fast-forward", // Fast forward by the seek time (default 10 seconds)
          "progress", // The progress bar and scrubber for playback and buffering
          "current-time", // The current time of playback
          "duration", // The full duration of the media
          "mute", // Toggle mute
          "volume", // Volume control
          "captions", // Toggle captions
          "settings", // Settings menu
          "pip", // Picture-in-picture (currently Safari only)
          "download", // Show a download button with a link to either the current source or a custom URL you specify in your options
          "fullscreen" // Toggle fullscreen
        ],
        seekTime: 30
      };
    }
  },
  mounted() {
    this.player = this.$refs.plyr.player;
    this.player.on("timeupdate", () => this.videoTimeUpdated());
    this.player.on("ready", () => this.playerReady());
  },
  methods: {
    videoTimeUpdated() {
      this.duration = this.player.currentTime;
    },
    playerReady() {
      console.log("player ready");
    }
  }
};
</script>
