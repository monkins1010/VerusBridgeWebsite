import React, { useEffect, useState, useRef } from 'react';

import { address as baddress, crypto as bcrypto } from '@bitgo/utxo-lib';
import { LoadingButton } from '@mui/lab';
import { Alert, Typography, Button } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
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
import { validateClaimAddress, isRAddress, isiAddress, uint64ToVerusFloat } from 'utils/rules';

import AddressAddressFieldField from './ClaimAddressField';
import bitGoUTXO from '../../utils/bitUTXO';
import TokenField from '../ConvertForm/TokenField';
import { useToast } from '../Toast/ToastProvider';

const maxGas = 800000;
const maxGasClaim = 80000;
const TYPE_FEE = 1;
const TYPE_REFUND = 2;
const TYPE_REFUND_CHECK = 3;
const TYPE_PUBLICKEY = 4;
// const TYPE_NOTARY_FEE = 5;
// const TYPE_DAI_BURN_BACK = 6;

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
    const [claimRefund, setclaimRefund] = useState(false);
    const { handleSubmit, control, watch, reset } = useForm({
        mode: 'all'
    });
    const address = watch('address');
    const refundCurrency = watch('token');

    const handleUsePublicKeyChange = (event) => {
        reset({ address: "" });
        setUsePublicKey(event.target.checked);
        setAlert(null);
        if (claimRefund) {
            setclaimRefund(false);
        }
    };

    const handleRefundsEnable = (event) => {

        setclaimRefund(event.target.checked);
        setAlert(null);
        if (!event.target.checked) {
            reset({ address: "" });
        } else {
            setUsePublicKey(false);
        }
    };


    const formatHexAddress = (address, type) => {
        try {
            const verusAddress = bitGoUTXO.address.fromBase58Check(address);
            let retval;
            switch (verusAddress.version) {
                case 60: // case R address
                    retval = `0214${verusAddress.hash.toString('hex')}`;
                    break;
                case 102: // case i address
                    retval = `0414${verusAddress.hash.toString('hex')}`;
                    break;
                default:
                    return null;
            }
            if (type === TYPE_REFUND_CHECK) {
                retval = Buffer.from(`${web3.utils.padLeft(retval, 64)}`, 'hex');
                retval[1] = 16;
                return `0x${retval.toString('hex')}`;
            }

            if (type === TYPE_FEE || type === TYPE_PUBLICKEY) {
                retval = Buffer.from(`${web3.utils.padLeft(retval, 64)}`, 'hex');
                return `0x${retval.toString('hex')}`;
            }

            return `0x${retval}`;



        } catch (error) {
            throw new Error("Invalid Address");
        }
    }

    const checkForAssets = async (address, type, currency) => {

        const formattedAddress = formatHexAddress(address, type);
        let feeSats;
        let fees;
        if (type === TYPE_FEE) {
            feeSats = await delegatorContract.callStatic.claimableFees(formattedAddress);
            fees = uint64ToVerusFloat(feeSats);
            if (fees === "0.00000000" || (parseFloat(fees) < 0.006)) {
                setAlert({ state: "warning", message: `${fees} ETH available to claim, minimum amount claimable is 0.006 ETH to cover import cost.` });
                setFeeToClaim(null);
                return fees;
            }
            setAlert({ state: "info", message: `${fees} ETH available to claim` });


        } else if (type === TYPE_REFUND_CHECK) {
            feeSats = await delegatorContract.callStatic.refunds(formattedAddress, currency);
            fees = uint64ToVerusFloat(feeSats);
            setAlert({ state: fees === "0.00000000" ? "warning" : "info", message: `${fees} Available to refund` });
        } else if (type === TYPE_PUBLICKEY) {
            feeSats = await delegatorContract.callStatic.claimableFees(formattedAddress);
            fees = uint64ToVerusFloat(feeSats);
        }
        setFeeToClaim(fees);
        return fees;
    }

    useEffect(() => {
        if (address && (isRAddress(address) || isiAddress(address))) {
            if (!claimRefund) {
                if (previousValue ? (previousValue !== address || feeToClaim === null || feeToClaim === "0.00000000") : true) {
                    checkForAssets(address, TYPE_FEE);
                }
            } else if (refundCurrency && refundCurrency.value) {
                checkForAssets(address, TYPE_REFUND_CHECK, refundCurrency.value);

            } else {
                removeAllToasts();
                setFeeToClaim(null)
                setAlert(null);
            }
        } else if (address && validateClaimAddress(address) !== true && feeToClaim !== null) {
            removeAllToasts();
            setFeeToClaim(null)
            setAlert(null);
        }
    }, [address, claimRefund, refundCurrency])

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
                    const compressed = utils.computePublicKey(publicKey, true);

                    const check = bcrypto.hash160(Buffer.from(compressed.slice(2), 'hex'));
                    const rAddress = baddress.toBase58Check(check, 60)

                    const checkfees = await checkForAssets(rAddress, TYPE_PUBLICKEY);
                    if (checkfees === "0.00000000") {
                        setAlert({ state: "warning", message: `${`${rAddress}\n`} has ${checkfees} fees to claim. Please try again with a different Ethereum account.` });
                        setIsTxPending(false);
                        return;
                    }
                    setAlert({ state: "info", message: `${`${rAddress}\n`} has ${checkfees} ETH to claim.` });

                    const { x, y } = { x: publicKey.slice(4, 68), y: publicKey.slice(68, 132) };

                    const txResult = await delegatorContract.sendfees(`0x${x}`, `0x${y}`, { from: account, gasLimit: maxGasClaim });
                    await txResult.wait();
                    setAlert(null);
                    setIsTxPending(false);
                    addToast({ type: "success", description: 'Claim to ETH Transaction Success!' });
                    setFeeToClaim(null)
                } catch (err) {
                    setAlert(`
                         Error with public key: ${err.message} `
                    );
                    throw err
                }
            } else if (claimRefund) {
                const hexResult = formatHexAddress(address, TYPE_REFUND);
                // const txEstimation = await delegatorContract.estimateGas.claimRefund(hexResult, refundCurrency.value);
                const testClaim = await delegatorContract.callStatic.claimRefund(hexResult, refundCurrency.value);
                if (testClaim === "0x") {
                    setAlert({ state: "warning", message: `No ${refundCurrency.value} available to refund` });
                    setIsTxPending(false);
                    return;
                }
                const txResult = await delegatorContract.claimRefund(hexResult, refundCurrency.value, { from: account, gasLimit: maxGas });
                await txResult.wait();
                setAlert(null);
                setIsTxPending(false);
                addToast({ type: "success", description: 'Refund Transaction Success!' });
                setFeeToClaim(null)
            }
            else {
                const hexResult = formatHexAddress(address, TYPE_FEE);
                // const txEstimation = await delegatorContract.estimateGas.sendfees(hexResult, `0x${Buffer.alloc(32).toString('hex')}`);
                if (address.slice(0, 1) === "R") {
                    setAlert({ state: "warning", message: `Please import the private key for ${address} into metamask, and use the 'Public Key' claim option to be paid directly to that ETH address.` });
                    setIsTxPending(false);
                    return;
                }
                await delegatorContract.callStatic.sendfees(hexResult, `0x${Buffer.alloc(32).toString('hex')}`);
                const txResult = await delegatorContract.sendfees(hexResult, `0x${Buffer.alloc(32).toString('hex')}`, { from: account, gasLimit: maxGas });
                await txResult.wait();
                setAlert(null);
                setIsTxPending(false);
                addToast({ type: "success", description: 'Fee reimburse Transaction Success!' });
                setFeeToClaim(null)
            }
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
                        <FormGroup sx={{ flexWrap: 'nowrap' }}>

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={usePublicKey}
                                        onChange={handleUsePublicKeyChange}
                                        name="usePublicKey"
                                    />
                                }
                                sx={{ fontSize: '20px' }} // add this line to set the font size
                            />
                            <Tooltip title="The private Key for your refundaddress should be imported into metamask in order for you to receive refunds"
                                arrow
                                placement="bottom"
                                PopperProps={{ style: { marginTop: -12 } }}>
                                <Typography sx={{ fontSize: 12, flexWrap: 'nowrap' }}>
                                    Use your Public Key to claim
                                </Typography>
                            </Tooltip>

                        </FormGroup>
                    </Grid>
                    <Grid item xs={12}>
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={claimRefund}
                                        onChange={handleRefundsEnable}
                                        name="claimRefund"
                                    />
                                }
                                sx={{ fontSize: '20px' }} // add this line to set the font size
                            />
                            <Typography sx={{ fontSize: 12 }}>
                                Fees / Refund (Claim Type)
                            </Typography>
                        </FormGroup>
                    </Grid>
                    <Grid item xs={12}>
                        {claimRefund && (<TokenField
                            control={control}
                            poolAvailable={false}
                            token="Refund Currency"
                        />)}
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