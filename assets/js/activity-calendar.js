(function () {
  // 与成员站保持同一套前端渲染模型：按日期聚合，再展示最新月份的活动日历。
  var storageKey = "luowei-activity-calendar-state";

  function readState() {
    try {
      return JSON.parse(window.localStorage.getItem(storageKey) || "{}") || {};
    } catch (error) {
      return {};
    }
  }

  function writeState(nextState) {
    try {
      var currentState = readState();
      window.localStorage.setItem(storageKey, JSON.stringify(Object.assign({}, currentState, nextState)));
    } catch (error) {}
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeItems(payload) {
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch (error) {}
    }

    if (Array.isArray(payload) && Array.isArray(payload[1]) && Array.isArray(payload[2])) {
      var schema = payload[1];
      var rows = payload[2];
      var dateIndex = schema.indexOf("date");
      var countIndex = schema.indexOf("count");
      var titlesIndex = schema.indexOf("titles");
      var urlsIndex = schema.indexOf("urls");
      return rows
        .map(function (row) {
          var date = String(row && row[dateIndex] ? row[dateIndex] : "").slice(0, 10);
          var count = Number(row && row[countIndex] ? row[countIndex] : 0);
          var titles = Array.isArray(row && row[titlesIndex]) ? row[titlesIndex].map(function (title) { return String(title || ""); }).filter(Boolean) : [];
          var urls = Array.isArray(row && row[urlsIndex]) ? row[urlsIndex].map(function (url) { return String(url || ""); }).filter(Boolean) : [];
          return /^\d{4}-\d{2}-\d{2}$/.test(date) ? { date: date, count: Math.max(1, count), titles: titles, urls: urls } : null;
        })
        .filter(Boolean)
        .sort(function (a, b) {
          return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
        });
    }

    var rawItems = Array.isArray(payload) ? payload : payload && Array.isArray(payload.items) ? payload.items : [];
    return rawItems
      .map(function (item) {
        var date = String(item && item.date ? item.date : "").slice(0, 10);
        var title = String(item && item.title ? item.title : "未命名文档");
        var url = String(item && item.url ? item.url : "");
        return /^\d{4}-\d{2}-\d{2}$/.test(date) ? { date: date, count: 1, titles: [title], urls: url ? [url] : [] } : null;
      })
      .filter(Boolean)
      .sort(function (a, b) {
        return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
      });
  }

  function getLevel(count, maxCount) {
    if (!count) return 0;
    var ratio = count / Math.max(1, maxCount);
    if (ratio >= 0.75) return 4;
    if (ratio >= 0.5) return 3;
    if (ratio >= 0.25) return 2;
    return 1;
  }

  function addMonths(monthKey, offset) {
    var parts = monthKey.split("-");
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1 + offset, 1);
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
  }

  function clampMonth(monthKey, minMonthKey, maxMonthKey) {
    if (monthKey < minMonthKey) return minMonthKey;
    if (monthKey > maxMonthKey) return maxMonthKey;
    return monthKey;
  }

  function buildYearOptions(minYear, maxYear, activeYear) {
    var options = [];
    for (var year = maxYear; year >= minYear; year -= 1) {
      options.push('<option value="' + year + '"' + (year === activeYear ? ' selected' : '') + '>' + year + '年</option>');
    }
    return options.join("");
  }

  function buildMonthOptions(activeMonth) {
    var options = [];
    for (var month = 1; month <= 12; month += 1) {
      options.push('<option value="' + String(month).padStart(2, "0") + '"' + (month === activeMonth ? ' selected' : '') + '>' + month + '月</option>');
    }
    return options.join("");
  }

  function buildArchiveHref(container, date) {
    var month = date.slice(0, 7);
    var pattern = container.getAttribute("data-activity-calendar-archive-pattern") || "/archive/{month}?date={date}#activity-date-{date}";
    return pattern
      .replace(/\{month\}/g, encodeURIComponent(month))
      .replace(/\{date\}/g, encodeURIComponent(date));
  }

  function escapeSelectorValue(value) {
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(value);
    }
    return String(value).replace(/"/g, '\\"');
  }

  function highlightActivityArchiveDate() {
    var params = new URLSearchParams(window.location.search);
    var date = params.get("date") || "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    var matches = document.querySelectorAll('[data-activity-archive-list] [data-post-date="' + escapeSelectorValue(date) + '"]');
    matches.forEach(function (item) {
      if (item instanceof HTMLElement) item.classList.add("activity-archive-highlight");
    });
    var first = matches[0];
    if (first instanceof HTMLElement) {
      window.requestAnimationFrame(function () {
        first.scrollIntoView({ block: "center", behavior: "smooth" });
      });
    }
  }

  function renderCalendar(container, items, activeMonthKey) {
    if (!items.length) {
      container.innerHTML = '<p class="activity-calendar__empty">暂无发布记录</p>';
      return;
    }

    var minMonthKey = items[items.length - 1].date.slice(0, 7);
    var maxMonthKey = items[0].date.slice(0, 7);
    var monthKey = clampMonth(/^\d{4}-\d{2}$/.test(activeMonthKey || "") ? activeMonthKey : maxMonthKey, minMonthKey, maxMonthKey);
    container.dataset.activityCalendarMonth = monthKey;
    writeState({ month: monthKey });
    var previousMonthKey = monthKey > minMonthKey ? addMonths(monthKey, -1) : "";
    var nextMonthKey = monthKey < maxMonthKey ? addMonths(monthKey, 1) : "";
    var parts = monthKey.split("-");
    var year = Number(parts[0]);
    var monthIndex = Number(parts[1]) - 1;
    var minYear = Number(minMonthKey.slice(0, 4));
    var maxYear = Number(maxMonthKey.slice(0, 4));
    var byDate = {};
    var monthTotal = 0;
    var siteTotal = 0;
    items.forEach(function (item) {
      siteTotal += item.count || 0;
      if (item.date.slice(0, 7) !== monthKey) return;
      if (!byDate[item.date]) byDate[item.date] = [];
      byDate[item.date].push(item);
      monthTotal += item.count || 0;
    });

    var maxCount = Object.keys(byDate).reduce(function (max, date) {
      var count = byDate[date].reduce(function (total, item) { return total + (item.count || 0); }, 0);
      return Math.max(max, count);
    }, 1);
    var firstDay = new Date(year, monthIndex, 1);
    var leadingEmptyDays = (firstDay.getDay() + 6) % 7;
    var daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    var cells = [];
    for (var i = 0; i < leadingEmptyDays; i += 1) {
      cells.push('<span class="activity-calendar__day activity-calendar__day--empty" aria-hidden="true"></span>');
    }
    for (var day = 1; day <= daysInMonth; day += 1) {
      var date = monthKey + "-" + String(day).padStart(2, "0");
      var dayItems = byDate[date] || [];
      var dayTotal = dayItems.reduce(function (total, item) { return total + (item.count || 0); }, 0);
      var level = getLevel(dayTotal, maxCount);
      if (dayTotal) {
        var titles = dayItems.reduce(function (all, item) { return all.concat(item.titles || []); }, []).slice(0, 3).join(" / ");
        var more = dayTotal > 3 ? " 等" : "";
        var label = date + " · " + dayTotal + " 篇" + (titles ? "：" + titles + more : "");
        var href = buildArchiveHref(container, date);
        cells.push(
          '<a class="activity-calendar__day activity-calendar__day--active activity-calendar__day--level-' + level + '" href="' +
            escapeHtml(href) + '" title="' + escapeHtml(label) + '" aria-label="' + escapeHtml(label) + '">' + day + '</a>'
        );
      } else {
        cells.push('<span class="activity-calendar__day" aria-label="' + escapeHtml(date + " 无发布") + '">' + day + '</span>');
      }
    }

    container.innerHTML =
      '<div class="activity-calendar__header">' +
        '<button type="button" class="activity-calendar__nav" data-activity-calendar-month="' + escapeHtml(previousMonthKey) + '"' + (previousMonthKey ? '' : ' disabled') + ' title="上一个月">‹</button>' +
        '<div class="activity-calendar__picker">' +
          '<select class="activity-calendar__select" data-activity-calendar-year aria-label="选择年份">' + buildYearOptions(minYear, maxYear, year) + '</select>' +
          '<select class="activity-calendar__select" data-activity-calendar-month-select aria-label="选择月份">' + buildMonthOptions(monthIndex + 1) + '</select>' +
        '</div>' +
        '<button type="button" class="activity-calendar__nav" data-activity-calendar-month="' + escapeHtml(nextMonthKey) + '"' + (nextMonthKey ? '' : ' disabled') + ' title="下一个月">›</button>' +
        '<span class="activity-calendar__meta">本月 ' + monthTotal + ' 篇 / 共 ' + siteTotal + ' 篇</span>' +
      '</div>' +
      '<div class="activity-calendar__weekdays" aria-hidden="true">' +
        '<span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span>' +
      '</div>' +
      '<div class="activity-calendar__grid">' + cells.join("") + '</div>' +
      '<div class="activity-calendar__legend" aria-hidden="true"><span>少</span><i class="activity-calendar__legend-cell activity-calendar__day--level-1"></i><i class="activity-calendar__legend-cell activity-calendar__day--level-2"></i><i class="activity-calendar__legend-cell activity-calendar__day--level-3"></i><i class="activity-calendar__legend-cell activity-calendar__day--level-4"></i><span>多</span></div>';
  }

  function setupActivityCalendar(container) {
    if (!(container instanceof HTMLElement) || container.dataset.activityCalendarReady === "true") return null;
    container.dataset.activityCalendarReady = "true";
    var cachedItems = [];
    var loadingPromise = null;

    container.addEventListener("click", function (event) {
      var target = event.target;
      var button = target instanceof Element ? target.closest("[data-activity-calendar-month]") : null;
      if (!(button instanceof HTMLButtonElement) || button.disabled) return;
      var month = button.getAttribute("data-activity-calendar-month") || "";
      if (!month) return;
      event.preventDefault();
      renderCalendar(container, cachedItems, month);
    });
    container.addEventListener("change", function (event) {
      var target = event.target;
      if (!(target instanceof HTMLSelectElement) || !target.matches("[data-activity-calendar-year], [data-activity-calendar-month-select]")) return;
      var yearSelect = container.querySelector("[data-activity-calendar-year]");
      var monthSelect = container.querySelector("[data-activity-calendar-month-select]");
      if (!(yearSelect instanceof HTMLSelectElement) || !(monthSelect instanceof HTMLSelectElement)) return;
      renderCalendar(container, cachedItems, yearSelect.value + "-" + monthSelect.value);
    });

    return function loadActivityCalendar() {
      if (cachedItems.length) {
        renderCalendar(container, cachedItems, container.dataset.activityCalendarMonth || readState().month);
        return Promise.resolve();
      }
      if (loadingPromise) return loadingPromise;

      var inlineData = container.querySelector("[data-activity-calendar-data]");
      if (inlineData) {
        try {
          cachedItems = normalizeItems(JSON.parse(inlineData.textContent || "[]"));
          renderCalendar(container, cachedItems, readState().month);
        } catch (error) {
          container.innerHTML = '<p class="activity-calendar__empty">发布日历数据解析失败</p>';
        }
        return Promise.resolve();
      }

      var url = container.getAttribute("data-activity-calendar-url");
      if (!url) return Promise.resolve();
      container.innerHTML = '<p class="activity-calendar__empty">正在加载发布日历...</p>';
      var codec = window.__publicDataCodec;
      if (!codec || typeof codec.fetchMessagePackGzip !== "function") {
        container.innerHTML = '<p class="activity-calendar__empty">发布日历解码器不可用</p>';
        return Promise.resolve();
      }
      loadingPromise = codec
        .fetchMessagePackGzip(url)
        .then(function (payload) {
          cachedItems = normalizeItems(payload);
          renderCalendar(container, cachedItems, readState().month);
        })
        .catch(function () {
          container.innerHTML = '<p class="activity-calendar__empty">发布日历加载失败</p>';
        });
      return loadingPromise;
    };
  }

  function initActivityCalendars() {
    document.querySelectorAll(".activity-calendar-section").forEach(function (section) {
      if (!(section instanceof HTMLElement)) return;
      var container = section.querySelector("[data-activity-calendar]");
      var shell = section.querySelector(".activity-calendar-shell");
      var toggle = section.querySelector("[data-activity-calendar-toggle]");
      var loadActivityCalendar = setupActivityCalendar(container);
      if (!loadActivityCalendar) return;

      if (toggle instanceof HTMLButtonElement && shell instanceof HTMLElement) {
        var state = readState();
        var initiallyExpanded = state.expanded === true;
        shell.hidden = !initiallyExpanded;
        toggle.setAttribute("aria-expanded", initiallyExpanded ? "true" : "false");
        toggle.textContent = initiallyExpanded ? "收起" : "展开";
        if (initiallyExpanded) loadActivityCalendar();
        toggle.addEventListener("click", function () {
          var expanded = toggle.getAttribute("aria-expanded") === "true";
          var nextExpanded = !expanded;
          toggle.setAttribute("aria-expanded", nextExpanded ? "true" : "false");
          toggle.textContent = nextExpanded ? "收起" : "展开";
          shell.hidden = !nextExpanded;
          writeState({ expanded: nextExpanded });
          if (nextExpanded) loadActivityCalendar();
        });
        return;
      }

      loadActivityCalendar();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initActivityCalendars();
      highlightActivityArchiveDate();
    });
  } else {
    initActivityCalendars();
    highlightActivityArchiveDate();
  }
})();
