import React from 'react';
import { Alert, AlertActionCloseButton, AlertVariant } from '@patternfly/react-core';
import { AppNotification } from '~/redux/types';
import { ackNotification, hideNotification } from '~/redux/actions/actions';
import { useAppDispatch } from '~/redux/hooks';

const TOAST_NOTIFICATION_TIMEOUT = 8 * 1000;

interface ToastNotificationProps {
  notification: AppNotification;
  key: number | undefined;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ notification, key }) => {
  const dispatch = useAppDispatch();
  const [timedOut, setTimedOut] = React.useState(false);
  const [mouseOver, setMouseOver] = React.useState(false);

  React.useEffect(() => {
    const handle = setTimeout(() => {
      setTimedOut(true);
    }, TOAST_NOTIFICATION_TIMEOUT);
    return () => {
      clearTimeout(handle);
    };
  }, [setTimedOut]);

  React.useEffect(() => {
    if (!notification.hidden && timedOut && !mouseOver) {
      dispatch(hideNotification(notification));
    }
  }, [dispatch, mouseOver, notification, timedOut]);

  if (notification.hidden) {
    return null;
  }

  return (
    <Alert
      variant={notification.status as AlertVariant}
      title={notification.title}
      actionClose={
        <AlertActionCloseButton onClose={() => dispatch(ackNotification(notification))} />
      }
      onMouseEnter={() => setMouseOver(true)}
      onMouseLeave={() => setMouseOver(false)}
      key={key}
    >
      {notification.message}
    </Alert>
  );
};

export default ToastNotification;
