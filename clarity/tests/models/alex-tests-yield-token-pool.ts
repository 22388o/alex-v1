import {
    Account,
    Chain,
    Clarinet,
    Tx,
    types,
  } from "https://deno.land/x/clarinet@v0.14.0/index.ts";
  
  class YTPTestAgent1 {
    chain: Chain;
    deployer: Account;
  
    constructor(chain: Chain, deployer: Account) {
      this.chain = chain;
      this.deployer = deployer;
    }
    
    getT(expiry: number, listed: number) {
      return this.chain.callReadOnlyFn("yield-token-pool", "get-t", [
        'u' + BigInt(expiry),
        'u' + BigInt(listed)
      ], this.deployer.address);
    }

    getYield(expiry: number, aytoken: string) {
        return this.chain.callReadOnlyFn("yield-token-pool", "get-yield", [
          'u' + BigInt(expiry),
          types.principal(aytoken)
        ], this.deployer.address);
      }

    getPrice(expiry: number, aytoken: string) {
        return this.chain.callReadOnlyFn("yield-token-pool", "get-price", [
          'u' + BigInt(expiry),
          types.principal(aytoken)
        ], this.deployer.address);
      }

      getPoolDetails(expiry: number, aytoken: string) {
        return this.chain.callReadOnlyFn("yield-token-pool", "get-pool-details", [
          'u' + BigInt(expiry),
          types.principal(aytoken)
        ], this.deployer.address);
      }

    createPool(user: Account, expiry: number, aytoken: string, token: string, pooltoken: string, multiSig: string, dX: number, dY: number) {
      let block = this.chain.mineBlock([
        Tx.contractCall("yield-token-pool", "create-pool", [
          'u' + BigInt(expiry),
          types.principal(aytoken),
          types.principal(token),
          types.principal(pooltoken),
          types.principal(multiSig),
          'u' + BigInt(dX),
          'u' + BigInt(dY)
        ], user.address),
      ]);
      return block.receipts[0].result;
    }
  
    addToPosition(user: Account, expiry: number, aytoken: string, token: string, pooltoken: string, dX: number, dY: number) {
        let block = this.chain.mineBlock([
          Tx.contractCall("yield-token-pool", "add-to-position", [
            'u' + BigInt(expiry),
            types.principal(aytoken),
            types.principal(token),
            types.principal(pooltoken),
            'u' + BigInt(dX),
            types.some('u' + BigInt(dY))
          ], user.address),
        ]);
        return block.receipts[0].result;
      }

      buyAndAddToPosition(user: Account, expiry: number, aytoken: string, token: string, pooltoken: string, dX: number, dY: number) {
        let block = this.chain.mineBlock([
          Tx.contractCall("yield-token-pool", "buy-and-add-to-position", [
            'u' + BigInt(expiry),
          types.principal(aytoken),
            types.principal(token),
            types.principal(pooltoken),
            'u' + BigInt(dX),
            types.some('u' + BigInt(dY))
          ], user.address),
        ]);
        return block.receipts[0].result;
      }    
      
      rollPosition(user: Account, expiry: number, aytoken: string, token: string, pooltoken: string, percent: number, expiry_to_roll: number) {
        let block = this.chain.mineBlock([
          Tx.contractCall("yield-token-pool", "roll-position", [
            'u' + BigInt(expiry),
          types.principal(aytoken),
            types.principal(token),
            types.principal(pooltoken),
            'u' + BigInt(percent),
            'u' + BigInt(expiry_to_roll)
          ], user.address),
        ]);
        return block.receipts[0].result;
      }         
  
      reducePosition(user: Account, expiry: number, aytoken: string, token: string, pooltoken: string, percent: number) {
        let block = this.chain.mineBlock([
          Tx.contractCall("yield-token-pool", "reduce-position", [
            'u' + BigInt(expiry),
            types.principal(aytoken),
            types.principal(token),
            types.principal(pooltoken),
            'u' + BigInt(percent)
          ], user.address),
        ]);
        return block.receipts[0].result;
      }
  
    swapXForY(user: Account, expiry: number, aytoken: string, token: string, dX: number, dy_min: number) {
      let block = this.chain.mineBlock([
        Tx.contractCall("yield-token-pool", "swap-x-for-y", [
          'u' + BigInt(expiry),
          types.principal(aytoken),
          types.principal(token),
          'u' + BigInt(dX),
          types.some('u' + BigInt(dy_min))
        ], user.address),
      ]);
      return block.receipts[0].result;
    }
  
    swapYForX(user: Account, expiry: number, aytoken: string, token: string, dY: number, dx_min: number) {
        let block = this.chain.mineBlock([
          Tx.contractCall("yield-token-pool", "swap-y-for-x", [
            'u' + BigInt(expiry),
          types.principal(aytoken),
            types.principal(token),
            'u' + BigInt(dY),
            types.some('u' + BigInt(dx_min))
          ], user.address),
        ]);
        return block.receipts[0].result;
      }

    getYgivenX(expiry: number, aytoken: string, dx: number) {
      return this.chain.callReadOnlyFn("yield-token-pool", "get-y-given-x", [
       'u' + BigInt(expiry),
        types.principal(aytoken),
        'u' + BigInt(dx)
      ], this.deployer.address);      
    }
    
    getXgivenY(expiry: number, aytoken: string, dy: number) {
      return this.chain.callReadOnlyFn("yield-token-pool", "get-x-given-y", [
       'u' + BigInt(expiry),
        types.principal(aytoken),
        'u' + BigInt(dy)
      ], this.deployer.address);      
    }      
  
    getYgivenPrice(expiry: number, aytoken: string, price: number) {
      return this.chain.callReadOnlyFn("yield-token-pool", "get-y-given-price", [
       'u' + BigInt(expiry),
        types.principal(aytoken),
        'u' + BigInt(price)
      ], this.deployer.address);      
    }
    
    getXgivenPrice(expiry: number, aytoken: string, price: number) {
      return this.chain.callReadOnlyFn("yield-token-pool", "get-x-given-price", [
       'u' + BigInt(expiry),
        types.principal(aytoken),
        'u' + BigInt(price)
      ], this.deployer.address);      
    }

    getYgivenYield(expiry: number, aytoken: string, yied: number) {
      return this.chain.callReadOnlyFn("yield-token-pool", "get-y-given-yield", [
       'u' + BigInt(expiry),
        types.principal(aytoken),
        'u' + BigInt(yied)
      ], this.deployer.address);      
    }
    
    getXgivenYield(expiry: number, aytoken: string, yied: number) {
      return this.chain.callReadOnlyFn("yield-token-pool", "get-x-given-yield", [
       'u' + BigInt(expiry),
        types.principal(aytoken),
        'u' + BigInt(yied)
      ], this.deployer.address);      
    }    
  
    getFeetoAddress(user: Account, expiry: number, aytoken: string) {
      let block = this.chain.mineBlock([
        Tx.contractCall("yield-token-pool", "get-fee-to-address", [
          'u' + BigInt(expiry),
          types.principal(aytoken)
        ], user.address),
      ]);
      return block.receipts[0].result;
    }
  
    collectFees(user: Account, expiry: number, aytoken: string, token: string) {
      let block = this.chain.mineBlock([
        Tx.contractCall("yield-token-pool", "collect-fees", [
            'u' + BigInt(expiry),
          types.principal(aytoken),
            types.principal(token),
        ], user.address),
      ]);
      return block.receipts[0].result;
    }

    setFeeRateToken(user: Account, expiry: number, aytoken: string, feerate:number) {
      let block = this.chain.mineBlock([
        Tx.contractCall("yield-token-pool", "set-fee-rate-token", [
          'u' + BigInt(expiry),
          types.principal(aytoken),
          'u' + BigInt(feerate)
        ], user.address),
      ]);
      return block.receipts[0].result;
    }
  
    setFeeRateayToken(user: Account, expiry: number, aytoken: string, feerate:number) {
      let block = this.chain.mineBlock([
        Tx.contractCall("yield-token-pool", "set-fee-rate-aytoken", [
          'u' + BigInt(expiry),
          types.principal(aytoken),
          'u' + BigInt(feerate)
        ], user.address),
      ]);
      return block.receipts[0].result;
    }

    getFeeRateToken(user: Account, expiry: number, aytoken: string) {
      let block = this.chain.mineBlock([
        Tx.contractCall("yield-token-pool", "get-fee-rate-token", [
          'u' + BigInt(expiry),
          types.principal(aytoken)
        ], user.address),
      ]);
      return block.receipts[0].result;
    }

    getFeeRateayToken(user: Account, expiry: number, aytoken: string) {
      let block = this.chain.mineBlock([
        Tx.contractCall("yield-token-pool", "get-fee-rate-aytoken", [
          'u' + BigInt(expiry),
          types.principal(aytoken)
        ], user.address),
      ]);
      return block.receipts[0].result;
    }

    setFeeRebate(user: Account, expiry: number, aytoken: string, rebate : number) {
      let block = this.chain.mineBlock([
        Tx.contractCall("yield-token-pool", "set-fee-rebate", [
          'u' + BigInt(expiry),
          types.principal(aytoken),
          'u' + BigInt(rebate)
        ], user.address),
      ]);
      return block.receipts[0].result;
    }

    getFeeRebate(expiry: number, aytoken: string) {
      return this.chain.callReadOnlyFn("yield-token-pool", "get-fee-rebate", [
       'u' + BigInt(expiry),
        types.principal(aytoken),
      ], this.deployer.address);
    }

    setOracleEnabled(user: Account, expiry: number, aytoken: string) {
      let block = this.chain.mineBlock([
        Tx.contractCall("yield-token-pool", "set-oracle-enabled", [
          'u' + BigInt(expiry),
          types.principal(aytoken),
        ], user.address),
      ]);
      return block.receipts[0].result;
    }      

    setOracleAverage(user: Account, expiry: number, aytoken: string, average: number) {
      let block = this.chain.mineBlock([
        Tx.contractCall("yield-token-pool", "set-oracle-average", [
          'u' + BigInt(expiry),
          types.principal(aytoken),
          'u' + BigInt(average),
        ], user.address),
      ]);
      return block.receipts[0].result;
    }    


  
  }
  
  export { YTPTestAgent1 };