//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract AMM {
	Token public tokenA;
	Token public tokenB;

	uint256 public tokenABalance;
	uint256 public tokenBBalance;
	uint256 public K;

	uint256 public totalShares;
	mapping(address => uint256) public shares;
	uint256 constant PRECISION = 10**18;

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

	function addLiquidity(uint256 _tokenAAmount, uint256 _tokenBAmount) external {
		//Deposit Tokens
		require(
			tokenA.transferFrom(msg.sender, address(this), _tokenAAmount),
			"token A LPing failed"
		);
		require(
			tokenB.transferFrom(msg.sender, address(this), _tokenBAmount),
			"token B LPing failed"
		);

		uint256 share;

		if (totalShares == 0) {
			share = 100 * PRECISION;
		} else {
			uint256 shareA = totalShares * _tokenAAmount / tokenABalance;
			uint256 shareB = totalShares * _tokenBAmount / tokenBBalance;
			require(
				(shareA / 1000) == (shareB / 1000),
				"provide equal tokens"
			);
			share = shareA;
		}

		tokenABalance += _tokenAAmount;
		tokenBBalance += _tokenBAmount;
		K = tokenABalance * tokenBBalance;

		totalShares += share;
		shares[msg.sender] += share;
	}

	function calculateTokenADeposit(uint256 _tokenBAmount)
		public
		view
		returns (uint256 tokenAAmount)
	{
		tokenAAmount = _tokenBAmount * tokenABalance / tokenBBalance;
	}

	function calculateTokenBDeposit(uint256 _tokenAAmount)
		public
		view
		returns (uint256 tokenBAmount)
	{
		tokenBAmount = _tokenAAmount * tokenBBalance / tokenABalance;
	}

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

	function calcuateWithdrawAmount(uint256 _share)
		public
		view
		returns (uint256 tokenAAmount, uint256 tokenBAmount)
	{
		require(_share <= totalShares, "too much");
		tokenAAmount = tokenABalance * _share / totalShares;
		tokenBAmount = tokenBBalance * _share / totalShares;
	}

	function withdrawLiquidity(uint256 _share)
		external
		returns(uint256 tokenAAmount, uint256 tokenBAmount)
	{
		require(
			_share <= shares[msg.sender],
			"Less than you have"
		);

		(tokenAAmount, tokenBAmount) = calcuateWithdrawAmount(_share);

		shares[msg.sender] -= _share;
		totalShares -= _share;

		tokenABalance -= tokenAAmount;
		tokenBBalance -= tokenBAmount;
		K = tokenABalance * tokenBBalance;

		tokenA.transfer(msg.sender, tokenAAmount);
		tokenB.transfer(msg.sender, tokenBAmount);
	}













}






















