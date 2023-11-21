import * as React from 'react';
import { AppNotification } from '~/redux/types';
import { LABEL_SELECTOR_DASHBOARD_RESOURCE } from '~/const';
import { InferenceServiceKind } from '~/k8sTypes';
import { listInferenceService } from '~/api';
import useNotification from '~/utilities/useNotification';

export type AppNotificationWithStringID = Omit<AppNotification, 'id'> & { id: string };

type NotificationsContext = {
  notifications: AppNotificationWithStringID[];
  addNotification: (
    id: string,
    status: AppNotificationWithStringID['status'],
    title: string,
    message: string,
  ) => void;
  getModelDeploymentInfo: (inferenceService: InferenceServiceKind, name: string) => void;
  removeNotification: (id?: string) => void;
};

export const InferenceServiceNotificationsContext = React.createContext<NotificationsContext>({
  notifications: [],
  addNotification: () => undefined,
  getModelDeploymentInfo: () => undefined,
  removeNotification: () => undefined,
});

type NotificationsProviderProps = {
  children: React.ReactNode;
};

const NotificationsContextProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = React.useState<AppNotificationWithStringID[]>([]);
  const uniqueNotificationIds = React.useMemo(() => new Set<string>(), []);
  const notification = useNotification();

  const addNotification = React.useCallback(
    (id: string, status: AppNotificationWithStringID['status'], title: string, message: string) => {
      if (!uniqueNotificationIds.has(id)) {
        const newNotification = {
          id,
          status,
          title,
          message,
          timestamp: new Date(),
        };

        setNotifications((prevNotifications) => [...prevNotifications, newNotification]);
        uniqueNotificationIds.add(id);
      }
    },
    [uniqueNotificationIds],
  );

  const removeNotification = React.useCallback(
    (id?: string) => {
      if (id) {
        setNotifications(
          notifications.filter((notification) => {
            if (notification.id === id) {
              uniqueNotificationIds.delete(id);
              return false;
            }
            return true;
          }),
        );
      }
    },
    [notifications, uniqueNotificationIds],
  );

  const pollInterval = 5000;

  const getModelDeploymentInfo = React.useCallback(
    (inferenceService: InferenceServiceKind, namespace: string) => {
      const pollFunction = () => {
        listInferenceService(inferenceService.metadata.namespace, LABEL_SELECTOR_DASHBOARD_RESOURCE)
          .then((inferenceServices: InferenceServiceKind[]) => {
            const currentDeployment = inferenceServices.filter(
              (inferenceService) => inferenceService.metadata.name === namespace,
            );
            currentDeployment.forEach((item) => {
              const lastFailureInfo = item.status?.modelStatus.lastFailureInfo ?? undefined;
              if (lastFailureInfo) {
                addNotification(
                  item.metadata.uid || '',
                  'danger',
                  item.metadata.name,
                  lastFailureInfo?.message || 'Unknown error',
                );
              }
            });
          })
          .catch((error) => {
            notification.error(`Error fetching deployment info: ${error.message}`);
          });
      };

      pollFunction();

      const pollIntervalId = setInterval(pollFunction, pollInterval);

      return () => {
        clearInterval(pollIntervalId);
      };
    },
    [addNotification, pollInterval, notification],
  );

  return (
    <InferenceServiceNotificationsContext.Provider
      value={{
        notifications,
        addNotification,
        getModelDeploymentInfo,
        removeNotification,
      }}
    >
      {children}
    </InferenceServiceNotificationsContext.Provider>
  );
};

export default NotificationsContextProvider;
