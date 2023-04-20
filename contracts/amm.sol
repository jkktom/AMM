//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";
// import "./ammHelper.sol";

contract AMM {
	Token public tokenA;
	Token public tokenB;

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

	event Swap(
		address user,
		address tokenSubmit,
		uint256 tokenSubmitAmount,
		address tokenDispense,
		uint256 tokenDispenseAmount,
		uint256 tokenABalance,
		uint256 tokenBBalance,
		uint256 timestamp
	);

	constructor(Token _tokenA, Token _tokenB) {
		tokenA = _tokenA;
		tokenB = _tokenB;
	}

	function addLiquidity(LiquidityAmounts memory amounts) external {
		increaseShares(
	        calculateShare(
	            increaseBalances(
	            	depositTokens(amounts)
	            )
	        )
	    );
	}
	function depositTokens(LiquidityAmounts memory amounts) 
		internal 
		returns (LiquidityAmounts memory)
	{
	    bool tokenATransferSuccess = tokenA.transferFrom(msg.sender, address(this), amounts.tokenAAmount);
	    bool tokenBTransferSuccess = tokenB.transferFrom(msg.sender, address(this), amounts.tokenBAmount);

	    // Require both transfers to be successful
	    require(
	        tokenATransferSuccess && tokenBTransferSuccess,
	        "Token A or B transfer for LPing failed"
	    );
	    return amounts;
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
    function increaseBalances(LiquidityAmounts memory amounts) 
    	internal 
	    returns (LiquidityAmounts memory) 
    {
        tokenABalance += amounts.tokenAAmount;
        tokenBBalance += amounts.tokenBAmount;
        K = tokenABalance * tokenBBalance;
	    return amounts;
    }
    function increaseShares(uint256 share) internal returns (uint256){
    	shares[msg.sender] += share;
    	totalShares += share;
	    return share;
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
	function calculateTokenASwap(uint256 _tokenAAmount)
		public
		view
		returns (uint256 tokenBAmount)
	{
		uint256 tokenAAfter = tokenABalance + _tokenAAmount;
		uint256 tokenBAfter = K / tokenAAfter;
		tokenBAmount = tokenBBalance - tokenBAfter;

		if(tokenBAmount == tokenBBalance) {
			tokenBAmount --;
		}

		require(tokenBAmount < tokenBBalance, "Swap Less");
	}

	function calculateTokenBSwap(uint256 _tokenBAmount)
		public
		view
		returns (uint256 tokenAAmount)
	{
		uint256 tokenBAfter = tokenBBalance + _tokenBAmount;
		uint256 tokenAAfter = K / tokenBAfter;
		tokenAAmount = tokenABalance - tokenAAfter;

		if(tokenAAmount == tokenABalance) {
			tokenAAmount --;
		}

		require(tokenAAmount < tokenABalance, "Swap Less");
	}

	function swapTokenA(uint256 _tokenAAmount)
		external
		returns(uint256 tokenBAmount)
	{
		tokenBAmount = calculateTokenASwap(_tokenAAmount);

		tokenA.transferFrom(msg.sender, address(this), _tokenAAmount);
		tokenABalance += _tokenAAmount;
		tokenBBalance -= tokenBAmount;
		tokenB.transfer(msg.sender, tokenBAmount);

		emit Swap(
			msg.sender,
			address(tokenA),
			_tokenAAmount,
			address(tokenB),
			tokenBAmount,
			tokenABalance,
			tokenBBalance,
			block.timestamp
		);
	}

	function swapTokenB(uint256 _tokenBAmount)
		external
		returns(uint256 tokenAAmount)
	{
		tokenAAmount = calculateTokenBSwap(_tokenBAmount);

		tokenB.transferFrom(msg.sender, address(this), _tokenBAmount);
		tokenBBalance += _tokenBAmount;
		tokenABalance -= tokenAAmount;
		tokenA.transfer(msg.sender, tokenAAmount);

		emit Swap(
			msg.sender,
			address(tokenB),
			_tokenBAmount,
			address(tokenA),
			tokenAAmount,
			tokenABalance,
			tokenBBalance,
			block.timestamp
		);
	}

////Start withdraw LPing

	function withdrawLiquidity(uint256 _share) external {
	    transferTokens(
	        reduceBalances(
	            calculateAmounts(
	            	reduceShares(
	            		validateShares(_share)
		           	)
            	)
	        )
	    );
	}

	function reduceShares(uint256 _share) internal returns (uint256) {
	    shares[msg.sender] -= _share;
	    totalShares -= _share;
	    return _share;
	}

	function reduceBalances(LiquidityAmounts memory amounts) 
	    internal 
	    returns (LiquidityAmounts memory) 
	{
	    tokenABalance -= amounts.tokenAAmount;
	    tokenBBalance -= amounts.tokenBAmount;
	    K = tokenABalance * tokenBBalance;
	    return amounts;
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

	function transferTokens(LiquidityAmounts memory amounts) internal {
	    bool tokenATransferSuccess = tokenA.transfer(msg.sender, amounts.tokenAAmount);
	    bool tokenBTransferSuccess = tokenB.transfer(msg.sender, amounts.tokenBAmount);

	    // Require both transfers to be successful
	    require(
	        tokenATransferSuccess && tokenBTransferSuccess,
	        "Token A or B transfer for withdrawing failed"
	    );
	}















}






















