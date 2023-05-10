import React from 'react'

import InputControlField from 'components/InputControlField'
import { validateETHAddress } from 'utils/rules'

const AddressField = ({ control }) => (
    <InputControlField
        name="address"
        label="Address"
        fullWidth
        variant="standard"
        defaultValue=""
        control={control}
        helperText="Your Ethereum Address"
        rules={{
            required: 'Address is required',
            validate: validateETHAddress
        }}
    />
)

export default AddressField
