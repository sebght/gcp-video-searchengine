<template>
  <v-app>
    <v-container>
      <v-row justify="center">
        <v-col cols="10">
          <v-card>
            <v-card-title
              class="title font-weight-regular justify-space-between"
            >
              <span>{{ currentTitle }}</span>
              <v-avatar
                color="primary lighten-2"
                class="subheading white--text"
                size="24"
                v-text="step"
              ></v-avatar>
            </v-card-title>

            <v-window v-model="step">
              <v-window-item :value="1">
                <v-form ref="form1" v-model="valid1">
                  <v-card-text>
                    <v-text-field
                      v-model="quadri"
                      label="Quadrigramme"
                      :rules="quadriRules"
                      hint="Celui du speaker"
                      required
                    ></v-text-field>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                      color="primary"
                      depressed
                      @click="step++"
                      :disabled="!valid1"
                    >
                      Next
                    </v-btn>
                  </v-card-actions>
                </v-form>
              </v-window-item>

              <v-window-item :value="2">
                <v-form ref="form2" v-model="valid2">
                  <v-card-text>
                    <v-text-field
                      v-model="title"
                      label="Titre de la BoF"
                      :rules="titleRules"
                      hint="Attention : pas plus de 20 caractères"
                      required
                    ></v-text-field>
                    <v-textarea
                      v-model="descr"
                      label="Description"
                    ></v-textarea>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn text @click="step--">
                      Back
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn
                      color="primary"
                      depressed
                      :loading="loading2"
                      @click="createBof"
                      :disabled="!valid2 || loading2"
                    >
                      Next
                    </v-btn>
                  </v-card-actions>
                </v-form>
              </v-window-item>

              <v-window-item :value="3">
                <v-form ref="form3" v-model="valid3">
                  <v-card-text>
                    <v-file-input
                      :rules="[v => v.length === 1 || 'Obligatoire']"
                      class="ma-3"
                      v-model="video"
                      label="Video"
                      accept="video/*"
                      placeholder="Importer la vidéo source"
                      prepend-icon="mdi-video-vintage"
                      outlined
                      hint="Obligatoire"
                      persistent-hint
                      multiple
                    ></v-file-input>
                    <v-file-input
                      class="ma-3"
                      v-model="audios"
                      label="Audio"
                      accept=".mp3,.wav"
                      placeholder="Importer l'audio"
                      prepend-icon="mdi-voice"
                      outlined
                      hint="Facultatif"
                      persistent-hint
                      multiple
                    ></v-file-input>
                    <v-file-input
                      class="ma-3"
                      v-model="slides"
                      label="Slides"
                      accept=".pdf"
                      placeholder="Importer les slides"
                      prepend-icon="mdi-file-pdf"
                      outlined
                      hint="Facultatif"
                      persistent-hint
                    ></v-file-input>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn text @click="step--">
                      Back
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn
                      color="primary"
                      depressed
                      :loading="loading3"
                      @click="uploadFiles"
                      :disabled="!valid3"
                    >
                      Next
                    </v-btn>
                  </v-card-actions>
                </v-form>
              </v-window-item>

              <v-window-item :value="4">
                <div class="pa-4 text-center">
                  <v-img
                    class="mb-4"
                    contain
                    height="128"
                    :src="require('../assets/Avatar_Magicien.png')"
                  ></v-img>
                  <h3 class="title font-weight-light mb-2">
                    La BoF a été créée
                  </h3>
                  <span class="caption grey--text"
                    >Notre magicien s'occupe de tout maintenant</span
                  >
                </div>
                <v-card-actions>
                  <v-btn :disabled="step === 1" text @click="step--">
                    Back
                  </v-btn>
                  <v-spacer></v-spacer>
                  <v-btn
                    :disabled="step === 4"
                    color="primary"
                    depressed
                    @click="step++"
                  >
                    Next
                  </v-btn>
                </v-card-actions>
              </v-window-item>
            </v-window>

            <v-divider></v-divider>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script>
import postBOF from "@/api/postBof";

export default {
  data: () => ({
    loader: null,
    loading2: false,
    loading3: false,
    step: 1,
    valid1: true,
    valid2: true,
    valid3: false,
    title: "",
    titleRules: [
      v => !!v || "Il faut un titre à la BoF",
      v => (v && v.length <= 20) || "Oups, trop de caractères"
    ],
    quadri: "",
    quadriRules: [
      v => !!v || "Donne ton quadri stp",
      v => (v && v.length <= 4 && v.length >= 3) || "Un quadri a 3 ou 4 lettres"
    ],
    descr: "",
    files: [],
    video: [],
    audios: [],
    slides: []
  }),
  computed: {
    currentTitle() {
      switch (this.step) {
        case 1:
          return "Qui es-tu ?";
        case 2:
          return "Crée la BoF";
        case 3:
          return "Ajoute les fichiers";
        default:
          return "C'est incroyable, tu l'as fait !";
      }
    }
  },
  methods: {
    async createBof() {
      if (this.$refs.form2.validate()) {
        this.loader = "loading2";
        const l = this.loader;
        this[l] = !this[l];
        this.firestoreDocID = await postBOF.updateDB(
          this.title,
          this.descr,
          this.quadri
        );
        this.loader = null;
        this.loading2 = false;
        if (typeof this.firestoreDocID === "undefined") {
          console.log(`Petit souci sur la création de la BoF sur Firestore`);
        } else {
          this.step++;
        }
        console.log(this.valid3);
        console.log(this.firestoreDocID);
      }
    },
    async uploadFiles() {
      if (this.$refs.form3.validate()) {
        this.loader = "loading3";
        const l = this.loader;
        this[l] = !this[l];
        this.files = this.video.concat(this.audios, this.slides);
        for (let n = 0; n < this.files.length; n++) {
          this.signedUrl = await postBOF.getSignedURL(
            this.firestoreDocID,
            this.files[n]
          );
          this.uploadfile = await postBOF.uploadFile(
            this.files[n],
            this.signedUrl
          );
        }
        this.loader = null;
        this.loading3 = false;
        this.step++;
      }
    },
    reset() {
      this.$refs.form.reset();
    }
  }
};
</script>
