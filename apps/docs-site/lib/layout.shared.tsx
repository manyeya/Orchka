import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      enabled: false, // Disabled for custom landing page
    },
    links: [
      {
        text: 'Docs',
        url: '/docs',
        active: 'nested-url',
      },
      {
        text: 'GitHub',
        url: 'https://github.com/manyeya/Orchka',
      },
    ],
    githubUrl: 'https://github.com/manyeya/Orchka',
  };
}
