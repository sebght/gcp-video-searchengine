import axios from 'axios'

/* eslint-disable */
export default {
  async getResult () {
    // url associée à l'émulateur NodeJS
    //const url = `http://localhost:8010/stage-bof-search/us-central1/helloGet`
    // url associée à la prod fournie par gcp
    const url = `https://us-central1-stage-bof-search.cloudfunctions.net/helloGet`
    try {
        const response = await axios.get(url);
        console.log(response);
      } catch (error) {
        console.error(error);
      }
    const {data} = await axios.get(url)
    return data
  }
}
