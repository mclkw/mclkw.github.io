(function () {
  var IMAGES = [
    "expired.png", "well.png", "football.png", "fallen.png",
    "HBD.png", "cans.png", "board.png", "cat.png", "bench.png"
  ];
  var RAYS = 64;
  var ALPHA_THRESH = 10;

  // --- shape analysis: read each png's alpha channel to find a tight
  // opaque centroid and a radial silhouette profile (distance from
  // centroid to the shape's edge at RAYS evenly spaced angles). this is
  // what lets the packing respect the actual transparent outline instead
  // of the image's rectangular bounds.
  function analyzeImage(img) {
    return new Promise(function (resolve) {
      var naturalW = img.naturalWidth, naturalH = img.naturalHeight;
      var maxSide = 140;
      var scale = maxSide / Math.max(naturalW, naturalH);
      var w = Math.max(1, Math.round(naturalW * scale));
      var h = Math.max(1, Math.round(naturalH * scale));

      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);

      var data;
      try {
        data = ctx.getImageData(0, 0, w, h).data;
      } catch (e) {
        resolve(fallbackProfile(naturalW, naturalH));
        return;
      }

      function alphaAt(px, py) {
        if (px < 0 || py < 0 || px >= w || py >= h) return 0;
        return data[(py * w + px) * 4 + 3];
      }

      var sumX = 0, sumY = 0, count = 0;
      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          if (alphaAt(x, y) > ALPHA_THRESH) {
            sumX += x; sumY += y; count++;
          }
        }
      }
      if (count === 0) {
        resolve(fallbackProfile(naturalW, naturalH));
        return;
      }
      var cx = sumX / count, cy = sumY / count;
      var maxR = Math.hypot(w, h);

      var radii = [];
      for (var i = 0; i < RAYS; i++) {
        var theta = (i / RAYS) * Math.PI * 2;
        var dx = Math.cos(theta), dy = Math.sin(theta);
        var r = 0, lastOpaque = 0, missStreak = 0;
        while (r < maxR) {
          var px = Math.round(cx + dx * r);
          var py = Math.round(cy + dy * r);
          if (alphaAt(px, py) > ALPHA_THRESH) {
            lastOpaque = r;
            missStreak = 0;
          } else {
            missStreak++;
            if (missStreak > 3 && r > lastOpaque + 2) break;
          }
          r += 0.75;
        }
        radii.push(lastOpaque);
      }

      var inv = 1 / scale;
      resolve({
        naturalW: naturalW,
        naturalH: naturalH,
        centroidX: cx * inv,
        centroidY: cy * inv,
        radii: radii.map(function (r) { return r * inv; })
      });
    });
  }

  function fallbackProfile(naturalW, naturalH) {
    var cx = naturalW / 2, cy = naturalH / 2;
    var radii = [];
    for (var i = 0; i < RAYS; i++) {
      var theta = (i / RAYS) * Math.PI * 2;
      var dx = Math.cos(theta), dy = Math.sin(theta);
      var tX = dx !== 0 ? (naturalW / 2) / Math.abs(dx) : Infinity;
      var tY = dy !== 0 ? (naturalH / 2) / Math.abs(dy) : Infinity;
      radii.push(Math.min(tX, tY));
    }
    return { naturalW: naturalW, naturalH: naturalH, centroidX: cx, centroidY: cy, radii: radii };
  }

  function radiusAt(profile, theta) {
    var norm = ((theta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    var f = (norm / (Math.PI * 2)) * RAYS;
    var i0 = Math.floor(f) % RAYS;
    var i1 = (i0 + 1) % RAYS;
    var frac = f - Math.floor(f);
    return profile.radii[i0] * (1 - frac) + profile.radii[i1] * frac;
  }

  // --- packing simulation ---
  document.addEventListener("DOMContentLoaded", function () {
    var container = document.getElementById("collage");
    if (!container) return;

    function vmin() { return Math.min(window.innerWidth, window.innerHeight); }

    var instances = [];

    function scaleFactorOf(inst) {
      return (inst.sizeFactor * inst.hoverScale * vmin()) / inst.profile.naturalW;
    }

    function centroidOffset(inst) {
      var s = scaleFactorOf(inst);
      return { x: inst.profile.centroidX * s, y: inst.profile.centroidY * s };
    }

    function radiusAtWorld(inst, theta) {
      return radiusAt(inst.profile, theta) * scaleFactorOf(inst);
    }

    function render(inst) {
      var s = scaleFactorOf(inst);
      var w = inst.profile.naturalW * s;
      var h = inst.profile.naturalH * s;
      var off = centroidOffset(inst);
      var left = inst.x - off.x;
      var top = inst.y - off.y;
      inst.el.style.width = w + "px";
      inst.el.style.height = h + "px";
      inst.el.style.transform = "translate(" + left + "px," + top + "px)";
    }

    function createInstance(name, profile, index) {
      var wrap = document.createElement("div");
      wrap.className = "piece";
      wrap.style.opacity = "0";
      wrap.style.width = "1px";
      wrap.style.height = "1px";
      wrap.style.pointerEvents = "none";
      var imgEl = document.createElement("img");
      imgEl.src = "/images/" + name;
      imgEl.alt = name.replace(".png", "");
      imgEl.draggable = false;
      wrap.appendChild(imgEl);
      container.appendChild(wrap);

      var inst = {
        el: wrap,
        profile: profile,
        sizeFactor: 0.17 + Math.random() * 0.15,
        hoverScale: 1,
        hoverTarget: 1,
        x: 0, y: 0, vx: 0, vy: 0,
        active: false
      };
      wrap.addEventListener("mouseenter", function () { inst.hoverTarget = 1.45; });
      wrap.addEventListener("mouseleave", function () { inst.hoverTarget = 1; });
      instances.push(inst);

      // pieces drop in one at a time, like tetris pieces, from a spawn
      // zone slightly left of center and above the visible viewport
      setTimeout(function () {
        inst.x = window.innerWidth * (0.22 + Math.random() * 0.26);
        inst.y = -200 - Math.random() * 160;
        inst.vx = 0;
        inst.vy = 0;
        inst.active = true;
        wrap.style.opacity = "1";
        wrap.style.pointerEvents = "auto";
      }, index * 420 + 250);
    }

    // sample a spread of angles around the direct line between two shapes'
    // centroids, projected onto that line, so protrusions off to either
    // side are still respected - not just the exact center-line radius.
    var EDGE_OFFSETS = [-0.7, -0.5, -0.32, -0.16, 0, 0.16, 0.32, 0.5, 0.7]; // radians
    function facingExtent(inst, baseAngle) {
      var max = 0;
      for (var i = 0; i < EDGE_OFFSETS.length; i++) {
        var off = EDGE_OFFSETS[i];
        var r = radiusAtWorld(inst, baseAngle + off) * Math.cos(off);
        if (r > max) max = r;
      }
      return max;
    }

    var HOVER_EASE = 0.12;
    var RESOLVE_ITERATIONS = 7;
    var CORRECTION_SHARE = 0.5;
    var SLEEP_MOVE_EPS = 0.08;
    var SLEEP_FRAMES = 18;
    var WAKE_DEFICIT = 0.15;

    function simTick() {
      var vm = vmin();
      var gravity = vm * 0.0016;
      var maxFall = vm * 0.065;
      var gap = Math.max(12, vm * 0.016);
      var floorY = window.innerHeight;
      var leftWall = 0, rightWall = window.innerWidth;
      var n = instances.length;
      var i, a;

      for (i = 0; i < n; i++) {
        a = instances[i];
        a.hoverScale += (a.hoverTarget - a.hoverScale) * HOVER_EASE;
        if (!a.active) continue;

        a.beforeX = a.x;
        a.beforeY = a.y;

        // sleeping pieces stop free-falling so they don't get nudged by
        // gravity and re-corrected back every single frame forever - the
        // constraint pass below still runs for them, so a neighbor growing
        // on hover can still wake and push them.
        if (!a.sleeping) {
          a.vy = Math.min(a.vy + gravity, maxFall);
          a.x += a.vx;
          a.y += a.vy;
        }
      }

      // resolve overlaps and hard borders with direct positional correction
      // (run a few relaxation passes so multi-body contacts, like a piece
      // landing on a pile, settle within the frame) rather than spring
      // forces, which would always leave a small residual overlap/sink.
      // only a fraction of the gap is closed per pass so it eases into
      // place smoothly instead of snapping.
      for (var pass = 0; pass < RESOLVE_ITERATIONS; pass++) {
        for (i = 0; i < n; i++) {
          a = instances[i];
          if (!a.active) continue;

          var bottomExt = facingExtent(a, Math.PI / 2);
          if (a.y + bottomExt > floorY) {
            a.y = floorY - bottomExt;
            if (a.vy > 0) a.vy = 0;
          }
          var leftExt = facingExtent(a, Math.PI);
          if (a.x - leftExt < leftWall) {
            a.x = leftWall + leftExt;
            if (a.vx < 0) a.vx = 0;
          }
          var rightExt = facingExtent(a, 0);
          if (a.x + rightExt > rightWall) {
            a.x = rightWall - rightExt;
            if (a.vx > 0) a.vx = 0;
          }

          for (var j = i + 1; j < n; j++) {
            var b = instances[j];
            if (!b.active) continue;
            if (a.sleeping && b.sleeping) continue;
            var dx = b.x - a.x, dy = b.y - a.y;
            var dist = Math.hypot(dx, dy) || 0.001;
            var theta = Math.atan2(dy, dx);
            var minDist = facingExtent(a, theta) + facingExtent(b, theta + Math.PI) + gap;
            if (dist < minDist) {
              var deficit = minDist - dist;
              var ux = dx / dist, uy = dy / dist;
              var share = deficit * CORRECTION_SHARE;
              a.x -= ux * share;
              a.y -= uy * share;
              b.x += ux * share;
              b.y += uy * share;
              if (deficit > WAKE_DEFICIT) {
                a.sleeping = false;
                b.sleeping = false;
              }
            }
          }
        }
      }

      // velocity is derived from the actual net position change (integration
      // plus every correction this frame), not left to free-run from raw
      // gravity - otherwise a piece resting on another piece (only ever
      // partially corrected via CORRECTION_SHARE, unlike the floor/wall's
      // exact clamp) keeps re-accumulating near max-fall speed forever,
      // slamming into its neighbor and never actually settling.
      for (i = 0; i < n; i++) {
        a = instances[i];
        if (!a.active || a.sleeping) continue;
        var moved = Math.hypot(a.x - a.beforeX, a.y - a.beforeY);
        a.vx = a.x - a.beforeX;
        a.vy = a.y - a.beforeY;
        if (moved < SLEEP_MOVE_EPS) {
          a.quiet = (a.quiet || 0) + 1;
          if (a.quiet > SLEEP_FRAMES) { a.sleeping = true; a.vx = 0; a.vy = 0; }
        } else {
          a.quiet = 0;
        }
      }

      for (var k = 0; k < n; k++) if (instances[k].active) render(instances[k]);
      requestAnimationFrame(simTick);
    }

    Promise.all(IMAGES.map(function (name) {
      return new Promise(function (resolve) {
        var img = new Image();
        img.onload = function () {
          analyzeImage(img).then(function (profile) {
            resolve({ name: name, profile: profile });
          });
        };
        img.onerror = function () { resolve(null); };
        img.src = "/images/" + name;
      });
    })).then(function (results) {
      results.filter(Boolean).forEach(function (r, idx) {
        createInstance(r.name, r.profile, idx);
      });
      requestAnimationFrame(simTick);
    });
  });
})();
