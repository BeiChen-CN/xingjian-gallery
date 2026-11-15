/* 作品页的返回展厅导航，以及从展厅靠近进入时的衔接淡入。 */
(() => {
  'use strict';
  const home = new URL('../学员AI作品展.html', document.currentScript.src);
  const prepareReturn = () => {
    const link = document.querySelector('.exhibition-return');
    if (!link) return;
    link.href = home.href;
    if (typeof link.showPopover === 'function') {
      link.setAttribute('popover', 'manual');
      link.showPopover();
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prepareReturn, { once: true });
  else prepareReturn();
  const url = new URL(location.href);
  if (url.searchParams.get('__exhibition') !== 'enter') return;
  url.searchParams.delete('__exhibition');
  history.replaceState(history.state, '', url.href);
  const root = document.documentElement;
  root.classList.add('exhibition-arrival');
  const reveal = () => {
    root.classList.add('exhibition-arrival-ready');
    setTimeout(() => root.classList.remove('exhibition-arrival', 'exhibition-arrival-ready'), 760);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reveal, { once: true });
  else reveal();
})();
