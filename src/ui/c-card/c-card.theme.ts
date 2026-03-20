import { defineThemes } from '../theme/theme.models';

export const { useTheme } = defineThemes({
  dark: {
    backgroundColor: '#1a211f',
    borderColor: '#27312f',
  },
  light: {
    backgroundColor: '#ffffff',
    borderColor: '#e5ded4',
  },
});
