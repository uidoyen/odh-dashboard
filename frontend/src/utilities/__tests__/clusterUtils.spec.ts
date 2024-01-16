import { useClusterInfo } from '~/redux/selectors/clusterInfo';
import { DEV_MODE } from '~/utilities/const';
import { getOpenShiftConsoleServerURL, useOpenShiftURL } from '~/utilities/clusterUtils';
let originalLocation: Location;
// Mocking the getOpenShiftConsoleServerURL function
jest.mock('~/utilities/clusterUtils', () => ({
  ...jest.requireActual('~/utilities/clusterUtils'),
  getOpenShiftConsoleServerURL: jest.fn(),
}));
describe('getOpenShiftConsoleServerURL', () => {
  console.log(process.env);
  beforeEach(() => {
    // Save the original window.location
    originalLocation = { ...window.location };
  });

  afterEach(() => {
    // Restore window.location to its original state
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('should construct URL based on window location when no apiURL is provided', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...originalLocation,
        hostname: 'api.example.com',
        protocol: 'https:',
        port: '443',
      },
    });
    // Invoke the function
    const result = getOpenShiftConsoleServerURL();

    // Assert the constructed URL
    expect(result).toBe('https://console-openshift-console.example.com:443');
  });

  it('should construct URL with DEV_MODE true and provided apiURL', () => {
    // Mock window.location for this test case
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...originalLocation,
        hostname: 'localhost',
        protocol: 'https:',
        port: '443',
      },
    });
    // Mock DEV_MODE to true
    jest.mock('~/utilities/const', () => ({
      ...jest.requireActual('~/utilities/const'),
      DEV_MODE: true,
    }));

    const result = getOpenShiftConsoleServerURL('https://api.example.com:8443');
    // Assert the constructed URL
    expect(result).toBe('https://console-openshift-console.apps.example.com:8443');

    // process.env.NODE_ENV = originalDevMode;
  });
});
