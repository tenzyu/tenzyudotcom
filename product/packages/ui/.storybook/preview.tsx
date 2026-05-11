import type { Preview } from "@storybook/react-vite";
import "../src/styles.css";

const preview: Preview = {
  parameters: {
    a11y: {
      test: "todo",
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="dark" data-theme="dark" style={{ minHeight: "100vh", padding: "2rem" }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
