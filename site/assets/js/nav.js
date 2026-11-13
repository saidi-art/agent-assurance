/* Progressive-enhancement nav: below 860px the primary nav sits behind a
   menu button (one phone pattern site-wide). Without JS, all links render. */
(function () {
  document.documentElement.classList.add('js');
  var btn = document.querySelector('.menu-button');
  var nav = document.querySelector('.primary-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
})();
