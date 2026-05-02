(function () {
  var items = Array.from(document.querySelectorAll('[data-lazy-index-item]')).filter(function (node) {
    return node instanceof HTMLElement;
  });
  if (!items.length) return;

  function setToggle(item, expanded) {
    var toggle = item.querySelector('[data-lazy-toggle]');
    var content = item.querySelector('[data-lazy-content]');
    if (toggle instanceof HTMLButtonElement) {
      toggle.textContent = expanded ? '收起' : '展开';
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }
    if (content instanceof HTMLElement) {
      content.hidden = !expanded;
    }
    item.dataset.lazyExpanded = expanded ? '1' : '0';
  }

  function extractListHtml(text) {
    var doc = new DOMParser().parseFromString(text, 'text/html');
    var node = doc.querySelector('[data-lazy-list-content]');
    if (!node) {
      node = doc.querySelector('#main-content article .nested');
    }
    return node ? node.innerHTML : '';
  }

  function loadItem(item) {
    if (!(item instanceof HTMLElement)) return Promise.resolve();
    if (item.dataset.lazyLoaded === '1') {
      setToggle(item, true);
      return Promise.resolve();
    }
    if (item.dataset.lazyLoading === '1') return Promise.resolve();

    var content = item.querySelector('[data-lazy-content]');
    var url = item.getAttribute('data-lazy-url') || '';
    if (!(content instanceof HTMLElement) || !url) return Promise.resolve();

    item.dataset.lazyLoading = '1';
    content.hidden = false;
    content.classList.add('is-loading');
    content.textContent = '正在加载...';
    setToggle(item, true);

    return fetch(url, {
      headers: {
        Accept: 'text/html',
        'X-Requested-With': 'fetch'
      }
    })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.text();
      })
      .then(function (text) {
        var html = extractListHtml(text);
        if (!html) throw new Error('empty fragment');
        content.classList.remove('is-loading', 'is-error');
        content.innerHTML = html;
        content.hidden = false;
        item.dataset.lazyLoaded = '1';
        setToggle(item, true);
      })
      .catch(function () {
        content.classList.remove('is-loading');
        content.classList.add('is-error');
        content.textContent = '加载失败，请点击标题进入详情页。';
      })
      .then(function () {
        item.dataset.lazyLoading = '0';
      });
  }

  function collapseItem(item) {
    if (!(item instanceof HTMLElement)) return;
    item.dataset.lazyWanted = '0';
    setToggle(item, false);
  }

  function toggleItem(item) {
    if (!(item instanceof HTMLElement)) return;
    if (item.dataset.lazyExpanded === '1') {
      collapseItem(item);
      return;
    }
    item.dataset.lazyWanted = '1';
    loadItem(item);
  }

  function shouldIgnoreHeaderClick(event) {
    var target = event.target;
    if (!(target instanceof Element)) return false;
    return !!target.closest('a, input, select, textarea');
  }

  var observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var item = entry.target;
          if (!(item instanceof HTMLElement)) return;
          if (entry.isIntersecting && item.dataset.lazyWanted === '1') {
            loadItem(item);
          }
        });
      }, { rootMargin: '160px 0px' })
    : null;

  items.forEach(function (item) {
    if (observer) observer.observe(item);
    var header = item.querySelector('.lazy-index-item__header');
    if (header instanceof HTMLElement) {
      header.addEventListener('click', function (event) {
        if (shouldIgnoreHeaderClick(event)) return;
        toggleItem(item);
      });
    }
  });

  document.querySelectorAll('[data-lazy-expand-all]').forEach(function (button) {
    button.addEventListener('click', function () {
      items.forEach(function (item) {
        if (!(item instanceof HTMLElement)) return;
        item.dataset.lazyWanted = '1';
        var rect = item.getBoundingClientRect();
        if (rect.bottom >= -160 && rect.top <= window.innerHeight + 160) {
          loadItem(item);
        }
      });
    });
  });

  document.querySelectorAll('[data-lazy-collapse-all]').forEach(function (button) {
    button.addEventListener('click', function () {
      items.forEach(collapseItem);
    });
  });
})();
