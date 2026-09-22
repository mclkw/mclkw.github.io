(function () {
  var IMAGE_DIR = "/images/frontpage/";
  var IMAGES = [
    "Upcycling.png", "Wirbelwind.png", "Wirbelwind2.png",
    "aesthetics_in_scientific_understanding.png", "airbrush.png",
    "amateur.png", "amateur2.png",
    "business_cards.png", "business_cards2.png",
    "commoning_grief.png", "commoning_grief1.png", "commoning_grief2.png",
    "commoning_grief4.png", "commoning_grief5.png",
    "epistemic_gamification.png",
    "funzel1.png", "funzel2.png",
    "gartenbuehne.png",
    "inflatable_carryon.png", "inflatable_carryon02.png",
    "kirmes.png",
    "masks.png", "masks1.png",
    "one_day1.png", "one_day2.png",
    "pigeon.png", "pigeon2.png", "pigeon3.png",
    "posthuman.png", "posthuman2.png", "posthuman4.png",
    "stars01.png", "stars02.png",
    "steel.png",
    "unknown_return.jpeg", "unknown_return.png", "unknown_return01.png",
    "unknown_return02.png", "unknown_return04.png", "unknown_return05.png",
    "unknown_return06.png"
  ];
  // where each image links to - whichever subpage actually features it.
  // wirbelwind, upcycling, airbrush and kirmes have no page of their own
  // (yet), so they're left out here and just fall back to "#" below.
  var LINKS = {
    "aesthetics_in_scientific_understanding.png": "/aesthetics-in-scientific-understanding/",
    "amateur.png": "/amateur-home-making/",
    "amateur2.png": "/amateur-home-making/",
    "business_cards.png": "/business-cards/",
    "business_cards2.png": "/business-cards/",
    "commoning_grief.png": "/commoning-grief/",
    "commoning_grief1.png": "/commoning-grief/",
    "commoning_grief2.png": "/commoning-grief/",
    "commoning_grief4.png": "/commoning-grief/",
    "commoning_grief5.png": "/commoning-grief/",
    "epistemic_gamification.png": "/epistemic-gamification/",
    "funzel1.png": "/die-funzel/",
    "funzel2.png": "/die-funzel/",
    "gartenbuehne.png": "/live-from-earth/",
    "inflatable_carryon.png": "/inflatable-carry-on/",
    "inflatable_carryon02.png": "/inflatable-carry-on/",
    "masks.png": "/masks-for-istanbul-ghetto-club/",
    "masks1.png": "/masks-for-istanbul-ghetto-club/",
    "one_day1.png": "/one-day-all-dreams/",
    "one_day2.png": "/one-day-all-dreams/",
    "pigeon.png": "/pigeon-oracle/",
    "pigeon2.png": "/pigeon-oracle/",
    "pigeon3.png": "/pigeon-oracle/",
    "posthuman.png": "/posthuman-fragments/",
    "posthuman2.png": "/posthuman-fragments/",
    "posthuman4.png": "/posthuman-fragments/",
    "stars01.png": "/2-half-stars/",
    "stars02.png": "/2-half-stars/",
    "steel.png": "/steel-on-canvas/",
    "unknown_return.jpeg": "/unknown-return-to-player/",
    "unknown_return.png": "/unknown-return-to-player/",
    "unknown_return01.png": "/unknown-return-to-player/",
    "unknown_return02.png": "/unknown-return-to-player/",
    "unknown_return04.png": "/unknown-return-to-player/",
    "unknown_return05.png": "/unknown-return-to-player/",
    "unknown_return06.png": "/unknown-return-to-player/"
  };
  // which corner-menu filter category each image belongs to (art =
  // "visual", other = "applied", research = "research" in the menu labels)
  var CATEGORIES = {
    "Upcycling.png": "other",
    "Wirbelwind.png": "other",
    "Wirbelwind2.png": "other",
    "aesthetics_in_scientific_understanding.png": "research",
    "airbrush.png": "art",
    "amateur.png": "research",
    "amateur2.png": "research",
    "business_cards.png": "art",
    "business_cards2.png": "art",
    "commoning_grief.png": "research",
    "commoning_grief1.png": "research",
    "commoning_grief2.png": "research",
    "commoning_grief4.png": "research",
    "commoning_grief5.png": "research",
    "epistemic_gamification.png": "research",
    "funzel1.png": "research",
    "funzel2.png": "research",
    "gartenbuehne.png": "other",
    "inflatable_carryon.png": "art",
    "inflatable_carryon02.png": "art",
    "kirmes.png": "art",
    "masks.png": "other",
    "masks1.png": "other",
    "one_day1.png": "other",
    "one_day2.png": "other",
    "pigeon.png": "other",
    "pigeon2.png": "other",
    "pigeon3.png": "other",
    "posthuman.png": "other",
    "posthuman2.png": "other",
    "posthuman4.png": "other",
    "stars01.png": "art",
    "stars02.png": "art",
    "steel.png": "art",
    "unknown_return.jpeg": "art",
    "unknown_return.png": "art",
    "unknown_return01.png": "art",
    "unknown_return02.png": "art",
    "unknown_return04.png": "art",
    "unknown_return05.png": "art",
    "unknown_return06.png": "art"
  };
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
        radii: radii.map(function (r) { return r * inv; }),
        // how much of its own bounding box the shape actually fills - a
        // solid rectangular scan (a publication spread, a book cover) is
        // near 1; a die-cut silhouette with lots of transparent cutout
        // around it is much lower. used to size fuller shapes down a bit,
        // since they'd otherwise visually dominate at the same sizeFactor.
        fillRatio: count / (w * h)
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
    // no alpha data to measure (getImageData failed) - assume the worst
    // case, a solid rectangle, same as a real fully-opaque scan would give.
    return { naturalW: naturalW, naturalH: naturalH, centroidX: cx, centroidY: cy, radii: radii, fillRatio: 1 };
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

    // tracked in viewport coordinates (matching each piece's x/y) so simTick
    // can gently repel nearby pieces as the cursor passes - null whenever
    // the pointer isn't over the page, so nothing gets pushed by a stale
    // position.
    var mouseX = null, mouseY = null;
    window.addEventListener("mousemove", function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    document.addEventListener("mouseleave", function () {
      mouseX = null;
      mouseY = null;
    });

    // the bottom-right corner menu (art / research / other) is a solid
    // obstacle for falling pieces, not just a floor/wall - read its live
    // rect each tick (cheap for one small fixed element) and pad it well
    // clear of the text so pieces never actually touch it.
    var cornerMenuEl = document.getElementById("cornerMenu");
    function cornerMenuRect() {
      if (!cornerMenuEl) return null;
      var r = cornerMenuEl.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      var pad = Math.max(24, vmin() * 0.035);
      return { left: r.left - pad, top: r.top - pad, right: r.right + pad, bottom: r.bottom + pad };
    }

    // the black horizontal header line is the real top boundary for the
    // pieces - not the bare viewport edge - matching the bouncing logo's
    // own boundary elsewhere on the site.
    var siteHeaderEl = document.querySelector(".site-header");
    function topBound() {
      return siteHeaderEl ? siteHeaderEl.getBoundingClientRect().height : 0;
    }

    var instances = [];

    // the corner menu doubles as a category filter (all / art / research /
    // other): non-matching pieces are fully deactivated (frozen + hidden)
    // rather than just hidden, so they don't occupy space or collide.
    var currentFilter = "all";
    function shouldShow(inst) {
      return currentFilter === "all" || inst.category === currentFilter;
    }
    function spawnInstance(inst) {
      inst.everDropped = true;
      // scattered at a random spot already inside the window (below the
      // header line) - no falling in from above. the resolve pass below
      // untangles any overlaps every frame from here on, so it settles
      // into a packed, tetris-like fit wherever it landed.
      var top = topBound();
      inst.x = Math.random() * window.innerWidth;
      inst.y = top + Math.random() * Math.max(1, window.innerHeight - top);
      inst.renderX = inst.x;
      inst.renderY = inst.y;
      inst.vx = 0;
      inst.vy = 0;
      inst.active = true;
      inst.el.style.opacity = "1";
      inst.el.style.pointerEvents = "auto";
    }

    // pieces are sized so their combined visible (opaque) area works out to
    // roughly TARGET_FILL of the available window area (below the header
    // line, minus the corner-menu's own footprint) - not a headcount
    // heuristic, an actual area computation from each visible image's own
    // real size and how much of its own bounding box it fills (fillRatio,
    // from the alpha-channel scan). PACKING_EFFICIENCY accounts for the
    // fact that irregular shapes with mandatory gaps between them can never
    // actually tile edge-to-edge - without it, "75% full" would demand a
    // packing that isn't geometrically possible, which is exactly what was
    // causing pieces to visibly overlap and fail to route around the
    // corner menu instead of settling into a real non-overlapping layout.
    var TARGET_FILL = 0.75;
    var PACKING_EFFICIENCY = 0.55;
    var GLOBAL_SCALE_MIN = 0.35;
    var GLOBAL_SCALE_MAX = 2;
    var globalScale = 1, globalScaleTarget = 1;
    var GLOBAL_SCALE_EASE = 0.04;
    function updateGlobalScaleTarget() {
      var visible = instances.filter(shouldShow);
      if (!visible.length) return;
      var vm = vmin();
      var availArea = window.innerWidth * Math.max(1, window.innerHeight - topBound());
      var cornerRect = cornerMenuRect();
      if (cornerRect) {
        availArea -= Math.max(0, cornerRect.right - cornerRect.left) * Math.max(0, cornerRect.bottom - cornerRect.top);
      }
      availArea = Math.max(1, availArea);
      var sumAreaFactor = 0;
      visible.forEach(function (inst) {
        var fill = inst.profile.fillRatio != null ? inst.profile.fillRatio : 1;
        var aspect = inst.profile.naturalH / inst.profile.naturalW;
        sumAreaFactor += fill * aspect * inst.sizeFactor * inst.sizeFactor;
      });
      var targetArea = TARGET_FILL * PACKING_EFFICIENCY * availArea;
      var currentArea = sumAreaFactor * vm * vm;
      var scale = currentArea > 0 ? Math.sqrt(targetArea / currentArea) : 1;
      globalScaleTarget = Math.min(GLOBAL_SCALE_MAX, Math.max(GLOBAL_SCALE_MIN, scale));
      // sizes are about to shift - wake everything so the collision pass
      // re-settles pieces at their new size instead of leaving "sleeping"
      // ones frozen at stale positions sized for the old scale.
      instances.forEach(function (inst) { inst.sleeping = false; });
    }
    window.addEventListener("resize", updateGlobalScaleTarget);
    window.addEventListener("orientationchange", updateGlobalScaleTarget);

    function setFilter(filter) {
      currentFilter = filter;
      instances.forEach(function (inst) {
        if (shouldShow(inst)) {
          if (inst.everDropped) {
            inst.active = true;
            inst.el.style.opacity = "1";
            inst.el.style.pointerEvents = "auto";
          } else {
            spawnInstance(inst);
          }
        } else {
          inst.active = false;
          inst.el.style.opacity = "0";
          inst.el.style.pointerEvents = "none";
        }
      });
      updateGlobalScaleTarget();
    }
    if (cornerMenuEl) {
      var filterLinks = cornerMenuEl.querySelectorAll("a[data-filter]");
      filterLinks.forEach(function (a) {
        a.addEventListener("click", function (e) {
          e.preventDefault();
          var filter = a.getAttribute("data-filter");
          if (filter === currentFilter) return;
          filterLinks.forEach(function (l) { l.classList.toggle("active", l === a); });
          setFilter(filter);
        });
      });
    }

    // hoverScale is intentionally NOT part of this - it's a purely visual
    // bump applied as an extra CSS transform in render() below, so hovering
    // a piece never changes its collision size and can never shove its
    // neighbors around.
    function baseScaleFactorOf(inst) {
      return (inst.sizeFactor * globalScale * vmin()) / inst.profile.naturalW;
    }
    // fitScale is a per-instance emergency shrink (see updateFitScales in
    // simTick) so a piece can never need more room than the window - minus
    // the header line - actually has, even before any collision pushing.
    function scaleFactorOf(inst) {
      return baseScaleFactorOf(inst) * (inst.fitScale != null ? inst.fitScale : 1);
    }

    function centroidOffset(inst) {
      var s = scaleFactorOf(inst);
      return { x: inst.profile.centroidX * s, y: inst.profile.centroidY * s };
    }

    function radiusAtWorld(inst, theta, scaleOverride) {
      var s = scaleOverride !== undefined ? scaleOverride : scaleFactorOf(inst);
      return radiusAt(inst.profile, theta) * s;
    }

    function render(inst) {
      var s = scaleFactorOf(inst);
      var w = inst.profile.naturalW * s;
      var h = inst.profile.naturalH * s;
      var off = centroidOffset(inst);
      // rendered from the smoothed renderX/renderY, not the true physics
      // x/y - the simulation itself resolves overlap quickly and exactly,
      // but what's drawn trails behind it with a heavy, liquid lag, so a
      // sharp correction never reads as a jump.
      var left = inst.renderX - off.x;
      var top = inst.renderY - off.y;
      inst.el.style.width = w + "px";
      inst.el.style.height = h + "px";
      inst.el.style.transform =
        "translate(" + left + "px," + top + "px) scale(" + inst.hoverScale + ")";
    }

    function createInstance(name, profile, index, imgEl) {
      var wrap = document.createElement("a");
      wrap.href = LINKS[name] || "#";
      wrap.className = "piece";
      wrap.style.opacity = "0";
      wrap.style.width = "1px";
      wrap.style.height = "1px";
      wrap.style.pointerEvents = "none";
      // pieces that link somewhere real hand the roaming logo off to that
      // page (see window.lkwDepart in index.html) so its bounce continues
      // smoothly instead of restarting fresh on arrival - same treatment
      // the top-menu links already get.
      if (LINKS[name]) {
        wrap.addEventListener("click", function (e) {
          if (window.lkwDepart) {
            e.preventDefault();
            window.lkwDepart(LINKS[name]);
          }
        });
      }
      // reuse the already-loaded/decoded image used for shape analysis,
      // rather than creating a second <img> that would need its own
      // decode - painting a filter (drop-shadow) on an image before the
      // browser has finished decoding it can show as a plain rectangle
      // until the next repaint (e.g. the one hover triggers).
      imgEl.alt = name.replace(/\.[^.]+$/, "");
      imgEl.draggable = false;
      wrap.appendChild(imgEl);
      container.appendChild(wrap);

      // a shape that fills most of its own bounding box (a solid
      // rectangular publication scan) gets sized down from the same random
      // base range a die-cut, mostly-cutout silhouette gets, so densely
      // "full" images don't end up dominating just by being rectangular.
      var fill = profile.fillRatio != null ? profile.fillRatio : 1;
      var fillShrink = 1 - fill * 0.4;

      var inst = {
        el: wrap,
        profile: profile,
        category: CATEGORIES[name] || "other",
        sizeFactor: (0.17 + Math.random() * 0.15) * fillShrink,
        hoverScale: 1,
        hoverTarget: 1,
        x: 0, y: 0, renderX: 0, renderY: 0, vx: 0, vy: 0,
        active: false,
        everDropped: false
      };
      wrap.addEventListener("mouseenter", function () {
        inst.hoverTarget = 1.15;
        wrap.classList.add("hovered");
      });
      wrap.addEventListener("mouseleave", function () {
        inst.hoverTarget = 1;
        wrap.classList.remove("hovered");
      });

      // touch: holding a finger down previews the enlarge (like hover),
      // lifting it off counts as a tap - shown briefly before navigating
      // away, same as the tap-delay pattern used for the menu/worklist.
      var touchHolding = false;
      wrap.addEventListener("touchstart", function () {
        touchHolding = true;
        inst.hoverTarget = 1.15;
        wrap.classList.add("hovered");
      }, { passive: true });
      wrap.addEventListener("touchend", function (e) {
        if (!touchHolding) return;
        touchHolding = false;
        e.preventDefault();
        setTimeout(function () {
          inst.hoverTarget = 1;
          wrap.classList.remove("hovered");
          wrap.click();
        }, 180);
      });
      wrap.addEventListener("touchcancel", function () {
        touchHolding = false;
        inst.hoverTarget = 1;
        wrap.classList.remove("hovered");
      });

      instances.push(inst);

      // pieces fade in already scattered in place, in quick succession
      // rather than one at a time falling - but only if the current filter
      // shows this piece's category; if it's filtered out at its scheduled
      // reveal, setFilter() will bring it in later, whenever a matching
      // filter gets selected.
      setTimeout(function () {
        if (shouldShow(inst)) spawnInstance(inst);
      }, index * 60 + 40);
    }

    // sample a spread of angles around the direct line between two shapes'
    // centroids, projected onto that line, so protrusions off to either
    // side are still respected - not just the exact center-line radius.
    var EDGE_OFFSETS = [-0.7, -0.5, -0.32, -0.16, 0, 0.16, 0.32, 0.5, 0.7]; // radians
    function facingExtent(inst, baseAngle, scaleOverride) {
      var max = 0;
      for (var i = 0; i < EDGE_OFFSETS.length; i++) {
        var off = EDGE_OFFSETS[i];
        var r = radiusAtWorld(inst, baseAngle + off, scaleOverride) * Math.cos(off);
        if (r > max) max = r;
      }
      return max;
    }

    var HOVER_EASE = 0.06;
    // the actual simulation resolves overlap firmly and quickly (so nothing
    // stays visibly interpenetrating) - "heavy/flowy/slow" comes from
    // RENDER_EASE below lagging what's drawn behind that true position,
    // not from weakening the collision response itself.
    var RESOLVE_ITERATIONS = 8;
    var CORRECTION_SHARE = 0.5;
    var SLEEP_MOVE_EPS = 0.08;
    var SLEEP_FRAMES = 18;
    var WAKE_DEFICIT = 0.15;
    var RENDER_EASE = 0.09;

    // pushes a piece's centroid out of an axis-aligned rectangle obstacle
    // (the corner menu) along whichever direction gets it out fastest -
    // the nearest point on the rect's boundary if the centroid is outside,
    // or the nearest edge if it somehow ended up inside.
    function pushOutOfRect(a, rect) {
      var cx = a.x, cy = a.y;
      var insideX = cx > rect.left && cx < rect.right;
      var insideY = cy > rect.top && cy < rect.bottom;
      var theta, dist;
      if (insideX && insideY) {
        var dl = cx - rect.left, dr = rect.right - cx, dt = cy - rect.top, db = rect.bottom - cy;
        var m = Math.min(dl, dr, dt, db);
        theta = m === dl ? Math.PI : m === dr ? 0 : m === dt ? -Math.PI / 2 : Math.PI / 2;
        dist = 0;
      } else {
        var closestX = Math.min(Math.max(cx, rect.left), rect.right);
        var closestY = Math.min(Math.max(cy, rect.top), rect.bottom);
        var ddx = cx - closestX, ddy = cy - closestY;
        dist = Math.hypot(ddx, ddy) || 0.001;
        theta = Math.atan2(ddy, ddx);
      }
      var ext = facingExtent(a, theta);
      if (dist < ext) {
        var push = ext - dist;
        a.x += Math.cos(theta) * push;
        a.y += Math.sin(theta) * push;
      }
    }

    // whenever 3+ visible pieces of the same category end up touching each
    // other, draw a thin black rectangular frame behind the whole cluster.
    // "touching" reuses the same distance test as the piece-piece collision
    // above (settled pieces rest almost exactly at that distance, `gap`
    // apart), with a little slack so a barely-separated pair still counts.
    var clusterFramesEl = document.getElementById("clusterFrames");
    var frameEls = [];
    function computeClusters(gap) {
      var visible = instances.filter(function (inst) { return inst.active; });
      var count = visible.length;
      var parent = visible.map(function (_, idx) { return idx; });
      function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
      var TOUCH_SLOP = gap * 1.5;

      for (var i = 0; i < count; i++) {
        for (var j = i + 1; j < count; j++) {
          var A = visible[i], B = visible[j];
          if (A.category !== B.category) continue;
          var dx = B.x - A.x, dy = B.y - A.y;
          var dist = Math.hypot(dx, dy) || 0.001;
          var theta = Math.atan2(dy, dx);
          var minDist = facingExtent(A, theta) + facingExtent(B, theta + Math.PI) + gap;
          if (dist <= minDist + TOUCH_SLOP) {
            var ra = find(i), rb = find(j);
            if (ra !== rb) parent[ra] = rb;
          }
        }
      }

      var groups = {};
      for (var k = 0; k < count; k++) {
        var root = find(k);
        (groups[root] = groups[root] || []).push(visible[k]);
      }

      var pad = Math.max(10, vmin() * 0.012);
      var frames = [];
      Object.keys(groups).forEach(function (key) {
        var group = groups[key];
        if (group.length < 3) return;
        // uses renderX/renderY (what's actually drawn), not the true x/y,
        // so the frame never looks detached from the pieces it's framing
        // while their drawn position is still easing toward the resolved one.
        var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        group.forEach(function (inst) {
          minX = Math.min(minX, inst.renderX - facingExtent(inst, Math.PI));
          maxX = Math.max(maxX, inst.renderX + facingExtent(inst, 0));
          minY = Math.min(minY, inst.renderY - facingExtent(inst, -Math.PI / 2));
          maxY = Math.max(maxY, inst.renderY + facingExtent(inst, Math.PI / 2));
        });
        frames.push({
          left: minX - pad, top: minY - pad,
          width: (maxX - minX) + pad * 2, height: (maxY - minY) + pad * 2
        });
      });
      return frames;
    }
    function renderClusterFrames(frames) {
      while (frameEls.length < frames.length) {
        var el = document.createElement("div");
        el.className = "cluster-frame";
        clusterFramesEl.appendChild(el);
        frameEls.push(el);
      }
      while (frameEls.length > frames.length) {
        frameEls.pop().remove();
      }
      frames.forEach(function (f, idx) {
        var el = frameEls[idx];
        el.style.left = f.left + "px";
        el.style.top = f.top + "px";
        el.style.width = f.width + "px";
        el.style.height = f.height + "px";
      });
    }

    function simTick() {
      var vm = vmin();
      var gravity = vm * 0.0004;
      var maxFall = vm * 0.01;
      var gap = Math.max(12, vm * 0.016);
      var topWallY = topBound();
      var floorY = window.innerHeight;
      var leftWall = 0, rightWall = window.innerWidth;
      var cornerRect = cornerMenuRect();
      var n = instances.length;
      var i, a;

      globalScale += (globalScaleTarget - globalScale) * GLOBAL_SCALE_EASE;

      // emergency shrink: whatever globalScale says, a piece can never be
      // allowed to need more room than the window (minus the header line)
      // actually has - so cap each piece's own scale to what actually fits
      // its bounding box in there, before any collision/positioning even
      // runs this frame. this is what "downsize if it doesn't fit" means
      // in practice, independent of the shared filter-driven grow/shrink.
      var availW = (rightWall - leftWall) * 0.96;
      var availH = (floorY - topWallY) * 0.96;
      for (i = 0; i < n; i++) {
        a = instances[i];
        if (!a.active) continue;
        var base = baseScaleFactorOf(a);
        var neededW = facingExtent(a, Math.PI, base) + facingExtent(a, 0, base);
        var neededH = facingExtent(a, -Math.PI / 2, base) + facingExtent(a, Math.PI / 2, base);
        a.fitScale = Math.min(1, availW / neededW, availH / neededH);
      }

      // liquid-flow: the cursor lightly, slowly draws nearby pieces toward
      // it (not repels) as it passes through the collage - the resolve
      // pass below still keeps them from ever overlapping each other or
      // the boundaries, so it reads as pieces drifting close without
      // piling into one another. kept gentle enough that a piece can
      // still be caught and clicked instead of sliding away.
      if (mouseX !== null) {
        var magnetRadius = vm * 0.16;
        var magnetStrength = vm * 0.0018;
        for (i = 0; i < n; i++) {
          a = instances[i];
          if (!a.active) continue;
          var mdx = mouseX - a.x, mdy = mouseY - a.y;
          var mdist = Math.hypot(mdx, mdy);
          if (mdist > 0.001 && mdist < magnetRadius) {
            var pull = (1 - mdist / magnetRadius) * magnetStrength;
            a.x += (mdx / mdist) * pull;
            a.y += (mdy / mdist) * pull;
            a.sleeping = false;
          }
        }
      }

      for (i = 0; i < n; i++) {
        a = instances[i];
        a.hoverScale += (a.hoverTarget - a.hoverScale) * HOVER_EASE;
        if (!a.active) continue;

        a.beforeX = a.x;
        a.beforeY = a.y;

        // a gentle, slow pull toward the bottom - not a fall, more a slow
        // magnetic drift - plus whatever momentum came out of the last
        // resolve pass. sleeping pieces stay put entirely, so a settled
        // pile doesn't keep drifting into itself forever.
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
          // ceiling: the header line's bottom edge, not the bare viewport
          // top - a piece can never sit above it, or under it unseen.
          var topExt = facingExtent(a, -Math.PI / 2);
          if (a.y - topExt < topWallY) {
            a.y = topWallY + topExt;
            if (a.vy < 0) a.vy = 0;
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
          if (cornerRect) pushOutOfRect(a, cornerRect);

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
          // re-check after the pairwise pass too, in case a neighbor's
          // correction just nudged this piece back into the menu's rect.
          if (cornerRect) pushOutOfRect(a, cornerRect);
        }
      }

      // hard limit: the per-pass wall/ceiling checks above can still get
      // overridden later in the same pass by a pairwise push (a piece
      // shoved by a crowded neighbor after already being clamped to the
      // floor, say) - so re-clamp every side once more, unconditionally,
      // after all relaxation passes are done. this is the actual guarantee
      // that nothing ever renders outside the window, not just usually.
      for (i = 0; i < n; i++) {
        a = instances[i];
        if (!a.active) continue;
        var hardBottom = facingExtent(a, Math.PI / 2);
        if (a.y + hardBottom > floorY) a.y = floorY - hardBottom;
        var hardTop = facingExtent(a, -Math.PI / 2);
        if (a.y - hardTop < topWallY) a.y = topWallY + hardTop;
        var hardLeft = facingExtent(a, Math.PI);
        if (a.x - hardLeft < leftWall) a.x = leftWall + hardLeft;
        var hardRight = facingExtent(a, 0);
        if (a.x + hardRight > rightWall) a.x = rightWall - hardRight;
      }

      // velocity is derived from the actual net position change this frame
      // (repulsion nudge plus every correction), so a piece only keeps
      // drifting while something is actively displacing it, and comes to
      // rest cleanly the moment nothing is anymore.
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

      // the drawn position eases toward the true (already-resolved, never
      // overlapping) position rather than snapping straight to it - this
      // is the actual source of the heavy/flowy/slow feel.
      for (i = 0; i < n; i++) {
        a = instances[i];
        if (!a.active) continue;
        a.renderX += (a.x - a.renderX) * RENDER_EASE;
        a.renderY += (a.y - a.renderY) * RENDER_EASE;
      }

      for (var k = 0; k < n; k++) if (instances[k].active) render(instances[k]);
      if (clusterFramesEl) renderClusterFrames(computeClusters(gap));
      requestAnimationFrame(simTick);
    }

    Promise.all(IMAGES.map(function (name) {
      return new Promise(function (resolve) {
        var img = new Image();
        img.onload = function () {
          // wait for a full decode (not just onload) before this image is
          // ever painted with a filter, so it's never shown mid-decode
          var decoded = img.decode ? img.decode().catch(function () {}) : Promise.resolve();
          decoded.then(function () {
            analyzeImage(img).then(function (profile) {
              resolve({ name: name, profile: profile, img: img });
            });
          });
        };
        img.onerror = function () { resolve(null); };
        img.src = IMAGE_DIR + name;
      });
    })).then(function (results) {
      results.filter(Boolean).forEach(function (r, idx) {
        createInstance(r.name, r.profile, idx, r.img);
      });
      updateGlobalScaleTarget();
      requestAnimationFrame(simTick);
    });
  });
})();
