// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Interface for the ERC20 token transfer function
interface ERC20Token {
    function transfer(address recipient, uint256 amount) external payable returns (bool);
    function balanceOf(address account) external  view returns (uint256);
    function transferFrom(address sender, address recipient, uint256 amount) external payable returns (bool);
    function approve(address spender, uint256 amount) external payable returns (bool);
    function allowance(address owner, address spender) external  returns (uint256);
}
contract GoodhiveJobContract {
    address internal usdctoken = 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359;
    ERC20Token Token = ERC20Token(usdctoken);
    address internal owner = 0x2744532faf9370cD0B4005A6CfC9CC64Fa8ecA38;
    struct Job {
        address user;
        uint256 amount;
    }
    mapping(uint128 => Job) public jobs;
    event JobCreated(uint128 indexed jobId, address indexed sender, uint256 amount);
    event PayFees(address indexed recipient, uint256 amount);
    event AllFundsWithdrawn(address indexed recipient, uint256 amount);
    event Allowence(uint total);
    event FailedToPayTheFees(bool);
    event RequestApprovalSuccess(bool succeed);
    function requestApproval(uint amount) external {
        require(Token.balanceOf(msg.sender)>=amount, "Insufficient balance");
        require(Token.approve(address(this), amount), "Approval Failed");
        emit RequestApprovalSuccess(true);
    }
    // Function to create a job by sending Matic to this contract
    function createJob(uint128 jobId, uint256 amount) external payable {
        if(jobs[jobId].user != address(0) && jobs[jobId].user!= msg.sender){
            require(false, "You are not allowed to use this jobid");
        }
        jobs[jobId].user = msg.sender;
        require(amount > 0, "Amount should be greater than 0");
        require(Token.allowance(msg.sender, address(this))>=amount, "Insufficient Allowence");
        require(Token.balanceOf(msg.sender)>=(amount), "Insufficient balance");
        require(Token.transferFrom(msg.sender, address(this), (amount)), "Transfer failed");
        
        if (jobs[jobId].amount > 0) {
            jobs[jobId].amount += amount;
        } else {
            jobs[jobId] = Job(msg.sender, amount);
        }

        emit JobCreated(jobId, msg.sender, amount);
    }
    function getAllowence() external{
        emit Allowence(Token.allowance(msg.sender, address(this)));
    }
    // Function to check the job balance for a specific user
    function checkBalance(uint128 jobId) external view returns (uint256) {
        return jobs[jobId].amount;
    }

    function sendTheFees(uint128 jobId, uint256 amount) external {
        if(jobs[jobId].user != address(0) && jobs[jobId].user!= msg.sender){
            require(false, "You are not allowed to pay the fees");
        }
        if(jobs[jobId].amount == 0){
            require(false, "Insufficient balance");
        }
        require(amount > 0, "Amount should be greater than 0");
        require(amount <= jobs[jobId].amount, "Insufficient balance");
        jobs[jobId].amount -= amount;
        require(Token.transfer(owner, amount), "Failed to transfer");
        emit PayFees(msg.sender, amount);
    }
    // Function to withdraw all funds from the job to the user wallet
    function withdrawFunds(uint128 jobId, uint256 amount) external {
        if(jobs[jobId].user != address(0) && jobs[jobId].user!= msg.sender){
            require(false, "You are not allowed to use this jobid");
        }
        require(amount > 0, "No balance to withdraw");
        require(jobs[jobId].amount>=amount, "Insufficient balance");
        require(Token.transfer(msg.sender, amount), "Failed to transfer");
        jobs[jobId].amount -= amount;
        emit AllFundsWithdrawn(msg.sender, amount);
    }

    function withdrawAllFunds(uint128 jobId) external {
        if(jobs[jobId].user != address(0) && jobs[jobId].user!= msg.sender){
            require(false, "You are not allowed to use this jobid");
        }
        uint256 amount = jobs[jobId].amount;
        require(amount > 0, "No balance to withdraw");
        require(Token.transfer(msg.sender, jobs[jobId].amount));
        jobs[jobId].amount = 0;
        emit AllFundsWithdrawn(msg.sender, amount);
    }
    // Function to check the contract's balance (only for debugging purposes)
    function contractBalance() external view returns (uint256) {
        return Token.balanceOf(address(this));
    }

    function myAddress() external view returns(address){
        return address(this);
    }
}