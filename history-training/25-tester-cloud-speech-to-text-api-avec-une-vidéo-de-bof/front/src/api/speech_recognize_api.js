const axios = require('axios')

export default {
  async syncRecognizeApi (file) {
    const textResult = 'A problem happened'
    const data = {
      audio: {
        content: file.toString('base64')
      },
      config: {
        languageCode: 'fr-FR'
      }
    }
    const response = await axios
      .post(
        `https://speech.googleapis.com/v1/speech:recognize?key=${
          process.env.VUE_APP_ApiKey
        }`,
        data
      )
    return response.data.results[0].alternatives[0].transcript
  }
}
