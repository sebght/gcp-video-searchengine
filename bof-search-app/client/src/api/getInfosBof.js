import store from "@/store";
import axios from "axios";

export default {
  async getAllVideos() {
    const url = `${store.state.GET_BOF_URL}`;
    const res = await axios.get(url);
    return res.data;
  }
};
