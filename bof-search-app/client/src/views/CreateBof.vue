<template>
  <v-app>
    <v-card class="ma-5">
      <v-toolbar flat color="blue-grey" dark>
        <v-toolbar-title>Poster une BoF</v-toolbar-title>
      </v-toolbar>

      <v-form ref="form" v-model="valid">
        <v-card-text>
          <v-text-field
            v-model="title"
            :rules="titleRules"
            label="Titre"
            required
          ></v-text-field>

          <v-text-field
            v-model="quadri"
            :counter="4"
            :rules="quadriRules"
            label="Quadrigramme"
            required
          ></v-text-field>

          <v-textarea
            class="mt-4"
            v-model="descr"
            label="Description"
            value=""
          ></v-textarea>

          <v-divider class="my-2"></v-divider>

          <v-item-group multiple v-model="actions">
            <v-subheader>Je veux upload</v-subheader>
            <p>{{ actions }}</p>
            <v-item
              v-for="(item, i) in filetypes"
              :key="i"
              v-slot:default="{ active, toggle }"
            >
              <v-chip
                active-class="purple--text"
                :input-value="active"
                @click="toggle"
                value="salut"
                >{{ item }}</v-chip
              >
            </v-item>
          </v-item-group>
        </v-card-text>

        <v-divider></v-divider>

        <v-file-input
          class="ma-3"
          v-model="files"
          counter
          :rules="[check_filetypes]"
          label="Audio input"
          multiple
          accept=".mp3,.wav"
          placeholder="Importer mes fichiers"
          prepend-icon="mdi-voice"
          outlined
          :display-size="1000"
        >
          <template v-slot:selection="{ index, text }">
            <v-chip v-if="index < 2" dark label small>{{ text }}</v-chip>
            <span
              v-else-if="index === 2"
              class="overline grey--text text--darken-3 mx-2"
              >+{{ files.length - 2 }} File(s)</span
            >
          </template>
        </v-file-input>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" class="mr-4" @click="reset">Reset Form</v-btn>
          <v-btn
            :disabled="!valid"
            color="success"
            class="mr-4"
            @click="validate"
            >Post</v-btn
          >
        </v-card-actions>
      </v-form>
    </v-card>
  </v-app>
</template>

<script>
import postBOF from "@/api/postBof";

export default {
  data: () => ({
    valid: true,
    title: "",
    titleRules: [
      v => !!v || "Il faut un titre à la BoF",
      v => (v && v.length <= 10) || "Name must be less than 10 characters"
    ],
    quadri: "",
    quadriRules: [
      v => !!v || "Donne ton quadri please",
      v => (v && v.length <= 4) || "Un quadri a maximum 4 lettres"
    ],
    descr: "",
    files: [],
    actions: [],
    filetypes: ["Audio", "Slides", "Video"]
  }),

  methods: {
    check_filetypes(value) {
      if (value.length > this.actions.length) {
        return "Trop de fichiers";
      } else if (value.length < this.actions.length) {
        return "Pas assez de fichiers";
      } else {
        return true;
      }
    },
    async validate() {
      if (this.$refs.form.validate()) {
        this.firestoreDocID = await postBOF.updateDB(this.title, this.descr);
        if (typeof this.firestoreDocID === "undefined") {
          console.log(`Petit souci sur la création de la BoF sur Firestore`);
        } else {
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
        }
        // console.log(this.files);
        // console.log(this.signedUrl);
        // console.log(this.uploadfile);
        console.log(this.firestoreDocID);
        console.log(this.files[0].name.split(".").pop());
      }
    },
    reset() {
      this.$refs.form.reset();
    }
  }
};
</script>
