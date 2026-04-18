(function () {
  function getSiteConfig() {
    return window.LUOWEI_SITE_CONFIG || {};
  }

  function getGiscusTheme(config) {
    return document.documentElement.getAttribute("data-theme") === "classic" ? "light" : "dark";
  }

  function mountGiscus(root, config) {
    var script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", config.repo);
    script.setAttribute("data-repo-id", config.repoId);
    script.setAttribute("data-category", config.category);
    script.setAttribute("data-category-id", config.categoryId);
    script.setAttribute("data-mapping", config.mapping);
    script.setAttribute("data-strict", config.strict);
    script.setAttribute("data-reactions-enabled", config.reactionsEnabled);
    script.setAttribute("data-emit-metadata", config.emitMetadata);
    script.setAttribute("data-input-position", config.inputPosition);
    script.setAttribute("data-theme", getGiscusTheme(config));
    script.setAttribute("data-lang", config.lang);
    root.replaceChildren(script);
  }

  function syncGiscusTheme(config) {
    var frame = document.querySelector("iframe.giscus-frame");
    if (!frame || !frame.contentWindow) {
      return;
    }

    frame.contentWindow.postMessage(
      {
        giscus: {
          setConfig: {
            theme: getGiscusTheme(config)
          }
        }
      },
      "https://giscus.app"
    );
  }

  function init() {
    var roots = document.querySelectorAll("[data-comments-root]");
    if (!roots.length) {
      return;
    }

    var siteConfig = getSiteConfig();
    var commentsConfig = siteConfig.comments || {};
    var config = commentsConfig.giscus || {};
    var ready = Boolean(
      commentsConfig.provider === "giscus" &&
      config.enabled &&
      config.repo &&
      config.repoId &&
      config.category &&
      config.categoryId
    );

    roots.forEach(function (root) {
      if (!ready) {
        root.textContent = "评论功能暂未完成配置。";
        return;
      }

      mountGiscus(root, config);
    });

    document.addEventListener("luowei:themechange", function () {
      syncGiscusTheme(config);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
