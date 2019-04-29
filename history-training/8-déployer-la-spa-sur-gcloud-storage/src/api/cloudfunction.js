import axios from 'axios'

/* eslint-disable */
export default {
  async getResult () {
    try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}`);
        console.log(response);
        console.log(`Endpoint utilisé : ${process.env.VUE_APP_API_URL}`)
      } catch (error) {
        console.error(error);
      }
    const {data} = await axios.get(`${process.env.VUE_APP_API_URL}`)
    return data
  }
}
