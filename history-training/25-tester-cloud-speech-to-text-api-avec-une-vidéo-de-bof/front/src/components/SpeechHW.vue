<template>
  <div class="speech">
    <button @click="callSyncRecognize"> Call Synchronous Speech Transcription </button>
    <div class="loading" v-show="loading">Loading ...</div>
    <div class="result" v-show="result">Get result: {{result}}</div>
    <input type="file" id="file" ref="file" v-on:change="handleFileUpload()"/>
  </div>
</template>

<script>
import functionApi from '@/api/speech_recognize_api.js'

export default {
  name: 'SpeechHW',
  data () {
    return {
      result: '',
      loading: false
    }
  },
  methods: {
    async callSyncRecognize () {
      this.loading = true
      this.result = await functionApi.syncRecognizeApi(this.file)
      this.loading = false
    },
    handleFileUpload () {
        this.file = this.$refs.file.files[0]
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
