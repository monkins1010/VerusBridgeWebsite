import React from 'react'

import InputControlField from 'components/InputControlField'
import { validateClaimAddress } from 'utils/rules'

const AddressField = ({ control, usePublicKey, disabled }) => (
    <InputControlField
        name="address"
        label="Address"
        fullWidth
        variant="standard"
        defaultValue=""
        disabled={disabled}
        control={control}
        helperText="Your R-Address or i-Address"
        rules={() => usePublicKey ? null : {
            required: 'Address is required',
            validate: validateClaimAddress
        }}
    />
)

export default AddressField
