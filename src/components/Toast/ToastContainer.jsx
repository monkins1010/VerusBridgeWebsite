import React from 'react';

import { styled } from '@mui/system';

import AnimatedToast from './AnimatedToast';

const ToastContainer = ({ toasts }) => (
  <StyledToastContainer>
    {toasts.map((toast) => (
      <AnimatedToast key={toast.id} toast={toast} />
    ))}
  </StyledToastContainer>
);

const StyledToastContainer = styled('div')(({ theme }) => ({
  position: 'fixed',
  width: 'auto',
  top: 'auto',
  textAlign: 'center',
  left: 0,
  zIndex: 1400,
  bottom: theme.spacing(3)
}))

export default ToastContainer;
