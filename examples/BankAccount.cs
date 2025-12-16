using System;

namespace BankingSystem
{
    public class BankAccount
    {
        private decimal balance;
        private string accountNumber;
        
        public BankAccount(string accountNumber, decimal initialBalance)
        {
            this.accountNumber = accountNumber;
            this.balance = initialBalance;
        }
        
        public bool Deposit(decimal amount)
        {
            if (amount > 0)
            {
                balance += amount;
                return true;
            }
            return false;
        }
    }
}