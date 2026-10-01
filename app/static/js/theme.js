// Theme: runs before the stylesheet so the page never flashes the wrong theme.
// Classic script (not a module) so it executes synchronously in <head>.
(function () {
  var KEY = "redactor:theme";
  var root = document.documentElement;
  var media = window.matchMedia("(prefers-color-scheme: light)");

  function saved() {
    try {
      var value = window.localStorage.getItem(KEY);
      return value === "light" || value === "dark" ? value : null;
    } catch (e) {
      return null;
    }
  }

  function label(button) {
    var next = root.dataset.theme === "light" ? "dark" : "light";
    button.setAttribute("aria-label", "Switch to " + next + " mode");
    button.title = "Switch to " + next + " mode";
  }

  root.dataset.theme = saved() || (media.matches ? "light" : "dark");

  // Follow the OS theme until the user picks one explicitly.
  media.addEventListener("change", function (event) {
    if (saved()) return;
    root.dataset.theme = event.matches ? "light" : "dark";
    var button = document.getElementById("theme-toggle");
    if (button) label(button);
  });

  document.addEventListener("DOMContentLoaded", function () {
    var button = document.getElementById("theme-toggle");
    if (!button) return;
    label(button);
    button.addEventListener("click", function () {
      var theme = root.dataset.theme === "light" ? "dark" : "light";
      root.dataset.theme = theme;
      try {
        window.localStorage.setItem(KEY, theme);
      } catch (e) {
        // Storage disabled: the choice lasts for this page only.
      }
      label(button);
    });
  });
})();
