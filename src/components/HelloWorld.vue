<script setup>
import "@wangeditor-next/editor/dist/css/style.css";
import { ref, shallowRef, onMounted, onBeforeUnmount } from "vue";
import { Editor, Toolbar } from "@wangeditor-next/editor-for-vue";

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef();

// 内容 HTML
const valueHtml = ref("<p>hello</p>");

// 模拟 ajax 异步获取内容
onMounted(() => {
  setTimeout(() => {
    valueHtml.value = "<p>模拟 Ajax 异步设置内容</p>";
  }, 1500);
});

// 工具栏配置
const toolbarConfig = {};

// 编辑器配置
const editorConfig = {
  placeholder: "请输入内容...",
};

// 组件销毁时，及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
});

// 编辑器回调函数
const handleCreated = (editor) => {
  console.log("created", editor);
  editorRef.value = editor; // 记录 editor 实例
};

const handleChange = (editor) => {
  console.log("change:", editor.getHtml());
};

const handleDestroyed = (editor) => {
  console.log("destroyed", editor);
};

const handleFocus = (editor) => {
  console.log("focus", editor);
};

const handleBlur = (editor) => {
  console.log("blur", editor);
};

const customAlert = (info, type) => {
  alert(`【自定义提示】${type} - ${info}`);
};

const customPaste = (editor, event, callback) => {
  console.log("ClipboardEvent 粘贴事件对象", event);

  // 自定义插入内容
  editor.insertText("xxx");

  // 阻止默认粘贴行为
  callback(false);
  // callback(true) // 如果要继续默认粘贴，调用 callback(true)
};

// 外部按钮调用的方法
const insertText = () => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.insertText("hello world");
};

const printHtml = () => {
  const editor = editorRef.value;
  if (editor == null) return;
  console.log(editor.getHtml());
};

const disable = () => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.disable();
};

const enable = () => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.enable();
};
</script>

<template>
  <div>
    <button @click="disable">disable</button>
    <button @click="enable">enable</button>
  </div>
  <div style="border: 1px solid #ccc; margin-top: 10px">
    <Toolbar
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      :mode="mode"
      style="border-bottom: 1px solid #ccc"
    />
    <Editor
      :defaultConfig="editorConfig"
      :mode="mode"
      v-model="valueHtml"
      style="height: 400px; overflow-y: hidden"
      @onCreated="handleCreated"
      @onChange="handleChange"
      @onDestroyed="handleDestroyed"
      @onFocus="handleFocus"
      @onBlur="handleBlur"
      @customAlert="customAlert"
    />
  </div>
</template>
