import { getLaunchStatus, LaunchStatusEnum } from '~/utilities/quickStartUtils';

jest.mock('~/utilities/quickStartUtils', () => ({
  getLaunchStatus: jest.fn(),
}));

describe('getLaunchStatus', () => {
  it('should return LaunchStatusEnum.Open when quickStartId is undefined', () => {
    const result = getLaunchStatus();
    console.log('🚀 ~ file: quickStartUtils.spec.ts:10 ~ it ~ result:', result);
    expect(result).toBe(LaunchStatusEnum.Open);
  });
});
