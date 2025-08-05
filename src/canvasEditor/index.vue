<script setup>
  import { ref, computed, watch, onMounted, nextTick } from 'vue';
  import Editor from '@hufe921/canvas-editor';
  import { Dialog } from './components/dialog/Dialog';
  import { Signature } from './components/signature/Signature';
  import { IEditorOption, ITableOption, IHeader, IFooter } from './options';

  import {
    BlockType,
    Command,
    ControlType,
    EditorMode,
    EditorZone,
    ElementType,
    KeyMap,
    ListStyle,
    ListType,
    PageMode,
    PaperDirection,
    RowFlex,
    TitleLevel,
    splitText
  } from '@hufe921/canvas-editor';

  const props = defineProps({
    // 编辑模式
    editMode: {
      type: String
    },
    // html数据
    htmlData: {
      type: String,
      default: ''
    },
    // 后端接口数据（用作回显）
    docJson: {
      type: String
    }
  });

  const emits = defineEmits(['save', 'isSave']);

  const editorRef = ref(null);
  const isApple = computed(() => typeof navigator !== 'undefined' && /Mac OS X/.test(navigator.userAgent));

  const modeList = [
    {
      mode: EditorMode.READONLY,
      name: '只读模式'
    },
    {
      mode: EditorMode.EDIT,
      name: '编辑模式'
    }
  ];
  const header = ref([]);
  const main = ref([]);
  const footer = ref([]);
  const options = IEditorOption;
  const commentList = ref([]);

  watch(
    () => props.editMode,
    (val) => {
      if (editorRef.value) {
        editorRef.value.command.executeMode(val);
        // 设置模式
        const modeElement = document.querySelector('.editor-mode');
        modeElement.innerText = modeList.value.filter((item) => item.mode == val).map((data) => data.name) || '';
        // 设置菜单栏权限视觉反馈
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

  const debounce = (func, delay) => {
    let timer;
    return function (...args) {
      if (timer) {
        window.clearTimeout(timer);
      }
      timer = window.setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  };

  onMounted(() => {
    const isApple = typeof navigator !== 'undefined' && /Mac OS X/.test(navigator.userAgent);
    // 初始化实例
    const instance = new Editor(document.querySelector('.editor'), {
      header: [], // 页眉配置
      main: [], // 主要编辑内容
      footer: [] // 页脚信息
    });

    editorRef.value = instance;
    // cypress使用
    Reflect.set(window, 'editor', instance);
    // 回显编辑器数据
    if (props.docJson) {
      // 通过getValue来的数据回显页面（因为用html回显页面会丢掉font-family，官网git issue有解释）
      instance.command.executeSetValue({ main: JSON.parse(props.docJson) });
    } else {
      // 处理后端返回的html字符串
      // 先替换 \r\n 为 空格，以统一处理空格问题

      let step1 = props.htmlData.replace(/\r\n/g, ' ');
      // 然后替换 \\\" 为 \" ，确保样式字符串内的引号正确
      let step2 = step1.replace(/\\\"/g, '"');
      // 接着替换 \\ 为 空字符，去掉其他不必要的转义
      let cleanedHtml = step2.replace(/\\+/g, '');
      // 设置Word模板数据
      instance.command.executeSetHTML({ main: cleanedHtml });
    }

    // 菜单弹窗销毁
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

    /*
        工具栏方法
      */

    // 1.保存（自定义）
    const saveDom = document.querySelector('.menu-item__save');
    saveDom.title = `保存(${isApple.value ? '⌘' : 'Ctrl'}+S)`;
    saveDom.onclick = () => {
      const value = instance.command.getValue(options);
      const htmlVal = instance.command.getHTML();
      emits('save', htmlVal); // 保存数据传给父组件
    };
    // 快捷键保存
    instance.listener.saved = (payload) => {
      console.log('elementList: ', payload);
      emits('save', htmlVal); // 保存数据传给父组件
    };

    // 2. | 撤销 | 重做 | 格式刷 | 清除格式 |
    const undoDom = document.querySelector('.menu-item__undo');
    undoDom.title = `撤销(${isApple ? '⌘' : 'Ctrl'}+Z)`;
    undoDom.onclick = function () {
      console.log('undo');
      instance.command.executeUndo();
    };

    const redoDom = document.querySelector('.menu-item__redo');
    redoDom.title = `重做(${isApple ? '⌘' : 'Ctrl'}+Y)`;
    redoDom.onclick = function () {
      console.log('redo');
      instance.command.executeRedo();
    };

    const painterDom = document.querySelector('.menu-item__painter');
    painterDom.onclick = function () {
      console.log('painter');
      instance.command.executePainter({
        isDblclick: false
      });
    };
    painterDom.ondblclick = function () {
      console.log('painter');
      instance.command.executePainter({
        isDblclick: true
      });
    };

    document.querySelector('.menu-item__format').onclick = function () {
      console.log('format');
      instance.command.executeFormat();
    };

    // 3. | 字体 | 字体变大 | 字体变小 | 加粗 | 斜体 | 下划线 | 删除线 | 上标 | 下标 | 字体颜色 | 背景色 |
    const fontDom = document.querySelector('.menu-item__font');
    const fontSelectDom = fontDom.querySelector('.select');
    const fontOptionDom = fontDom.querySelector('.options');
    fontDom.onclick = function () {
      console.log('font');
      fontOptionDom.classList.toggle('visible');
    };
    fontOptionDom.onclick = function (evt) {
      const li = evt.target;
      instance.command.executeFont(li.dataset.family);
    };

    const sizeSetDom = document.querySelector('.menu-item__size');
    const sizeSelectDom = sizeSetDom.querySelector('.select');
    const sizeOptionDom = sizeSetDom.querySelector('.options');
    sizeSetDom.title = `设置字号`;
    sizeSetDom.onclick = function () {
      console.log('size');
      sizeOptionDom.classList.toggle('visible');
    };
    sizeOptionDom.onclick = function (evt) {
      const li = evt.target;
      instance.command.executeSize(Number(li.dataset.size));
    };

    const sizeAddDom = document.querySelector('.menu-item__size-add');
    sizeAddDom.title = `增大字号(${isApple.value ? '⌘' : 'Ctrl'}+[)`;
    sizeAddDom.onclick = function () {
      console.log('size-add');
      instance.command.executeSizeAdd();
    };

    const sizeMinusDom = document.querySelector('.menu-item__size-minus');
    sizeMinusDom.title = `减小字号(${isApple.value ? '⌘' : 'Ctrl'}+])`;
    sizeMinusDom.onclick = function () {
      console.log('size-minus');
      instance.command.executeSizeMinus();
    };

    const boldDom = document.querySelector('.menu-item__bold');
    boldDom.title = `加粗(${isApple.value ? '⌘' : 'Ctrl'}+B)`;
    boldDom.onclick = function () {
      console.log('bold');
      instance.command.executeBold();
    };

    const italicDom = document.querySelector('.menu-item__italic');
    italicDom.title = `斜体(${isApple.value ? '⌘' : 'Ctrl'}+I)`;
    italicDom.onclick = function () {
      console.log('italic');
      instance.command.executeItalic();
    };

    const underlineDom = document.querySelector('.menu-item__underline');
    underlineDom.title = `下划线(${isApple.value ? '⌘' : 'Ctrl'}+U)`;
    underlineDom.onclick = function () {
      console.log('underline');
      instance.command.executeUnderline();
    };

    const strikeoutDom = document.querySelector('.menu-item__strikeout');
    strikeoutDom.onclick = function () {
      console.log('strikeout');
      instance.command.executeStrikeout();
    };

    const superscriptDom = document.querySelector('.menu-item__superscript');
    superscriptDom.title = `上标(${isApple.value ? '⌘' : 'Ctrl'}+Shift+,)`;
    superscriptDom.onclick = function () {
      console.log('superscript');
      instance.command.executeSuperscript();
    };

    const subscriptDom = document.querySelector('.menu-item__subscript');
    subscriptDom.title = `下标(${isApple.value ? '⌘' : 'Ctrl'}+Shift+.)`;
    subscriptDom.onclick = function () {
      console.log('subscript');
      instance.command.executeSubscript();
    };

    const colorControlDom = document.querySelector('#color');
    colorControlDom.oninput = function () {
      instance.command.executeColor(colorControlDom.value);
    };
    const colorDom = document.querySelector('.menu-item__color');
    const colorSpanDom = colorDom.querySelector('span');
    colorDom.onclick = function () {
      console.log('color');
      colorControlDom.click();
    };

    const highlightControlDom = document.querySelector('#highlight');
    highlightControlDom.oninput = function () {
      instance.command.executeHighlight(highlightControlDom.value);
    };
    const highlightDom = document.querySelector('.menu-item__highlight');
    const highlightSpanDom = highlightDom.querySelector('span');
    highlightDom.onclick = function () {
      console.log('highlight');
      highlightControlDom?.click();
    };

    const titleDom = document.querySelector('.menu-item__title');
    const titleSelectDom = titleDom.querySelector('.select');
    const titleOptionDom = titleDom.querySelector('.options');
    titleOptionDom.querySelectorAll('li').forEach((li, index) => {
      li.title = `Ctrl+${isApple.value ? 'Option' : 'Alt'}+${index}`;
    });

    titleDom.onclick = function () {
      console.log('title');
      titleOptionDom.classList.toggle('visible');
    };
    titleOptionDom.onclick = function (evt) {
      const li = evt.target;
      const level = li.dataset.level;
      instance.command.executeTitle(level || null);
    };

    const leftDom = document.querySelector('.menu-item__left');
    leftDom.title = `左对齐(${isApple.value ? '⌘' : 'Ctrl'}+L)`;
    leftDom.onclick = function () {
      console.log('left');
      instance.command.executeRowFlex(RowFlex.LEFT);
    };

    const centerDom = document.querySelector('.menu-item__center');
    centerDom.title = `居中对齐(${isApple.value ? '⌘' : 'Ctrl'}+E)`;
    centerDom.onclick = function () {
      console.log('center');
      instance.command.executeRowFlex(RowFlex.CENTER);
    };

    const rightDom = document.querySelector('.menu-item__right');
    rightDom.title = `右对齐(${isApple.value ? '⌘' : 'Ctrl'}+R)`;
    rightDom.onclick = function () {
      console.log('right');
      instance.command.executeRowFlex(RowFlex.RIGHT);
    };

    const alignmentDom = document.querySelector('.menu-item__alignment');
    alignmentDom.title = `两端对齐(${isApple.value ? '⌘' : 'Ctrl'}+J)`;
    alignmentDom.onclick = function () {
      console.log('alignment');
      instance.command.executeRowFlex(RowFlex.ALIGNMENT);
    };

    const rowMarginDom = document.querySelector('.menu-item__row-margin');
    const rowOptionDom = rowMarginDom.querySelector('.options');
    rowMarginDom.onclick = function () {
      console.log('row-margin');
      rowOptionDom.classList.toggle('visible');
    };
    rowOptionDom.onclick = function (evt) {
      const li = evt.target;
      instance.command.executeRowMargin(Number(li.dataset.rowmargin));
    };

    const listDom = document.querySelector('.menu-item__list');
    listDom.title = `列表(${isApple.value ? '⌘' : 'Ctrl'}+Shift+U)`;
    const listOptionDom = listDom.querySelector('.options');
    listDom.onclick = function () {
      console.log('list');
      listOptionDom.classList.toggle('visible');
    };
    listOptionDom.onclick = function (evt) {
      const li = evt.target;
      const listType = li.dataset.listType || null;
      const listStyle = li.dataset.listStyle;
      instance.command.executeList(listType, listStyle);
    };

    // 4. | 表格 | 图片 | 超链接 | 分割线 | 水印 | 代码块 | 分隔符 | 控件 | 复选框 | LaTeX | 日期选择器
    const tableDom = document.querySelector('.menu-item__table');
    const tablePanelContainer = document.querySelector('.menu-item__table__collapse');
    const tableClose = document.querySelector('.table-close');
    const tableTitle = document.querySelector('.table-select');
    const tablePanel = document.querySelector('.table-panel');
    // 绘制行列
    const tableCellList = [];
    for (let i = 0; i < 10; i++) {
      const tr = document.createElement('tr');
      tr.classList.add('table-row');
      const trCellList = [];
      for (let j = 0; j < 10; j++) {
        const td = document.createElement('td');
        td.classList.add('table-cel');
        tr.append(td);
        trCellList.push(td);
      }
      tablePanel.append(tr);
      tableCellList.push(trCellList);
    }
    let colIndex = 0;
    let rowIndex = 0;
    // 移除所有格选择
    function removeAllTableCellSelect() {
      tableCellList.forEach((tr) => {
        tr.forEach((td) => td.classList.remove('active'));
      });
    }
    // 设置标题内容
    function setTableTitle(payload) {
      tableTitle.innerText = payload;
    }
    // 恢复初始状态
    function recoveryTable() {
      // 还原选择样式、标题、选择行列
      removeAllTableCellSelect();
      setTableTitle('插入');
      colIndex = 0;
      rowIndex = 0;
      // 隐藏panel
      tablePanelContainer.style.display = 'none';
    }
    tableDom.onclick = function () {
      console.log('table');
      tablePanelContainer.style.display = 'block';
    };
    tablePanel.onmousemove = function (evt) {
      const celSize = 16;
      const rowMarginTop = 10;
      const celMarginRight = 6;
      const { offsetX, offsetY } = evt;
      // 移除所有选择
      removeAllTableCellSelect();
      colIndex = Math.ceil(offsetX / (celSize + celMarginRight)) || 1;
      rowIndex = Math.ceil(offsetY / (celSize + rowMarginTop)) || 1;
      // 改变选择样式
      tableCellList.forEach((tr, trIndex) => {
        tr.forEach((td, tdIndex) => {
          if (tdIndex < colIndex && trIndex < rowIndex) {
            td.classList.add('active');
          }
        });
      });
      // 改变表格标题
      setTableTitle(`${rowIndex}×${colIndex}`);
    };
    tableClose.onclick = function () {
      recoveryTable();
    };
    tablePanel.onclick = function () {
      // 应用选择
      instance.command.executeInsertTable(rowIndex, colIndex);
      recoveryTable();
    };

    const imageDom = document.querySelector('.menu-item__image');
    const imageFileDom = document.querySelector('#image');
    imageDom.onclick = function () {
      imageFileDom.click();
    };
    imageFileDom.onchange = function () {
      const file = imageFileDom.files[0];
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = function () {
        // 计算宽高
        const image = new Image();
        const value = String(fileReader.result);
        image.src = value;
        image.onload = function () {
          instance.command.executeImage({
            value,
            width: image.width,
            height: image.height
          });
          imageFileDom.value = '';
        };
      };
    };

    const hyperlinkDom = document.querySelector('.menu-item__hyperlink');
    hyperlinkDom.onclick = function () {
      console.log('hyperlink');
      new Dialog({
        title: '超链接',
        data: [
          {
            type: 'text',
            label: '文本',
            name: 'name',
            required: true,
            placeholder: '请输入文本',
            value: instance.command.getRangeText()
          },
          {
            type: 'text',
            label: '链接',
            name: 'url',
            required: true,
            placeholder: '请输入链接'
          }
        ],
        onConfirm: (payload) => {
          const name = payload.find((p) => p.name === 'name')?.value;
          if (!name) return;
          const url = payload.find((p) => p.name === 'url')?.value;
          if (!url) return;
          instance.command.executeHyperlink({
            type: ElementType.HYPERLINK,
            value: '',
            url,
            valueList: splitText(name).map((n) => ({
              value: n,
              size: 16
            }))
          });
        }
      });
    };

    const separatorDom = document.querySelector('.menu-item__separator');
    const separatorOptionDom = separatorDom.querySelector('.options');
    separatorDom.onclick = function () {
      console.log('separator');
      separatorOptionDom.classList.toggle('visible');
    };
    separatorOptionDom.onmousedown = function (evt) {
      let payload = [];
      const li = evt.target;
      const separatorDash = li.dataset.separator?.split(',').map(Number);
      if (separatorDash) {
        const isSingleLine = separatorDash.every((d) => d === 0);
        if (!isSingleLine) {
          payload = separatorDash;
        }
      }
      instance.command.executeSeparator(payload);
    };

    // const pageBreakDom = document.querySelector(
    //   '.menu-item__page-break'
    // )
    // pageBreakDom.onclick = function () {
    //   console.log('pageBreak')
    //   instance.command.executePageBreak()
    // }

    // const watermarkDom = document.querySelector(
    //   '.menu-item__watermark'
    // )
    // const watermarkOptionDom =
    //   watermarkDom.querySelector('.options')
    // watermarkDom.onclick = function () {
    //   console.log('watermark')
    //   watermarkOptionDom.classList.toggle('visible')
    // }
    // watermarkOptionDom.onmousedown = function (evt) {
    //   const li = evt.target
    //   const menu = li.dataset.menu
    //   watermarkOptionDom.classList.toggle('visible')
    //   if (menu === 'add') {
    //     new Dialog({
    //       title: '水印',
    //       data: [
    //         {
    //           type: 'text',
    //           label: '内容',
    //           name: 'data',
    //           required: true,
    //           placeholder: '请输入内容'
    //         },
    //         {
    //           type: 'color',
    //           label: '颜色',
    //           name: 'color',
    //           required: true,
    //           value: '#AEB5C0'
    //         },
    //         {
    //           type: 'number',
    //           label: '字体大小',
    //           name: 'size',
    //           required: true,
    //           value: '120'
    //         }
    //       ],
    //       onConfirm: payload => {
    //         const nullableIndex = payload.findIndex(p => !p.value)
    //         if (~nullableIndex) return
    //         const watermark = payload.reduce((pre, cur) => {
    //           pre[cur.name] = cur.value
    //           return pre
    //         }, {})
    //         instance.command.executeAddWatermark({
    //           data: watermark.data,
    //           color: watermark.color,
    //           size: Number(watermark.size)
    //         })
    //       }
    //     })
    //   } else {
    //     instance.command.executeDeleteWatermark()
    //   }
    // }

    const codeblockDom = document.querySelector('.menu-item__codeblock');
    codeblockDom.onclick = function () {
      console.log('codeblock');
      new Dialog({
        title: '代码块',
        data: [
          {
            type: 'textarea',
            name: 'codeblock',
            placeholder: '请输入代码',
            width: 500,
            height: 300
          }
        ],
        onConfirm: (payload) => {
          const codeblock = payload.find((p) => p.name === 'codeblock')?.value;
          if (!codeblock) return;
          const tokenList = prism.tokenize(codeblock, prism.languages.javascript);
          const formatTokenList = formatPrismToken(tokenList);
          const elementList = [];
          for (let i = 0; i < formatTokenList.length; i++) {
            const formatToken = formatTokenList[i];
            const tokenStringList = splitText(formatToken.content);
            for (let j = 0; j < tokenStringList.length; j++) {
              const value = tokenStringList[j];
              const element = {
                value
              };
              if (formatToken.color) {
                element.color = formatToken.color;
              }
              if (formatToken.bold) {
                element.bold = true;
              }
              if (formatToken.italic) {
                element.italic = true;
              }
              elementList.push(element);
            }
          }
          elementList.unshift({
            value: '\n'
          });
          instance.command.executeInsertElementList(elementList);
        }
      });
    };

    const controlDom = document.querySelector('.menu-item__control');
    const controlOptionDom = controlDom.querySelector('.options');
    controlDom.onclick = function () {
      console.log('control');
      controlOptionDom.classList.toggle('visible');
    };
    controlOptionDom.onmousedown = function (evt) {
      controlOptionDom.classList.toggle('visible');
      const li = evt.target;
      const type = li.dataset.control;
      switch (type) {
        case ControlType.TEXT:
          new Dialog({
            title: '文本控件',
            data: [
              {
                type: 'text',
                label: '占位符',
                name: 'placeholder',
                required: true,
                placeholder: '请输入占位符'
              },
              {
                type: 'text',
                label: '默认值',
                name: 'value',
                placeholder: '请输入默认值'
              }
            ],
            onConfirm: (payload) => {
              const placeholder = payload.find((p) => p.name === 'placeholder')?.value;
              if (!placeholder) return;
              const value = payload.find((p) => p.name === 'value')?.value || '';
              instance.command.executeInsertElementList([
                {
                  type: ElementType.CONTROL,
                  value: '',
                  control: {
                    type,
                    value: value
                      ? [
                          {
                            value
                          }
                        ]
                      : null,
                    placeholder
                  }
                }
              ]);
            }
          });
          break;
        case ControlType.SELECT:
          new Dialog({
            title: '列举控件',
            data: [
              {
                type: 'text',
                label: '占位符',
                name: 'placeholder',
                required: true,
                placeholder: '请输入占位符'
              },
              {
                type: 'text',
                label: '默认值',
                name: 'code',
                placeholder: '请输入默认值'
              },
              {
                type: 'textarea',
                label: '值集',
                name: 'valueSets',
                required: true,
                height: 100,
                placeholder: `请输入值集JSON，例：\n[{\n"value":"有",\n"code":"98175"\n}]`
              }
            ],
            onConfirm: (payload) => {
              const placeholder = payload.find((p) => p.name === 'placeholder')?.value;
              if (!placeholder) return;
              const valueSets = payload.find((p) => p.name === 'valueSets')?.value;
              if (!valueSets) return;
              const code = payload.find((p) => p.name === 'code')?.value;
              instance.command.executeInsertElementList([
                {
                  type: ElementType.CONTROL,
                  value: '',
                  control: {
                    type,
                    code,
                    value: null,
                    placeholder,
                    valueSets: JSON.parse(valueSets)
                  }
                }
              ]);
            }
          });
          break;
        case ControlType.CHECKBOX:
          new Dialog({
            title: '复选框控件',
            data: [
              {
                type: 'text',
                label: '默认值',
                name: 'code',
                placeholder: '请输入默认值，多个值以英文逗号分割'
              },
              {
                type: 'textarea',
                label: '值集',
                name: 'valueSets',
                required: true,
                height: 100,
                placeholder: `请输入值集JSON，例：\n[{\n"value":"有",\n"code":"98175"\n}]`
              }
            ],
            onConfirm: (payload) => {
              const valueSets = payload.find((p) => p.name === 'valueSets')?.value;
              if (!valueSets) return;
              const code = payload.find((p) => p.name === 'code')?.value;
              instance.command.executeInsertElementList([
                {
                  type: ElementType.CONTROL,
                  value: '',
                  control: {
                    type,
                    code,
                    value: null,
                    valueSets: JSON.parse(valueSets)
                  }
                }
              ]);
            }
          });
          break;
        default:
          break;
      }
    };

    const checkboxDom = document.querySelector('.menu-item__checkbox');
    checkboxDom.onclick = function () {
      console.log('checkbox');
      instance.command.executeInsertElementList([
        {
          type: ElementType.CHECKBOX,
          checkbox: {
            value: false
          },
          value: ''
        }
      ]);
    };

    //latex
    const latexDom = document.querySelector('.menu-item__latex');
    latexDom.onclick = function () {
      console.log('LaTeX');
      new Dialog({
        title: 'LaTeX',
        data: [
          {
            type: 'textarea',
            height: 100,
            name: 'value',
            placeholder: '请输入LaTeX文本'
          }
        ],
        onConfirm: (payload) => {
          const value = payload.find((p) => p.name === 'value')?.value;
          if (!value) return;
          instance.command.executeInsertElementList([
            {
              type: ElementType.LATEX,
              value
            }
          ]);
        }
      });
    };

    //日期添加
    const dateDom = document.querySelector('.menu-item__date');
    const dateDomOptionDom = dateDom.querySelector('.options');
    dateDom.onclick = function () {
      console.log('date');
      dateDomOptionDom.classList.toggle('visible');
      // 定位调整
      const bodyRect = document.body.getBoundingClientRect();
      const dateDomOptionRect = dateDomOptionDom.getBoundingClientRect();
      if (dateDomOptionRect.left + dateDomOptionRect.width > bodyRect.width) {
        dateDomOptionDom.style.right = '0px';
        dateDomOptionDom.style.left = 'unset';
      } else {
        dateDomOptionDom.style.right = 'unset';
        dateDomOptionDom.style.left = '0px';
      }
      // 当前日期
      const date = new Date();
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      const second = date.getSeconds().toString().padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      const dateTimeString = `${dateString} ${hour}:${minute}:${second}`;
      dateDomOptionDom.querySelector('li:first-child').innerText = dateString;
      dateDomOptionDom.querySelector('li:last-child').innerText = dateTimeString;
    };
    dateDomOptionDom.onmousedown = function (evt) {
      const li = evt.target;
      const dateFormat = li.dataset.format;
      dateDomOptionDom.classList.toggle('visible');
      instance.command.executeInsertElementList([
        {
          type: ElementType.DATE,
          value: '',
          dateFormat,
          valueList: [
            {
              value: li.innerText.trim()
            }
          ]
        }
      ]);
    };

    //内容块 未修复
    // const blockDom = document.querySelector('.menu-item__block');
    // blockDom.onclick = function () {
    //   console.log('block');
    //   new Dialog({
    //     title: '内容块',
    //     data: [
    //       {
    //         type: 'select',
    //         label: '类型',
    //         name: 'type',
    //         value: 'iframe',
    //         required: true,
    //         options: [
    //           {
    //             label: '网址',
    //             value: 'iframe'
    //           },
    //           {
    //             label: '视频',
    //             value: 'video'
    //           }
    //         ]
    //       },
    //       {
    //         type: 'number',
    //         label: '宽度',
    //         name: 'width',
    //         placeholder: '请输入宽度（默认页面内宽度）'
    //       },
    //       {
    //         type: 'number',
    //         label: '高度',
    //         name: 'height',
    //         required: true,
    //         placeholder: '请输入高度'
    //       },
    //       {
    //         type: 'textarea',
    //         label: '地址',
    //         height: 100,
    //         name: 'value',
    //         required: true,
    //         placeholder: '请输入地址'
    //       }
    //     ],
    //     onConfirm: (payload) => {
    //       const type = payload.find((p) => p.name === 'type')?.value;
    //       if (!type) return;
    //       const value = payload.find((p) => p.name === 'value')?.value;
    //       if (!value) return;
    //       const width = payload.find((p) => p.name === 'width')?.value;
    //       const height = payload.find((p) => p.name === 'height')?.value;
    //       if (!height) return;
    //       const block = {
    //         type: null
    //       };
    //       if (block.type === BlockType.IFRAME) {
    //         block.iframeBlock = {
    //           src: value
    //         };
    //       } else if (block.type === BlockType.VIDEO) {
    //         block.videoBlock = {
    //           src: value
    //         };
    //       }
    //       const blockElement = {
    //         type: ElementType.BLOCK,
    //         value: '',
    //         height: Number(height),
    //         block
    //       };
    //       if (width) {
    //         blockElement.width = Number(width);
    //       }
    //       instance.command.executeInsertElementList([blockElement]);
    //     }
    //   });
    // };

    // 5. | 搜索&替换 | 打印 |
    const searchCollapseDom = document.querySelector('.menu-item__search__collapse');
    const searchInputDom = document.querySelector('.menu-item__search__collapse__search input');
    const replaceInputDom = document.querySelector('.menu-item__search__collapse__replace input');
    const searchDom = document.querySelector('.menu-item__search');
    searchDom.title = `搜索与替换(${isApple ? '⌘' : 'Ctrl'}+F)`;
    const searchResultDom = searchCollapseDom.querySelector('.search-result');
    function setSearchResult() {
      const result = instance.command.getSearchNavigateInfo();
      if (result) {
        const { index, count } = result;
        searchResultDom.innerText = `${index}/${count}`;
      } else {
        searchResultDom.innerText = '';
      }
    }
    searchDom.onclick = function () {
      console.log('search');
      searchCollapseDom.style.display = 'block';
      const bodyRect = document.body.getBoundingClientRect();
      const searchRect = searchDom.getBoundingClientRect();
      const searchCollapseRect = searchCollapseDom.getBoundingClientRect();
      if (searchRect.left + searchCollapseRect.width > bodyRect.width) {
        searchCollapseDom.style.right = '0px';
        searchCollapseDom.style.left = 'unset';
      } else {
        searchCollapseDom.style.right = 'unset';
      }
      searchInputDom.focus();
    };
    searchCollapseDom.querySelector('span').onclick = function () {
      searchCollapseDom.style.display = 'none';
      searchInputDom.value = '';
      replaceInputDom.value = '';
      instance.command.executeSearch(null);
      setSearchResult();
    };
    searchInputDom.oninput = function () {
      instance.command.executeSearch(searchInputDom.value || null);
      setSearchResult();
    };
    searchInputDom.onkeydown = function (evt) {
      if (evt.key === 'Enter') {
        instance.command.executeSearch(searchInputDom.value || null);
        setSearchResult();
      }
    };
    searchCollapseDom.querySelector('button').onclick = function () {
      const searchValue = searchInputDom.value;
      const replaceValue = replaceInputDom.value;
      if (searchValue && replaceValue && searchValue !== replaceValue) {
        instance.command.executeReplace(replaceValue);
      }
    };
    searchCollapseDom.querySelector('.arrow-left').onclick = function () {
      instance.command.executeSearchNavigatePre();
      setSearchResult();
    };
    searchCollapseDom.querySelector('.arrow-right').onclick = function () {
      instance.command.executeSearchNavigateNext();
      setSearchResult();
    };

    // const printDom = document.querySelector('.menu-item__print')
    // printDom.title = `打印(${isApple ? '⌘' : 'Ctrl'}+P)`
    // printDom.onclick = function () {
    //   console.log('print')
    //   instance.command.executePrint()
    // }

    // 6. 目录显隐 | 页面模式 | 纸张缩放 | 纸张大小 | 纸张方向 | 页边距 | 全屏
    async function updateCatalog() {
      const catalog = await instance.command.getCatalog();
      const catalogMainDom = document.querySelector('.catalog__main');
      catalogMainDom.innerHTML = '';
      if (catalog) {
        const appendCatalog = (parent, catalogItems) => {
          for (let c = 0; c < catalogItems.length; c++) {
            const catalogItem = catalogItems[c];
            const catalogItemDom = document.createElement('div');
            catalogItemDom.classList.add('catalog-item');
            // 渲染
            const catalogItemContentDom = document.createElement('div');
            catalogItemContentDom.classList.add('catalog-item__content');
            const catalogItemContentSpanDom = document.createElement('span');
            catalogItemContentSpanDom.innerText = catalogItem.name;
            catalogItemContentDom.append(catalogItemContentSpanDom);
            // 定位
            catalogItemContentDom.onclick = () => {
              instance.command.executeLocationCatalog(catalogItem.id);
            };
            catalogItemDom.append(catalogItemContentDom);
            if (catalogItem.subCatalog && catalogItem.subCatalog.length) {
              appendCatalog(catalogItemDom, catalogItem.subCatalog);
            }
            // 追加
            parent.append(catalogItemDom);
          }
        };
        appendCatalog(catalogMainDom, catalog);
      }
    }
    let isCatalogShow = true;
    const catalogDom = document.querySelector('.catalog');
    const catalogModeDom = document.querySelector('.catalog-mode');
    const catalogHeaderCloseDom = document.querySelector('.catalog__header__close');
    const switchCatalog = () => {
      console.log('目录', isCatalogShow);
      isCatalogShow = !isCatalogShow;
      if (isCatalogShow) {
        console.log('目录', isCatalogShow);
        catalogDom.style.display = 'block';
        updateCatalog();
      } else {
        catalogDom.style.display = 'none';
      }
    };
    catalogModeDom.onclick = switchCatalog;
    catalogHeaderCloseDom.onclick = switchCatalog;

    const pageModeDom = document.querySelector('.page-mode');
    const pageModeOptionsDom = pageModeDom.querySelector('.options');
    pageModeDom.onclick = function () {
      pageModeOptionsDom.classList.toggle('visible');
    };
    pageModeOptionsDom.onclick = function (evt) {
      const li = evt.target;
      instance.command.executePageMode(li.dataset.pageMode);
    };

    document.querySelector('.page-scale-percentage').onclick = function () {
      console.log('page-scale-recovery');
      instance.command.executePageScaleRecovery();
    };

    document.querySelector('.page-scale-minus').onclick = function () {
      console.log('page-scale-minus');
      instance.command.executePageScaleMinus();
    };

    document.querySelector('.page-scale-add').onclick = function () {
      console.log('page-scale-add');
      instance.command.executePageScaleAdd();
    };

    // 纸张大小
    const paperSizeDom = document.querySelector('.paper-size');
    const paperSizeDomOptionsDom = paperSizeDom.querySelector('.options');
    paperSizeDom.onclick = function () {
      paperSizeDomOptionsDom.classList.toggle('visible');
    };
    paperSizeDomOptionsDom.onclick = function (evt) {
      const li = evt.target;
      const paperType = li.dataset.paperSize;
      const [width, height] = paperType.split('*').map(Number);
      instance.command.executePaperSize(width, height);
      // 纸张状态回显
      paperSizeDomOptionsDom.querySelectorAll('li').forEach((child) => child.classList.remove('active'));
      li.classList.add('active');
    };

    // 纸张方向
    const paperDirectionDom = document.querySelector('.paper-direction');
    const paperDirectionDomOptionsDom = paperDirectionDom.querySelector('.options');
    paperDirectionDom.onclick = function () {
      paperDirectionDomOptionsDom.classList.toggle('visible');
    };
    paperDirectionDomOptionsDom.onclick = function (evt) {
      const li = evt.target;
      const paperDirection = li.dataset.paperDirection;
      instance.command.executePaperDirection(paperDirection);
      // 纸张方向状态回显
      paperDirectionDomOptionsDom.querySelectorAll('li').forEach((child) => child.classList.remove('active'));
      li.classList.add('active');
    };

    // 页面边距
    const paperMarginDom = document.querySelector('.paper-margin');
    paperMarginDom.onclick = function () {
      const [topMargin, rightMargin, bottomMargin, leftMargin] = instance.command.getPaperMargin();
      new Dialog({
        title: '页边距',
        data: [
          {
            type: 'text',
            label: '上边距',
            name: 'top',
            required: true,
            value: `${topMargin}`,
            placeholder: '请输入上边距'
          },
          {
            type: 'text',
            label: '下边距',
            name: 'bottom',
            required: true,
            value: `${bottomMargin}`,
            placeholder: '请输入下边距'
          },
          {
            type: 'text',
            label: '左边距',
            name: 'left',
            required: true,
            value: `${leftMargin}`,
            placeholder: '请输入左边距'
          },
          {
            type: 'text',
            label: '右边距',
            name: 'right',
            required: true,
            value: `${rightMargin}`,
            placeholder: '请输入右边距'
          }
        ],
        onConfirm: (payload) => {
          const top = payload.find((p) => p.name === 'top')?.value;
          if (!top) return;
          const bottom = payload.find((p) => p.name === 'bottom')?.value;
          if (!bottom) return;
          const left = payload.find((p) => p.name === 'left')?.value;
          if (!left) return;
          const right = payload.find((p) => p.name === 'right')?.value;
          if (!right) return;
          instance.command.executeSetPaperMargin([Number(top), Number(right), Number(bottom), Number(left)]);
        }
      });
    };
    // 全屏
    const fullscreenDom = document.querySelector('.fullscreen');
    fullscreenDom.onclick = toggleFullscreen;
    window.addEventListener('keydown', (evt) => {
      if (evt.key === 'F11') {
        toggleFullscreen();
        evt.preventDefault();
      }
    });
    document.addEventListener('fullscreenchange', () => {
      fullscreenDom.classList.toggle('exist');
    });
    function toggleFullscreen() {
      console.log('fullscreen');
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }

    // 7. 编辑器使用模式
    let modeIndex = 1;
    const modeList = [
      {
        mode: EditorMode.READONLY,
        name: '只读模式'
      },
      {
        mode: EditorMode.EDIT,
        name: '编辑模式'
      },
      {
        mode: EditorMode.CLEAN,
        name: '清洁模式'
      },

      {
        mode: EditorMode.FORM,
        name: '表单模式'
      },
      {
        mode: EditorMode.PRINT,
        name: '打印模式'
      }
    ];
    const modeElement = document.querySelector('.editor-mode');
    // 初始设置编辑模式
    const { name, mode } = modeList[modeIndex];
    modeElement.innerText = name;
    instance.command.executeMode(mode);
    // 设置菜单栏权限视觉反馈
    const isReadonly = mode === EditorMode.READONLY;
    const enableMenuList = ['search', 'print'];
    document.querySelectorAll('.menu-item>div').forEach((dom) => {
      const menu = dom.dataset.menu;
      isReadonly && (!menu || !enableMenuList.includes(menu))
        ? dom.classList.add('disable')
        : dom.classList.remove('disable');
    });
    modeElement.onclick = function () {
      // 模式选择循环
      modeIndex === modeList.length - 1 ? (modeIndex = 0) : modeIndex++;
      // 设置模式
      const { name, mode } = modeList[modeIndex];
      modeElement.innerText = name;
      instance.command.executeMode(mode);
      // 设置菜单栏权限视觉反馈
      const isReadonly = mode === EditorMode.READONLY;
      const enableMenuList = ['search', 'print'];
      document.querySelectorAll('.menu-item>div').forEach((dom) => {
        const menu = dom.dataset.menu;
        isReadonly && (!menu || !enableMenuList.includes(menu))
          ? dom.classList.add('disable')
          : dom.classList.remove('disable');
      });
    };

    // 模拟批注;
    const commentDom = document.querySelector('.comment');
    const updateComment = async () => {
      const groupIds = await instance.command.getGroupIds();
      for (const comment of commentList.value) {
        const activeCommentDom = commentDom.querySelector(`.comment-item[data-id='${comment.id}']`);
        // 编辑器是否存在对应成组id
        if (groupIds.includes(comment.id)) {
          // 当前dom是否存在-不存在则追加
          if (!activeCommentDom) {
            const commentItem = document.createElement('div');
            commentItem.classList.add('comment-item');
            commentItem.setAttribute('data-id', comment.id);
            commentItem.onclick = () => {
              instance.command.executeLocationGroup(comment.id);
            };
            commentDom.append(commentItem);
            // 选区信息
            const commentItemTitle = document.createElement('div');
            commentItemTitle.classList.add('comment-item__title');
            commentItemTitle.append(document.createElement('span'));
            const commentItemTitleContent = document.createElement('span');
            commentItemTitleContent.innerText = comment.rangeText;
            commentItemTitle.append(commentItemTitleContent);
            const closeDom = document.createElement('i');
            closeDom.onclick = () => {
              instance.command.executeDeleteGroup(comment.id);
            };
            commentItemTitle.append(closeDom);
            commentItem.append(commentItemTitle);
            // 基础信息
            const commentItemInfo = document.createElement('div');
            commentItemInfo.classList.add('comment-item__info');
            const commentItemInfoName = document.createElement('span');
            commentItemInfoName.innerText = comment.userName;
            const commentItemInfoDate = document.createElement('span');
            commentItemInfoDate.innerText = comment.createdDate;
            commentItemInfo.append(commentItemInfoName);
            commentItemInfo.append(commentItemInfoDate);
            commentItem.append(commentItemInfo);
            // 详细评论
            const commentItemContent = document.createElement('div');
            commentItemContent.classList.add('comment-item__content');
            commentItemContent.innerText = comment.content;
            commentItem.append(commentItemContent);
            commentDom.append(commentItem);
          }
        } else {
          // 编辑器内不存在对应成组id则dom则移除
          activeCommentDom?.remove();
        }
      }
    };
    // 8. 内部事件监听
    instance.listener.rangeStyleChange = function (payload) {
      // 控件类型
      payload.type === ElementType.SUBSCRIPT
        ? subscriptDom.classList.add('active')
        : subscriptDom.classList.remove('active');
      payload.type === ElementType.SUPERSCRIPT
        ? superscriptDom.classList.add('active')
        : superscriptDom.classList.remove('active');
      payload.type === ElementType.SEPARATOR
        ? separatorDom.classList.add('active')
        : separatorDom.classList.remove('active');
      separatorOptionDom.querySelectorAll('li').forEach((li) => li.classList.remove('active'));
      if (payload.type === ElementType.SEPARATOR) {
        const separator = payload.dashArray.join(',') || '0,0';
        const curSeparatorDom = separatorOptionDom.querySelector(`[data-separator='${separator}']`);
        if (curSeparatorDom) {
          curSeparatorDom.classList.add('active');
        }
      }

      // 富文本
      fontOptionDom.querySelectorAll('li').forEach((li) => li.classList.remove('active'));
      const curFontDom = fontOptionDom.querySelector(`[data-family='${payload.font}']`);
      if (curFontDom) {
        fontSelectDom.innerText = curFontDom.innerText;
        fontSelectDom.style.fontFamily = payload.font;
        curFontDom.classList.add('active');
      }
      sizeOptionDom.querySelectorAll('li').forEach((li) => li.classList.remove('active'));
      const curSizeDom = sizeOptionDom.querySelector(`[data-size='${payload.size}']`);
      if (curSizeDom) {
        sizeSelectDom.innerText = curSizeDom.innerText;
        curSizeDom.classList.add('active');
      } else {
        sizeSelectDom.innerText = `${payload.size}`;
      }
      payload.bold ? boldDom.classList.add('active') : boldDom.classList.remove('active');
      payload.italic ? italicDom.classList.add('active') : italicDom.classList.remove('active');
      payload.underline ? underlineDom.classList.add('active') : underlineDom.classList.remove('active');
      payload.strikeout ? strikeoutDom.classList.add('active') : strikeoutDom.classList.remove('active');
      if (payload.color) {
        colorDom.classList.add('active');
        colorControlDom.value = payload.color;
        colorSpanDom.style.backgroundColor = payload.color;
      } else {
        colorDom.classList.remove('active');
        colorControlDom.value = '#000000';
        colorSpanDom.style.backgroundColor = '#000000';
      }
      if (payload.highlight) {
        highlightDom.classList.add('active');
        highlightControlDom.value = payload.highlight;
        highlightSpanDom.style.backgroundColor = payload.highlight;
      } else {
        highlightDom.classList.remove('active');
        highlightControlDom.value = '#ffff00';
        highlightSpanDom.style.backgroundColor = '#ffff00';
      }
      // 行布局
      leftDom.classList.remove('active');
      centerDom.classList.remove('active');
      rightDom.classList.remove('active');
      alignmentDom.classList.remove('active');
      if (payload.rowFlex && payload.rowFlex === 'right') {
        rightDom.classList.add('active');
      } else if (payload.rowFlex && payload.rowFlex === 'center') {
        centerDom.classList.add('active');
      } else if (payload.rowFlex && payload.rowFlex === 'alignment') {
        alignmentDom.classList.add('active');
      } else {
        leftDom.classList.add('active');
      }

      // 行间距
      rowOptionDom.querySelectorAll('li').forEach((li) => li.classList.remove('active'));
      const curRowMarginDom = rowOptionDom.querySelector(`[data-rowmargin='${payload.rowMargin}']`);
      curRowMarginDom.classList.add('active');

      // 功能
      payload.undo ? undoDom.classList.remove('no-allow') : undoDom.classList.add('no-allow');
      payload.redo ? redoDom.classList.remove('no-allow') : redoDom.classList.add('no-allow');
      payload.painter ? painterDom.classList.add('active') : painterDom.classList.remove('active');
      // 标题
      titleOptionDom.querySelectorAll('li').forEach((li) => li.classList.remove('active'));
      if (payload.level) {
        const curTitleDom = titleOptionDom.querySelector(`[data-level='${payload.level}']`);
        titleSelectDom.innerText = curTitleDom.innerText;
        curTitleDom.classList.add('active');
      } else {
        titleSelectDom.innerText = '正文';
        titleOptionDom.querySelector('li:first-child').classList.add('active');
      }

      // 列表
      listOptionDom.querySelectorAll('li').forEach((li) => li.classList.remove('active'));
      if (payload.listType) {
        listDom.classList.add('active');
        const listType = payload.listType;
        const listStyle = payload.listType === ListType.OL ? ListStyle.DECIMAL : payload.listType;
        const curListDom = listOptionDom.querySelector(
          `[data-list-type='${listType}'][data-list-style='${listStyle}']`
        );
        if (curListDom) {
          curListDom.classList.add('active');
        }
      } else {
        listDom.classList.remove('active');
      }

      // 批注;
      commentDom.querySelectorAll('.comment-item').forEach((commentItemDom) => {
        commentItemDom.classList.remove('active');
      });
      if (payload.groupIds) {
        const [id] = payload.groupIds;
        const activeCommentDom = commentDom.querySelector(`.comment-item[data-id='${id}']`);
        if (activeCommentDom) {
          activeCommentDom.classList.add('active');
          scrollIntoView(commentDom, activeCommentDom);
        }
      }
    };

    instance.listener.visiblePageNoListChange = function (payload) {
      const text = payload.map((i) => i + 1).join('、');
      document.querySelector('.page-no-list').innerText = text;
    };

    instance.listener.pageSizeChange = function (payload) {
      if (document.querySelector('.page-size')) {
        document.querySelector('.page-size').innerText = payload.toString();
      }
    };

    instance.listener.intersectionPageNoChange = function (payload) {
      document.querySelector('.page-no').innerText = `${payload + 1}`;
    };

    instance.listener.pageScaleChange = function (payload) {
      document.querySelector('.page-scale-percentage').innerText = `${Math.floor(payload * 10 * 10)}%`;
    };

    instance.listener.controlChange = function (payload) {
      const disableMenusInControlContext = ['table', 'hyperlink', 'separator', 'page-break'];
      // 菜单操作权限
      disableMenusInControlContext.forEach((menu) => {
        const menuDom = document.querySelector(`.menu-item__${menu}`);
        payload ? menuDom.classList.add('disable') : menuDom.classList.remove('disable');
      });
    };

    instance.listener.pageModeChange = function (payload) {
      const activeMode = pageModeOptionsDom.querySelector(`[data-page-mode='${payload}']`);
      pageModeOptionsDom.querySelectorAll('li').forEach((li) => li.classList.remove('active'));
      activeMode.classList.add('active');
    };

    const handleContentChange = async () => {
      emits('isSave', true);
      // 字数
      const wordCount = await instance.command.getWordCount();
      document.querySelector('.word-count').innerText = `${wordCount || 0}`;
      // 目录
      if (isCatalogShow) {
        await nextTick(() => {
          updateCatalog();
        });
      }
      // // 批注
      await nextTick(() => {
        updateComment();
      });
    };
    instance.listener.contentChange = debounce(handleContentChange, 200);
    handleContentChange();

    // 9. 右键菜单注册
    instance.register.contextMenuList([
      {
        name: '批注',
        when: (payload) => {
          return !payload.isReadonly && payload.editorHasSelection && payload.zone === EditorZone.MAIN;
        },
        callback: (command) => {
          new Dialog({
            title: '批注',
            data: [
              {
                type: 'textarea',
                label: '批注',
                height: 100,
                name: 'value',
                required: true,
                placeholder: '请输入批注'
              }
            ],
            onConfirm: (payload) => {
              const value = payload.find((p) => p.name === 'value')?.value;
              if (!value) return;
              const groupId = command.executeSetGroup();
              if (!groupId) return;
              commentList.value.push({
                id: groupId,
                content: value,
                userName: 'Hufe',
                rangeText: command.getRangeText(),
                createdDate: new Date().toLocaleString()
              });
            }
          });
        }
      },
      {
        name: '签名',
        icon: 'signature',
        when: (payload) => {
          return !payload.isReadonly && payload.editorTextFocus;
        },
        callback: (command) => {
          new Signature({
            onConfirm(payload) {
              if (!payload) return;
              const { value, width, height } = payload;
              if (!value || !width || !height) return;
              command.executeInsertElementList([
                {
                  value,
                  width,
                  height,
                  type: ElementType.IMAGE
                }
              ]);
            }
          });
        }
      },
      {
        name: '格式整理',
        icon: 'word-tool',
        when: (payload) => {
          return !payload.isReadonly;
        },
        callback: (command) => {
          command.executeWordTool();
        }
      }
    ]);

    // 10. 快捷键注册
    instance.register.shortcutList([
      {
        key: KeyMap.P,
        mod: true,
        isGlobal: true,
        callback: (command) => {
          command.executePrint();
        }
      },
      {
        key: KeyMap.F,
        mod: true,
        isGlobal: true,
        callback: (command) => {
          const text = command.getRangeText();
          searchDom.click();
          if (text) {
            searchInputDom.value = text;
            instance.command.executeSearch(text);
            setSearchResult();
          }
        }
      },
      {
        key: KeyMap.MINUS,
        ctrl: true,
        isGlobal: true,
        callback: (command) => {
          command.executePageScaleMinus();
        }
      },
      {
        key: KeyMap.EQUAL,
        ctrl: true,
        isGlobal: true,
        callback: (command) => {
          command.executePageScaleAdd();
        }
      },
      {
        key: KeyMap.ZERO,
        ctrl: true,
        isGlobal: true,
        callback: (command) => {
          command.executePageScaleRecovery();
        }
      }
    ]);
  });
</script>

<template>
  <div id="app">
    <div class="menu" editor-component="menu">
      <div class="menu-item">
        <div class="menu-item__save" title="保存">
          <svg
            t="1754436488458"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="1476"
            width="16"
            height="16"
            fill="gray">
            <path
              d="M708.388571 121.904762L902.095238 320.804571V828.952381a73.142857 73.142857 0 0 1-73.142857 73.142857H195.047619a73.142857 73.142857 0 0 1-73.142857-73.142857V195.047619a73.142857 73.142857 0 0 1 73.142857-73.142857h513.340952zM292.571429 195.023238L195.047619 195.047619v633.904762l97.52381-0.024381V536.380952h438.857142v292.547048L828.952381 828.952381V350.549333l-97.52381-100.156952V365.714286H292.571429V195.023238zM658.285714 609.52381H365.714286v219.40419h292.571428V609.52381z m-48.761904 73.142857v73.142857h-195.04762v-73.142857h195.04762z m48.761904-487.619048H365.714286v97.52381h292.571428V195.047619z"
              p-id="1477"></path>
          </svg>
        </div>
        <div class="menu-item__undo">
          <i></i>
        </div>
        <div class="menu-item__redo">
          <i></i>
        </div>
        <div class="menu-item__painter" title="格式刷(双击可连续使用)">
          <i></i>
        </div>
        <div class="menu-item__format" title="清除格式">
          <i></i>
        </div>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item">
        <div class="menu-item__font">
          <span class="select" title="字体">微软雅黑</span>
          <div class="options">
            <ul>
              <li data-family="Microsoft YaHei" style="font-family: 'Microsoft YaHei'">微软雅黑</li>
              <li data-family="华文宋体" style="font-family: '华文宋体'">华文宋体</li>
              <li data-family="华文黑体" style="font-family: '华文黑体'">华文黑体</li>
              <li data-family="华文仿宋" style="font-family: '华文仿宋'">华文仿宋</li>
              <li data-family="华文楷体" style="font-family: '华文楷体'">华文楷体</li>
              <li data-family="华文琥珀" style="font-family: '华文琥珀'">华文琥珀</li>
              <li data-family="华文楷体" style="font-family: '华文楷体'">华文楷体</li>
              <li data-family="华文隶书" style="font-family: '华文隶书'">华文隶书</li>
              <li data-family="华文新魏" style="font-family: '华文新魏'">华文新魏</li>
              <li data-family="华文行楷" style="font-family: '华文行楷'">华文行楷</li>
              <li data-family="华文中宋" style="font-family: '华文中宋'">华文中宋</li>
              <li data-family="华文彩云" style="font-family: '华文彩云'">华文彩云</li>
              <li data-family="Arial" style="font-family: 'Arial'">Arial</li>
              <li data-family="Segoe UI" style="font-family: 'Segoe UI'">Segoe UI</li>
              <li data-family="Ink Free" style="font-family: 'Ink Free'">Ink Free</li>
              <li data-family="Fantasy" style="font-family: 'Fantasy'">Fantasy</li>
            </ul>
          </div>
        </div>
        <div class="menu-item__size">
          <span class="select" title="字体">小四</span>
          <div class="options">
            <ul>
              <li data-size="56">初号</li>
              <li data-size="48">小初</li>
              <li data-size="34">一号</li>
              <li data-size="32">小一</li>
              <li data-size="29">二号</li>
              <li data-size="24">小二</li>
              <li data-size="21">三号</li>
              <li data-size="20">小三</li>
              <li data-size="18">四号</li>
              <li data-size="16">小四</li>
              <li data-size="14">五号</li>
              <li data-size="12">小五</li>
              <li data-size="10">六号</li>
              <li data-size="8">小六</li>
              <li data-size="7">七号</li>
              <li data-size="6">八号</li>
            </ul>
          </div>
        </div>
        <div class="menu-item__size-add">
          <i></i>
        </div>
        <div class="menu-item__size-minus">
          <i></i>
        </div>
        <div class="menu-item__bold">
          <i></i>
        </div>
        <div class="menu-item__italic">
          <i></i>
        </div>
        <div class="menu-item__underline">
          <i></i>
          <span class="select"></span>
          <div class="options">
            <ul>
              <li data-decoration-style="solid">
                <i></i>
              </li>
              <li data-decoration-style="double">
                <i></i>
              </li>
              <li data-decoration-style="dashed">
                <i></i>
              </li>
              <li data-decoration-style="dotted">
                <i></i>
              </li>
              <li data-decoration-style="wavy">
                <i></i>
              </li>
            </ul>
          </div>
        </div>
        <div class="menu-item__strikeout" title="删除线(Ctrl+Shift+X)">
          <i></i>
        </div>
        <div class="menu-item__superscript">
          <i></i>
        </div>
        <div class="menu-item__subscript">
          <i></i>
        </div>
        <div class="menu-item__color" title="字体颜色">
          <i></i>
          <span></span>
          <input type="color" id="color" />
        </div>
        <div class="menu-item__highlight" title="高亮">
          <i></i>
          <span></span>
          <input type="color" id="highlight" />
        </div>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item">
        <div class="menu-item__title">
          <i></i>
          <span class="select" title="切换标题">正文</span>
          <div class="options">
            <ul>
              <li style="font-size: 16px">正文</li>
              <li data-level="first" style="font-size: 26px">标题1</li>
              <li data-level="second" style="font-size: 24px">标题2</li>
              <li data-level="third" style="font-size: 22px">标题3</li>
              <li data-level="fourth" style="font-size: 20px">标题4</li>
              <li data-level="fifth" style="font-size: 18px">标题5</li>
              <li data-level="sixth" style="font-size: 16px">标题6</li>
            </ul>
          </div>
        </div>
        <div class="menu-item__left">
          <i></i>
        </div>
        <div class="menu-item__center">
          <i></i>
        </div>
        <div class="menu-item__right">
          <i></i>
        </div>
        <div class="menu-item__alignment">
          <i></i>
        </div>
        <div class="menu-item__justify">
          <i></i>
        </div>
        <div class="menu-item__row-margin">
          <i title="行间距"></i>
          <div class="options">
            <ul>
              <li data-rowmargin="1">1</li>
              <li data-rowmargin="1.25">1.25</li>
              <li data-rowmargin="1.5">1.5</li>
              <li data-rowmargin="1.75">1.75</li>
              <li data-rowmargin="2">2</li>
              <li data-rowmargin="2.5">2.5</li>
              <li data-rowmargin="3">3</li>
            </ul>
          </div>
        </div>
        <div class="menu-item__list">
          <i></i>
          <div class="options">
            <ul>
              <li>
                <label>取消列表</label>
              </li>
              <li data-list-type="ol" data-list-style="decimal">
                <label>有序列表：</label>
                <ol>
                  <li>________</li>
                </ol>
              </li>
              <li data-list-type="ul" data-list-style="checkbox">
                <label>复选框列表：</label>
                <ul style="list-style-type: '☑️ '">
                  <li>________</li>
                </ul>
              </li>
              <li data-list-type="ul" data-list-style="disc">
                <label>实心圆点列表：</label>
                <ul style="list-style-type: disc">
                  <li>________</li>
                </ul>
              </li>
              <li data-list-type="ul" data-list-style="circle">
                <label>空心圆点列表：</label>
                <ul style="list-style-type: circle">
                  <li>________</li>
                </ul>
              </li>
              <li data-list-type="ul" data-list-style="square">
                <label>空心方块列表：</label>
                <ul style="list-style-type: '☐ '">
                  <li>________</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item">
        <div class="menu-item__table">
          <i title="表格"></i>
        </div>
        <div class="menu-item__table__collapse">
          <div class="table-close">×</div>
          <div class="table-title">
            <span class="table-select">插入</span>
            <span>表格</span>
          </div>
          <div class="table-panel"></div>
        </div>
        <div class="menu-item__image">
          <i title="图片"></i>
          <input type="file" id="image" accept=".png, .jpg, .jpeg, .svg, .gif" />
        </div>
        <div class="menu-item__hyperlink">
          <i title="超链接"></i>
        </div>
        <div class="menu-item__separator">
          <i title="分割线"></i>
          <div class="options">
            <ul>
              <li data-separator="0,0">
                <i></i>
              </li>
              <li data-separator="1,1">
                <i></i>
              </li>
              <li data-separator="3,1">
                <i></i>
              </li>
              <li data-separator="4,4">
                <i></i>
              </li>
              <li data-separator="7,3,3,3">
                <i></i>
              </li>
              <li data-separator="6,2,2,2,2,2">
                <i></i>
              </li>
            </ul>
          </div>
        </div>
        <div class="menu-item__watermark">
          <i title="水印(添加、删除)"></i>
          <div class="options">
            <ul>
              <li data-menu="add">添加水印</li>
              <li data-menu="delete">删除水印</li>
            </ul>
          </div>
        </div>
        <div class="menu-item__codeblock" title="代码块">
          <i></i>
        </div>
        <div class="menu-item__page-break" title="分页符">
          <i></i>
        </div>
        <div class="menu-item__control">
          <i title="控件"></i>
          <div class="options">
            <ul>
              <li data-control="text">文本</li>
              <!-- <li data-control="number">数值</li> -->
              <li data-control="select">列举</li>
              <!-- <li data-control="date">日期</li> -->
              <li data-control="checkbox">复选框</li>
              <!-- <li data-control="radio">单选框</li> -->
            </ul>
          </div>
        </div>
        <div class="menu-item__checkbox" title="复选框">
          <i></i>
        </div>
        <div class="menu-item__radio" title="单选框">
          <i></i>
        </div>
        <div class="menu-item__latex" title="LateX">
          <i></i>
        </div>
        <div class="menu-item__date">
          <i title="日期"></i>
          <div class="options">
            <ul>
              <li data-format="yyyy-MM-dd"></li>
              <li data-format="yyyy-MM-dd hh:mm:ss"></li>
            </ul>
          </div>
        </div>
        <div class="menu-item__block" title="内容块">
          <i></i>
        </div>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item">
        <div class="menu-item__search" data-menu="search">
          <i></i>
        </div>
        <div class="menu-item__search__collapse" data-menu="search">
          <div class="menu-item__search__collapse__search">
            <input type="text" />
            <label class="search-result"></label>
            <div class="arrow-left">
              <i></i>
            </div>
            <div class="arrow-right">
              <i></i>
            </div>
            <span>×</span>
          </div>
          <div class="menu-item__search__collapse__replace">
            <input type="text" />
            <button>替换</button>
          </div>
        </div>
        <div class="menu-item__print" data-menu="print">
          <i></i>
        </div>
      </div>
    </div>
    <div class="catalog" editor-component="catalog">
      <div class="catalog__header">
        <span>目录</span>
        <div class="catalog__header__close">
          <i></i>
        </div>
      </div>
      <div class="catalog__main"></div>
    </div>
    <div class="editor"></div>
    <div class="comment" editor-component="comment"></div>
    <div class="footer" editor-component="footer">
      <div>
        <div class="catalog-mode" title="目录">
          <i></i>
        </div>
        <div class="page-mode">
          <i title="页面模式(分页、连页)"></i>
          <div class="options">
            <ul>
              <li data-page-mode="paging" class="active">分页</li>
              <li data-page-mode="continuity">连页</li>
            </ul>
          </div>
        </div>
        <span>可见页码：<span class="page-no-list">1</span></span>
        <span>页面：<span class="page-no">1</span>/<span class="page-size">1</span></span>
        <span>字数：<span class="word-count">0</span></span>
        <span>行：<span class="row-no">0</span></span>
        <span>列：<span class="col-no">0</span></span>
      </div>
      <div class="editor-mode" title="编辑模式(编辑、清洁、只读、表单、设计)">编辑模式</div>
      <div>
        <div class="page-scale-minus" title="缩小(Ctrl+-)">
          <i></i>
        </div>
        <span class="page-scale-percentage" title="显示比例(点击可复原Ctrl+0)">100%</span>
        <div class="page-scale-add" title="放大(Ctrl+=)">
          <i></i>
        </div>
        <div class="paper-size">
          <i title="纸张类型"></i>
          <div class="options">
            <ul>
              <li data-paper-size="794*1123" class="active">A4</li>
              <li data-paper-size="1593*2251">A2</li>
              <li data-paper-size="1125*1593">A3</li>
              <li data-paper-size="565*796">A5</li>
              <li data-paper-size="412*488">5号信封</li>
              <li data-paper-size="450*866">6号信封</li>
              <li data-paper-size="609*862">7号信封</li>
              <li data-paper-size="862*1221">9号信封</li>
              <li data-paper-size="813*1266">法律用纸</li>
              <li data-paper-size="813*1054">信纸</li>
            </ul>
          </div>
        </div>
        <div class="paper-direction">
          <i title="纸张方向"></i>
          <div class="options">
            <ul>
              <li data-paper-direction="vertical" class="active">纵向</li>
              <li data-paper-direction="horizontal">横向</li>
            </ul>
          </div>
        </div>
        <div class="paper-margin" title="页边距">
          <i></i>
        </div>
        <div class="fullscreen" title="全屏显示">
          <i></i>
        </div>
        <div class="editor-option" title="编辑器设置">
          <i></i>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
  @import url('./components/dialog/dialog.css');
  @import url('./components/signature/signature.css');
  @import url(./style.css);
</style>
