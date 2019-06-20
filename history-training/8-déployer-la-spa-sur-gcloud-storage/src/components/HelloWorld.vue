<template>
  <div class="hello">
    <button @click="callCloudFunction"> Call the GCF </button>
    <div class="loading" v-show="loading">Loading ...</div>
    <div class="result" v-show="result">Get result: {{result}}</div>
  </div>
</template>

<script>
import functionApi from '@/api/cloudfunction'

export default {
  name: 'HelloWorld',
  data () {
    return {
      result: '',
      loading: false
    }
  },
  methods: {
    async callCloudFunction () {
      this.loading = true
      this.result = await functionApi.getResult()
      this.loading = false
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
