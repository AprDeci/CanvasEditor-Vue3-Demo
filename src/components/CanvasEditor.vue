<script setup>
import { onMounted } from "vue";
import Editor from "@hufe921/canvas-editor";
import { RowFlex } from "@hufe921/canvas-editor";

onMounted(() => {
  new Editor(
    document.querySelector(".canvas-editor"),
    {
      header: [
        {
          value: "Header",
          rowFlex: RowFlex.CENTER,
        },
      ],
      main: [
        {
          value: "Hello World",
        },
      ],
      footer: [
        {
          value: "canvas-editor",
          size: 12,
        },
      ],
    },
    {}
  );
});
</script>

<template><div class="canvas-editor"></div></template>
