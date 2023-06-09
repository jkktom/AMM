import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import { ethers } from 'ethers'

import Alert from './Alert'

import {
  swap,
  loadBalances
} from '../store/interactions'

const Swap = () => {
  const [inputToken, setInputToken] = useState(null)
  const [outputToken, setOutputToken] = useState(null)
  const [inputAmount, setInputAmount] = useState(0)
  const [outputAmount, setOutputAmount] = useState(0)
  const [price, setPrice] = useState(0)
  const [showAlert, setShowAlert] = useState(false)

  const provider = useSelector(state => state.provider.connection)
  const account = useSelector(state => state.provider.account)
  const tokens = useSelector(state => state.tokens.contracts)
    const symbols = useSelector(state => state.tokens.symbols)
    const balances = useSelector(state => state.tokens.balances)
  const amm = useSelector(state => state.amm.contract)
    const isSwapping = useSelector(state => state.amm.swapping.isSwapping)
    const isSuccess = useSelector(state => state.amm.swapping.isSuccess)
    const transactionHash = useSelector(state => state.amm.swapping.transactionHash)
  const dispatch = useDispatch()


  const inputHandler = async (e) => {
    if (!inputToken || !outputToken) {
      window.alert('Please select token')
      return
    }
    if (inputToken === outputToken) {
      window.alert('Invalid token pair')
      return
    }
    if (inputToken === 'DAPP') {
      setInputAmount(e.target.value)
        const _token1Amount = ethers.utils.parseUnits(e.target.value, 'ether')
        const result = await amm.calculateDispense(true, _token1Amount)
        const _token2Amount = ethers.utils.formatUnits(result[0].toString(), 'ether')
      setOutputAmount(_token2Amount.toString())
    } else {
      setInputAmount(e.target.value)
        const _token2Amount = ethers.utils.parseUnits(e.target.value, 'ether')
        const result = await amm.calculateDispense(false, _token2Amount)
        const _token1Amount = ethers.utils.formatUnits(result[0].toString(), 'ether')
      setOutputAmount(_token1Amount.toString())
    }
  }
//Swap Handler
  const swapHandler = async (e) => {
    e.preventDefault()
    setShowAlert(false)
      if (inputToken === outputToken) {
        window.alert('Invalid Token Pair')
        return
      }
    const _inputAmount = ethers.utils.parseUnits(inputAmount, 'ether')
    const tokenIndex = inputToken === "DAPP" ? 0 : 1;
    await swap(provider, amm, tokens[tokenIndex], inputToken, _inputAmount, dispatch);

    await loadBalances(amm, tokens, account, dispatch)
    await getPrice()
    setShowAlert(true)
  }


  const getPrice = async () => {
    if (inputToken === outputToken) {
      setPrice(0)
      return
    }
    if (inputToken === 'DAPP') {
      setPrice(await amm.tokenBBalance() / await amm.tokenABalance())
    } else {
      setPrice(await amm.tokenABalance() / await amm.tokenBBalance())
    }
  }

  useEffect(() => {
    if(inputToken && outputToken) {
      getPrice()
    }
  }, [inputToken, outputToken]);

  return(
    <div>
      <Card style={{ maxWidth: '450px' }} className='mx-auto px-4'>
        {account ? (
          <Form onSubmit={swapHandler} style={{ maxWidth: '450px', margin: '50px auto' }}>
          {/*Input Token Start*/}
            <Row className='my-3'> 
              <div className='d-flex justify-content-between'>
                <Form.Label><strong>Submit:</strong></Form.Label>
                <Form.Text muted>
                  Current : {
                    inputToken === symbols[0] ? (
                      balances[0]
                    ) : inputToken === symbols[1] ? (
                      balances[1]
                    ) : 0
                  }
                </Form.Text>
              </div>
              <InputGroup>
                <Form.Control
                  type="number"
                  placeholder="0.0"
                  min="0.0"
                  step="any"
                  onChange={(e) => inputHandler(e) }
                  disabled={!inputToken}
                />
                <DropdownButton
                  variant="outline-secondary"
                  title={inputToken ? inputToken : "Select Token"}
                >
                <Dropdown.Item onClick={(e) => setInputToken(e.target.innerHTML)} >DAPP</Dropdown.Item>
                <Dropdown.Item onClick={(e) => setInputToken(e.target.innerHTML)} >USD</Dropdown.Item>

                </DropdownButton>
              </InputGroup>
            </Row>
          {/*Output Token Start  */}
            <Row className='my-5'>
              <div className='d-flex justify-content-between'>
                <Form.Label><strong>Dispense:</strong></Form.Label>
                <Form.Text muted>
                  Current : {
                    outputToken === symbols[0] ? (
                      balances[0]
                    ) : outputToken === symbols[1] ? (
                      balances[1]
                    ) : 0
                  }
                </Form.Text>
              </div>
              <InputGroup>
                <Form.Control
                  type="number"
                  placeholder="0.0"
                  value={outputAmount === 0 ? "Dispense amount here" : outputAmount }
                  disabled
                />
                <DropdownButton
                  variant="outline-secondary"
                  title={outputToken ? outputToken : "Select Token"}
                >
                  <Dropdown.Item onClick={(e) => setOutputToken(e.target.innerHTML)}>DAPP</Dropdown.Item>
                  <Dropdown.Item onClick={(e) => setOutputToken(e.target.innerHTML)}>USD</Dropdown.Item>
                </DropdownButton>
              </InputGroup>
            </Row>

            <Row className='my-5'>
              {isSwapping ? (
                <Spinner animation="border" style={{ display: 'block', margin: '0 auto' }} />
              ) : (
                <Button type='submit'>Swap</Button>
              )}
              <Form.Text muted>
                Exchange Rate : {price}
              </Form.Text>
            </Row>
          </Form>  
        ):(
          <p
            className='d-flex justify-content-center align-items-center'
            style={{ height: '300px' }}
          >
            Please connect wallet.
          </p>
        )}
      </Card>
      {isSwapping ? (
        <Alert
          message={'Swap Pending...'}
          transactionHash={null}
          variant={'info'}
          setShowAlert={setShowAlert}
        />
      ) : isSuccess && showAlert ? (
        <Alert
          message={'Swap Successful'}
          transactionHash={transactionHash}
          variant={'success'}
          setShowAlert={setShowAlert}
        />
      ) : !isSuccess && showAlert ? (
        <Alert
          message={'Swap Failed'}
          transactionHash={null}
          variant={'danger'}
          setShowAlert={setShowAlert}
        />
      ) : (
        <></>
      )}
    </div>
  )
}

export default Swap;
