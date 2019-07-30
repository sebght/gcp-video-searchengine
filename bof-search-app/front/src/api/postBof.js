import axios from "axios";
const SIGN_URL = env.SIGN_URL;
const FIRESTORE_URL = env.FIRESTORE_URL;
const bucket = env.VIDEO_BUCKET;

export default {
  async getSignedURL(title_bof, file) {
    let res = await axios
      .post(SIGN_URL, {
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
  },
  async updateDB(title_bof, descr_bof, files) {
    let respo = await axios({
      method: "post",
      url: FIRESTORE_URL,
      data: {
        title: title_bof,
        descr: descr_bof,
        files: files.map(file => ({
          filetype: file.type,
          filename: file.name
        }))
      },
      headers: {
        "Content-Type": "application/json"
      }
    });
    return respo.data;
  }
};
