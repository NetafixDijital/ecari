(function () {
  'use strict';
  function cssVar(name, fb) {
    return (window.Helpers && window.Helpers.getCssVar(name)) || fb;
  }
  window.config = {
    colors: {
      primary: cssVar('primary', '#7367f0'),
      secondary: cssVar('secondary', '#808390'),
      success: cssVar('success', '#28c76f'),
      info: cssVar('info', '#00bad1'),
      warning: cssVar('warning', '#ff9f43'),
      danger: cssVar('danger', '#ff4c51'),
      cardColor: cssVar('paper-bg', '#fff'),
      headingColor: cssVar('heading-color', '#444050'),
      textMuted: cssVar('secondary-color', '#acaab1')
    },
    colors_label: {
      primary: cssVar('primary-bg-subtle', '#e9e7fd'),
      secondary: '#eaeaec',
      success: '#ddf6e8',
      info: '#d6f4f8',
      warning: '#fff0e1',
      danger: '#ffe2e3'
    },
    fontFamily: cssVar('font-family-base', '"IBM Plex Sans", Tahoma, "Segoe UI", Arial, sans-serif')
  };
  window.assetsPath = 'assets/';
})();
