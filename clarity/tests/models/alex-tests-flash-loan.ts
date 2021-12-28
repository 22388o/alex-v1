import {
    Account,
    Chain,
    Clarinet,
    Tx,
    types,
  } from "https://deno.land/x/clarinet@v0.14.0/index.ts";
  

  class FLTestAgent1 {
    chain: Chain;
    deployer: Account;
  
    constructor(chain: Chain, deployer: Account) {
      this.chain = chain;
      this.deployer = deployer;
    }
  
    flashLoan(user: Account, loanuser:string, token:string, amount: number, memo: ArrayBuffer) {
      let block = this.chain.mineBlock([
        Tx.contractCall("alex-vault", "flash-loan", [
          types.principal(loanuser),
          types.principal(token),
          'u' + BigInt(amount),
          types.some(types.buff(memo))
        ], user.address),
      ]);
      return block.receipts[0].result;
    }

    rollPosition(user: Account, token: string, collateral: string, keyToken: string, loanuser:string, expiry: number, expiry_to_roll: number) {
      let block = this.chain.mineBlock([
        Tx.contractCall("margin-helper", "roll-position", [
          types.principal(token),
          types.principal(collateral),
          types.principal(keyToken),
          types.principal(loanuser),
          'u' + BigInt(expiry),
          'u' + BigInt(expiry_to_roll)
        ], user.address),
      ]);
      return block.receipts[0].result;
    }

    getBalance(token: string, owner: string) {
      return this.chain.callReadOnlyFn(token, "get-balance-fixed", [
        types.principal(owner)
      ], this.deployer.address);
    }   

    getBalanceSFT(token: string, expiry: number, owner: string) {
      return this.chain.callReadOnlyFn(token, "get-balance-fixed", [
        'u' + BigInt(expiry),
        types.principal(owner)
      ], this.deployer.address);
    }        

  }
  export { FLTestAgent1 };
  