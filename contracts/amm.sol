//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";
// import "./ammHelper.sol";

contract AMM {
	Token public tokenA;
	Token public tokenB;
	Token public tokenSubmit;
	Token public tokenDispense;

	uint256 public tokenABalance;
	uint256 public tokenBBalance;
	uint256 public K;

	uint256 public totalShares;
	mapping(address => uint256) public shares;
	uint256 constant PRECISION = 10**18;

	struct LiquidityAmounts {
		uint256 tokenAAmount;
		uint256 tokenBAmount;
	}

	struct TokenBalances {
	    uint256 tokenABalance;
	    uint256 tokenBBalance;
	}

	TokenBalances public poolBalances;

	event Swap(
		address indexed user,
		address indexed tokenSubmit,
		uint256 tokenSubmitAmount,
		address indexed tokenDispense,
		uint256 tokenDispenseAmount,
		uint256 tokenABalance,
		uint256 tokenBBalance,
		uint256 timestamp
	);

	constructor(Token _tokenA, Token _tokenB) {
		tokenA = _tokenA;
		tokenB = _tokenB;
	}
	
	//Adding liquidity to the pool
	function addLiquidity(LiquidityAmounts memory amounts) external {
	    transferTokens(amounts, true);
	    updateBalances(amounts, true);
	    uint256 share = calculateShare(amounts);
	    updateShares(share, true);
	}


	function calculateShare(LiquidityAmounts memory amounts) 
		internal view
		returns (uint256 share)
	{
    	if (totalShares == 0) {
			share = 100 * PRECISION;
		} else {
			uint256 shareA = totalShares * amounts.tokenAAmount / tokenABalance;
			uint256 shareB = totalShares * amounts.tokenBAmount / tokenBBalance;
			require(
				(shareA / 1000) == (shareB / 1000),
				"provide equal tokens"
			);
			share = shareA;
		}
		return share;
    }
	function updateBalances(LiquidityAmounts memory amounts, bool isAdd) internal {
	    if (isAdd) {
	        tokenABalance += amounts.tokenAAmount;
	        tokenBBalance += amounts.tokenBAmount;
	    } else {
	        tokenABalance -= amounts.tokenAAmount;
	        tokenBBalance -= amounts.tokenBAmount;
	    }
	    K = tokenABalance * tokenBBalance;
	}

	function updateShares(uint256 _share, bool isAdd) internal {
	    if (isAdd) {
	        shares[msg.sender] += _share;
	        totalShares += _share;
	    } else {
	        shares[msg.sender] -= _share;
	        totalShares -= _share;
	    }
	}

	function transferTokens(LiquidityAmounts memory amounts, bool isAdd) internal {
	    bool tokenATransferSuccess;
	    bool tokenBTransferSuccess;

	    if (isAdd) {
	        tokenATransferSuccess = tokenA.transferFrom(msg.sender, address(this), amounts.tokenAAmount);
	        tokenBTransferSuccess = tokenB.transferFrom(msg.sender, address(this), amounts.tokenBAmount);
	    } else {
	        tokenATransferSuccess = tokenA.transfer(msg.sender, amounts.tokenAAmount);
	        tokenBTransferSuccess = tokenB.transfer(msg.sender, amounts.tokenBAmount);
	    }

	    // Require both transfers to be successful
	    require(
	        tokenATransferSuccess && tokenBTransferSuccess,
	        "Token A or B transfer failed"
	    );
	}
	function withdrawLiquidity(uint256 _share) external {
	    validateShares(_share);
	    updateShares(_share, false);
	    LiquidityAmounts memory amounts = calculateAmounts(_share);
	    updateBalances(amounts, false);
	    transferTokens(amounts, false);
	}
	function validateShares(uint256 _share) internal view returns(uint256){
		require(_share <= totalShares, "exceeds total");
		require(_share <= shares[msg.sender], "less than yours");
	    return _share;
	}
	function calculateAmounts(uint256 _share) 
		internal 
		view 
		returns (LiquidityAmounts memory amounts)
	{
		amounts.tokenAAmount = tokenABalance * _share / totalShares;	
		amounts.tokenBAmount = tokenBBalance * _share / totalShares;
	    return amounts;	
	}
    
	function calculateTokenDeposit(uint256 _inputAmount, address _token)
		public
		view
		returns (LiquidityAmounts memory)
	{
		LiquidityAmounts memory amounts;

		if (_token == address(tokenA)) {
			amounts.tokenAAmount = _inputAmount;
			amounts.tokenBAmount = _inputAmount * tokenBBalance / tokenABalance;
		} else if (_token == address(tokenB)) {
			amounts.tokenBAmount = _inputAmount;
			amounts.tokenAAmount = _inputAmount * tokenABalance / tokenBBalance;
		} else {
			revert("Invalid token type");
		}
		return amounts;
	}



///////////?SWAP

	function swapTokenA(uint256 _tokenAmount)
	    external
	    returns(bool isTokenA, uint256 tokenSubmitAmount)
	{
	    isTokenA = true;
	    tokenSubmit = tokenA;
	    tokenSubmitAmount = _tokenAmount;
	    tokenDispense = tokenB;
	    swapTokens(isTokenA, tokenSubmitAmount);
	}
	function swapTokenB(uint256 _tokenAmount)
	    external
	    returns(bool isTokenA, uint256 tokenSubmitAmount)
	{
	    isTokenA = false;
	    tokenSubmit = tokenB;
	    tokenSubmitAmount = _tokenAmount;
	    tokenDispense = tokenA;
	    swapTokens(isTokenA, tokenSubmitAmount);
	}

	function swapTokens(bool isTokenA, uint256 tokenSubmitAmount) internal {
	    (TokenBalances memory newPoolBalances, uint256 dispenseAmount) = calculateDispense(isTokenA, tokenSubmitAmount);

	    tokenSubmit.transferFrom(msg.sender, address(this), tokenSubmitAmount);
	    tokenDispense.transfer(msg.sender, dispenseAmount);

	    updateTokenBalances(newPoolBalances);

	    emit Swap(
	        msg.sender,
	        address(tokenSubmit),
	        tokenSubmitAmount,
	        address(tokenDispense),
	        dispenseAmount,
	        tokenABalance,
	        tokenBBalance,
	        block.timestamp
	    );
	}
	

	function calculateDispense(bool isTokenA , uint256 tokenSubmitAmount) 
	    internal 
	    view 
	    returns (TokenBalances memory newPoolBalances, uint256 dispenseAmount) {
	    uint256 beforeSwapBalance;
	    
	    if (isTokenA) {
	        newPoolBalances.tokenABalance = tokenABalance + tokenSubmitAmount;
	        newPoolBalances.tokenBBalance = K / newPoolBalances.tokenABalance;
	        dispenseAmount = tokenBBalance - newPoolBalances.tokenBBalance;
	        beforeSwapBalance = tokenBBalance;
	    } else {
	        newPoolBalances.tokenBBalance = tokenBBalance + tokenSubmitAmount;
	        newPoolBalances.tokenABalance = K / newPoolBalances.tokenBBalance;
	        dispenseAmount = tokenABalance - newPoolBalances.tokenABalance;
	        beforeSwapBalance = tokenABalance;
	    }

	    if (dispenseAmount == beforeSwapBalance) {
	        dispenseAmount--;
	    }
	    return (newPoolBalances, dispenseAmount);
	}
	function calculateTokenASwap(uint256 _tokenAAmount)
	    public
	    view
	    returns(uint256 dispenseAmount)
	{
	    (, dispenseAmount) = calculateDispense(true, _tokenAAmount);
	    return dispenseAmount;
	}


	function calculateTokenBSwap(uint256 _tokenBAmount)
	    public
	    view
	    returns(uint256 dispenseAmount)
	{
	    (, dispenseAmount) = calculateDispense(false, _tokenBAmount);
	    return dispenseAmount;
	}
	
	function updateTokenBalances(TokenBalances memory newPoolBalances) internal {
	    tokenABalance = newPoolBalances.tokenABalance;
	    tokenBBalance = newPoolBalances.tokenBBalance;
	}
	

	
	
	














}






















