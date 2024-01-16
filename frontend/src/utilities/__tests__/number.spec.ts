import { bytesAsGB } from '~/utilities/number';

describe('bytesAsGB', () => {
  it('should return 0 for NaN input', () => {
    const resultNaN = bytesAsGB(NaN);
    expect(resultNaN).toBe(0);
  });

  it('should convert bytes to gigabytes and round to 1 decimal place when greater than or equal to 0.1 GB', () => {
    const result1GB = bytesAsGB(1024 * 1024 * 1024);
    expect(result1GB).toBe(1);
  });

  it('should round to 2 decimal places when less than 0.1 GB', () => {
    const result0_1GB = bytesAsGB(100 * 1024 * 1024);
    expect(result0_1GB).toBe(0.1);
  });
});
