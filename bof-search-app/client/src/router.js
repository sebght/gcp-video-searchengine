import Vue from "vue";
import Router from "vue-router";
import Home from "./views/Home.vue";
import CreateBof from "./views/CreateBof.vue";
import Upload from "./views/Upload.vue";
import Video from "./views/Video.vue";

Vue.use(Router);

export default new Router({
  mode: "history",
  routes: [
    {
      path: "/",
      name: "home",
      component: Home
    },
    {
      path: "/video/:video",
      component: Video,
      name: "video"
    },
    {
      path: "/create",
      name: "create",
      component: CreateBof
    },
    {
      path: "/upload",
      name: "upload",
      component: Upload
    },
    { path: "*", redirect: { name: "home" } }
  ]
});
