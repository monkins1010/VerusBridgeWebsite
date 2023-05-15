import React, { useCallback, useContext, useState, createContext } from 'react';

import ToastContainer from './ToastContainer';

const contextDefaultValues = {
  toasts: [],
  addToast: () => undefined,
  removeToast: () => undefined
};

let id = 1;

const ToastContext = createContext(contextDefaultValues);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(
    (toast) => {
      setToasts(toasts => [
        ...toasts,
        {
          // eslint-disable-next-line no-plusplus
          id: id++,
          ...toast
        }
      ]);
    },
    [setToasts]
  );

  const removeToast = useCallback(
    id => {
      setToasts(toasts => toasts.filter(t => t.id !== id));
    },
    [setToasts]
  );

  const removeAllToasts = () => { setToasts([]) };

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        removeAllToasts
      }}>
      <ToastContainer toasts={toasts} />
      {children}
    </ToastContext.Provider>
  );
};

const useToast = () => {
  const toastHelpers = useContext(ToastContext);

  return toastHelpers;
};

export { ToastContext, useToast };
export default ToastProvider;
