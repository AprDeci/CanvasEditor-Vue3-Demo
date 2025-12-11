import { EditorMode, EditorZone, ElementType, KeyMap, ListStyle, ListType } from '@hufe921/canvas-editor';

export const setupModeAndListeners = (instance, context, helpers) => {
  const { commentList, emits, debounce, nextTick, Signature, Dialog, scrollIntoView } = context;
  const { toolbarRefs, searchRefs, viewOptions } = helpers;
  const {
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
  } = toolbarRefs;

  const modeElement = document.querySelector('.editor-mode');
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
  let modeIndex = 1;
  if (modeElement) {
    const applyMode = (modeInfo) => {
      modeElement.innerText = modeInfo.name;
      instance.command.executeMode(modeInfo.mode);
      const isReadonly = modeInfo.mode === EditorMode.READONLY;
      const enableMenuList = ['search', 'print'];
      document.querySelectorAll('.menu-item>div').forEach((dom) => {
        const menu = dom.dataset.menu;
        isReadonly && (!menu || !enableMenuList.includes(menu))
          ? dom.classList.add('disable')
          : dom.classList.remove('disable');
      });
    };
    applyMode(modeList[modeIndex]);
    modeElement.onclick = () => {
      modeIndex === modeList.length - 1 ? (modeIndex = 0) : modeIndex++;
      applyMode(modeList[modeIndex]);
    };
  }

  // 评论
  const commentDom = document.querySelector('.comment');
  const updateComment = async () => {
    if (!commentDom) return;
    const groupIds = await instance.command.getGroupIds();
    for (const comment of commentList.value) {
      const activeCommentDom = commentDom.querySelector(`.comment-item[data-id='${comment.id}']`);
      if (groupIds.includes(comment.id)) {
        if (!activeCommentDom) {
          const commentItem = document.createElement('div');
          commentItem.classList.add('comment-item');
          commentItem.setAttribute('data-id', comment.id);
          commentItem.onclick = () => {
            instance.command.executeLocationGroup(comment.id);
          };
          commentDom.append(commentItem);
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
          const commentItemInfo = document.createElement('div');
          commentItemInfo.classList.add('comment-item__info');
          const commentItemInfoName = document.createElement('span');
          commentItemInfoName.innerText = comment.userName;
          const commentItemInfoDate = document.createElement('span');
          commentItemInfoDate.innerText = comment.createdDate;
          commentItemInfo.append(commentItemInfoName);
          commentItemInfo.append(commentItemInfoDate);
          commentItem.append(commentItemInfo);
          const commentItemContent = document.createElement('div');
          commentItemContent.classList.add('comment-item__content');
          commentItemContent.innerText = comment.content;
          commentItem.append(commentItemContent);
          commentDom.append(commentItem);
        }
      } else {
        activeCommentDom?.remove();
      }
    }
  };

  const searchDom = searchRefs.searchDom;
  const searchInputDom = searchRefs.searchInputDom;
  const setSearchResult = searchRefs.setSearchResult;

  instance.listener.rangeStyleChange = (payload) => {
    payload.type === ElementType.SUBSCRIPT
      ? subscriptDom?.classList.add('active')
      : subscriptDom?.classList.remove('active');
    payload.type === ElementType.SUPERSCRIPT
      ? superscriptDom?.classList.add('active')
      : superscriptDom?.classList.remove('active');
    payload.type === ElementType.SEPARATOR
      ? separatorDom?.classList.add('active')
      : separatorDom?.classList.remove('active');
    separatorOptionDom?.querySelectorAll('li').forEach((li) => li.classList.remove('active'));
    if (payload.type === ElementType.SEPARATOR && separatorOptionDom) {
      const separator = payload.dashArray.join(',') || '0,0';
      const curSeparatorDom = separatorOptionDom.querySelector(`[data-separator='${separator}']`);
      curSeparatorDom?.classList.add('active');
    }

    fontOptionDom?.querySelectorAll('li').forEach((li) => li.classList.remove('active'));
    if (fontOptionDom && fontSelectDom) {
      const curFontDom = fontOptionDom.querySelector(`[data-family='${payload.font}']`);
      if (curFontDom) {
        fontSelectDom.innerText = curFontDom.innerText;
        fontSelectDom.style.fontFamily = payload.font;
        curFontDom.classList.add('active');
      }
    }

    sizeOptionDom?.querySelectorAll('li').forEach((li) => li.classList.remove('active'));
    if (sizeOptionDom && sizeSelectDom) {
      const curSizeDom = sizeOptionDom.querySelector(`[data-size='${payload.size}']`);
      if (curSizeDom) {
        sizeSelectDom.innerText = curSizeDom.innerText;
        curSizeDom.classList.add('active');
      } else {
        sizeSelectDom.innerText = `${payload.size}`;
      }
    }

    payload.bold ? boldDom?.classList.add('active') : boldDom?.classList.remove('active');
    payload.italic ? italicDom?.classList.add('active') : italicDom?.classList.remove('active');
    payload.underline ? underlineDom?.classList.add('active') : underlineDom?.classList.remove('active');
    payload.strikeout ? strikeoutDom?.classList.add('active') : strikeoutDom?.classList.remove('active');

    if (payload.color) {
      colorDom?.classList.add('active');
      if (colorControlDom) {
        colorControlDom.value = payload.color;
      }
      if (colorSpanDom) {
        colorSpanDom.style.backgroundColor = payload.color;
      }
    } else {
      colorDom?.classList.remove('active');
      if (colorControlDom) {
        colorControlDom.value = '#000000';
      }
      if (colorSpanDom) {
        colorSpanDom.style.backgroundColor = '#000000';
      }
    }

    if (payload.highlight) {
      highlightDom?.classList.add('active');
      if (highlightControlDom) {
        highlightControlDom.value = payload.highlight;
      }
      if (highlightSpanDom) {
        highlightSpanDom.style.backgroundColor = payload.highlight;
      }
    } else {
      highlightDom?.classList.remove('active');
      if (highlightControlDom) {
        highlightControlDom.value = '#ffff00';
      }
      if (highlightSpanDom) {
        highlightSpanDom.style.backgroundColor = '#ffff00';
      }
    }

    leftDom?.classList.remove('active');
    centerDom?.classList.remove('active');
    rightDom?.classList.remove('active');
    alignmentDom?.classList.remove('active');
    if (payload.rowFlex && payload.rowFlex === 'right') {
      rightDom?.classList.add('active');
    } else if (payload.rowFlex && payload.rowFlex === 'center') {
      centerDom?.classList.add('active');
    } else if (payload.rowFlex && payload.rowFlex === 'alignment') {
      alignmentDom?.classList.add('active');
    } else {
      leftDom?.classList.add('active');
    }

    rowOptionDom?.querySelectorAll('li').forEach((li) => li.classList.remove('active'));
    if (rowOptionDom) {
      const curRowMarginDom = rowOptionDom.querySelector(`[data-rowmargin='${payload.rowMargin}']`);
      curRowMarginDom?.classList.add('active');
    }

    payload.undo ? undoDom?.classList.remove('no-allow') : undoDom?.classList.add('no-allow');
    payload.redo ? redoDom?.classList.remove('no-allow') : redoDom?.classList.add('no-allow');
    payload.painter ? painterDom?.classList.add('active') : painterDom?.classList.remove('active');

    titleOptionDom?.querySelectorAll('li').forEach((li) => li.classList.remove('active'));
    if (titleSelectDom && titleOptionDom) {
      if (payload.level) {
        const curTitleDom = titleOptionDom.querySelector(`[data-level='${payload.level}']`);
        if (curTitleDom) {
          titleSelectDom.innerText = curTitleDom.innerText;
          curTitleDom.classList.add('active');
        }
      } else {
        titleSelectDom.innerText = '正文';
        titleOptionDom.querySelector('li:first-child')?.classList.add('active');
      }
    }

    listOptionDom?.querySelectorAll('li').forEach((li) => li.classList.remove('active'));
    if (payload.listType) {
      listDom?.classList.add('active');
      const listType = payload.listType;
      const listStyle = payload.listType === ListType.OL ? ListStyle.DECIMAL : payload.listType;
      if (listOptionDom) {
        const curListDom = listOptionDom.querySelector(
          `[data-list-type='${listType}'][data-list-style='${listStyle}']`
        );
        curListDom?.classList.add('active');
      }
    } else {
      listDom?.classList.remove('active');
    }

    commentDom?.querySelectorAll('.comment-item').forEach((commentItemDom) => {
      commentItemDom.classList.remove('active');
    });
    if (payload.groupIds && commentDom) {
      const [id] = payload.groupIds;
      const activeCommentDom = commentDom.querySelector(`.comment-item[data-id='${id}']`);
      if (activeCommentDom) {
        activeCommentDom.classList.add('active');
        scrollIntoView(commentDom, activeCommentDom);
      }
    }
  };

  instance.listener.visiblePageNoListChange = (payload) => {
    const text = payload.map((i) => i + 1).join('、');
    const pageNoListDom = document.querySelector('.page-no-list');
    if (pageNoListDom) {
      pageNoListDom.innerText = text;
    }
  };

  instance.listener.pageSizeChange = (payload) => {
    const pageSizeDom = document.querySelector('.page-size');
    if (pageSizeDom) {
      pageSizeDom.innerText = payload.toString();
    }
  };

  instance.listener.intersectionPageNoChange = (payload) => {
    const pageNoDom = document.querySelector('.page-no');
    if (pageNoDom) {
      pageNoDom.innerText = `${payload + 1}`;
    }
  };

  instance.listener.pageScaleChange = (payload) => {
    const pageScalePercentageDom = document.querySelector('.page-scale-percentage');
    if (pageScalePercentageDom) {
      pageScalePercentageDom.innerText = `${Math.floor(payload * 10 * 10)}%`;
    }
  };

  instance.listener.controlChange = (payload) => {
    const disableMenusInControlContext = ['table', 'hyperlink', 'separator', 'page-break'];
    disableMenusInControlContext.forEach((menu) => {
      const menuDom = document.querySelector(`.menu-item__${menu}`);
      if (!menuDom) return;
      payload ? menuDom.classList.add('disable') : menuDom.classList.remove('disable');
    });
  };

  const pageModeOptionsDom = viewOptions.pageModeOptionsDom;
  instance.listener.pageModeChange = (payload) => {
    const activeMode = pageModeOptionsDom?.querySelector(`[data-page-mode='${payload}']`);
    pageModeOptionsDom?.querySelectorAll('li').forEach((li) => li.classList.remove('active'));
    activeMode?.classList.add('active');
  };

  const handleContentChange = async () => {
    emits('isSave', true);
    const wordCount = await instance.command.getWordCount();
    const wordCountDom = document.querySelector('.word-count');
    if (wordCountDom) {
      wordCountDom.innerText = `${wordCount || 0}`;
    }
    if (viewOptions.catalogState.isCatalogShow()) {
      await nextTick(() => {
        viewOptions.updateCatalog();
      });
    }
    await nextTick(() => {
      updateComment();
    });
  };
  instance.listener.contentChange = debounce(handleContentChange, 200);
  handleContentChange();

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
        searchDom?.click();
        if (text && searchInputDom) {
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
};
