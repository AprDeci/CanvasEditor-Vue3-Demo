import {
  BlockType,
  ControlType,
  ElementType,
  ListStyle,
  ListType
} from '@hufe921/canvas-editor';

export const setupInsertTools = (instance, context) => {
  const { Dialog, splitText, Signature } = context;

  // 表格
  const tableDom = document.querySelector('.menu-item__table');
  const tablePanelContainer = document.querySelector('.menu-item__table__collapse');
  const tableClose = document.querySelector('.table-close');
  const tableTitle = document.querySelector('.table-select');
  const tablePanel = document.querySelector('.table-panel');
  const tableCellList = [];
  if (tablePanel) {
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
  }
  let colIndex = 0;
  let rowIndex = 0;
  function removeAllTableCellSelect() {
    tableCellList.forEach((tr) => {
      tr.forEach((td) => td.classList.remove('active'));
    });
  }
  function setTableTitle(payload) {
    tableTitle && (tableTitle.innerText = payload);
  }
  function recoveryTable() {
    removeAllTableCellSelect();
    setTableTitle('插入');
    colIndex = 0;
    rowIndex = 0;
    if (tablePanelContainer) {
      tablePanelContainer.style.display = 'none';
    }
  }
  tableDom &&
    (tableDom.onclick = () => {
      if (tablePanelContainer) {
        tablePanelContainer.style.display = 'block';
      }
    });
  tablePanel &&
    (tablePanel.onmousemove = (evt) => {
      const celSize = 16;
      const rowMarginTop = 10;
      const celMarginRight = 6;
      const { offsetX, offsetY } = evt;
      removeAllTableCellSelect();
      colIndex = Math.ceil(offsetX / (celSize + celMarginRight)) || 1;
      rowIndex = Math.ceil(offsetY / (celSize + rowMarginTop)) || 1;
      tableCellList.forEach((tr, trIndex) => {
        tr.forEach((td, tdIndex) => {
          if (tdIndex < colIndex && trIndex < rowIndex) {
            td.classList.add('active');
          }
        });
      });
      setTableTitle(`${rowIndex}×${colIndex}`);
    });
  tableClose &&
    (tableClose.onclick = () => {
      recoveryTable();
    });
  tablePanel &&
    (tablePanel.onclick = () => {
      instance.command.executeInsertTable(rowIndex, colIndex);
      recoveryTable();
    });

  // 图片
  const imageDom = document.querySelector('.menu-item__image');
  const imageFileDom = document.querySelector('#image');
  imageDom &&
    (imageDom.onclick = () => {
      imageFileDom?.click();
    });
  imageFileDom &&
    (imageFileDom.onchange = () => {
      const file = imageFileDom.files[0];
      if (!file) return;
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        const image = new Image();
        const value = String(fileReader.result);
        image.src = value;
        image.onload = () => {
          instance.command.executeImage({
            value,
            width: image.width,
            height: image.height
          });
          imageFileDom.value = '';
        };
      };
    });

  // 超链接
  const hyperlinkDom = document.querySelector('.menu-item__hyperlink');
  hyperlinkDom &&
    (hyperlinkDom.onclick = () => {
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
            url,
            valueList: splitText(name).map((n) => ({
              value: n,
              size: 16
            }))
          });
        }
      });
    });

  // 分页符
  const pageBreakDom = document.querySelector('.menu-item__page-break');
  pageBreakDom &&
    (pageBreakDom.onclick = () => {
      instance.command.executePageBreak();
    });

  // 水印
  const watermarkDom = document.querySelector('.menu-item__watermark');
  const watermarkOptionDom = watermarkDom?.querySelector('.options');
  watermarkDom &&
    (watermarkDom.onclick = () => {
      watermarkOptionDom?.classList.toggle('visible');
    });
  watermarkOptionDom &&
    (watermarkOptionDom.onmousedown = (evt) => {
      const li = evt.target;
      const menu = li.dataset.menu;
      watermarkOptionDom.classList.toggle('visible');
      if (menu === 'add') {
        new Dialog({
          title: '水印',
          data: [
            {
              type: 'text',
              label: '内容',
              name: 'data',
              required: true,
              placeholder: '请输入内容'
            },
            {
              type: 'color',
              label: '颜色',
              name: 'color',
              required: true,
              value: '#AEB5C0'
            },
            {
              type: 'number',
              label: '字体大小',
              name: 'size',
              required: true,
              value: '120'
            }
          ],
          onConfirm: (payload) => {
            const nullableIndex = payload.findIndex((p) => !p.value);
            if (~nullableIndex) return;
            const watermark = payload.reduce((pre, cur) => {
              pre[cur.name] = cur.value;
              return pre;
            }, {});
            instance.command.executeAddWatermark({
              data: watermark.data,
              color: watermark.color,
              size: Number(watermark.size)
            });
          }
        });
      } else {
        instance.command.executeDeleteWatermark();
      }
    });

  // 代码块
  const codeblockDom = document.querySelector('.menu-item__codeblock');
  codeblockDom &&
    (codeblockDom.onclick = () => {
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
              const element = { value };
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
          elementList.unshift({ value: '\n' });
          instance.command.executeInsertElementList(elementList);
        }
      });
    });

  // 控件
  const controlDom = document.querySelector('.menu-item__control');
  const controlOptionDom = controlDom?.querySelector('.options');
  controlDom &&
    (controlDom.onclick = () => {
      controlOptionDom?.classList.toggle('visible');
    });
  controlOptionDom &&
    (controlOptionDom.onmousedown = (evt) => {
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
    });

  // 复选框/单选框
  const checkboxDom = document.querySelector('.menu-item__checkbox');
  checkboxDom &&
    (checkboxDom.onclick = () => {
      instance.command.executeInsertElementList([
        {
          type: ElementType.CHECKBOX,
          checkbox: {
            value: false
          },
          value: ''
        }
      ]);
    });
  const radioDom = document.querySelector('.menu-item__radio');
  radioDom &&
    (radioDom.onclick = () => {
      instance.command.executeInsertElementList([
        {
          type: ElementType.RADIO,
          checkbox: {
            value: false
          },
          value: ''
        }
      ]);
    });

  // LaTeX
  const latexDom = document.querySelector('.menu-item__latex');
  latexDom &&
    (latexDom.onclick = () => {
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
    });

  // 日期
  const dateDom = document.querySelector('.menu-item__date');
  const dateDomOptionDom = dateDom?.querySelector('.options');
  dateDom &&
    (dateDom.onclick = () => {
      dateDomOptionDom?.classList.toggle('visible');
      if (!dateDomOptionDom) return;
      const bodyRect = document.body.getBoundingClientRect();
      const dateDomOptionRect = dateDomOptionDom.getBoundingClientRect();
      if (dateDomOptionRect.left + dateDomOptionRect.width > bodyRect.width) {
        dateDomOptionDom.style.right = '0px';
        dateDomOptionDom.style.left = 'unset';
      } else {
        dateDomOptionDom.style.right = 'unset';
        dateDomOptionDom.style.left = '0px';
      }
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
    });
  dateDomOptionDom &&
    (dateDomOptionDom.onmousedown = (evt) => {
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
    });
};
