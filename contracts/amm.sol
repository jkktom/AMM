//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

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
	// function token1() external view returns (address) {
    //     return address(tokenA);
    // }
	// function token2() external view returns (address) {
    //     return address(tokenB);
    // }
	// function token1Balance() external view returns (uint256) {
    //     return  tokenABalance;
    // }
	// function token2Balance() external view returns (uint256) {
    //     return  tokenBBalance;
    // }
	
	// function calculateTokenADeposit(uint256 _tokenBAmount) 
	//     public
	//     view
	//     returns (uint256 tokenAAmount)
	// {
	//     LiquidityAmounts memory amounts = calculateTokenDeposit(false, _tokenBAmount);
	//     return amounts.tokenAAmount;
	// }

	// function calculateTokenBDeposit(uint256 _tokenAAmount) 
	//     public
	//     view
	//     returns (uint256 tokenBAmount)
	// {
	//     LiquidityAmounts memory amounts = calculateTokenDeposit(true, _tokenAAmount);
	//     return amounts.tokenBAmount;
	// }

	// function calculateTokenDeposit(bool isTokenA, uint256 _inputAmount)
	// 	public
	// 	view
	// 	returns (LiquidityAmounts memory)
	// {
	// 	LiquidityAmounts memory amounts;

	// 	if (isTokenA) {
	// 		amounts.tokenAAmount = _inputAmount;
	// 		amounts.tokenBAmount = _inputAmount * tokenBBalance / tokenABalance;
	// 	} else {
	// 		amounts.tokenBAmount = _inputAmount;
	// 		amounts.tokenAAmount = _inputAmount * tokenABalance / tokenBBalance;
	// 	} 
	// 	return amounts;
	// }

	function calculateTokenDeposit(bool isTokenA, uint256 _inputAmount)
		public
		view
		returns (uint256 depositAmount)
	{
		LiquidityAmounts memory amounts;

		if (isTokenA) {
			amounts.tokenAAmount = _inputAmount;
			amounts.tokenBAmount = _inputAmount * tokenBBalance / tokenABalance;
			depositAmount = amounts.tokenBAmount;
		} else {
			amounts.tokenBAmount = _inputAmount;
			amounts.tokenAAmount = _inputAmount * tokenABalance / tokenBBalance;
			depositAmount = amounts.tokenAAmount;
		} 
		return depositAmount;
	}
	function addLiquidity(uint256 _token1Amount, uint256 _token2Amount)
	    external
	    returns (LiquidityAmounts memory amounts)
	{
	    amounts.tokenAAmount = _token1Amount;
	    amounts.tokenBAmount = _token2Amount;
	    addLiquidityWith(amounts);
	}    
	//Adding liquidity to the pool
	function addLiquidityWith(LiquidityAmounts memory amounts) public {
	    uint256 share = calculateShare(amounts);
	    transferTokens(amounts, true);
	    updateShares(share, true);
	    updateBalances(amounts, true);
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
	
	//withdraw shares

	function withdrawLiquidity(uint256 _share) internal {
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
	function removeLiquidity(uint256 _share) external {
		withdrawLiquidity(_share);
	}
    



/////////// SWAP 
	

	// function swapTokens(bool isTokenA, uint256 tokenSubmitAmount) public {
	//     (TokenBalances memory newPoolBalances, uint256 dispenseAmount)
	//     	 = calculateDispense(isTokenA, tokenSubmitAmount);
	//    	if(isTokenA) {
	//    		tokenSubmit = tokenA;
	// 	    tokenDispense = tokenB;
   	// 	} else {
	//    		tokenSubmit = tokenB;
	// 	    tokenDispense = tokenA;
   	// 	}
	//     tokenSubmit.transferFrom(msg.sender, address(this), tokenSubmitAmount); // Fix this
	//     tokenDispense.transfer(msg.sender, dispenseAmount);

	//     updateTokenBalances(newPoolBalances);

	//     emit Swap(
	//         msg.sender,
	//         address(tokenSubmit),
	//         tokenSubmitAmount,
	//         address(tokenDispense),
	//         dispenseAmount,
	//         tokenABalance,
	//         tokenBBalance,
	//         block.timestamp
	//     );
	// }
	// function calculateDispense(bool isTokenA , uint256 tokenSubmitAmount) 
	//     public 
	//     view 
	//     returns (TokenBalances memory newPoolBalances, uint256 dispenseAmount) {
	//     uint256 beforeSwapBalance;
	    
	//     if (isTokenA) {
	//         newPoolBalances.tokenABalance = tokenABalance + tokenSubmitAmount;
	//         newPoolBalances.tokenBBalance = K / newPoolBalances.tokenABalance;
	//         dispenseAmount = tokenBBalance - newPoolBalances.tokenBBalance;
	//         beforeSwapBalance = tokenBBalance;
	//     } else {
	//         newPoolBalances.tokenBBalance = tokenBBalance + tokenSubmitAmount;
	//         newPoolBalances.tokenABalance = K / newPoolBalances.tokenBBalance;
	//         dispenseAmount = tokenABalance - newPoolBalances.tokenABalance;
	//         beforeSwapBalance = tokenABalance;
	//     }

	//     if (dispenseAmount == beforeSwapBalance) {
	//         dispenseAmount--;
	//     }
	//     return (newPoolBalances, dispenseAmount);
	// }
	
	// function updateTokenBalances(TokenBalances memory newPoolBalances) internal {
	//     tokenABalance = newPoolBalances.tokenABalance;
	//     tokenBBalance = newPoolBalances.tokenBBalance;
	// }

	function calculateDispense(bool isTokenA , uint256 tokenSubmitAmount) 
	    public 
	    view 
	    returns (uint256 dispenseAmount, uint256 newTokenABalance, uint256 newTokenBBalance) {

	    if (isTokenA) {
	        newTokenABalance = tokenABalance + tokenSubmitAmount;
	        newTokenBBalance = K / newTokenABalance;
	        dispenseAmount = tokenBBalance - newTokenBBalance;
	    } else {
	        newTokenBBalance = tokenBBalance + tokenSubmitAmount;
	        newTokenABalance = K / newTokenBBalance;
	        dispenseAmount = tokenABalance - newTokenABalance;
	    }
	    return (dispenseAmount, newTokenABalance, newTokenBBalance);
	}

	function swapTokens(bool isTokenA, uint256 tokenSubmitAmount) 
		public 
	{
	    (uint256 dispenseAmount, 
    	uint256 newTokenABalance, 
    	uint256 newTokenBBalance) 
	    	= calculateDispense(isTokenA, tokenSubmitAmount);
	    
	    require(executeSwapTransfer(isTokenA, tokenSubmitAmount, dispenseAmount), 'swap Transfer Fails');

	    tokenABalance = newTokenABalance;
	    tokenBBalance = newTokenBBalance;

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
	function executeSwapTransfer(bool isTokenA, uint256 tokenSubmitAmount, uint256 dispenseAmount) internal returns (bool){
	    tokenSubmit = isTokenA ? tokenA : tokenB;
	    tokenDispense = isTokenA ? tokenB : tokenA;

	    tokenSubmit.transferFrom(msg.sender, address(this), tokenSubmitAmount);
	    tokenDispense.transfer(msg.sender, dispenseAmount);
	    return true;
	}

	
	
}
