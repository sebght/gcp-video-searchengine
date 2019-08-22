import store from "@/store";
import axios from "axios";
const SIGN_URL = store.state.SIGN_URL;
const FIRESTORE_URL = store.state.FIRESTORE_URL;

export default {
  async getSignedURL(id_bof, file) {
    let res = await axios
      .post(SIGN_URL, {
        filename: `${id_bof}/${file.name}`,
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
  async updateDB(title_bof, descr_bof) {
    let respo = await axios({
      method: "post",
      url: FIRESTORE_URL,
      data: {
        title: title_bof,
        descr: descr_bof
      },
      headers: {
        "Content-Type": "application/json"
      }
    });
    return respo.data;
  }
};
