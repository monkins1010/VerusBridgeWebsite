import React from 'react';

import TextField from '@mui/material/TextField';
import { Controller } from 'react-hook-form';

const InputControlField = ({
  name,
  defaultValue,
  control,
  rules,
  autoComplete,
  fullWidth = true,
  autoFocus = false,
  testid,
  variant = 'outlined',
  helperText = null,
  ...props
}) => (
  <Controller
    name={name}
    defaultValue={defaultValue}
    control={control}
    render={({ field: { onChange, value }, fieldState: { error } }) => (
      <TextField
        variant={variant}
        inputProps={{
          'data-testid': testid
        }}
        fullWidth={fullWidth}
        autoComplete={autoComplete || name}
        onChange={onChange}
        value={value}
        error={!!error}
        autoFocus={autoFocus}
        helperText={error ? error.message : helperText}
        FormHelperTextProps={{ style: { fontSize: 10 } }}
        {...props}
      />
    )}
    rules={rules}
  />
);

export default InputControlField;
