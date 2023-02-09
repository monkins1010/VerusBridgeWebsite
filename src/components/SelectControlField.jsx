import React from 'react';

import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { Controller } from 'react-hook-form';

const SelectControlField = ({
  name,
  label,
  control,
  defaultValue,
  children,
  rules,
  selectProps,
  options = [],
  ...props
}) => {
  const labelid = `${name}-label`;
  return (
    <FormControl {...props}>
      <InputLabel id={labelid}>{label}</InputLabel>
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        rules={rules}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <Select
              labelid={labelid}
              label={label}
              id={name}
              onChange={onChange}
              value={value}
              error={!!error}
              {...selectProps}
              MenuProps={{
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left'
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left'
                }
              }}
            >
              {options.map((option) => (
                <MenuItem value={option.value} key={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {error && <FormHelperText error>{error.message}</FormHelperText>}
          </>
        )}
      />
    </FormControl>
  );
};
export default SelectControlField;
