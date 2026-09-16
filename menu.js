(function () {
  document.addEventListener("DOMContentLoaded", function () {
    // there can be more than one nav.menu block on a page (e.g. the index
    // page's top header menu and its separate bottom-right corner menu),
    // so this works across all of them rather than assuming a single one.
    var links = document.querySelectorAll(".menu a[data-page]");
    if (!links.length) return;
    var current = document.body.getAttribute("data-page") || "";
    // pages using the new white/black site header (index, work, about) show
    // the active/triggered link in black, matching that design; pages that
    // kept their own dark theme (e.g. the commoning-death project page)
    // keep the chroma-key green highlight that matches their imagery.
    var usesNewHeader = !!document.querySelector(".site-header");
    var HIGHLIGHT_COLOR = usesNewHeader ? "#000000" : "#00ff00";

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
      // placeholder links (no destination yet) shouldn't jump/scroll the page
      if (a.getAttribute("href") === "#") {
        a.addEventListener("click", function (e) {
          e.preventDefault();
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

  // touch devices have no real hover: holding a finger down on a link now
  // shows the same visual as a mouse hover (via the .touch-hover class,
  // paired with the existing :hover rules in css), and lifting it off
  // counts as a tap/click - but only after a brief delay, so the hover
  // state is actually visible before the page navigates away.
  var HOLD_CLASS = "touch-hover";
  var TAP_DELAY = 180;
  var MOVE_TOLERANCE = 10;
  var SELECTOR = ".menu a, .worklist a";

  var current = null;
  var active = false;
  var startX = 0, startY = 0;

  function release(el) {
    if (el) el.classList.remove(HOLD_CLASS);
  }

  document.addEventListener("touchstart", function (e) {
    var el = e.target.closest ? e.target.closest(SELECTOR) : null;
    if (!el) return;
    current = el;
    active = true;
    var t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    el.classList.add(HOLD_CLASS);
  }, { passive: true });

  document.addEventListener("touchmove", function (e) {
    if (!active || !current) return;
    var t = e.touches[0];
    if (Math.abs(t.clientX - startX) > MOVE_TOLERANCE || Math.abs(t.clientY - startY) > MOVE_TOLERANCE) {
      release(current);
      active = false;
      current = null;
    }
  }, { passive: true });

  document.addEventListener("touchend", function (e) {
    if (!active || !current) return;
    var el = current;
    active = false;
    current = null;
    e.preventDefault();
    setTimeout(function () {
      release(el);
      el.click();
    }, TAP_DELAY);
  });

  document.addEventListener("touchcancel", function () {
    release(current);
    active = false;
    current = null;
  });
})();
