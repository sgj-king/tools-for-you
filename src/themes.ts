import type { GlobalThemeOverrides } from 'naive-ui';

export const lightThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#1e8b77FF',
    primaryColorHover: '#28a08aFF',
    primaryColorPressed: '#147360FF',
    primaryColorSuppl: '#28a08aFF',
    fontFamily: '"IBM Plex Sans", "Noto Sans SC", "Microsoft YaHei", sans-serif',
    fontFamilyMono: '"IBM Plex Mono", "JetBrains Mono", "Menlo", monospace',
    borderRadius: '12px',
  },
  Layout: {
    color: 'transparent',
    siderColor: 'transparent',
    siderBorderColor: 'transparent',
  },
  Card: {
    color: '#ffffff',
    borderColor: '#e5ded4',
    borderRadius: '16px',
  },
  Menu: {
    itemHeight: '36px',
    itemTextColor: '#2a3437',
    itemTextColorHover: '#1e8b77',
    itemTextColorActive: '#1e8b77',
    itemIconColor: '#7c8681',
    itemIconColorHover: '#1e8b77',
    itemIconColorActive: '#1e8b77',
  },
  Notification: {
    color: '#ffffff',
    textColor: '#1f2a2d',
  },
  AutoComplete: {
    peers: {
      InternalSelectMenu: {
        height: '500px',
      },
    },
  },
};

export const darkThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#35c9a0FF',
    primaryColorHover: '#45d7aeFF',
    primaryColorPressed: '#23b08aFF',
    primaryColorSuppl: '#45d7aeFF',
    fontFamily: '"IBM Plex Sans", "Noto Sans SC", "Microsoft YaHei", sans-serif',
    fontFamilyMono: '"IBM Plex Mono", "JetBrains Mono", "Menlo", monospace',
    borderRadius: '12px',
  },
  Notification: {
    color: '#1f2523',
    textColor: '#e7f1ed',
  },
  AutoComplete: {
    peers: {
      InternalSelectMenu: {
        height: '500px',
        color: '#1c2220',
      },
    },
  },
  InternalSelectMenu: {
    color: '#1a211f',
    textColor: '#c6d3ce',
    optionTextColor: '#c6d3ce',
    optionTextColorActive: '#35c9a0',
    optionTextColorPressed: '#35c9a0',
    optionColorPending: 'rgba(53, 201, 160, 0.08)',
    optionColorActive: 'rgba(53, 201, 160, 0.12)',
    optionColorActivePending: 'rgba(53, 201, 160, 0.16)',
    actionDividerColor: '#27312f',
    actionTextColor: '#c6d3ce',
    groupHeaderTextColor: '#97a8a1',
  },
  InternalSelection: {
    color: '#1a211f',
    textColor: '#c6d3ce',
    borderColor: '#27312f',
    borderColorHover: '#35c9a0',
    borderColorFocus: '#35c9a0',
    colorActive: '#1a211f',
    boxShadowFocus: '0 0 0 2px rgba(53, 201, 160, 0.2)',
  },
  Select: {
    peers: {
      InternalSelection: {
        color: '#1a211f',
        textColor: '#c6d3ce',
        borderColor: '#27312f',
        borderColorHover: '#35c9a0',
        borderColorFocus: '#35c9a0',
        boxShadowFocus: '0 0 0 2px rgba(53, 201, 160, 0.2)',
      },
      InternalSelectMenu: {
        color: '#1a211f',
        textColor: '#c6d3ce',
        optionTextColor: '#c6d3ce',
        optionTextColorActive: '#35c9a0',
        optionColorPending: 'rgba(53, 201, 160, 0.08)',
        optionColorActive: 'rgba(53, 201, 160, 0.12)',
      },
    },
  },
  Dropdown: {
    color: '#1a211f',
    textColor: '#c6d3ce',
    optionColorHover: 'rgba(53, 201, 160, 0.08)',
    optionColorActive: 'rgba(53, 201, 160, 0.12)',
    optionTextColor: '#c6d3ce',
    optionTextColorHover: '#35c9a0',
    optionTextColorActive: '#35c9a0',
    dividerColor: '#27312f',
    padding: '6px',
    borderRadius: '8px',
  },
  Menu: {
    color: '#1a2622',
    itemColorHover: 'rgba(53, 201, 160, 0.08)',
    itemColorActive: 'rgba(53, 201, 160, 0.16)',
    itemColorActiveHover: 'rgba(53, 201, 160, 0.2)',
    itemColorActiveCollapsed: 'rgba(53, 201, 160, 0.16)',
    itemColorActiveHoverCollapsed: 'rgba(53, 201, 160, 0.2)',
    itemColorHoverCollapsed: 'rgba(53, 201, 160, 0.08)',
    itemHeight: '36px',
    itemTextColor: '#c6d3ce',
    itemTextColorHover: '#35c9a0',
    itemTextColorActive: '#35c9a0',
    itemIconColor: '#97a8a1',
    itemIconColorHover: '#35c9a0',
    itemIconColorActive: '#35c9a0',
  },
  Layout: {
    color: 'transparent',
    siderColor: 'transparent',
    siderBorderColor: 'transparent',
  },
  Card: {
    color: '#1a211f',
    borderColor: '#27312f',
    borderRadius: '16px',
  },
  Table: {
    tdColor: '#1a211f',
    thColor: '#222b28',
  },
};
