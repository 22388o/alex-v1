import {
    Account,
    Chain,
    Clarinet,
    Tx,
    types,
  } from "https://deno.land/x/clarinet@v0.14.0/index.ts";
  
  class LBPTestAgent {
    chain: Chain;
    deployer: Account;
  
    constructor(chain: Chain, deployer: Account) {
      this.chain = chain;
      this.deployer = deployer;
    }
  
    getPoolDetails(tokenX: string, tokenY: string, expiry: number) {
      return this.chain.callReadOnlyFn("liquidity-bootstrapping-pool", "get-pool-details", [
        types.principal(tokenX),
        types.principal(tokenY),
        'u' + BigInt(expiry),
      ], this.deployer.address);
    }
  
    createPool(user: Account, tokenX: string, tokenY: string, weightX1: number, weightX2: number, expiry :number, pooltoken: string, multisig: string, price_x_min: number, price_x_max: number, dX: number, dY: number) {
      let block = this.chain.mineBlock([
        Tx.contractCall("liquidity-bootstrapping-pool", "create-pool", [
          types.principal(tokenX),
          types.principal(tokenY),
          'u' + BigInt(weightX1),
          'u' + BigInt(weightX2),
          'u' + BigInt(expiry),
          types.principal(pooltoken),
          types.principal(multisig),
          'u' + BigInt(price_x_min),
          'u' + BigInt(price_x_max),
          'u' + BigInt(dX),
          'u' + BigInt(dY),
        ], user.address),
      ]);
      return block.receipts[0].result;
    }

    setPriceRange(user: Account, tokenX: string, tokenY: string, expiry :number, min_price: number, max_price: number) {
      let block = this.chain.mineBlock([
        Tx.contractCall("liquidity-bootstrapping-pool", "set-price-range", [
          types.principal(tokenX),
          types.principal(tokenY),
          'u' + BigInt(expiry),
          'u' + BigInt(min_price),
          'u' + BigInt(max_price)
        ], user.address),
      ]);
      return block.receipts[0].result;
    }

    getPriceRange(tokenX: string, tokenY: string, expiry: number) {
      return this.chain.callReadOnlyFn("liquidity-bootstrapping-pool", "get-price-range", [
        types.principal(tokenX),
        types.principal(tokenY),
        'u' + BigInt(expiry)
      ], this.deployer.address);
    }     

    getWeightX(tokenX: string, tokenY: string, expiry: number) {
      return this.chain.callReadOnlyFn("liquidity-bootstrapping-pool", "get-weight-x", [
        types.principal(tokenX),
        types.principal(tokenY),
        'u' + BigInt(expiry)
      ], this.deployer.address);
    }      

    setPoolMultisig(user: Account, tokenX: string, tokenY: string, expiry :number, new_multisig: string) {
      let block = this.chain.mineBlock([
        Tx.contractCall("liquidity-bootstrapping-pool", "set-pool-multisig", [
          types.principal(tokenX),
          types.principal(tokenY),
          'u' + BigInt(expiry),
          types.principal(new_multisig)
        ], user.address),
      ]);
      return block.receipts[0].result;
    }    
  
    reducePosition(user: Account, tokenX: string, tokenY: string, expiry :number, pooltoken: string, percentage: number) {
      let block = this.chain.mineBlock([
        Tx.contractCall("liquidity-bootstrapping-pool", "reduce-position", [
          types.principal(tokenX),
          types.principal(tokenY),
          'u' + BigInt(expiry),
          types.principal(pooltoken),
          'u' + BigInt(percentage),
        ], user.address),
      ]);
      return block.receipts[0].result;
    }
  
    swapYForX(user: Account, tokenX: string, tokenY: string, expiry: number, dy: number, min_dx: number) {
      let block = this.chain.mineBlock([
        Tx.contractCall("liquidity-bootstrapping-pool", "swap-y-for-x", [
          types.principal(tokenX),
          types.principal(tokenY),
          'u' + BigInt(expiry),
          'u' + BigInt(dy),
          types.some('u' + BigInt(min_dx))
        ], user.address),
      ]);
      return block.receipts[0].result;
    }

    getXgivenY(tokenX: string, tokenY: string, expiry: number, dy: number) {
      return this.chain.callReadOnlyFn("liquidity-bootstrapping-pool", "get-x-given-y", [
        types.principal(tokenX),
        types.principal(tokenY),
        'u' + BigInt(expiry),
        'u' + BigInt(dy)
      ], this.deployer.address);
    } 
    
    getYgivenX(tokenX: string, tokenY: string, expiry: number, dx: number) {
      return this.chain.callReadOnlyFn("liquidity-bootstrapping-pool", "get-y-given-x", [
        types.principal(tokenX),
        types.principal(tokenY),
        'u' + BigInt(expiry),
        'u' + BigInt(dx)
      ], this.deployer.address);
    }
  
  }
  
  export { LBPTestAgent };