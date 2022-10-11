import React from 'react'

import InputControlField from 'components/InputControlField'
import { validateNFTAddress } from 'utils/rules'

const AddressField = ({ control }) => (
  <InputControlField
    name="address"
    label="Address"
    fullWidth
    variant="standard"
    defaultValue=""
    control={control}
    helperText="I-Address, R-address"
    rules={{
      required: 'Address is required',
      validate: validateNFTAddress
    }}
  />
)

export default AddressField
