import React from 'react';
import { AlertGroup, Alert, AlertActionCloseButton } from '@patternfly/react-core';
import { InferenceServiceNotificationsContext } from '~/app/InferenceServiceNotificationsContext';

const InferenceServiceNotifications: React.FC = () => {
  const { notifications, removeNotification } = React.useContext(
    InferenceServiceNotificationsContext,
  );

  if (!notifications) {
    return null;
  }

  return (
    <AlertGroup isToast isLiveRegion>
      {notifications.map((notification) => (
        <Alert
          key={notification.id}
          variant={notification.status}
          title={notification.title}
          actionClose={
            <AlertActionCloseButton onClose={() => removeNotification(notification.id ?? '')} />
          }
        >
          {notification.message}
        </Alert>
      ))}
    </AlertGroup>
  );
};

export default InferenceServiceNotifications;
