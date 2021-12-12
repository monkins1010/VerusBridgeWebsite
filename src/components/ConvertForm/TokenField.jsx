import React from 'react'

import SelectControlField from 'components/SelectControlField'
import { getTokenOptions } from 'utils/options'

const TokenField = ({ control, poolAvailable }) => (
    <SelectControlField 
      name="token"
      id="token"
      label="Token"
      fullWidth
      variant="standard"
      defaultValue=""
      control={control}
      options={getTokenOptions(poolAvailable)}
      rules={{
        required: 'Address is required'
      }}
    />
  )

export default TokenField
