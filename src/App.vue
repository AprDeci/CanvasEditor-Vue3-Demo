<script setup>
  // import HelloWorld from "./components/HelloWorld.vue";
  // import CanvasEditor from "./components/CanvasEditor.vue";
  import CanvasEditor from './canvasEditor/index.vue';
</script>

<template>
  <!-- <div>
    <HelloWorld />
  </div> -->
  <!-- <div><CanvasEditor /></div> -->
  <div><CanvasEditor :edit-mode="'edit'" /></div>
</template>
