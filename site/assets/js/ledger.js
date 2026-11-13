/* Ledger filtering: verdict chips + text search over prerendered rows.
   Rows carry data-verdict and data-search attributes; no fetching. */
(function () {
  var table = document.querySelector('.ledger');
  if (!table) return;
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip[data-filter]'));
  var search = document.getElementById('q');
  var rows = Array.prototype.slice.call(table.querySelectorAll('.body-row'));
  var state = { verdict: 'all', q: '' };

  function apply() {
    rows.forEach(function (row) {
      var okV = state.verdict === 'all' || row.getAttribute('data-verdict') === state.verdict;
      var okQ = !state.q || (row.getAttribute('data-search') || '').toLowerCase().indexOf(state.q) !== -1;
      row.style.display = okV && okQ ? '' : 'none';
    });
    chips.forEach(function (chip) {
      chip.setAttribute('aria-pressed', chip.getAttribute('data-filter') === state.verdict ? 'true' : 'false');
    });
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      state.verdict = chip.getAttribute('data-filter');
      apply();
    });
  });
  if (search) {
    search.addEventListener('input', function () {
      state.q = search.value.trim().toLowerCase();
      apply();
    });
  }
})();
