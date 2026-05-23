import { defineThemes } from './theme.models';

export const { themes: appThemes, useTheme: useAppTheme } = defineThemes({
  light: {
    background: '#fbf8f2',
    text: {
      baseColor: '#1f2a2d',
      mutedColor: '#6b7570',
    },
    default: {
      color: 'rgba(31, 42, 45, 0.06)',
      colorHover: 'rgba(31, 42, 45, 0.1)',
      colorPressed: 'rgba(31, 42, 45, 0.2)',
    },
    primary: {
      color: '#1e8b77',
      colorHover: '#28a08a',
      colorPressed: '#147360',
      colorFaded: '#1e8b7726',
    },
    warning: {
      color: '#d98a1b',
      colorHover: '#e09a2a',
      colorPressed: '#b87314',
      colorFaded: '#d98a1b26',
    },
    success: {
      color: '#1f9d6a',
      colorHover: '#2ab07a',
      colorPressed: '#177f56',
      colorFaded: '#1f9d6a26',
    },
    error: {
      color: '#cf5a63',
      colorHover: '#d97078',
      colorPressed: '#b94a52',
      colorFaded: '#cf5a6326',
    },
  },
  dark: {
    background: '#141916',
    text: {
      baseColor: '#e7f1ed',
      mutedColor: '#a2b3ad',
    },
    default: {
      color: 'rgba(231, 241, 237, 0.08)',
      colorHover: 'rgba(231, 241, 237, 0.12)',
      colorPressed: 'rgba(231, 241, 237, 0.22)',
    },
    primary: {
      color: '#35c9a0',
      colorHover: '#45d7ae',
      colorPressed: '#23b08a',
      colorFaded: '#35c9a024',
    },
    warning: {
      color: '#f0a43c',
      colorHover: '#f3b353',
      colorPressed: '#d9902c',
      colorFaded: '#f0a43c26',
    },
    success: {
      color: '#35c9a0',
      colorHover: '#45d7ae',
      colorPressed: '#23b08a',
      colorFaded: '#35c9a024',
    },
    error: {
      color: '#e68a8a',
      colorHover: '#ee9b9b',
      colorPressed: '#d97171',
      colorFaded: '#e68a8a24',
    },
  },
});
