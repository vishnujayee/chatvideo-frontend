import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addNotification, removeNotification } from '../../store/slices/notificationSlice';
import { Snackbar, Alert } from '@mui/material';

const NotificationHandler = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector(state => state.notifications);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  const handleClose = (id) => {
    dispatch(removeNotification(id));
  };

  return (
    <>
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={6000}
          onClose={() => handleClose(notification.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => handleClose(notification.id)} 
            severity={notification.type}
            elevation={6}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

export default NotificationHandler; 