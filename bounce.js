(function () {
  // shared DVD-style bounce physics, used on every page so a logo can
  // hand off mid-flight (position + velocity) across a real navigation.
  function startBounce(cfg) {
    var x = cfg.x, y = cfg.y;
    var vx = cfg.vx, vy = cfg.vy;
    var last = performance.now();
    var startTime = last;
    var stopped = false;

    function frame(now) {
      if (stopped) return;
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      var speed = cfg.speed();
      x += vx * speed * dt;
      y += vy * speed * dt;

      var b = cfg.bounds();
      var bounced = false;
      if (x <= b.minX) { x = b.minX; vx = Math.abs(vx); bounced = true; }
      else if (x >= b.maxX) { x = b.maxX; vx = -Math.abs(vx); bounced = true; }
      if (y <= b.minY) { y = b.minY; vy = Math.abs(vy); bounced = true; }
      else if (y >= b.maxY) { y = b.maxY; vy = -Math.abs(vy); bounced = true; }
      if (bounced && cfg.onBounce) cfg.onBounce();

      if (cfg.onFrame) cfg.onFrame(x, y, vx, vy);

      if (cfg.duration != null && (now - startTime) >= cfg.duration) {
        stopped = true;
        if (cfg.onDone) cfg.onDone({ x: x, y: y, vx: vx, vy: vy });
        return;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return function stop() { stopped = true; };
  }

  window.startBounce = startBounce;
})();
