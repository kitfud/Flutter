import React, { isValidElement } from 'react'
import { useEffect,useState } from 'react'
import {Typography,Snackbar,CircularProgress,Button,Card,Box,Paper,Table, TableBody,TableCell,TableContainer,TableHead,TableRow } from '@mui/material'
import { ethers } from 'ethers'
import DollarCost from '../chain-info/smart_contracts.json'

import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import smartContracts from '../chain-info/smart_contracts.json'

const UserRecurringBuys = ({signer,contract,provider,address}) => {

    // console.log(DollarCost.DollarCostAverage.address.sepolia)
// console.log("address",address)
const [data, setData] = useState(null)
const [tabledata,setTableData] = useState(null)
const [processing, setProcessing] = useState(false)

  const [openSnackbar,setOpenSnackBar] = useState(false)
  const [txHash, setTxHash] = useState(null)
  const [canceledIds,setCanceledIds] = useState(null)
 


  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    window.location.reload(false);
    setOpenSnackBar(false);
    
  };



  const action = (
    <React.Fragment>
      <Button color="secondary" size="small" onClick={handleClose}>
        UNDO
      </Button>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </React.Fragment>
  );

    useEffect(()=>{

    const loggingData = async()=>{
    const data = await logEventData("RecurringBuyCreated",[], provider)
    console.log("data",data)
    setData(data)
    }

    if(provider!=null){
    try{
    loggingData()  
    }
    catch(err){
        console.log(err)
    }
    }

    },[provider,address])

    useEffect(()=>{
    if(data != undefined){
    console.log("data",data)
    filterData(data)
}
    },[data])



    const filterData = (data)=>{
        // console.log(data)
        // console.log("data",data[16][0])

        //takes off records which don't relate to events,setup of contracts and admin
        let userData = []
        let cancelledContracts = []

        data.forEach((element)=>{
            //the cancel event array is length 2 and the admin stuff does not start witha  string when
            //llooking at data
            if(typeof(element[0])!='string'& element.length==3){
                userData.push(element)
            }
           
        })

        
            data.forEach((element)=>{
                //event structure for canclled events in length 2 and only take sender from address
                if(typeof(element[0])!='string'& element.length==2 &element.sender==address){
                //filter and convert big number to javascript integer
                    cancelledContracts.push(element.recBuyId.toNumber())
                }
               
            })
           
       

        //console.log("cancelled",cancelledContracts)
        setCanceledIds(cancelledContracts)
        //filter to only records specific to user
        console.log("userData",userData.buy)
       let result =[] 
       for(let i = 0; i<userData.length; i++){
       if (userData[i][1]==address&& userData[i].buy){
        result.push(userData[i])
       }
       }
console.log("result",result)
       let tableResult = []
       result.forEach((element)=>{
        // console.log("buy",element.buy)
        // console.log("timeIntervalSeconds",element.buy.timeIntervalInSeconds.toNumber())
      
        console.log("tokenToBuy",element.buy.tokenToBuy)
        console.log("token to spend",element.buy.tokenToSpend)
        // console.log(element.recBuyId.toNumber())
        
        // console.log("amount",ethers.utils.formatEther(element.buy[1]))
       
        let tdata = {
            "buyId":element.recBuyId.toNumber(),
            "tokenToSpend":element.buy.tokenToSpend,
            "tokenToBuy":element.buy.tokenToBuy,
            "timeInterval":element.buy.timeIntervalInSeconds.toNumber(),
            "amount":ethers.utils.formatEther(element.buy[1])
        }
        tableResult.push(tdata)
    
       })
    //    console.log("tableresult",tableResult)
    setTableData(tableResult)
    }


    
    const logEventData = async (eventName, filters = [], provider, setterFunction = undefined) => {

        // console.log("eventName",eventName)
        // console.log("provider",provider)
        // console.log("filters",filters)
        // let filterABI = ["event RecurringBuyCreated ( uint256 recBuyId,address sender, tuple buy)"]
        // console.log(DollarCost.DollarCostAverage.abi)
        let filterABI = DollarCost.DollarCostAverage.abi
        let iface = new ethers.utils.Interface(filterABI)

        // console.log(iface)

        let dollarCostAddress = DollarCost.DollarCostAverage.address.sepolia
        // console.log(dollarCostAddress)
        let filter = {
            address: dollarCostAddress,
            fromBlock:0,     
        }
        let logPromise = provider.getLogs(filter)
        logPromise.then(function(logs){
            let events = logs.map((log)=>{
                return iface.parseLog(log).args
            })
            setData(events)
            
        }).catch(function(err){
            console.log(err);
        });

    }

    const handleCancel = async (id)=>{
        if(signer){
        try{
        setProcessing(true)
        let tx = await contract.connect(signer).cancelRecurringPayment(id)
        let hash = tx.hash
        setTxHash(hash.toString())
        isTransactionMined(hash.toString())

        }
        catch(err){
        setProcessing(false)
        console.log(err)
        }
        }
    }

    const isTransactionMined = async (transactionHash) => {
        let transactionBlockFound = false
      
        while (transactionBlockFound === false) {
            let tx = await provider.getTransactionReceipt(transactionHash)
            console.log("transaction status check....")
            try {
                await tx.blockNumber
            }
            catch (error) {
                tx = await provider.getTransactionReceipt(transactionHash)
            }
            finally {
                console.log("proceeding")
            }
      
      
            if (tx && tx.blockNumber) {
               
                setProcessing(false)
                console.log("block number assigned.")
                transactionBlockFound = true
                let stringBlock = tx.blockNumber.toString()
                console.log("COMPLETED BLOCK: " + stringBlock)
                // setReloadPage(true)
                setOpenSnackBar(true)
      
            }
        }
      }
    
 const removeCancelledContracts = (tableData) =>{
    // console.log('tableData',tableData)
    // console.log("cancelled",canceledIds)
    let refinedData = tableData.filter(element=>!canceledIds.includes(element.buyId))
    // console.log("refined",refinedData)
    return refinedData
 }

 const translateToken = (row)=>{
    let translatedData = {}
    if(row.tokenToBuy == smartContracts.UNIMock.address.sepolia){
        translatedData["tokenToBuy"] ="UNI"
    }
    else if (row.tokenToBuy == smartContracts.WETHMock.address.sepolia){
        translatedData["tokenToBuy"]="WETH"        
    }

    if(row.tokenToSpend == smartContracts.UNIMock.address.sepolia){
        translatedData["tokenToSpend"] ="UNI"
    }
    else if (row.tokenToSpend == smartContracts.WETHMock.address.sepolia){
        translatedData["tokenToSpend"]="WETH"        
    }

    return translatedData

 }

 const translateTime=(row)=>{
    let returnData = {}
    if(row.timeInterval==300){
        returnData["timeInterval"] = "5 Minutes"
    }
    else if (row.timeInterval==86400){
        returnData["timeInterval"] = "Daily"
    } 
    else if (row.timeInterval==604800){
        returnData["timeInterval"] = "Weekly"
    } 
    else if (row.timeInterval==2419200){
        returnData["timeInterval"] = "Monthly" 
    }
    return returnData
 }

  return (
    <>
   {
    !processing?
    <Card sx={{marginTop:'20px',padding:'40px'}}>
        <Box>
        <div>Current Dollar Cost Average Contracts</div>
        </Box>
        <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="Current Dollar Cost Average">
        <TableHead sx={{backgroundColor:"lightyellow"}}>
          <TableRow>
            <TableCell>buyId</TableCell>
            <TableCell align="right">Token To Spend</TableCell>
            <TableCell align="right">Token To Buy</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell align="right">Interval&nbsp;</TableCell>
            <TableCell align="right"></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tabledata?(removeCancelledContracts(tabledata).map((row) => {
            // let swap = {"tokenToBuy":"UNI","tokenToSpend":"WETH"}
            // console.log("row",row)
            let swap = translateToken(row)
            let time = translateTime(row)
            
            return(
            <TableRow
              key={row.buyId}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
          
              <TableCell align="right">{row.buyId}</TableCell>
              <TableCell align="right">{swap.tokenToSpend}</TableCell>
              <TableCell align="right">{swap.tokenToBuy}</TableCell>
              <TableCell align="right">{row.amount}</TableCell>
              <TableCell align="right">{time.timeInterval}</TableCell>
              <TableCell><Button onClick={()=>handleCancel(row.buyId)} variant='contained' color="error">Cancel</Button></TableCell>
            </TableRow>)
          })):<div></div>}
        </TableBody>
      </Table>
    </TableContainer>



    </Card>:<Box display="flex"
                alignItems="center"
                justifyContent="center" 
                sx={{marginTop:'20px'}}> <CircularProgress/></Box>
}
        <Snackbar
        anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleClose}
        message=""
        action={action}
        sx={{backgroundColor:"white"}}
      >
        <a target="_blank" href={`https://sepolia.etherscan.io/tx/${txHash}`}>
          <Typography color="black">Success!Dollar Cost Agreement Canceled:${txHash} on Etherscan</Typography>
        </a>
        </Snackbar>
    </>
   
  )
}

export default UserRecurringBuys