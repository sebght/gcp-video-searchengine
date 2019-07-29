import axios from "axios";
const BASE_URL =
  "https://us-central1-bof-search.cloudfunctions.net/getSignedURL_bof";

export default {
  async getSignedURL(bucket, file) {
    let res = await axios
      .post(BASE_URL, {
        bucket: bucket,
        filename: file.name,
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
