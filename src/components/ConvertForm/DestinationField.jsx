import React from 'react'

import SelectControlField from 'components/SelectControlField'
import { getDestinationOptions } from 'utils/options'

const DestinationField = ({ control, poolAvailable, address, selectedToken }) => (
    <SelectControlField 
      name="destination"
      id="destination"
      label="Destination"
      fullWidth
      defaultValue=""
      variant="standard"
      control={control}
      options={getDestinationOptions(poolAvailable, address, selectedToken)}
      rules={{
        required: 'Destination is required'
      }}
    />
  )

export default DestinationField
