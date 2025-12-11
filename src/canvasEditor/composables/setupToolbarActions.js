import { RowFlex } from '@hufe921/canvas-editor';

export const setupToolbarActions = (instance, context) => {
  const { options, emits, isApple } = context;

  // 保存
  const saveDom = document.querySelector('.menu-item__save');
  if (saveDom) {
    saveDom.title = `保存(${isApple.value ? '⌘' : 'Ctrl'}+S)`;
    saveDom.onclick = () => {
      const value = instance.command.getValue(options);
      emits('save', value.data);
    };
    instance.listener.saved = () => {
      const htmlVal = instance.command.getHTML();
      emits('save', htmlVal);
    };
  }

  // 撤销/重做/格式刷/清除格式
  const undoDom = document.querySelector('.menu-item__undo');
  if (undoDom) {
    undoDom.title = `撤销(${isApple.value ? '⌘' : 'Ctrl'}+Z)`;
    undoDom.onclick = () => {
      instance.command.executeUndo();
    };
  }
  const redoDom = document.querySelector('.menu-item__redo');
  if (redoDom) {
    redoDom.title = `重做(${isApple.value ? '⌘' : 'Ctrl'}+Y)`;
    redoDom.onclick = () => {
      instance.command.executeRedo();
    };
  }
  const painterDom = document.querySelector('.menu-item__painter');
  if (painterDom) {
    painterDom.onclick = () => {
      instance.command.executePainter({ isDblclick: false });
    };
    painterDom.ondblclick = () => {
      instance.command.executePainter({ isDblclick: true });
    };
  }
  const formatDom = document.querySelector('.menu-item__format');
  if (formatDom) {
    formatDom.onclick = () => {
      instance.command.executeFormat();
    };
  }

  // 字体
  const fontDom = document.querySelector('.menu-item__font');
  const fontSelectDom = fontDom?.querySelector('.select');
  const fontOptionDom = fontDom?.querySelector('.options');
  fontDom &&
    (fontDom.onclick = () => {
      fontOptionDom?.classList.toggle('visible');
    });
  fontOptionDom &&
    (fontOptionDom.onclick = (evt) => {
      const li = evt.target;
      li.dataset.family && instance.command.executeFont(li.dataset.family);
    });

  // 字号
  const sizeSetDom = document.querySelector('.menu-item__size');
  const sizeSelectDom = sizeSetDom?.querySelector('.select');
  const sizeOptionDom = sizeSetDom?.querySelector('.options');
  sizeSetDom &&
    (sizeSetDom.onclick = () => {
      sizeOptionDom?.classList.toggle('visible');
    });
  sizeOptionDom &&
    (sizeOptionDom.onclick = (evt) => {
      const li = evt.target;
      li.dataset.size && instance.command.executeSize(Number(li.dataset.size));
    });
  const sizeAddDom = document.querySelector('.menu-item__size-add');
  sizeAddDom &&
    (sizeAddDom.onclick = () => {
      instance.command.executeSizeAdd();
    });
  const sizeMinusDom = document.querySelector('.menu-item__size-minus');
  sizeMinusDom &&
    (sizeMinusDom.onclick = () => {
      instance.command.executeSizeMinus();
    });

  // 样式
  const boldDom = document.querySelector('.menu-item__bold');
  boldDom &&
    (boldDom.onclick = () => {
      instance.command.executeBold();
    });
  const italicDom = document.querySelector('.menu-item__italic');
  italicDom &&
    (italicDom.onclick = () => {
      instance.command.executeItalic();
    });
  const underlineDom = document.querySelector('.menu-item__underline');
  underlineDom &&
    (underlineDom.onclick = () => {
      instance.command.executeUnderline();
    });
  const strikeoutDom = document.querySelector('.menu-item__strikeout');
  strikeoutDom &&
    (strikeoutDom.onclick = () => {
      instance.command.executeStrikeout();
    });
  const superscriptDom = document.querySelector('.menu-item__superscript');
  superscriptDom &&
    (superscriptDom.onclick = () => {
      instance.command.executeSuperscript();
    });
  const subscriptDom = document.querySelector('.menu-item__subscript');
  subscriptDom &&
    (subscriptDom.onclick = () => {
      instance.command.executeSubscript();
    });

  // 颜色
  const colorControlDom = document.querySelector('#color');
  colorControlDom &&
    (colorControlDom.oninput = () => {
      instance.command.executeColor(colorControlDom.value);
    });
  const colorDom = document.querySelector('.menu-item__color');
  const colorSpanDom = colorDom?.querySelector('span');
  colorDom &&
    (colorDom.onclick = () => {
      colorControlDom?.click();
    });

  const highlightControlDom = document.querySelector('#highlight');
  highlightControlDom &&
    (highlightControlDom.oninput = () => {
      instance.command.executeHighlight(highlightControlDom.value);
    });
  const highlightDom = document.querySelector('.menu-item__highlight');
  const highlightSpanDom = highlightDom?.querySelector('span');
  highlightDom &&
    (highlightDom.onclick = () => {
      highlightControlDom?.click();
    });

  // 标题
  const titleDom = document.querySelector('.menu-item__title');
  const titleSelectDom = titleDom?.querySelector('.select');
  const titleOptionDom = titleDom?.querySelector('.options');
  titleOptionDom?.querySelectorAll('li').forEach((li, index) => {
    li.title = `Ctrl+${isApple.value ? 'Option' : 'Alt'}+${index}`;
  });
  titleDom &&
    (titleDom.onclick = () => {
      titleOptionDom?.classList.toggle('visible');
    });
  titleOptionDom &&
    (titleOptionDom.onclick = (evt) => {
      const li = evt.target;
      instance.command.executeTitle(li.dataset.level || null);
    });

  // 对齐
  const leftDom = document.querySelector('.menu-item__left');
  leftDom &&
    (leftDom.onclick = () => {
      instance.command.executeRowFlex(RowFlex.LEFT);
    });
  const centerDom = document.querySelector('.menu-item__center');
  centerDom &&
    (centerDom.onclick = () => {
      instance.command.executeRowFlex(RowFlex.CENTER);
    });
  const rightDom = document.querySelector('.menu-item__right');
  rightDom &&
    (rightDom.onclick = () => {
      instance.command.executeRowFlex(RowFlex.RIGHT);
    });
  const alignmentDom = document.querySelector('.menu-item__alignment');
  alignmentDom &&
    (alignmentDom.onclick = () => {
      instance.command.executeRowFlex(RowFlex.ALIGNMENT);
    });

  // 行间距
  const rowMarginDom = document.querySelector('.menu-item__row-margin');
  const rowOptionDom = rowMarginDom?.querySelector('.options');
  rowMarginDom &&
    (rowMarginDom.onclick = () => {
      rowOptionDom?.classList.toggle('visible');
    });
  rowOptionDom &&
    (rowOptionDom.onclick = (evt) => {
      const li = evt.target;
      li.dataset.rowmargin && instance.command.executeRowMargin(Number(li.dataset.rowmargin));
    });

  // 列表
  const listDom = document.querySelector('.menu-item__list');
  const listOptionDom = listDom?.querySelector('.options');
  listDom &&
    (listDom.onclick = () => {
      listOptionDom?.classList.toggle('visible');
    });
  listOptionDom &&
    (listOptionDom.onclick = (evt) => {
      const li = evt.target;
      const listType = li.dataset.listType || null;
      const listStyle = li.dataset.listStyle;
      instance.command.executeList(listType, listStyle);
    });

  // 表格
  const separatorDom = document.querySelector('.menu-item__separator');
  const separatorOptionDom = separatorDom?.querySelector('.options');
  separatorDom &&
    (separatorDom.onclick = () => {
      separatorOptionDom?.classList.toggle('visible');
    });
  separatorOptionDom &&
    (separatorOptionDom.onmousedown = (evt) => {
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
    });

  return {
    undoDom,
    redoDom,
    painterDom,
    fontSelectDom,
    fontOptionDom,
    sizeSelectDom,
    sizeOptionDom,
    boldDom,
    italicDom,
    underlineDom,
    strikeoutDom,
    superscriptDom,
    subscriptDom,
    colorDom,
    colorControlDom,
    colorSpanDom,
    highlightDom,
    highlightControlDom,
    highlightSpanDom,
    titleSelectDom,
    titleOptionDom,
    leftDom,
    centerDom,
    rightDom,
    alignmentDom,
    rowOptionDom,
    listDom,
    listOptionDom,
    separatorDom,
    separatorOptionDom
  };
};
