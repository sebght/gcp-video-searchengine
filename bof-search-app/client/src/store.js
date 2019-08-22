import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

const initialState = {
  // eslint-disable-next-line
    ...env
};

export default new Vuex.Store({
  state: {
    ...initialState,
    currentVideo: {}
  },
  mutations: {
    SET_VIDEO(state, video) {
      state.currentVideo = video;
    }
  },
  actions: {}
});
