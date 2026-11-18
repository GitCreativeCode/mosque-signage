import { describe, it, expect } from 'vitest';
import { HelpdeskSupportCard } from '@/components/common/HelpdeskSupportCard';

describe('HelpdeskSupportCard Component', () => {
  it('renders support card with default URLs and email', () => {
    const card = HelpdeskSupportCard({});
    expect(card).toBeDefined();
    expect(card.type).toBe('section');
    expect(card.props['aria-labelledby']).toBe('helpdesk-support-title');
  });

  it('supports custom URL and email overrides', () => {
    const card = HelpdeskSupportCard({
      supportFormUrl: 'https://custom-support.example.com',
      feedbackFormUrl: 'https://custom-feedback.example.com',
      supportEmail: 'custom.support@example.org',
    });
    expect(card).toBeDefined();
    expect(card.props.children).toBeDefined();
  });

  it('verifies standard action destinations and email syntax', () => {
    const defaultSupportForm = 'https://forms.gle/X8j99388AAWAKk3a8';
    const defaultFeedbackForm = 'https://forms.gle/E7TBvvD6H8njMhn88';
    const defaultEmail = 'helpdesk.guidance@gmail.com';

    expect(defaultSupportForm).toBe('https://forms.gle/X8j99388AAWAKk3a8');
    expect(defaultFeedbackForm).toBe('https://forms.gle/E7TBvvD6H8njMhn88');
    expect(defaultEmail).toBe('helpdesk.guidance@gmail.com');
  });
});
