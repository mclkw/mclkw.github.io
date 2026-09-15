(function () {
  // sampled from the logo artwork: purple, red, blue, orange
  var PALETTE = ["#894ea7", "#a7504e", "#4e76a7", "#a7804e"];
  function randomColor() {
    return PALETTE[Math.floor(Math.random() * PALETTE.length)];
  }

  document.addEventListener("DOMContentLoaded", function () {
    var menu = document.querySelector(".menu");
    if (!menu) return;
    var current = document.body.getAttribute("data-page") || "";
    var links = menu.querySelectorAll("a[data-page]");

    links.forEach(function (a) {
      var page = a.getAttribute("data-page");
      if (page === current) {
        a.classList.add("active");
        a.style.color = randomColor();
      }
      if (page === "contact") {
        a.addEventListener("click", function () {
          a.classList.add("active");
          a.style.color = randomColor();
          setTimeout(function () {
            a.classList.remove("active");
            a.style.color = "";
          }, 700);
        });
      }
    });
  });
})();
