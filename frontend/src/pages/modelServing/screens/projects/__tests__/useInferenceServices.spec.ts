import { act } from '@testing-library/react';
import { k8sListResource } from '@openshift/dynamic-plugin-sdk-utils';
import { InferenceServiceKind } from '~/k8sTypes';
import { standardUseFetchState, testHook } from '~/__tests__/unit/testUtils/hooks';
import useModelServingEnabled from '~/pages/modelServing/useModelServingEnabled';
import useInferenceServices from '~/pages/modelServing/useInferenceServices';

jest.mock('@openshift/dynamic-plugin-sdk-utils', () => ({
  k8sListResource: jest.fn(),
}));

const k8sListResourceMock = k8sListResource as jest.Mock;

jest.mock('~/pages/modelServing/useModelServingEnabled', () => ({
  __esModule: true,
  default: jest.fn(() => true),
}));

useModelServingEnabled as jest.Mock;

describe('useInferenceServices', () => {
  it('should return successful list of InferenceService', async () => {
    const mockInferenceServices = {
      items: [
        { metadata: { name: 'item 1' } },
        { metadata: { name: 'item 2' } },
      ] as InferenceServiceKind[],
    };

    k8sListResourceMock.mockReturnValue(Promise.resolve(mockInferenceServices));
    const renderResult = testHook(useInferenceServices)('namespace');

    expect(k8sListResourceMock).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual(standardUseFetchState([]));
    expect(renderResult).hookToHaveUpdateCount(1);

    // wait for update
    await renderResult.waitForNextUpdate();
    expect(k8sListResourceMock).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual(
      standardUseFetchState(mockInferenceServices.items, true),
    );
    expect(renderResult).hookToHaveUpdateCount(2);
    expect(renderResult).hookToBeStable([false, false, true, true]);

    // refresh
    k8sListResourceMock.mockReturnValue(
      Promise.resolve({ items: [...mockInferenceServices.items] }),
    );
    await act(() => renderResult.result.current[3]());
    expect(k8sListResourceMock).toHaveBeenCalledTimes(2);
    expect(renderResult).hookToStrictEqual(
      standardUseFetchState([...mockInferenceServices.items], true),
    );
    expect(renderResult).hookToHaveUpdateCount(3);
    expect(renderResult).hookToBeStable([false, true, true, true]);
  });

  it('should fail to fetch InferenceService', async () => {
    k8sListResourceMock.mockReturnValue(Promise.reject('error'));
    const renderResult = testHook(useInferenceServices)('namespace');
    expect(k8sListResourceMock).toHaveBeenCalledTimes(1);
    expect(renderResult).hookToStrictEqual(standardUseFetchState([], false));
    expect(renderResult).hookToHaveUpdateCount(1);

    // // Wait for the hook to handle the error
    await renderResult.waitForNextUpdate();
    expect(renderResult).hookToStrictEqual(
      standardUseFetchState([], false, new Error('No Inference Services found.')),
    );
    expect(renderResult).hookToHaveUpdateCount(2);
    expect(renderResult).hookToBeStable([false, true, false, true]);
  });
});
