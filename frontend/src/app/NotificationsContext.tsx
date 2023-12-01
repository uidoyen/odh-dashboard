import * as React from 'react';
import { AppNotification } from '~/redux/types';

// type ListenerCallback = () => Promise<any>;
type NotificationsContext = {
  notifications: AppNotification[];
  addNotification: (status: AppNotification['status'], title: string, message: string) => void;
  registerListeners: (callback: Promise<any>) => void;
};
export const NotificationsContext = React.createContext<NotificationsContext>({
  notifications: [],
  addNotification: () => undefined,
  registerListeners: () => Promise<any>,
});

type NotificationsProviderProps = {
  children: React.ReactNode;
};

const NotificationsContextProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);

  const registerListeners = (callback: any) => {
    console.log(callback);
  };

  const addNotification = React.useCallback(
    (status: AppNotification['status'], title: string, message: string) => {
      const newNotification = {
        status,
        title,
        message,
        timestamp: new Date(),
      };

      setNotifications([...notifications, newNotification]);
    },
    [notifications],
  );

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        addNotification,
        registerListeners,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
export default NotificationsContextProvider;
