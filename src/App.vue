<script setup>
  import CanvasEditor from './canvasEditor/index.vue';
  import { ref } from 'vue';

  const html = ref('');

  const Save = (json) => {
    html.value = json;
  };
</script>

<template>
  <div><CanvasEditor @save="Save" :edit-mode="'edit'" /></div>
  <div style="height: 20rem">123:{{ html }}</div>
</template>
