import * as React from 'react';
import { useAppContext } from '~/app/AppContext';
import { DashboardConfig, NotebookSize } from '~/types';
// import useNotification from '~/utilities/useNotification';
import { useDeepCompareMemoize } from '~/utilities/useDeepCompareMemoize';
import { GenericContainerSize } from '~/types';
import { DEFAULT_NOTEBOOK_SIZES } from './const';

export const getNotebookSizes = (config: DashboardConfig): NotebookSize[] => {
  let sizes = config.spec.notebookSizes || [];
  if (sizes.length === 0) {
    sizes = DEFAULT_NOTEBOOK_SIZES;
  }
  return sizes;
};

export const useNotebookSize = (): {
  selectedSize: GenericContainerSize;
  setSelectedSize: (size: GenericContainerSize) => void;
  sizes: GenericContainerSize[];
} => {
  const { dashboardConfig } = useAppContext();
  // const notification = useNotification();
  const sizes = useDeepCompareMemoize(getNotebookSizes(dashboardConfig));

  const [selectedSize, setSelectedSize] = React.useState<NotebookSize>(sizes[0]);

  const setSelectedSizeSafe = React.useCallback(
    (containerSize: GenericContainerSize) => {
      setSelectedSize(containerSize);
    },
    [setSelectedSize],
  );

  return { selectedSize, setSelectedSize: setSelectedSizeSafe, sizes };
};
