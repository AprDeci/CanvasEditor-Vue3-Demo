import { ref, computed, watch, onMounted, nextTick } from 'vue';
import Editor, { EditorMode, splitText } from '@hufe921/canvas-editor';
import { Dialog } from '../components/dialog/Dialog';
import { Signature } from '../components/signature/Signature';
import { IEditorOption } from '../options';
import { setupToolbarActions } from './setupToolbarActions';
import { setupInsertTools } from './setupInsertTools';
import { setupSearchAndPrint } from './setupSearchAndPrint';
import { setupViewOptions } from './setupViewOptions';
import { setupModeAndListeners } from './setupModeAndListeners';
import { debounce, scrollIntoView } from '../utils/helpers';

export const useCanvasEditor = (props, emits) => {
  const editorRef = ref(null);
  const commentList = ref([]);
  const options = IEditorOption;
  const isApple = computed(() => typeof navigator !== 'undefined' && /Mac OS X/.test(navigator.userAgent));

  const menuModeList = [
    {
      mode: EditorMode.READONLY,
      name: '只读模式'
    },
    {
      mode: EditorMode.EDIT,
      name: '编辑模式'
    }
  ];

  watch(
    () => props.editMode,
    (val) => {
      if (editorRef.value) {
        editorRef.value.command.executeMode(val);
        const modeElement = document.querySelector('.editor-mode');
        const currentMode = menuModeList.find((item) => item.mode === val);
        if (modeElement && currentMode) {
          modeElement.innerText = currentMode.name;
        }
        const isReadonly = val === EditorMode.READONLY;
        const enableMenuList = ['search', 'print'];
        document.querySelectorAll('.menu-item>div').forEach((dom) => {
          const menu = dom.dataset.menu;
          isReadonly && (!menu || !enableMenuList.includes(menu))
            ? dom.classList.add('disable')
            : dom.classList.remove('disable');
        });
      }
    },
    {
      deep: true
    }
  );

  onMounted(() => {
    const instance = new Editor(document.querySelector('.editor'), {
      header: [],
      main: [],
      footer: []
    });
    editorRef.value = instance;
    Reflect.set(window, 'editor', instance);
    if (props.docJson) {
      instance.command.executeSetValue({ main: JSON.parse(props.docJson) });
    } else {
      let step1 = props.htmlData.replace(/\r\n/g, ' ');
      let step2 = step1.replace(/\\\"/g, '"');
      let cleanedHtml = step2.replace(/\\+/g, '');
      instance.command.executeSetHTML({ main: cleanedHtml });
    }

    window.addEventListener(
      'click',
      (evt) => {
        const visibleDom = document.querySelector('.visible');
        if (!visibleDom || visibleDom.contains(evt.target)) return;
        visibleDom.classList.remove('visible');
      },
      {
        capture: true
      }
    );

    const context = {
      options,
      emits,
      isApple,
      commentList,
      Dialog,
      Signature,
      splitText,
      debounce,
      nextTick,
      scrollIntoView
    };
    const toolbarRefs = setupToolbarActions(instance, context);
    setupInsertTools(instance, context);
    const searchRefs = setupSearchAndPrint(instance, context);
    const viewOptions = setupViewOptions(instance, context);
    setupModeAndListeners(instance, context, { toolbarRefs, searchRefs, viewOptions });
  });

  return {
    editorRef
  };
};
