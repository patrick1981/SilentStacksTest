/* SilentStacks Selector Map Loader (AI-collab friendly)
 * Usage:
 *   <script src="selector-loader.js" data-src="selector-map.json"></script>
 *   <script> window.SS_SELECTOR_MAP.then(S => { /* pass S into adapter */ }); </script>
 */
(function(){
  function deepMerge(target, source){
    for (const k in source){
      if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k])){
        if (!target[k]) target[k] = {};
        deepMerge(target[k], source[k]);
      } else {
        target[k] = source[k];
      }
    }
    return target;
  }

  const script = document.currentScript;
  const url = (script && script.getAttribute('data-src')) || 'selector-map.json';

  const defaultMap = {
    buttons:{}, inputs:{}, clinical_trials:{}, chips:{}, bulk:{}, table:{}, status_regions:{}
  };

  window.SS_SELECTOR_MAP = fetch(url, { cache: 'no-store' })
    .then(r => r.ok ? r.json() : defaultMap)
    .then(json => deepMerge(defaultMap, json))
    .catch(() => defaultMap);
})();