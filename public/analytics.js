(() => {
  // Google Analytics dos jogos, contrato v3 (24/09/2026). Todas as cópias são iguais,
  // mudando só `game`; framework/tests/games-analytics.test.mjs confere cada uma.
  // - Só domínios do estúdio medem (cópia publicada por terceiros não suja a propriedade).
  // - A URL enviada perde a query, menos campanha (utm_* e ids de clique do Google):
  //   código de sala, token e retorno de login nunca saem do navegador.
  // - Volta de login (Google, Supabase, Apple) não vira origem da sessão.
  // - <script data-screens="virtual"> desliga a visualização automática: o jogo manda
  //   uma por tela e lê window.__gamesAnalyticsContext para URL, campanha e referência.
  const measurementId = 'G-JQ2HZ32YD8';
  const game = { game_id: "tres-porquinhos-carrossel", game_name: "Os Três Porquinhos" };
  const script = document.currentScript;
  const search = new URLSearchParams(location.search);
  const debug = search.get('analytics_debug') === '1';
  const host = location.hostname;
  const local = /^(localhost|127(?:\.\d+){3}|\[::1\])$/.test(host);
  const ours = /(^|\.)(rabisco\.net|alanicolas\.com)$/.test(host)
    || /^(distrito-rabisco|corrida-rabisco|rabisco-boom|rabisco-fight|guerra-dos-rabiscos|arena-rabisco|so-sobra-um|universo-rabisco|games-alanicolas|brasa-pista|bebe-geleia|megarealista|combate-lendario|era-uma-vez-rosy|sucata-viva-psi|doodleshooter)\.vercel\.app$/.test(host);
  if (window.__gamesAnalytics || !/^https?:$/.test(location.protocol) || !(debug || (ours && !local))) return;
  window.__gamesAnalytics = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  const cleanUrl = (value) => {
    if (!value) return '';
    try {
      const url = new URL(value);
      return /^https?:$/.test(url.protocol) ? url.origin + url.pathname : '';
    } catch { return ''; }
  };
  const campaign = new URLSearchParams();
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'gclid', 'gbraid', 'wbraid']) {
    const value = search.get(key);
    if (value) campaign.set(key, value.slice(0, 100));
  }
  const query = campaign.toString() ? '?' + campaign : '';
  let referrerHost = '';
  try { referrerHost = new URL(document.referrer).hostname; } catch {}
  const loginReturn = /(^|\.)(accounts\.google\.com|supabase\.co|appleid\.apple\.com)$/.test(referrerHost);
  const referrer = loginReturn ? '' : cleanUrl(document.referrer);
  window.__gamesAnalyticsContext = { measurementId, ...game, campaign: query, referrer, ignoreReferrer: loginReturn, debug };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    ...game,
    send_page_view: script?.dataset?.screens !== 'virtual',
    page_location: cleanUrl(location.href) + query,
    page_referrer: referrer,
    ...(loginReturn ? { ignore_referrer: true } : {}),
    linker: { domains: ['rabisco.net', 'alanicolas.com'] },
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    ...(debug ? { debug_mode: true } : {}),
  });
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(tag);
  window.dispatchEvent?.(new Event('games-analytics-ready'));
})();
