(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var el = document.getElementById("cornerlogo");
    if (!el) return;
    var corner = document.body.getAttribute("data-corner") || "top-left";
    var currentPage = document.body.getAttribute("data-page") || "";

    // pages that don't hardcode a specific corner-logo color (the
    // per-project subpages) get a random one of the four, picked fresh
    // each visit - same roaming/bounce mechanics either way, just a
    // different color. must happen before the load-check below.
    if (el.hasAttribute("data-random-logo") && !el.getAttribute("src")) {
      var colors = ["logolila.png", "logoorange.png", "logoblau.png", "logorot.png"];
      el.src = "/images/" + colors[Math.floor(Math.random() * colors.length)];
    }

    // pages with the new white/black site header have a horizontal line
    // across the top - the roaming logo bounces off that line's bottom
    // edge instead of the bare viewport edge. pages without one (like the
    // commoning-death project page) fall back to 0, unchanged.
    var headerEl = document.querySelector(".site-header");
    function topBound() {
      return headerEl ? headerEl.getBoundingClientRect().height : 0;
    }

    function size() {
      // same portrait/mobile adjustment as the index page's logo - scaling
      // purely off width reads as too small once the window is tall and
      // narrow, so it gets a bigger share of that (smaller) width there.
      var portrait = window.innerHeight > window.innerWidth;
      var w = window.innerWidth / (portrait ? 2.4 : 5);
      var ratio = (el.naturalWidth && el.naturalHeight) ? el.naturalHeight / el.naturalWidth : 0.5;
      return { w: w, h: w * ratio };
    }
    function bounds() {
      var s = size();
      return {
        minX: 0, minY: topBound(),
        maxX: Math.max(0, window.innerWidth - s.w),
        maxY: Math.max(0, window.innerHeight - s.h)
      };
    }
    function speed() {
      return Math.min(window.innerWidth, window.innerHeight) * 0.32;
    }
    function outwardVelocity() {
      var ang = (25 + Math.random() * 30) * (Math.PI / 180);
      var dirY = (corner === "top-left") ? 1 : -1;
      return { vx: Math.cos(ang), vy: Math.sin(ang) * dirY };
    }
    function randomVelocity() {
      var ang = (20 + Math.random() * 40) * (Math.PI / 180);
      return {
        vx: Math.cos(ang) * (Math.random() < 0.5 ? -1 : 1),
        vy: Math.sin(ang) * (Math.random() < 0.5 ? -1 : 1)
      };
    }
    function randomStartPos() {
      var b = bounds();
      return {
        x: b.minX + Math.random() * (b.maxX - b.minX),
        y: b.minY + Math.random() * (b.maxY - b.minY)
      };
    }

    el.style.cursor = "pointer";
    var stopFn = null;

    function applyFrame(x, y) {
      el.style.transform = "translate(" + x + "px," + y + "px)";
    }

    // arrival: bounce naturally (like index, same constant speed) and just
    // keep going forever - it never settles into a static position.
    function startArrival(startX, startY, startVx, startVy) {
      var s = size();
      el.style.width = s.w + "px";
      el.style.height = s.h + "px";
      el.style.transition = "none";

      stopFn = window.startBounce({
        x: startX, y: startY, vx: startVx, vy: startVy,
        size: size, bounds: bounds, speed: speed,
        onFrame: applyFrame,
        duration: null
      });
    }

    var handoff = null;
    try {
      var raw = sessionStorage.getItem("lkw_logo_state");
      if (raw) {
        sessionStorage.removeItem("lkw_logo_state");
        handoff = JSON.parse(raw);
      }
    } catch (e) {}

    function beginWhenReady() {
      var s = size();
      el.style.width = s.w + "px";
      el.style.height = s.h + "px";

      if (handoff) {
        var sx = handoff.vw ? window.innerWidth / handoff.vw : 1;
        var sy = handoff.vh ? window.innerHeight / handoff.vh : 1;
        var b = bounds();
        var hx = Math.min(Math.max(b.minX, handoff.x * sx), b.maxX);
        var hy = Math.min(Math.max(b.minY, handoff.y * sy), b.maxY);
        startArrival(hx, hy, handoff.vx, handoff.vy);
      } else {
        // fresh/direct visit: no handoff position to continue from, so
        // start it roaming from a random spot rather than already-arrived
        var p = randomStartPos();
        var v = randomVelocity();
        startArrival(p.x, p.y, v.vx, v.vy);
      }
    }

    if (el.complete && el.naturalWidth) beginWhenReady();
    else el.addEventListener("load", beginWhenReady, { once: true });

    window.addEventListener("resize", function () {
      var s = size();
      el.style.width = s.w + "px";
      el.style.height = s.h + "px";
    });

    function departTo(href) {
      if (stopFn) stopFn();
      var rect = el.getBoundingClientRect();
      var v = outwardVelocity();
      el.style.transition = "none";
      window.startBounce({
        x: rect.left, y: rect.top, vx: v.vx, vy: v.vy,
        size: size, bounds: bounds, speed: speed,
        onFrame: applyFrame,
        duration: 550,
        onDone: function (final) {
          try {
            sessionStorage.setItem("lkw_logo_state", JSON.stringify({
              x: final.x, y: final.y, vx: final.vx, vy: final.vy,
              vw: window.innerWidth, vh: window.innerHeight
            }));
          } catch (e) {}
          window.location.href = href;
        }
      });
    }

    el.addEventListener("click", function () {
      departTo("/");
    });

    document.querySelectorAll('.menu a[data-page="work"], .menu a[data-page="about"]').forEach(function (a) {
      var page = a.getAttribute("data-page");
      if (page === currentPage) return;
      a.addEventListener("click", function (e) {
        e.preventDefault();
        departTo(a.getAttribute("href"));
      });
    });
  });
})();
