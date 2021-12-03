import React, { useEffect } from 'react';

import { Alert, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import css from './Toast.module.css';
import { useToast } from './ToastProvider';

const AnimatedToast = ({ toast }) => {
  const { removeToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 10100);

    return () => {
      clearTimeout(timer);
    };
  }, [toast.id, removeToast]);

  return (
    <StyledAlert
      severity={toast.type}
      description={toast.description}
      className={css.fadeToast}
    >
      <Typography>
        {toast.description}
      </Typography>
    </StyledAlert>
  );
};

const StyledAlert = styled(Alert)(({ theme, severity }) => ({
  width: '300px',
  marginBottom: theme.spacing(3),
  marginLeft: theme.spacing(3),
  border: `1px solid ${theme.palette[severity].dark}`
}));

export default AnimatedToast;
