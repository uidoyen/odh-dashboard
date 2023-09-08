import * as React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { NotebookSize } from '~/types';

type NotebookSizeDetailsProps = {
  notebookSize: NotebookSize;
};

const NotebookSizeDetails: React.FC<NotebookSizeDetailsProps> = ({ notebookSize }) => {
  const {
    resources: { requests, limits },
  } = notebookSize;

  return (
    <DescriptionList>
      <DescriptionListGroup>
        <DescriptionListTerm>Limits</DescriptionListTerm>
        <DescriptionListDescription>
          {limits?.cpu ?? 'Custom'} CPU, {limits?.memory ?? 'Custom'} Memory
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Requests</DescriptionListTerm>
        <DescriptionListDescription>
          {requests?.cpu ?? 'Custom'} CPU, {requests?.memory ?? 'Custom'} Memory
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

export default NotebookSizeDetails;
