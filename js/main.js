/*!
 * Chalkboard Cosmos — main.js
 * Drives all DOM interactions for the single-page portfolio:
 *   1. Reveal-on-scroll
 *   2. Scroll progress bar
 *   3. Lesson-rail scroll-spy
 *   4. 3D project cards
 *   5. Lesson dolly (scroll-linked zoom)
 *
 * Plain vanilla JS, no dependencies, no modules. Loaded AFTER js/cosmos.js.
 * Every behaviour is isolated in its own try/catch so a failure in one can
 * never break the rest, and every motion-based effect respects
 * `prefers-reduced-motion`. Zero console errors.
 */
(function () {
  'use strict';

  /* --- Shared helpers -------------------------------------------------- */

  /** Cross-browser vertical scroll position (px from top of the document). */
  function getScrollY() {
    if (window.pageYOffset !== undefined) {
      return window.pageYOffset;
    }
    return window.scrollY || 0;
  }

  /** True when the user has requested reduced motion. */
  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /** True when the primary pointer supports hover (mouse / trackpad). */
  function hoverCapable() {
    return !!(window.matchMedia && window.matchMedia('(hover: hover)').matches);
  }

  /** requestAnimationFrame with a safe fallback for ancient browsers. */
  function raf(callback) {
    if (window.requestAnimationFrame) {
      return window.requestAnimationFrame(callback);
    }
    return window.setTimeout(callback, 16);
  }

  /* --- 1. Reveal-on-scroll ---------------------------------------------- */
  (function () {
    try {
      var reveals = document.querySelectorAll('.reveal');

      /* Reduced motion: reveal everything up front, skip the observer. */
      if (prefersReducedMotion()) {
        for (var i = 0; i < reveals.length; i++) {
          reveals[i].classList.add('is-visible');
        }
        return;
      }

      /* No IntersectionObserver: reveal everything rather than hiding it. */
      if (!('IntersectionObserver' in window)) {
        for (var j = 0; j < reveals.length; j++) {
          reveals[j].classList.add('is-visible');
        }
        return;
      }

      var revealObserver = new IntersectionObserver(
        function (entries) {
          for (var k = 0; k < entries.length; k++) {
            if (entries[k].isIntersecting) {
              entries[k].target.classList.add('is-visible');
              revealObserver.unobserve(entries[k].target);
            }
          }
        },
        { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
      );

      /* Observing fires an initial callback immediately, so anything that is
         already in the viewport at load gets revealed right away. */
      for (var l = 0; l < reveals.length; l++) {
        revealObserver.observe(reveals[l]);
      }
    } catch (err) {
      /* reveal failure must never take down the rest of the page */
    }
  })();

  /* --- 2. Scroll progress bar -------------------------------------------- */
  (function () {
    try {
      var bar = document.querySelector('.progress-chalk__bar');
      if (!bar) {
        return;
      }

      var progressTicking = false;

      function updateProgress() {
        progressTicking = false;
        var docHeight = document.documentElement.scrollHeight;
        var viewportHeight = window.innerHeight;
        var maxScroll = docHeight - viewportHeight;
        if (maxScroll <= 0) {
          bar.style.setProperty('--p', 0);
          return;
        }
        bar.style.setProperty('--p', Math.min(1, getScrollY() / maxScroll));
      }

      /* rAF-throttle: coalesce multiple scroll events into one update. */
      function scheduleProgress() {
        if (!progressTicking) {
          progressTicking = true;
          raf(updateProgress);
        }
      }

      window.addEventListener('scroll', scheduleProgress, { passive: true });
      window.addEventListener('resize', scheduleProgress);
      window.addEventListener('load', updateProgress);

      /* Draw once so the bar is correct before the first scroll. */
      updateProgress();
    } catch (err) {
      /* progress-bar failure must never take down the rest of the page */
    }
  })();

  /* --- 3. Lesson-rail scroll-spy ------------------------------------------ */
  (function () {
    try {
      var sections = Array.prototype.slice.call(
        document.querySelectorAll('section.lesson[data-lesson]')
      );

      /* The hero header is a <header>, not a section, but it is the first
         stop on the rail (dot 00), so prepend it. */
      var hero = document.getElementById('hero');
      if (hero) {
        sections.unshift(hero);
      }

      var dots = document.querySelectorAll('.lesson-dot');
      if (!sections.length || !dots.length) {
        return;
      }

      var currentActiveId = null;

      /** Mark the matching dot active (+ aria-current) and clear the rest. */
      function setActive(id) {
        if (!id || id === currentActiveId) {
          return;
        }
        currentActiveId = id;
        for (var i = 0; i < dots.length; i++) {
          var dot = dots[i];
          if (dot.getAttribute('data-target') === id) {
            dot.classList.add('is-active');
            dot.setAttribute('aria-current', 'true');
          } else {
            dot.classList.remove('is-active');
            dot.removeAttribute('aria-current');
          }
        }
      }

      /* Fallback: find the section overlapping the spy band by document
         position, run on every scroll for robustness (layout can shift as
         lazy images load). */
      var spyTicking = false;

      function updateSpyFromScroll() {
        spyTicking = false;
        var ref = getScrollY() + window.innerHeight * 0.475; /* band middle */
        var current = null;

        for (var i = 0; i < sections.length; i++) {
          var top = sections[i].getBoundingClientRect().top + getScrollY();
          var bottom = top + sections[i].offsetHeight;
          if (top <= ref && ref <= bottom) {
            current = sections[i];
            break;
          }
        }

        if (!current) {
          /* Between lessons: pick the nearest section by offset distance. */
          var bestDist = Infinity;
          for (var j = 0; j < sections.length; j++) {
            var t = sections[j].getBoundingClientRect().top + getScrollY();
            var b = t + sections[j].offsetHeight;
            var dist = ref < t ? t - ref : ref > b ? ref - b : 0;
            if (dist < bestDist) {
              bestDist = dist;
              current = sections[j];
            }
          }
        }

        if (current) {
          setActive(current.id);
        }
      }

      function scheduleSpy() {
        if (!spyTicking) {
          spyTicking = true;
          raf(updateSpyFromScroll);
        }
      }

      window.addEventListener('scroll', scheduleSpy, { passive: true });
      window.addEventListener('resize', scheduleSpy);
      window.addEventListener('load', updateSpyFromScroll);

      if ('IntersectionObserver' in window) {
        /* Primary spy: the root band sits in the middle of the viewport
           (-45% top / -50% bottom); the section overlapping it is current. */
        var spyObserver = new IntersectionObserver(
          function (entries) {
            var best = null;
            var bestRatio = -1;
            var bestIndex = -1;

            for (var k = 0; k < entries.length; k++) {
              var entry = entries[k];
              if (!entry.isIntersecting) {
                continue;
              }
              var idx = sections.indexOf(entry.target);
              var ratio = entry.intersectionRatio;
              /* Ties go to the later section so a fresh lesson wins. */
              if (ratio > bestRatio || (ratio === bestRatio && idx > bestIndex)) {
                best = entry.target;
                bestRatio = ratio;
                bestIndex = idx;
              }
            }

            if (best) {
              setActive(best.id);
            }
          },
          { rootMargin: '-45% 0px -50% 0px' }
        );

        for (var m = 0; m < sections.length; m++) {
          spyObserver.observe(sections[m]);
        }
      } else {
        updateSpyFromScroll();
      }
    } catch (err) {
      /* scroll-spy failure must never take down the rest of the page */
    }
  })();

  /* --- 4. 3D project cards ------------------------------------------------- */
  (function () {
    try {
      /* Touch devices (no hover) and reduced-motion users keep cards flat. */
      if (!hoverCapable() || prefersReducedMotion()) {
        return;
      }

      var cards = document.querySelectorAll('.card-3d');
      if (!cards.length) {
        return;
      }

      function resetTilt(card) {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      }

      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];

        card.addEventListener('pointermove', function (event) {
          var target = event.currentTarget;
          var rect = target.getBoundingClientRect();
          if (!rect.width || !rect.height) {
            return;
          }
          var x = event.clientX - rect.left;
          var y = event.clientY - rect.top;
          var ry = ((x / rect.width) - 0.5) * 14;   /* tilt left/right   */
          var rx = -((y / rect.height) - 0.5) * 10; /* tilt up/down      */
          target.style.setProperty('--ry', ry.toFixed(3) + 'deg');
          target.style.setProperty('--rx', rx.toFixed(3) + 'deg');
        });

        card.addEventListener('pointerleave', function (event) {
          resetTilt(event.currentTarget);
        });
      }
    } catch (err) {
      /* 3D-card failure must never take down the rest of the page */
    }
  })();

  /* --- 5. Lesson dolly (scroll-linked zoom) -------------------------------- */
  (function () {
    try {
      /* Camera-sympathy contract: cosmos.js reads this every frame, so the
         object must always exist and never throw — even when dolly is off. */
      window.__chalkDolly = window.__chalkDolly || { dip: 0 };

      /* Reduced motion: zero visual changes to the planes. */
      if (prefersReducedMotion()) {
        return;
      }

      /* Collect the hero plane plus every lesson plane, in document order.
         A plane is the inner content element; the outer section only provides
         the document geometry. Skip any plane whose inner is missing. */
      var planes = [];

      var heroEl = document.getElementById('hero');
      if (heroEl) {
        var heroInner = heroEl.querySelector('.hero-inner');
        if (heroInner) {
          planes.push({ el: heroInner, docTop: 0, height: 0 });
        }
      }

      var lessonEls = document.querySelectorAll('section.lesson[data-lesson]');
      for (var k = 0; k < lessonEls.length; k++) {
        var lessonInner = lessonEls[k].querySelector('.lesson-inner');
        if (lessonInner) {
          planes.push({ el: lessonInner, docTop: 0, height: 0 });
        }
      }

      if (planes.length < 2) {
        return;
      }

      var dollyTicking = false;
      var lastScrollHeight = 0;

      /** Recompute the cached geometry for every plane. Only this function
          may read layout; the per-frame handler uses the cache alone. */
      function cachePlanes() {
        var scrollY = getScrollY();
        for (var i = 0; i < planes.length; i++) {
          var rect = planes[i].el.getBoundingClientRect();
          planes[i].docTop = rect.top + scrollY;
          planes[i].height = rect.height;
        }
        lastScrollHeight = document.documentElement.scrollHeight;
      }

      function updateDolly() {
        dollyTicking = false;

        /* Cheap guard: lazy images finishing loading shift layout, so refresh
           the cached geometry whenever the document height changes. */
        if (document.documentElement.scrollHeight !== lastScrollHeight) {
          cachePlanes();
        }

        var vh = window.innerHeight;
        var scrollY = getScrollY(); /* convert cached doc-space tops to viewport space */
        var maxScroll = document.documentElement.scrollHeight - vh;
        var i;
        var dip = 0;

        for (i = 0; i < planes.length; i++) {
          var plane = planes[i];
          var s = (vh + scrollY - plane.docTop) / (vh + plane.height);
          if (s < 0) { s = 0; } else if (s > 1) { s = 1; }

          /* Edge planes are pinned by the scroll limits and can never centre
             their content, so at the scroll extremes clamp them to the resting
             pose (s = 0.5) before the smoothstep. */
          if (i === 0 && scrollY <= 0) {
            s = Math.max(s, 0.5);
          } else if (i === planes.length - 1 && maxScroll > 0 && scrollY >= maxScroll) {
            s = Math.min(s, 0.5);
          }

          var s2 = s * s * (3 - 2 * s); /* smoothstep */

          /* Departing lesson recedes; arriving lesson looms and settles. */
          var scale = 1 + 0.16 * (0.5 - s2);
          var opacity;
          var ty;
          if (s2 < 0.5) {
            opacity = 2 * s2;                    /* entering: 0 -> 1      */
            ty = 14 * (1 - 2 * s2);              /* loom from +14px        */
          } else {
            opacity = 1 - 0.9 * (s2 - 0.5);      /* departing floors 0.55  */
            ty = -12 * (2 * s2 - 1);             /* recede to -12px        */
          }

          plane.el.style.transform =
            'scale(' + scale.toFixed(4) + ') translateY(' + ty.toFixed(1) + 'px)';
          plane.el.style.opacity = opacity.toFixed(3);

          /* Promote only the planes mid-transition, then release. The zoom
             band is wider than two adjacent plane steps, so at most two
             planes ever hold will-change at once. */
          if (s > 0.15 && s < 0.85) {
            plane.el.style.willChange = 'transform, opacity';
          } else if (plane.el.style.willChange === 'transform, opacity') {
            plane.el.style.willChange = '';
          }
        }

        /* Camera sympathy: find the active boundary (at most one qualifies)
           and dip the cosmos camera toward it. */
        for (i = 0; i < planes.length - 1; i++) {
          var nextTop = planes[i + 1].docTop - scrollY;
          if (nextTop > 0.34 * vh && nextTop < 0.66 * vh) {
            var crossing = (0.66 * vh - nextTop) / (0.32 * vh);
            dip = Math.sin(crossing * Math.PI);
            break;
          }
        }

        window.__chalkDolly = { dip: dip };
      }

      /* rAF-throttle: coalesce multiple scroll events into one update. */
      function scheduleDolly() {
        if (!dollyTicking) {
          dollyTicking = true;
          raf(updateDolly);
        }
      }

      cachePlanes();

      window.addEventListener('scroll', scheduleDolly, { passive: true });
      window.addEventListener('resize', cachePlanes);
      window.addEventListener('load', cachePlanes);

      /* Draw once so planes sit at their resting pose before the first scroll. */
      updateDolly();
    } catch (err) {
      /* lesson-dolly failure must never take down the rest of the page */
    }
  })();
})();
