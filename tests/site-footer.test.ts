import { describe, it, expect } from 'vitest';
import { APP_VERSION, SiteFooter } from '@/components/common/SiteFooter';
import packageJson from '../package.json';

describe('SiteFooter Component & Release Metadata', () => {
  it('exports APP_VERSION matching package.json release version', () => {
    expect(APP_VERSION).toBe('0.1.3');
    expect(APP_VERSION).toBe(packageJson.version);
  });

  it('renders SiteFooter component successfully with default version', () => {
    const footerElement = SiteFooter({});
    expect(footerElement).toBeDefined();
    expect(footerElement.type).toBe('footer');
  });

  it('accepts custom version override if needed', () => {
    const footerElement = SiteFooter({ version: '0.2.0-beta' });
    expect(footerElement).toBeDefined();
    expect(footerElement.props.role).toBe('contentinfo');
  });
});
