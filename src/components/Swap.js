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

// import Alert from './Alert'

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

  const account = useSelector(state => state.provider.account)
  const amm = useSelector(state => state.amm.contract)

  const getPrice = async () => {
    if (inputToken === outputToken) {
      setPrice(0)
      return
    }
    if (inputToken === 'DAPP') {
      setPrice(await amm.token2Balance() / await amm.token1Balance())
    } else {
      setPrice(await amm.token1Balance() / await amm.token2Balance())
    }
  }
  
  return(
    <div>
      <Card style={{ maxWidth: '450px' }} className='mx-auto px-4'>
        {account ? (
          <Form  style={{ maxWidth: '450px', margin: '50px auto' }}>
            <Row className='my-3'>
              <div className='d-flex justify-content-between'>
                <Form.Label><strong>Submit:</strong></Form.Label>
                <Form.Text muted>
                  Balance: {/*{
                    inputToken === symbols[0] ? (
                      balances[0]
                    ) : inputToken === symbols[1] ? (
                      balances[1]
                    ) : 0
                  }*/}
                </Form.Text>
              </div>
              <InputGroup>
                <Form.Control
                  type="number"
                  placeholder="0.0"
                  min="0.0"
                  step="any"
                  // onChange={(e) => inputHandler(e) }
                  // disabled={!inputToken}
                  disabled={0}
                />
                <DropdownButton
                  variant="outline-secondary"
                  // title={inputToken ? inputToken : "Select Token"}
                  title={"Select Token"}
                >
                <Dropdown.Item>DAPP</Dropdown.Item>
                <Dropdown.Item>USD</Dropdown.Item>

                </DropdownButton>
              </InputGroup>
            </Row>
            <Row className='my-5'>
              <div className='d-flex justify-content-between'>
                <Form.Label><strong>Dispense:</strong></Form.Label>
                <Form.Text muted>
                  Balance: {/*{
                    inputToken === symbols[0] ? (
                      balances[0]
                    ) : inputToken === symbols[1] ? (
                      balances[1]
                    ) : 0
                  }*/}
                </Form.Text>
              </div>
              <InputGroup>
                <Form.Control
                  type="number"
                  placeholder="0.0"
                  step="any"
                  disabled
                />
                <DropdownButton
                  variant="outline-secondary"
                  // title={inputToken ? inputToken : "Select Token"}
                  title={"Select Token"}
                >
                <Dropdown.Item>DAPP</Dropdown.Item>
                <Dropdown.Item>USD</Dropdown.Item>

                </DropdownButton>
              </InputGroup>
            </Row>

            <Row className='my-5'>
                <Button type='submit'>Swap</Button>
              {/*{isSwapping ? (
                <Spinner animation="border" style={{ display: 'block', margin: '0 auto' }} />
              ): (
              )}*/}

              <Form.Text muted>
                {/*Exchange Rate: {price}*/}
                Exchange Rate:
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
    </div>
  )
}

export default Swap;
