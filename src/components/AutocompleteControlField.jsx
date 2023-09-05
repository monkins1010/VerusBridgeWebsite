import React from 'react';

import { FormControl, FormHelperText } from '@mui/material';
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
    const labelid = `${name}-label`;
    return (
        <FormControl {...props}>
            <Controller
                name={name}
                control={control}
                defaultValue={defaultValue}
                rules={rules}
                render={({ field: { onChange }, fieldState: { error } }) => (
                    <>
                        <Autocomplete
                            labelid={labelid}
                            disablePortal
                            id={name}
                            options={options}
                            {...selectProps}
                            onChange={(e, data) => onChange({ value: data?.value, name: data?.label, erc20address: data?.erc20address, iaddress: data?.iaddress, flags: data?.flags })}
                            renderInput={(params) => <TextField {...params} label={label} />}
                        />
                        {error && <FormHelperText error>{error.message}</FormHelperText>}
                    </>
                )}
            />
        </FormControl>
    );
};



export default SelectControlField;
