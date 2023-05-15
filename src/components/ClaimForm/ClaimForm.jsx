import React, { useEffect, useState, useRef } from 'react';

import { LoadingButton } from '@mui/lab';
import { Alert, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Box } from '@mui/system';
import { useWeb3React } from '@web3-react/core';
import { useForm } from 'react-hook-form';
import web3 from 'web3';

import DELEGATOR_ABI from 'abis/DelegatorAbi.json';
import {
    DELEGATOR_ADD
} from 'constants/contractAddress';
import useContract from 'hooks/useContract';
import { validateETHAddress } from 'utils/rules'

import { useToast } from '../Toast/ToastProvider';
import AddressAddressFieldField from './ClaimAddressField';

function usePreviousValue(value) {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

export default function ClaimForm() {
    const [isTxPending, setIsTxPending] = useState(false);
    const [alert, setAlert] = useState(null);
    const [feeToClaim, setFeeToClaim] = useState(null);
    const { addToast, removeAllToasts } = useToast();
    const { account } = useWeb3React();
    const previousValue = usePreviousValue(account);
    const delegatorContract = useContract(DELEGATOR_ADD, DELEGATOR_ABI);

    const { handleSubmit, control, watch } = useForm({
        mode: 'all'
    });
    const address = watch('address');
    const uint64ToVerusFloat = (number) => {

        const input = BigInt(number);
        let inter = `${(input / BigInt(100000000))}.`
        let decimalp = `${(input % BigInt(100000000))}`

        if (input < 0) {
            inter = `-${inter}`;
            decimalp = decimalp.slice(1);
        }

        while (decimalp.length < 8) {
            decimalp = `0${decimalp}`;
        }
        return (inter + decimalp)
    }

    const checkFees = async (address) => {

        const formattedAddress = `0x${web3.utils.padLeft(`0c14${address.slice(2)}`, 64)}`
        const feesSats = await delegatorContract.callStatic.claimableFees(formattedAddress);
        const fees = uint64ToVerusFloat(feesSats);
        setFeeToClaim(fees);
        setAlert({ state: fees === "0.00000000" ? "warning" : "info", message: `${fees} ETH available to claim` });
        addToast({ type: "success", description: `You have ${fees} ETH to claim` });
    }

    useEffect(() => {
        if (address && validateETHAddress(address) === true &&
            (previousValue ? (previousValue !== address || feeToClaim === null || feeToClaim === "0.00000000") : true)) {
            checkFees(address);
        } else if (address && validateETHAddress(address) !== true && feeToClaim !== null) {
            removeAllToasts();
            setFeeToClaim(null)
            setAlert(null);
        }
    }, [address])

    const onSubmit = async (values) => {
        const { address } = values;
        setAlert(null);
        setIsTxPending(true);

        try {
            if (address !== account)
                throw new Error("Please switch your metaMask account to the address you are claiming.")
            const txResult = await delegatorContract.claimfees();
            await txResult.wait();
            setAlert(null);
            setIsTxPending(false);
            addToast({ type: "success", description: 'Transaction Success!' });
            setFeeToClaim(null)
        } catch (error) {
            if (error.message) {
                addToast({ type: "error", description: error.message })
            } else {
                addToast({ type: "error", description: 'Transaction Failed!' })
            }
            setAlert(null);
            setIsTxPending(false);
        }
    }

    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)}>
                {alert &&
                    <Alert severity={alert.state} sx={{ mb: 3 }}>
                        <Typography>
                            {alert.message}
                        </Typography>
                    </Alert>
                }
                {!account && (<Alert severity="info" sx={{ mb: 3 }}>
                    <Typography>
                        <b>Wallet not connected</b>
                    </Typography>
                </Alert>)
                }
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <AddressAddressFieldField
                            control={control}
                        />
                    </Grid>
                    <Box mt="30px" textAlign="center" width="100%">
                        <LoadingButton loading={isTxPending} disabled={feeToClaim === null || feeToClaim === "0.00000000"} type="submit" color="primary" variant="contained">Claim</LoadingButton>
                    </Box>
                </Grid>
            </form>
        </>
    );
}