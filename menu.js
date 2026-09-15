(function () {
  var HIGHLIGHT_COLOR = "#00ff00"; // same chroma-key green as the index background

  document.addEventListener("DOMContentLoaded", function () {
    var menu = document.querySelector(".menu");
    if (!menu) return;
    var current = document.body.getAttribute("data-page") || "";
    var links = menu.querySelectorAll("a[data-page]");

    links.forEach(function (a) {
      var page = a.getAttribute("data-page");
      if (page === current) {
        a.classList.add("active");
        a.style.color = HIGHLIGHT_COLOR;
      }
      if (page === "contact") {
        a.addEventListener("click", function () {
          a.classList.add("active");
          a.style.color = HIGHLIGHT_COLOR;
          setTimeout(function () {
            a.classList.remove("active");
            a.style.color = "";
          }, 700);
        });
      }
    });
  });
})();
