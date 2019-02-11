import run from './index';

describe('Interface tests', () => {
  it('Has a default export', () => {
    expect(run()).toBe(true);
  });
});
