// Sets the initial theme before the stylesheet paints, so the page never flashes the wrong one.
// A classic script (not a module) so it runs synchronously in <head>. The React app owns the
// toggle and OS-change handling after load (frontend/src/lib/theme.ts).
(function () {
  var KEY = "redactor:theme";
  var root = document.documentElement;
  var theme = null;
  try {
    var value = window.localStorage.getItem(KEY);
    if (value === "light" || value === "dark") theme = value;
  } catch (e) {
    // Storage disabled: fall back to the OS preference.
  }
  root.dataset.theme = theme || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
})();
