

import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

const ONE_8 = 100000000

class Faucet {
    chain: Chain;
    deployer: Account;
  
    constructor(chain: Chain, deployer: Account) {
      this.chain = chain;
      this.deployer = deployer;
    }

    transferSTX(sender: Account, amount: number, recipient: string) {
      let block = this.chain.mineBlock([
        Tx.transferSTX(amount, recipient, sender.address),
      ]);
      return block.receipts[0].result;      
    }

    setUsdaAmount(sender: Account, amount: number) {
      let block = this.chain.mineBlock([
          Tx.contractCall("faucet", "set-usda-amount", [
            types.uint(amount),
          ], sender.address),
        ]);
        return block.receipts[0].result;
    }

    setWbtcAmount(sender: Account, amount: number) {
        let block = this.chain.mineBlock([
            Tx.contractCall("faucet", "set-wbtc-amount", [
              types.uint(amount),
            ], sender.address),
          ]);
          return block.receipts[0].result;
      }
      
    setStxAmount(sender: Account, amount: number) {
      let block = this.chain.mineBlock([
          Tx.contractCall("faucet", "set-stx-amount", [
            types.uint(amount),
          ], sender.address),
        ]);
        return block.receipts[0].result;
    }  

    setWstxAmount(sender: Account, amount: number) {
      let block = this.chain.mineBlock([
          Tx.contractCall("faucet", "set-wstx-amount", [
            types.uint(amount),
          ], sender.address),
        ]);
        return block.receipts[0].result;
    }

    setAlexAmount(sender: Account, amount: number) {
      let block = this.chain.mineBlock([
          Tx.contractCall("faucet", "set-alex-amount", [
            types.uint(amount),
          ], sender.address),
        ]);
        return block.receipts[0].result;
    }      

    setMaxUse(sender: Account, amount: number) {
      let block = this.chain.mineBlock([
          Tx.contractCall("faucet", "set-max-use", [
            types.uint(amount),
          ], sender.address),
        ]);
        return block.receipts[0].result;
    }         
    
    getUsdaAmount() {
        return this.chain.callReadOnlyFn("faucet", "get-usda-amount", [
        ], this.deployer.address);
    }

    getWbtcAmount() {
        return this.chain.callReadOnlyFn("faucet", "get-wbtc-amount", [
        ], this.deployer.address);
    }
    
    getStxAmount() {
        return this.chain.callReadOnlyFn("faucet", "get-stx-amount", [
        ], this.deployer.address);
    }   
    
    getWstxAmount() {
      return this.chain.callReadOnlyFn("faucet", "get-wstx-amount", [
      ], this.deployer.address);
    }
    
    getAlexAmount() {
      return this.chain.callReadOnlyFn("faucet", "get-alex-amount", [
      ], this.deployer.address);
    }     

    getMaxUse() {
      return this.chain.callReadOnlyFn("faucet", "get-max-use", [
      ], this.deployer.address);
    }   
    
    getUserUse(recipient: string) {
      return this.chain.callReadOnlyFn("faucet", "get-user-use", [
        types.principal(recipient)
      ], this.deployer.address);
    }       
    
    getSomeTokens(sender: Account, recipient: string) {
        let block = this.chain.mineBlock([
            Tx.contractCall("faucet", "get-some-tokens", [
              types.principal(recipient),
            ], sender.address),
          ]);
          return block.receipts[0].result;
    }

    getSomeWstxTokens(sender: Account) {
      let block = this.chain.mineBlock([Tx.contractCall("faucet", "get-some-wstx-tokens", [], sender.address)]);
      return block.receipts[0].result;
    }

    sendMany(sender: Account, recipients: string[]) {
      let block = this.chain.mineBlock([
          Tx.contractCall("faucet", "send-many", [
            types.list(recipients.map(types.principal)),
          ], sender.address),
        ]);
        return block.receipts[0].result;
    }    

    mintAlexMany(sender: Account, recipients: Array<MintAlexManyRecord>) {
      let block = this.chain.mineBlock([
          Tx.contractCall("faucet", "mint-alex-many", [
            types.list(recipients.map((record) => { 
              return types.tuple({ to: types.principal(record.to.address), amount: types.uint(record.amount) });
            }))
          ], sender.address),
        ]);
        return block.receipts[0].result;
    }      
    
    getBalance(token: string, owner: string) {
        return this.chain.callReadOnlyFn(token, "get-balance", [
          types.principal(owner)
        ], this.deployer.address);
    }    

}
export class MintAlexManyRecord {
  constructor(
    readonly to: Account,
    readonly amount: number
  ) {}
}

/**
 * faucet test cases
 * 
 */

Clarinet.test({
    name: "Faucet: set amounts and send some tokens",

    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get("deployer")!;
        let wallet_6 = accounts.get("wallet_6")!;
        let wallet_7 = accounts.get("wallet_7")!;
        let FaucetTest = new Faucet(chain, deployer);
        
        // non contract-owner attempting to set faucet amount throws an error
        let result:any = await FaucetTest.setStxAmount(wallet_6, 10);
        result.expectErr().expectUint(1000);
        result = await FaucetTest.setUsdaAmount(wallet_6, 10);
        result.expectErr().expectUint(1000);
        result = await FaucetTest.setWbtcAmount(wallet_6, 10);
        result.expectErr().expectUint(1000)
        result = await FaucetTest.setWstxAmount(wallet_6, 10);
        result.expectErr().expectUint(1000);
        result = await FaucetTest.setAlexAmount(wallet_6, 10);
        result.expectErr().expectUint(1000)            
        
        // contract-owner setting faucet amount works
        await FaucetTest.setStxAmount(deployer, 100 * ONE_8);
        result = await FaucetTest.getStxAmount(); 
        result.result.expectOk().expectUint(100 * ONE_8);
        await FaucetTest.setUsdaAmount(deployer, 100 * ONE_8);
        result = await FaucetTest.getUsdaAmount(); 
        result.result.expectOk().expectUint(100 * ONE_8);
        await FaucetTest.setWbtcAmount(deployer, 100 * ONE_8);
        result = await FaucetTest.getWbtcAmount(); 
        result.result.expectOk().expectUint(100 * ONE_8); 
        await FaucetTest.setWstxAmount(deployer, 100 * ONE_8);
        result = await FaucetTest.getWstxAmount();
        result.result.expectOk().expectUint(100 * ONE_8);
        await FaucetTest.setAlexAmount(deployer, 100 * ONE_8);
        result = await FaucetTest.getAlexAmount(); 
        result.result.expectOk().expectUint(100 * ONE_8);           
        
        // by default use is capped to once only.
        result = await FaucetTest.getMaxUse();
        result.result.expectOk().expectUint(1);

        // first-time user has no record (yet)
        result = await FaucetTest.getUserUse(wallet_7.address);
        result.result.expectNone();

        result = await FaucetTest.getBalance('token-usda', wallet_7.address);
        result.result.expectOk().expectUint(0);
        result = await FaucetTest.getBalance('token-wbtc', wallet_7.address);
        result.result.expectOk().expectUint(0);  
        
        // first-time user using faucet works
        result = await FaucetTest.getSomeTokens(deployer, wallet_7.address);
        result.expectOk().expectBool(true);
        result = await FaucetTest.getBalance('token-usda', wallet_7.address);
        result.result.expectOk().expectUint(100 * ONE_8);
        result = await FaucetTest.getBalance('token-wbtc', wallet_7.address);
        result.result.expectOk().expectUint(100 * ONE_8);          
        result = await FaucetTest.getBalance('token-t-alex', wallet_7.address);
        result.result.expectOk().expectUint(100 * ONE_8);  
        
        // getSomeWstxTokens called by the user mints token-wstx
        result = await FaucetTest.getSomeWstxTokens(wallet_7);
        result.expectOk();
        result = await FaucetTest.getBalance('token-wstx', wallet_7.address);
        result.result.expectOk().expectUint(100 * ONE_8);
        
        // non contract-owner attempting to call get-some-tokens throws an error.
        result = await FaucetTest.getSomeTokens(wallet_6, wallet_7.address);
        result.expectErr().expectUint(1000);        

        // using more than max-use throws an error
        result = await FaucetTest.getSomeTokens(deployer, wallet_7.address);
        result.expectErr().expectUint(9000);

        // non contract-owner attempting to set max-use throws an error
        result = await FaucetTest.setMaxUse(wallet_6, 2);
        result.expectErr().expectUint(1000);
        result = await FaucetTest.setMaxUse(deployer, 2);
        result.expectOk().expectBool(true);
        result = await FaucetTest.getMaxUse();
        result.result.expectOk().expectUint(2);

        // with a higher value of max-use, users can get more tokens
        result = await FaucetTest.getUserUse(wallet_7.address);
        result.result.expectSome().expectUint(1);
        result = await FaucetTest.getSomeTokens(deployer, wallet_7.address);
        result.expectOk().expectBool(true);
        result = await FaucetTest.getBalance('token-usda', wallet_7.address);
        result.result.expectOk().expectUint(200 * ONE_8);
        result = await FaucetTest.getBalance('token-wbtc', wallet_7.address);
        result.result.expectOk().expectUint(200 * ONE_8);   
        result = await FaucetTest.getBalance('token-t-alex', wallet_7.address);
        result.result.expectOk().expectUint(200 * ONE_8);        

        // using more than max-use throws an error
        result = await FaucetTest.getSomeTokens(deployer, wallet_7.address);
        result.expectErr().expectUint(9000);       
        
        // non contract-owner calling send-many will throw an error
        result = await FaucetTest.sendMany(wallet_6, [wallet_6.address, wallet_7.address]);
        result.expectErr().expectUint(1000);

        // contract-owner calling send-many works, but wallet_7 exceeded max use, so throwing error
        result = await FaucetTest.sendMany(deployer, [wallet_6.address, wallet_7.address]);
        result.expectErr().expectUint(9000);
        result = await FaucetTest.getUserUse(wallet_7.address);
        result.result.expectSome().expectUint(2);

        result = await FaucetTest.setMaxUse(deployer, 3);
        result.expectOk().expectBool(true);
        result = await FaucetTest.getMaxUse();
        result.result.expectOk().expectUint(3);

        // now that max-use === 3, this succeeds.
        result = await FaucetTest.sendMany(deployer, [wallet_6.address, wallet_7.address]);
        result.expectOk().expectBool(true);
        result = await FaucetTest.getBalance('token-usda', wallet_6.address);
        result.result.expectOk().expectUint(100 * ONE_8);
        result = await FaucetTest.getBalance('token-wbtc', wallet_6.address);
        result.result.expectOk().expectUint(100 * ONE_8);   
        result = await FaucetTest.getBalance('token-t-alex', wallet_6.address);
        result.result.expectOk().expectUint(100 * ONE_8);    
        result = await FaucetTest.getBalance('token-usda', wallet_7.address);
        result.result.expectOk().expectUint(300 * ONE_8);
        result = await FaucetTest.getBalance('token-wbtc', wallet_7.address);
        result.result.expectOk().expectUint(300 * ONE_8);   
        result = await FaucetTest.getBalance('token-t-alex', wallet_7.address);
        result.result.expectOk().expectUint(300 * ONE_8);

        // testing mint-alex-many
        const recipients: Array<Account> = [ accounts.get("wallet_6")!, accounts.get("wallet_7")! ];
        const amounts: Array<number> = [100 * ONE_8, 200 * ONE_8];

        const mintAlexManyRecords: MintAlexManyRecord[] = [];

        recipients.forEach((recipient, recipientIdx) => {
          let record = new MintAlexManyRecord(
            recipient,
            amounts[recipientIdx]
          );
          mintAlexManyRecords.push(record);
        });
        
        // non contract-owner calling mint-alex-many throws an error.
        result = await FaucetTest.mintAlexMany(wallet_6, mintAlexManyRecords);
        result.expectErr().expectUint(1000);

        result = await FaucetTest.mintAlexMany(deployer, mintAlexManyRecords);
        result.expectOk().expectBool(true);
        result = await FaucetTest.getBalance('token-t-alex', wallet_6.address);
        result.result.expectOk().expectUint(200 * ONE_8);
        result = await FaucetTest.getBalance('token-t-alex', wallet_7.address);
        result.result.expectOk().expectUint(500 * ONE_8);        
    },    
});
