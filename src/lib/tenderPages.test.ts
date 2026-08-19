import { describe, expect, it } from 'vitest';
import { tenderPageText, type TenderPage } from './tenderPages';

describe('Tender pages', () => {
  it('builds playback text from the kept parts without inventing content', () => {
    const page: TenderPage = {
      id: 'page-1',
      createdAt: '2026-08-18T12:00:00.000Z',
      promptId: 'present',
      durationMinutes: 10,
      body: 'What I wrote.',
      turnText: 'What I understand now.',
      stone: 'One line to carry.',
    };
    expect(tenderPageText(page)).toBe(
      'What I wrote.\n\nWhat I understand now.\n\nOne line to carry.',
    );
  });
});
