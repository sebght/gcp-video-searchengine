<template>
  <div id="app">
    <vue-dropzone ref="dropzone" id="drop1" :options="dropOptions" @vdropzone-complete="afterComplete"></vue-dropzone>
    <button @click="removeAllFiles">Remove All Files</button>
    <button @click="callUploadGCS"> Upload File </button>
  </div>
</template>

<script>
import vueDropzone from 'vue2-dropzone'
import functionApi from '@/api/upload_gcs'

export default {
  data: () => ({
    dropOptions: {
      url: 'https://httpbin.org/post'
    }
  }),
  components: {
    vueDropzone
  },
  methods: {
    removeAllFiles () {
      this.$refs.dropzone.removeAllFiles()
    },
    afterComplete (file) {
      console.log(file)
    },
    async callUploadGCS (file) {
      this.result = await functionApi.uploadFile(file)
    }
  }
}
</script>
