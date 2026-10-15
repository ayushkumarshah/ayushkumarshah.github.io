/* ==========================================================================
   Blog post enhancements: table of contents with scroll spy, heading
   anchors, code block copy buttons + language labels, scrollable tables
   and the mobile TOC drawer.
   ========================================================================== */

(function () {
  'use strict';

  var prose = document.getElementById('post-prose');
  if (!prose) return;

  function slug(text) {
    return text.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  // ── Table of contents ────────────────────────────────────────────────
  // Older posts use "#" as their top level, newer ones "##"; use the two
  // highest heading levels that actually appear in the post.
  var all = prose.querySelectorAll('h1, h2, h3, h4');
  var levels = [];
  for (var i = 0; i < all.length; i++) {
    var lvl = +all[i].tagName.charAt(1);
    if (levels.indexOf(lvl) === -1) levels.push(lvl);
  }
  levels.sort();
  var top = levels[0];
  var sub = levels[1];

  var nav = document.getElementById('post-toc-nav');
  var toc = document.getElementById('post-toc');
  var fab = document.getElementById('post-toc-fab');
  var links = [];
  var seen = {};

  for (var j = 0; j < all.length; j++) {
    var h = all[j];
    var level = +h.tagName.charAt(1);
    if (!h.id) {
      var id = slug(h.textContent) || 'section';
      if (seen[id]) { seen[id]++; id += '-' + seen[id]; } else { seen[id] = 1; }
      h.id = id;
    }

    // hover anchor for sharing a section
    var anchor = document.createElement('a');
    anchor.className = 'heading-anchor';
    anchor.href = '#' + h.id;
    anchor.setAttribute('aria-label', 'Link to this section');
    anchor.textContent = '#';
    h.appendChild(anchor);

    if (level !== top && level !== sub) continue;
    var a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent.replace(/#$/, '').trim();
    if (level === sub) a.className = 'is-sub';
    nav.appendChild(a);
    links.push({ a: a, el: h });
  }

  if (links.length < 2) {
    toc.classList.add('is-empty');
  } else if (fab) {
    fab.hidden = false;
  }

  var current = null;
  function spy() {
    var y = window.pageYOffset + 120;
    var found = links[0];
    for (var k = 0; k < links.length; k++) {
      if (links[k].el.getBoundingClientRect().top + window.pageYOffset <= y) found = links[k];
      else break;
    }
    if (found && found.a !== current) {
      if (current) current.classList.remove('is-active');
      found.a.classList.add('is-active');
      current = found.a;
      var nb = nav.getBoundingClientRect();
      var ab = current.getBoundingClientRect();
      if (ab.top < nb.top || ab.bottom > nb.bottom) {
        nav.scrollTop += ab.top - nb.top - nb.height / 2;
      }
    }
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { spy(); ticking = false; });
  }, { passive: true });
  if (links.length) spy();

  // ── Scrollable tables ────────────────────────────────────────────────
  var tables = prose.querySelectorAll('table');
  for (var t = 0; t < tables.length; t++) {
    if (tables[t].parentNode.classList.contains('table-wrap')) continue;
    var tw = document.createElement('div');
    tw.className = 'table-wrap';
    tables[t].parentNode.insertBefore(tw, tables[t]);
    tw.appendChild(tables[t]);
  }

  // ── Code blocks: language label + copy button ────────────────────────
  var blocks = prose.querySelectorAll('pre');
  for (var b = 0; b < blocks.length; b++) {
    (function (pre) {
      var host = pre.closest('div.highlighter-rouge, figure.highlight') || pre;
      if (host.parentNode.classList.contains('code-block')) return;

      var lang = '';
      var m = (host.className || '').match(/language-([\w+#-]+)/) ||
              ((pre.querySelector('code') || pre).className || '').match(/language-([\w+#-]+)/);
      if (m && m[1] !== 'plaintext' && m[1] !== 'text') lang = m[1];

      var wrap = document.createElement('div');
      wrap.className = 'code-block';
      host.parentNode.insertBefore(wrap, host);

      var bar = document.createElement('div');
      bar.className = 'code-block__bar';
      var label = document.createElement('span');
      label.className = 'code-block__lang';
      label.textContent = lang || 'code';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'code-block__copy';
      btn.textContent = 'Copy';
      btn.addEventListener('click', function () {
        var text = (pre.querySelector('code') || pre).innerText;
        var done = function () {
          btn.textContent = 'Copied ✓';
          btn.classList.add('is-done');
          setTimeout(function () {
            btn.textContent = 'Copy';
            btn.classList.remove('is-done');
          }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done);
        } else {
          var ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); done(); } catch (e) {}
          document.body.removeChild(ta);
        }
      });
      bar.appendChild(label);
      bar.appendChild(btn);

      wrap.appendChild(bar);
      wrap.appendChild(host);
    })(blocks[b]);
  }

  // ── Mobile TOC drawer ────────────────────────────────────────────────
  var scrim = document.getElementById('post-scrim');
  function closeToc() {
    toc.classList.remove('is-open');
    scrim.classList.remove('is-open');
  }
  if (fab) {
    fab.addEventListener('click', function () {
      toc.classList.toggle('is-open');
      scrim.classList.toggle('is-open');
    });
  }
  if (scrim) scrim.addEventListener('click', closeToc);
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') closeToc();
  });
})();
