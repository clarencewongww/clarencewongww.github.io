/*!
 * Chalkboard Cosmos — main.js
 * Drives all DOM interactions for the single-page portfolio:
 *   1. Reveal-on-scroll
 *   2. Scroll progress bar
 *   3. Lesson-rail scroll-spy
 *   4. 3D project cards
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
})();
