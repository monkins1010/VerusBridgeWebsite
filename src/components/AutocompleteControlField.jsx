import React from 'react';

import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
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
    const labelId = `${name}-label`;
    return (
        <FormControl {...props}>


            <Controller
                name={name}
                control={control}
                defaultValue={defaultValue}
                rules={rules}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <>
                        <Autocomplete
                            labelId={labelId}
                            disablePortal
                            id={name}
                            options={options}
                            {...selectProps}
                            onChange={(e, data) => onChange({ value: data?.value, name: data?.label })}
                            renderInput={(params) => <TextField {...params} label="Token" />}
                        />
                        {error && <FormHelperText error>{error.message}</FormHelperText>}
                    </>
                )}
            />
        </FormControl>
    );
};



export default SelectControlField;
