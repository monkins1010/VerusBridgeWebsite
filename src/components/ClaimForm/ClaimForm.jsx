import React, { useEffect, useState, useRef } from 'react';

import { ECPair, networks } from '@bitgo/utxo-lib';
import { LoadingButton } from '@mui/lab';
import { Alert, Typography, Button } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import { Box } from '@mui/system';
import { useWeb3React } from '@web3-react/core';
import { utils } from 'ethers'
import { useForm } from 'react-hook-form';
import { Link } from "react-router-dom";
import web3 from 'web3';

import DELEGATOR_ABI from 'abis/DelegatorAbi.json';
import {
    DELEGATOR_ADD
} from 'constants/contractAddress';
import useContract from 'hooks/useContract';
import { validateETHAddress, isRAddress, isiAddress } from 'utils/rules'

import AddressAddressFieldField from './ClaimAddressField';
import bitGoUTXO from '../../utils/bitUTXO';
import { useToast } from '../Toast/ToastProvider';

const maxGas = 6000000;


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
    const [usePublicKey, setUsePublicKey] = useState(false);
    const { handleSubmit, control, watch, reset } = useForm({
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
    const handleUsePublicKeyChange = (event) => {
        reset({ address: "" });
        setUsePublicKey(event.target.checked);
    };

    const formatHexAddress = (address) => {
        try {
            const verusAddress = bitGoUTXO.address.fromBase58Check(address);

            switch (verusAddress.version) {
                case 60:
                    return `0x${web3.utils.padLeft(`0214${verusAddress.hash.toString('hex')}`, 64)}`;
                case 102:
                    return `0x${web3.utils.padLeft(`0414${verusAddress.hash.toString('hex')}`, 64)}`;
                default:
                    return null;
            }
        } catch (error) {
            throw new Error("Invalid Address");
        }
    }

    const checkFeesETHAddressFees = async (address) => {

        const formattedAddress = `0x${web3.utils.padLeft(`0c14${address.slice(2)}`, 64)}`
        const feesSats = await delegatorContract.callStatic.claimableFees(formattedAddress);
        const fees = uint64ToVerusFloat(feesSats);
        setFeeToClaim(fees);
        setAlert({ state: fees === "0.00000000" ? "warning" : "info", message: `${fees} ETH available to claim` });
        addToast({ type: "success", description: `You have ${fees} ETH to claim` });
    }

    const checkFeesVerusAddressFees = async (address) => {

        const formattedAddress = formatHexAddress(address)
        const feesSats = await delegatorContract.callStatic.claimableFees(formattedAddress);
        const fees = uint64ToVerusFloat(feesSats);
        setFeeToClaim(fees);
        setAlert({ state: fees === "0.00000000" ? "warning" : "info", message: `${fees} ETH available to claim` });
        //  addToast({ type: "success", description: `You have ${fees} ETH to claim` });
        return fees;
    }

    useEffect(() => {
        if (address && validateETHAddress(address) === true &&
            (previousValue ? (previousValue !== address || feeToClaim === null || feeToClaim === "0.00000000") : true)) {
            checkFeesETHAddressFees(address);
        } if (address && (isRAddress(address) === true || isiAddress(address)) &&
            (previousValue ? (previousValue !== address || feeToClaim === null || feeToClaim === "0.00000000") : true)) {
            checkFeesVerusAddressFees(address);
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
            if (usePublicKey) {
                try {
                    const from = account;
                    // For historical reasons, you must submit the message to sign in hex-encoded UTF-8.
                    // This uses a Node.js-style buffer shim in the browser.
                    const msg = `0x${Buffer.from("Agreeing to this will create a public key address for Verus Refunds.", 'utf8').toString('hex')}`;
                    const sign = await window.ethereum.request({
                        method: 'personal_sign',
                        params: [msg, from]
                    });

                    const messageHash = utils.hashMessage("Agreeing to this will create a public key address for Verus Refunds.");
                    const messageHashBytes = utils.arrayify(messageHash);

                    // Now you have the digest,
                    const publicKey = utils.recoverPublicKey(messageHashBytes, sign);
                    const compressed = utils.computePublicKey(publicKey, true)

                    const rAddress = ECPair.fromPublicKeyBuffer(Buffer.from(compressed.slice(2), 'hex'), networks.verustest).getAddress()

                    if (await checkFeesVerusAddressFees(rAddress) === "0.00000000") {
                        setIsTxPending(false);
                        return
                    }

                    const { x, y } = { x: publicKey.slice(4, 68), y: publicKey.slice(68, 132) };

                    const txResult = await delegatorContract.sendfees(`0x${x}`, `0x${y}`, { from: account, gasLimit: maxGas });
                    await txResult.wait();
                    setAlert(null);
                    setIsTxPending(false);
                    addToast({ type: "success", description: 'Transaction Success!' });
                    setFeeToClaim(null)
                } catch (err) {
                    setAlert(`
                         Error with public key: ${err.message} `
                    );
                    throw err
                }
            }

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
                            usePublicKey={usePublicKey}
                            disabled={usePublicKey}
                        />
                    </Grid>
                    <Box mt="30px" textAlign="center" width="100%">
                        <LoadingButton loading={isTxPending} disabled={(feeToClaim === null || feeToClaim === "0.00000000") && !usePublicKey} type="submit" color="primary" variant="contained">Claim</LoadingButton>
                    </Box>
                    <Grid item xs={12}>
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={usePublicKey}
                                        onChange={handleUsePublicKeyChange}
                                        name="usePublicKey"
                                    />
                                }
                                label={
                                    <Typography sx={{ fontSize: 12 }}>
                                        Use Public Key from ETH address
                                    </Typography>
                                }
                                sx={{ fontSize: '20px' }} // add this line to set the font size
                            />
                        </FormGroup>
                    </Grid>

                </Grid>
                <div style={{ alignItems: 'center', paddingTop: 42 }}>
                    <Link to="/">
                        <Button variant="outlined">
                            BACK
                        </Button>
                    </Link>
                </div>
            </form>

        </>
    );
}