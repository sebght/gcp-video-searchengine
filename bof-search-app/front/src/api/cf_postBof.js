import axios from "axios";
// const BASE_URL = process.env.SIGN_URL;
// const bucket = process.env.VIDEO_BUCKET;
const BASE_URL = "https://us-central1-bof-search.cloudfunctions.net/getSignedURL_bof";
const bucket = "audio-source-bof";

export default {
  async getSignedURL(title_bof, file) {
    console.log(BASE_URL);
    let res = await axios
      .post(BASE_URL, {
        bucket: bucket,
        filename: `${title_bof}/${file.name}`,
        contentType: file.type
      })
      .catch(function(error) {
        console.log(error);
      });
    return res.data;
  },
  async uploadFile(file, signedUrl) {
    let resp = await axios({
      method: "put",
      url: signedUrl,
      data: file,
      headers: {
        "Content-Type": file.type
      }
    });
    return resp;
  }
};
