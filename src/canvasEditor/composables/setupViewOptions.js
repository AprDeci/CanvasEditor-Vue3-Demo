export const setupViewOptions = (instance, context) => {
  const { Dialog } = context;

  const catalogDom = document.querySelector('.catalog');
  const catalogModeDom = document.querySelector('.catalog-mode');
  const catalogHeaderCloseDom = document.querySelector('.catalog__header__close');
  let isCatalogShow = true;

  const updateCatalog = async () => {
    const catalog = await instance.command.getCatalog();
    const catalogMainDom = document.querySelector('.catalog__main');
    if (!catalogMainDom) return;
    catalogMainDom.innerHTML = '';
    if (catalog) {
      const appendCatalog = (parent, catalogItems) => {
        for (let c = 0; c < catalogItems.length; c++) {
          const catalogItem = catalogItems[c];
          const catalogItemDom = document.createElement('div');
          catalogItemDom.classList.add('catalog-item');
          const catalogItemContentDom = document.createElement('div');
          catalogItemContentDom.classList.add('catalog-item__content');
          const catalogItemContentSpanDom = document.createElement('span');
          catalogItemContentSpanDom.innerText = catalogItem.name;
          catalogItemContentDom.append(catalogItemContentSpanDom);
          catalogItemContentDom.onclick = () => {
            instance.command.executeLocationCatalog(catalogItem.id);
          };
          catalogItemDom.append(catalogItemContentDom);
          if (catalogItem.subCatalog && catalogItem.subCatalog.length) {
            appendCatalog(catalogItemDom, catalogItem.subCatalog);
          }
          parent.append(catalogItemDom);
        }
      };
      appendCatalog(catalogMainDom, catalog);
    }
  };

  const switchCatalog = () => {
    isCatalogShow = !isCatalogShow;
    if (!catalogDom) return;
    if (isCatalogShow) {
      catalogDom.style.display = 'block';
      updateCatalog();
    } else {
      catalogDom.style.display = 'none';
    }
  };

  catalogModeDom && (catalogModeDom.onclick = switchCatalog);
  catalogHeaderCloseDom && (catalogHeaderCloseDom.onclick = switchCatalog);

  const pageModeDom = document.querySelector('.page-mode');
  const pageModeOptionsDom = pageModeDom?.querySelector('.options');
  pageModeDom &&
    (pageModeDom.onclick = () => {
      pageModeOptionsDom?.classList.toggle('visible');
    });
  pageModeOptionsDom &&
    (pageModeOptionsDom.onclick = (evt) => {
      const li = evt.target;
      li.dataset.pageMode && instance.command.executePageMode(li.dataset.pageMode);
    });

  const pageScalePercentageDom = document.querySelector('.page-scale-percentage');
  const pageScaleMinusDom = document.querySelector('.page-scale-minus');
  const pageScaleAddDom = document.querySelector('.page-scale-add');
  pageScalePercentageDom &&
    (pageScalePercentageDom.onclick = () => {
      instance.command.executePageScaleRecovery();
    });
  pageScaleMinusDom &&
    (pageScaleMinusDom.onclick = () => {
      instance.command.executePageScaleMinus();
    });
  pageScaleAddDom &&
    (pageScaleAddDom.onclick = () => {
      instance.command.executePageScaleAdd();
    });

  const paperSizeDom = document.querySelector('.paper-size');
  const paperSizeDomOptionsDom = paperSizeDom?.querySelector('.options');
  paperSizeDom &&
    (paperSizeDom.onclick = () => {
      paperSizeDomOptionsDom?.classList.toggle('visible');
    });
  paperSizeDomOptionsDom &&
    (paperSizeDomOptionsDom.onclick = (evt) => {
      const li = evt.target;
      const paperType = li.dataset.paperSize;
      if (!paperType) return;
      const [width, height] = paperType.split('*').map(Number);
      instance.command.executePaperSize(width, height);
      paperSizeDomOptionsDom.querySelectorAll('li').forEach((child) => child.classList.remove('active'));
      li.classList.add('active');
    });

  const paperDirectionDom = document.querySelector('.paper-direction');
  const paperDirectionDomOptionsDom = paperDirectionDom?.querySelector('.options');
  paperDirectionDom &&
    (paperDirectionDom.onclick = () => {
      paperDirectionDomOptionsDom?.classList.toggle('visible');
    });
  paperDirectionDomOptionsDom &&
    (paperDirectionDomOptionsDom.onclick = (evt) => {
      const li = evt.target;
      const paperDirection = li.dataset.paperDirection;
      if (!paperDirection) return;
      instance.command.executePaperDirection(paperDirection);
      paperDirectionDomOptionsDom.querySelectorAll('li').forEach((child) => child.classList.remove('active'));
      li.classList.add('active');
    });

  const paperMarginDom = document.querySelector('.paper-margin');
  paperMarginDom &&
    (paperMarginDom.onclick = () => {
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
    });

  const fullscreenDom = document.querySelector('.fullscreen');
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };
  fullscreenDom && (fullscreenDom.onclick = toggleFullscreen);
  window.addEventListener('keydown', (evt) => {
    if (evt.key === 'F11') {
      toggleFullscreen();
      evt.preventDefault();
    }
  });
  document.addEventListener('fullscreenchange', () => {
    fullscreenDom?.classList.toggle('exist');
  });

  return {
    updateCatalog,
    catalogState: {
      isCatalogShow: () => isCatalogShow
    },
    pageModeOptionsDom
  };
};
