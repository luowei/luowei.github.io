(function () {
  var form = document.getElementById('search-form');
  var input = document.getElementById('query');
  var mainContent = document.getElementById('main-content');
  var resultsContainer = document.getElementById('search-results');

  if (!(form instanceof HTMLFormElement) || !(input instanceof HTMLInputElement) || !resultsContainer || !mainContent) {
    return;
  }

  var searchIndexPromise;
  var currentRenderedItems = [];
  var currentState = null;
  var visibleCount = 0;
  var PAGE_SIZE = 12;

  function fetchIndex() {
    if (!searchIndexPromise) {
      var codec = window.__publicDataCodec;
      if (!codec || typeof codec.fetchMessagePackGzip !== 'function') {
        return Promise.reject(new Error('搜索索引解码器不可用'));
      }

      searchIndexPromise = codec
        .fetchMessagePackGzip('/assets/site/search-index-v1.msgpack.gz')
        .then(normalizeSearchIndexPayload);
    }

    return searchIndexPromise;
  }

  function normalizeSearchIndexPayload(payload) {
    var schema = Array.isArray(payload) && Array.isArray(payload[1]) ? payload[1] : [];
    var rows = Array.isArray(payload) && Array.isArray(payload[2]) ? payload[2] : [];
    var titleIndex = schema.indexOf('title');
    var slugIndex = schema.indexOf('slug');
    var urlIndex = schema.indexOf('url');
    var summaryIndex = schema.indexOf('summary');
    var contentIndex = schema.indexOf('content');
    var categoriesIndex = schema.indexOf('categories');
    var tagsIndex = schema.indexOf('tags');
    var dateIndex = schema.indexOf('date');

    return rows.map(function (row) {
      return {
        title: String(row[titleIndex] || ''),
        slug: String(row[slugIndex] || ''),
        url: String(row[urlIndex] || ''),
        summary: String(row[summaryIndex] || ''),
        content: String(row[contentIndex] || ''),
        categories: Array.isArray(row[categoriesIndex]) ? row[categoriesIndex] : [],
        tags: Array.isArray(row[tagsIndex]) ? row[tagsIndex] : [],
        date: String(row[dateIndex] || '')
      };
    });
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function tokenizeQuery(query) {
    var tokens = [];
    var seen = new Set();
    var normalized = String(query || '').trim().toLowerCase();
    if (!normalized) {
      return tokens;
    }

    normalized.split(/\s+/).filter(Boolean).forEach(function (token) {
      if (!seen.has(token)) {
        seen.add(token);
        tokens.push(token);
      }
    });

    var cjkOnly = normalized.replace(/\s+/g, '');
    if (/[\u3400-\u9fff]/.test(cjkOnly)) {
      if (!seen.has(cjkOnly)) {
        seen.add(cjkOnly);
        tokens.push(cjkOnly);
      }

      for (var i = 0; i < cjkOnly.length - 1; i += 1) {
        var bigram = cjkOnly.slice(i, i + 2);
        if (!seen.has(bigram)) {
          seen.add(bigram);
          tokens.push(bigram);
        }
      }
    }

    return tokens;
  }

  function getStateFromUrl() {
    var url = new URL(window.location.href);
    return {
      q: (url.searchParams.get('q') || '').trim(),
      category: (url.searchParams.get('category') || '').trim(),
      tag: (url.searchParams.get('tag') || '').trim()
    };
  }

  function updateUrl(state) {
    var url = new URL(window.location.href);
    ['q', 'category', 'tag'].forEach(function (key) {
      if (state[key]) {
        url.searchParams.set(key, state[key]);
      } else {
        url.searchParams.delete(key);
      }
    });
    window.history.pushState({}, '', url);
  }

  function highlightText(text, query) {
    if (!query) {
      return escapeHtml(text);
    }

    var terms = tokenizeQuery(query).map(escapeRegex);

    if (terms.length === 0) {
      return escapeHtml(text);
    }

    var pattern = new RegExp('(' + terms.join('|') + ')', 'gi');
    return escapeHtml(text).replace(pattern, '<mark class="search-highlight">$1</mark>');
  }

  function buildSnippet(item, query) {
    var source = String(item.content || item.summary || '').replace(/\s+/g, ' ').trim();
    if (!source) {
      return '';
    }

    if (!query) {
      return source.slice(0, 180);
    }

    var lowerSource = source.toLowerCase();
    var terms = tokenizeQuery(query);

    var firstIndex = -1;
    terms.forEach(function (term) {
      if (firstIndex !== -1) return;
      firstIndex = lowerSource.indexOf(term);
    });

    if (firstIndex === -1) {
      return source.slice(0, 180);
    }

    var start = Math.max(0, firstIndex - 50);
    var end = Math.min(source.length, firstIndex + 130);
    var snippet = source.slice(start, end).trim();
    if (start > 0) snippet = '…' + snippet;
    if (end < source.length) snippet = snippet + '…';
    return snippet;
  }

  function scoreItem(item, state) {
    var keywords = tokenizeQuery(state.q);

    var haystacks = {
      title: String(item.title || '').toLowerCase(),
      summary: String(item.summary || '').toLowerCase(),
      content: String(item.content || '').toLowerCase(),
      categories: (item.categories || []).join(' ').toLowerCase(),
      tags: (item.tags || []).join(' ').toLowerCase()
    };

    if (state.category && !(item.categories || []).includes(state.category)) {
      return 0;
    }
    if (state.tag && !(item.tags || []).includes(state.tag)) {
      return 0;
    }

    if (keywords.length === 0) {
      return state.category || state.tag ? 1 : 0;
    }

    var score = 0;
    if (state.q && haystacks.title === state.q.toLowerCase()) {
      score += 40;
    }
    if (state.q && haystacks.title.startsWith(state.q.toLowerCase())) {
      score += 20;
    }
    keywords.forEach(function (term) {
      if (haystacks.title.includes(term)) score += 10;
      if (haystacks.summary.includes(term)) score += 5;
      if (haystacks.content.includes(term)) score += 2;
      if (haystacks.categories.includes(term)) score += 3;
      if (haystacks.tags.includes(term)) score += 3;
    });

    var timestamp = Date.parse(item.date || '');
    if (!Number.isNaN(timestamp)) {
      score += Math.max(0, timestamp / 1e13);
    }

    return score;
  }

  function buildFilterTags(state) {
    var tags = [];
    if (state.category) {
      tags.push('<li><a href="#" data-clear-filter="category">分类: ' + escapeHtml(state.category) + ' ×</a></li>');
    }
    if (state.tag) {
      tags.push('<li><a href="#" data-clear-filter="tag">标签: ' + escapeHtml(state.tag) + ' ×</a></li>');
    }
    return tags.length ? '<div class="search-active-filters"><ul class="tag-box">' + tags.join('') + '</ul></div>' : '';
  }

  function buildResultsHtml(state, items) {
    return items
      .map(function (item) {
        var tags = (item.tags || []).slice(0, 6).map(function (tag) {
          return '<li><a href="/tags/' + encodeURIComponent(String(tag).toLowerCase()) + '/">' + escapeHtml(tag) + '</a></li>';
        }).join('');

        var categoryText = '';
        if ((item.categories || []).length) {
          categoryText = '，类别：<a href="/categories/' + encodeURIComponent(String(item.categories[0]).toLowerCase()) + '/">' + escapeHtml(item.categories[0]) + '</a>';
        }

        return '<li class="post-card">' +
          '<strong><a href="' + escapeHtml(item.url) + '">' + highlightText(item.title, state.q) + '</a></strong>' +
          '<div class="post-card__meta-row">' +
            '<div class="post-card__meta">' + escapeHtml(item.date || '') + categoryText + '</div>' +
            (tags ? '<ul class="tag-box tag-box--inline">' + tags + '</ul>' : '') +
          '</div>' +
          '<div class="post-card__summary">' + highlightText(buildSnippet(item, state.q), state.q) + '</div>' +
        '</li>';
      })
      .join('');
  }

  function renderResults(state, items, append) {
    var resultItems = buildResultsHtml(state, items);
    var queryText = state.q || '未填写';
    if (!append) {
      resultsContainer.innerHTML = '' +
        '<section id="content">' +
          '<article class="post">' +
            '<header class="page-header">' +
              '<span class="badge">Search</span>' +
              '<h1>搜索结果</h1>' +
              '<p>关键词：' + escapeHtml(queryText) + '，共 ' + currentRenderedItems.length + ' 条结果。</p>' +
              buildFilterTags(state) +
            '</header>' +
            '<section class="nested">' +
              '<ul id="search-results-list" class="post-list">' + (resultItems || '<li class="post-card__summary">没有匹配结果。</li>') + '</ul>' +
              '<div id="search-load-more" class="search-load-more"></div>' +
            '</section>' +
          '</article>' +
        '</section>';
    } else {
      var list = document.getElementById('search-results-list');
      if (list) {
        list.insertAdjacentHTML('beforeend', resultItems);
      }
    }

    var loadMore = document.getElementById('search-load-more');
    if (loadMore) {
      if (visibleCount < currentRenderedItems.length) {
        loadMore.innerHTML = '<button type="button" id="search-load-more-button" class="button-link">显示更多结果</button>';
        var button = document.getElementById('search-load-more-button');
        if (button) {
          button.addEventListener('click', function () {
            renderNextPage();
          });
        }
      } else {
        loadMore.innerHTML = '';
      }
    }

    resultsContainer.querySelectorAll('[data-clear-filter]').forEach(function (node) {
      node.addEventListener('click', function (event) {
        event.preventDefault();
        var key = node.getAttribute('data-clear-filter');
        var nextState = {
          q: state.q,
          category: state.category,
          tag: state.tag
        };
        if (key === 'category') nextState.category = '';
        if (key === 'tag') nextState.tag = '';
        syncForm(nextState);
        updateUrl(nextState);
        applySearch(nextState);
      });
    });
  }

  function renderNextPage() {
    if (!currentState) {
      return;
    }

    var nextItems = currentRenderedItems.slice(visibleCount, visibleCount + PAGE_SIZE);
    if (nextItems.length === 0) {
      return;
    }

    visibleCount += nextItems.length;
    renderResults(currentState, nextItems, visibleCount > nextItems.length);
  }

  function syncForm(state) {
    input.value = state.q;
  }

  function applySearch(state) {
    if (!state.q && !state.category && !state.tag) {
      resultsContainer.hidden = true;
      mainContent.hidden = false;
      return;
    }

    resultsContainer.hidden = false;
    mainContent.hidden = true;

    fetchIndex()
      .then(function (items) {
        currentState = state;
        currentRenderedItems = items
          .map(function (item) {
            return { item: item, score: scoreItem(item, state) };
          })
          .filter(function (entry) {
            return entry.score > 0;
          })
          .sort(function (left, right) {
            return right.score - left.score;
          })
          .map(function (entry) {
            return entry.item;
          });

        visibleCount = 0;
        renderNextPage();
      })
      .catch(function (error) {
        resultsContainer.innerHTML = '<section id="content"><article class="post"><header class="page-header"><span class="badge">Search</span><h1>搜索不可用</h1><p>' + escapeHtml(error.message || '加载搜索索引失败。') + '</p></header></article></section>';
      });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var state = {
      q: input.value.trim(),
      category: '',
      tag: ''
    };
    updateUrl(state);
    applySearch(state);
  });

  window.addEventListener('popstate', function () {
    var state = getStateFromUrl();
    syncForm(state);
    applySearch(state);
  });

  var initialState = getStateFromUrl();
  initialState.category = '';
  initialState.tag = '';
  syncForm(initialState);
  applySearch(initialState);
})();
