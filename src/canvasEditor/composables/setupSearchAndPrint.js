export const setupSearchAndPrint = (instance, context) => {
  const { isApple } = context;

  const searchCollapseDom = document.querySelector('.menu-item__search__collapse');
  const searchInputDom = document.querySelector('.menu-item__search__collapse__search input');
  const replaceInputDom = document.querySelector('.menu-item__search__collapse__replace input');
  const searchDom = document.querySelector('.menu-item__search');
  if (searchDom && searchCollapseDom && searchInputDom && replaceInputDom) {
    searchDom.title = `搜索与替换(${isApple.value ? '⌘' : 'Ctrl'}+F)`;
    const searchResultDom = searchCollapseDom.querySelector('.search-result');
    const setSearchResult = () => {
      const result = instance.command.getSearchNavigateInfo();
      if (result) {
        const { index, count } = result;
        searchResultDom.innerText = `${index}/${count}`;
      } else {
        searchResultDom.innerText = '';
      }
    };
    searchDom.onclick = () => {
      searchCollapseDom.style.display = 'block';
      const bodyRect = document.body.getBoundingClientRect();
      const searchRect = searchDom.getBoundingClientRect();
      const searchCollapseRect = searchCollapseDom.getBoundingClientRect();
      if (searchRect.left + searchCollapseRect.width > bodyRect.width) {
        searchCollapseDom.style.right = '0px';
        searchCollapseDom.style.left = 'unset';
      } else {
        searchCollapseDom.style.right = 'unset';
        searchCollapseDom.style.left = '0px';
      }
      searchInputDom.focus();
    };
    const closeSearch = () => {
      searchCollapseDom.style.display = 'none';
      searchInputDom.value = '';
      replaceInputDom.value = '';
      instance.command.executeSearch(null);
      setSearchResult();
    };
    searchCollapseDom.querySelector('span').onclick = closeSearch;
    searchInputDom.oninput = () => {
      instance.command.executeSearch(searchInputDom.value || null);
      setSearchResult();
    };
    searchInputDom.onkeydown = (evt) => {
      if (evt.key === 'Enter') {
        instance.command.executeSearch(searchInputDom.value || null);
        setSearchResult();
      }
    };
    const replaceButton = searchCollapseDom.querySelector('button');
    replaceButton.onclick = () => {
      const searchValue = searchInputDom.value;
      const replaceValue = replaceInputDom.value;
      if (searchValue && replaceValue && searchValue !== replaceValue) {
        instance.command.executeReplace(replaceValue);
      }
    };
    searchCollapseDom.querySelector('.arrow-left').onclick = () => {
      instance.command.executeSearchNavigatePre();
      setSearchResult();
    };
    searchCollapseDom.querySelector('.arrow-right').onclick = () => {
      instance.command.executeSearchNavigateNext();
      setSearchResult();
    };

    const printDom = document.querySelector('.menu-item__print');
    if (printDom) {
      printDom.title = `打印(${isApple.value ? '⌘' : 'Ctrl'}+P)`;
      printDom.onclick = () => {
        instance.command.executePrint();
      };
    }

    return {
      searchDom,
      searchInputDom,
      replaceInputDom,
      setSearchResult,
      printDom
    };
  }

  return {
    searchDom: null,
    searchInputDom: null,
    replaceInputDom: null,
    setSearchResult: () => {},
    printDom: null
  };
};
