import type { Preview } from "@storybook/react-vite";
import { withThemeByClassName } from '@storybook/addon-themes';
import "../src/styles.css";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "tenzyu dark",
      values: [
        { name: "tenzyu dark", value: "#0f1017" },
        { name: "tenzyu light", value: "#f8f8fb" },
      ],
    },
    a11y: {
      test: "todo",
    },
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: [
          "Design System",
          [
            "Foundations",
            ["Tokens", "Normalize", "Variant Policy"],
            "Components",
            [
              "Actions",
              "Surfaces",
              "Forms",
              "Feedback",
              "Navigation",
              "Disclosure",
              "Data Display",
              "Rich",
            ],
          ],
        ],
      },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
  ],
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Design token theme",
      defaultValue: "dark",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "dark", title: "Dark" },
          { value: "light", title: "Light" },
        ],
      },
    },
  },
};

export default preview;
