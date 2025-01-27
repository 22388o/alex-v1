

import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

import { YTPTestAgent1, } from './models/alex-tests-yield-token-pool.ts';

import { MS_YTP_YIELD_WBTC } from './models/alex-tests-multisigs.ts';

import { USDAToken, WBTCToken, YIELD_WBTC, YTP_YIELD_WBTC } from './models/alex-tests-tokens.ts';


// Deployer Address Constants 
const wbtcAddress = "ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.token-wbtc"
const yieldwbtcAddress = "ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.yield-wbtc"
const ytpyieldwbtcAddress = "ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.ytp-yield-wbtc"
const multisigytpyieldwbtc = "ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.multisig-ytp-yield-wbtc"
const wrongPooltokenAddress = "ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.ytp-yield-usda"

const ONE_8 = 100000000
const expiry = 59761 * ONE_8
const wrongExpiry = 70000 * ONE_8
const anotherExpiry = 80875 * ONE_8

/**
 * Yield Token Pool Test Cases  
 * 
 */

Clarinet.test({
    name: "yield-token-pool : pool creation, adding values and reducing values",

    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get("deployer")!;
        let wallet_1 = accounts.get("wallet_1")!;
        let YTPTest = new YTPTestAgent1(chain, deployer);
        let yieldWBTC = new YIELD_WBTC(chain, deployer);
        let wbtcToken = new WBTCToken(chain, deployer);

        // Deployer minting initial tokens
        let result = wbtcToken.mintFixed(deployer, deployer.address, 100000 * ONE_8);
        result.expectOk();
        result = wbtcToken.mintFixed(deployer, wallet_1.address, 100000 * ONE_8);
        result.expectOk(); 
        result = yieldWBTC.mintFixed(deployer, expiry, 10000 * ONE_8, deployer.address);
        result.expectOk().expectBool(true);

        //Deployer creating a pool, initial tokens injected to the pool
        result = YTPTest.createPool(deployer, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, multisigytpyieldwbtc, 1000*ONE_8, 1000*ONE_8);
        result.expectOk().expectTuple();

        const block = chain.mineBlock(
            [
                Tx.contractCall("alex-vault", "add-approved-token", [types.principal(yieldwbtcAddress)], deployer.address),
                Tx.contractCall("alex-vault", "add-approved-token", [types.principal(wbtcAddress)], deployer.address),
                Tx.contractCall("alex-vault", "add-approved-token", [types.principal(ytpyieldwbtcAddress)], deployer.address),
            ]
        );
        block.receipts.forEach(e => { e.result.expectOk() });

        // Check pool details and print
        let call = await YTPTest.getPoolDetails(expiry, yieldwbtcAddress);
        let position:any = call.result.expectOk().expectTuple();
        position['balance-token'].expectUint(1000*ONE_8);
        position['balance-yield-token'].expectUint(0);
        position['balance-virtual'].expectUint(1000*ONE_8);

        let listed = 100000000;

        //Add extra liquidity
        result = YTPTest.addToPosition(deployer, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, 10*ONE_8, Number.MAX_SAFE_INTEGER);
        position = result.expectOk().expectTuple();
        position['supply'].expectUint(10*ONE_8);
        position['balance-token'].expectUint(10*ONE_8);
        position['balance-yield-token'].expectUint(0);
        position['balance-virtual'].expectUint(10*ONE_8);

        // Check pool details and print
        call = await YTPTest.getPoolDetails(expiry, yieldwbtcAddress);
        position = call.result.expectOk().expectTuple();
        position['total-supply'].expectUint(1010*ONE_8);
        position['balance-token'].expectUint(1010*ONE_8);
        position['balance-yield-token'].expectUint(0);
        position['balance-virtual'].expectUint(1010*ONE_8);        
        
        // Remove all liquidlity
        result = YTPTest.reducePosition(deployer, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, ONE_8);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(1010*ONE_8);
        position['dy'].expectUint(0);
        
        // Check pool details and print
        call = await YTPTest.getPoolDetails(expiry, yieldwbtcAddress);
        position = call.result.expectOk().expectTuple();
        position['total-supply'].expectUint(0);
        position['balance-token'].expectUint(0);
        position['balance-yield-token'].expectUint(0);
        position['balance-virtual'].expectUint(0);          

        // Add back some liquidity
        result = YTPTest.addToPosition(deployer, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, 1000*ONE_8, Number.MAX_SAFE_INTEGER);
        position = result.expectOk().expectTuple();
        position['supply'].expectUint(1000*ONE_8);
        position['balance-token'].expectUint(1000*ONE_8);
        position['balance-yield-token'].expectUint(0);
        position['balance-virtual'].expectUint(1000*ONE_8);     
        
        // check t
        call = chain.callReadOnlyFn("yield-token-pool", "get-t", 
            [types.uint(expiry),
             types.uint(listed)
            ], deployer.address);
        call.result.expectOk().expectUint(28420987)
        
        // zero actual yield-token, so must throw an error
        call = await YTPTest.getYgivenX(expiry, yieldwbtcAddress, 1*ONE_8);
        call.result.expectErr().expectUint(2016)
        
        // zero actual yield-token, so yield must be zero
        call = chain.callReadOnlyFn("yield-token-pool", "get-yield", 
            [types.uint(expiry), types.principal(yieldwbtcAddress)
            ], deployer.address);
        call.result.expectOk().expectUint(5)

        // zero rate environment, so yield-token and token are (almost) at parity.
        call = await YTPTest.getXgivenY(expiry, yieldwbtcAddress, 2*ONE_8);
        call.result.expectOk().expectUint(200076853)

        // sell some yield-token
        result = YTPTest.swapYForX(deployer, expiry, yieldwbtcAddress, wbtcAddress, 2*ONE_8, 0);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(200076853);
        position['dy'].expectUint(2*ONE_8);

        // yield-token now has "actual" balance
        call = chain.callReadOnlyFn("yield-token-pool", "get-pool-details", 
            [types.uint(expiry), types.principal(yieldwbtcAddress)
            ], deployer.address);
        position = call.result.expectOk().expectTuple();
        position['balance-token'].expectUint(99799923147);
        position['balance-yield-token'].expectUint(2*ONE_8);
        position['balance-virtual'].expectUint(1000*ONE_8);         
            
        // now that yield token supply > token supply, yield is positive.
        call = chain.callReadOnlyFn("yield-token-pool", "get-yield", 
            [types.uint(expiry), types.principal(yieldwbtcAddress)
            ], deployer.address);
        call.result.expectOk().expectUint(113775);

        // buy back some yield token
        result = YTPTest.swapXForY(deployer, expiry, yieldwbtcAddress, wbtcAddress, ONE_8, 0);
        position = result.expectOk().expectTuple()
        position['dx'].expectUint(ONE_8);
        position['dy'].expectUint(100115958);        

        // attempt to sell more than max allowed yield token (50% of pool) must throw an error
        result = YTPTest.swapYForX(deployer, expiry, yieldwbtcAddress, wbtcAddress, 501*ONE_8, 0);
        position =result.expectErr().expectUint(4002)

        call = chain.callReadOnlyFn("yield-token-pool", "get-pool-details", 
            [types.uint(expiry), types.principal(yieldwbtcAddress)
            ], deployer.address);
        position = call.result.expectOk().expectTuple();
        position['balance-token'].expectUint(99899923147);
        position['balance-yield-token'].expectUint(99884042);
        position['balance-virtual'].expectUint(1000*ONE_8); 

        // after buying back some yield token, yield decreases.
        call = chain.callReadOnlyFn("yield-token-pool", "get-yield", 
            [types.uint(expiry), types.principal(yieldwbtcAddress)
            ], deployer.address);
        call.result.expectOk().expectUint(56850);

        // we sell close to maximum allowed of yield token
        result = YTPTest.swapYForX(deployer, expiry, yieldwbtcAddress, wbtcAddress, 29*ONE_8, 0);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(2922393213);
        position['dy'].expectUint(29*ONE_8);                      

        // which moves yield substantially into the positive territory.
        call = chain.callReadOnlyFn("yield-token-pool", "get-yield", 
            [types.uint(expiry), types.principal(yieldwbtcAddress)
            ], deployer.address);
        call.result.expectOk().expectUint(1726979);   
        
        // simulate to be on half way to expiry
        chain.mineEmptyBlockUntil(Math.floor(expiry / ONE_8 / 2) + 1);
        
        // check t == 0.5
        call = chain.callReadOnlyFn("yield-token-pool", "get-t", 
            [types.uint(expiry),
             types.uint(listed)
            ], deployer.address);
        call.result.expectOk().expectUint(14212396)

        // about half way, so yield should halve, just like zero coupon bond gets closer to par
        call = chain.callReadOnlyFn("yield-token-pool", "get-yield", 
            [types.uint(expiry), types.principal(yieldwbtcAddress)
            ], deployer.address);
        call.result.expectOk().expectUint(859970);
        
        // sell some (a lot of) yield-token
        result = YTPTest.swapYForX(deployer, expiry, yieldwbtcAddress, wbtcAddress, 100*ONE_8, 0);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(10057118339);
        position['dy'].expectUint(100*ONE_8);       
            
        // and see how it pushes the yield pretty high
        call = chain.callReadOnlyFn("yield-token-pool", "get-yield", 
            [types.uint(expiry), types.principal(yieldwbtcAddress)
            ], deployer.address);
        call.result.expectOk().expectUint(3799584);   

        //buy back some yield token
        result = YTPTest.swapXForY(deployer, expiry, yieldwbtcAddress, wbtcAddress, 100*ONE_8, 0);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(100*ONE_8);
        position['dy'].expectUint(10230425635);

        call = await YTPTest.getPoolDetails(expiry, yieldwbtcAddress);
        position = call.result.expectOk().expectTuple();
        position['total-supply'].expectUint(100000000000);
        
        call = chain.callReadOnlyFn(ytpyieldwbtcAddress, "get-balance-fixed", 
            [types.uint(expiry), types.principal(deployer.address)
            ], deployer.address);
        call.result.expectOk().expectUint(100000000000);   

        // Remove some liquidlity
        result = YTPTest.reducePosition(deployer, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, 0.5*ONE_8);
        position = result.expectOk().expectTuple();
        position['dx'].expectUint(48460205797);
        position['dy'].expectUint(1384729042);  
        
        call = await YTPTest.getPoolDetails(expiry, yieldwbtcAddress);
        position = call.result.expectOk().expectTuple();
        position['total-supply'].expectUint(50000000000);
        
        call = chain.callReadOnlyFn(ytpyieldwbtcAddress, "get-balance-fixed", 
            [types.uint(expiry), types.principal(deployer.address)
            ], deployer.address);
        call.result.expectOk().expectUint(50000000000);   
        
        call = chain.callReadOnlyFn(yieldwbtcAddress, "get-balance-fixed", 
            [types.uint(expiry), types.principal(deployer.address)
            ], deployer.address);
        call.result.expectOk().expectUint(998615270635);        

        // Add back some liquidity
        result = YTPTest.addToPosition(deployer, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, 1000*ONE_8, Number.MAX_SAFE_INTEGER);
        position = result.expectOk().expectTuple();
        position['supply'].expectUint(103177440000);
        position['balance-token'].expectUint(1000*ONE_8);
        position['balance-yield-token'].expectUint(2857455954);
        position['balance-virtual'].expectUint(103177440333);    
        
        call = await YTPTest.getPoolDetails(expiry, yieldwbtcAddress);
        position = call.result.expectOk().expectTuple();
        position['total-supply'].expectUint(50000000000 + 103177440000);
        
        call = chain.callReadOnlyFn(ytpyieldwbtcAddress, "get-balance-fixed", 
            [types.uint(expiry), types.principal(deployer.address)
            ], deployer.address);
        call.result.expectOk().expectUint(50000000000 + 103177440000);

        // simulate to right before expiry
        chain.mineEmptyBlockUntil((expiry / ONE_8) - 1);  
        
        // confirm t is almost zero.
        call = chain.callReadOnlyFn("yield-token-pool", "get-t", 
            [types.uint(expiry),
             types.uint(listed)
            ], deployer.address);
        call.result.expectOk().expectUint(475)

        // nearly maturity, so yield should be close to zero.
        call = chain.callReadOnlyFn("yield-token-pool", "get-yield", 
            [types.uint(expiry), types.principal(yieldwbtcAddress)
            ], deployer.address);
        call.result.expectOk().expectUint(33);    
        
        // buy some yield-token
        result = YTPTest.swapXForY(deployer, expiry, yieldwbtcAddress, wbtcAddress, 19*ONE_8, 0);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(19*ONE_8);
        position['dy'].expectUint(1900033732);

        // on expiry, the prices are back to parity.
        call = chain.callReadOnlyFn("yield-token-pool", "get-price", 
            [types.uint(expiry), types.principal(yieldwbtcAddress)
            ], deployer.address);
        call.result.expectOk().expectUint(100000005); // par       
        
        // simulate to after expiry
        chain.mineEmptyBlockUntil((expiry / ONE_8) + 1);

        // on expiry, the prices are back to parity.
        call = chain.callReadOnlyFn("yield-token-pool", "get-price", 
            [types.uint(expiry), types.principal(yieldwbtcAddress)
            ], deployer.address);
        call.result.expectOk().expectUint(100000005); // par    
        
        // Check pool details and print
        call = await YTPTest.getPoolDetails(expiry, yieldwbtcAddress);
        position = call.result.expectOk().expectTuple();
        position['total-supply'].expectUint(153177440000);
        position['balance-token'].expectUint(150360205798);
        position['balance-yield-token'].expectUint(2342151587);
        position['balance-virtual'].expectUint(153177440172);          
        
        call = chain.callReadOnlyFn(ytpyieldwbtcAddress, "get-balance-fixed", 
            [types.uint(expiry), types.principal(deployer.address)
            ], deployer.address);
        call.result.expectOk().expectUint(153177440000);        

        // Remove all liquidlity
        result = YTPTest.reducePosition(deployer, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, ONE_8);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(150360205798);
        position['dy'].expectUint(2342151490);        

        // Check pool details and print
        call = await YTPTest.getPoolDetails(expiry, yieldwbtcAddress);
        position = call.result.expectOk().expectTuple();
        position['total-supply'].expectUint(0);
        position['balance-token'].expectUint(0);
        position['balance-yield-token'].expectUint(97);
        position['balance-virtual'].expectUint(0);    
    },    
});

Clarinet.test({
    name: "yield-token-pool : trait check",

    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get("deployer")!;
        let wallet_1 = accounts.get("wallet_1")!;
        let YTPTest = new YTPTestAgent1(chain, deployer);
        let wbtcToken = new WBTCToken(chain, deployer);

        // Deployer minting initial tokens
        let result = wbtcToken.mintFixed(deployer, deployer.address, 100000 * ONE_8);
        result.expectOk();
        result = wbtcToken.mintFixed(deployer, wallet_1.address, 100000 * ONE_8);
        result.expectOk();

        //if non-deployer attempts to create a pool, throw an error.
        result = YTPTest.createPool(wallet_1, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, multisigytpyieldwbtc, 1000*ONE_8, 1000*ONE_8);
        result.expectErr().expectUint(1000);

        const block = chain.mineBlock(
            [
                Tx.contractCall("alex-vault", "add-approved-token", [types.principal(yieldwbtcAddress)], deployer.address),
                Tx.contractCall("alex-vault", "add-approved-token", [types.principal(wbtcAddress)], deployer.address),
                Tx.contractCall("alex-vault", "add-approved-token", [types.principal(ytpyieldwbtcAddress)], deployer.address),
            ]
        );
        block.receipts.forEach(e => { e.result.expectOk() });

        //Deployer creating a pool, initial tokens injected to the pool
        result = YTPTest.createPool(deployer, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, multisigytpyieldwbtc, 1000*ONE_8, 1000*ONE_8);
        result.expectOk().expectTuple();        

        //if wrong pool token is supplied, then throw an error
        result = YTPTest.addToPosition(deployer, expiry, yieldwbtcAddress, wbtcAddress, wrongPooltokenAddress, 10*ONE_8, Number.MAX_SAFE_INTEGER);
        result.expectErr().expectUint(2026);

        // non-deployer can add liquidity
        result = YTPTest.addToPosition(wallet_1, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, 10*ONE_8, Number.MAX_SAFE_INTEGER);
        result.expectOk();
        
        //if wrong pool token is supplied, throw an error
        result = YTPTest.reducePosition(deployer, expiry, yieldwbtcAddress, wbtcAddress, wrongPooltokenAddress, ONE_8);
        result.expectErr().expectUint(2026);        
        
    }
})

Clarinet.test({
    name: "yield-token-pool : get-x-given-price/yield, get-y-given-price/yield",

    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get("deployer")!;
        let wallet_1 = accounts.get("wallet_1")!;
        let YTPTest = new YTPTestAgent1(chain, deployer);
        let yieldWBTC = new YIELD_WBTC(chain, deployer);
        let wbtcToken = new WBTCToken(chain, deployer);

        // Deployer minting initial tokens
        let result = wbtcToken.mintFixed(deployer, deployer.address, 100000 * ONE_8);
        result.expectOk();
        result = wbtcToken.mintFixed(deployer, wallet_1.address, 100000 * ONE_8);
        result.expectOk(); 
        result = yieldWBTC.mintFixed(deployer, expiry, 10000 * ONE_8, deployer.address);
        result.expectOk().expectBool(true);        
        
        //Deployer creating a pool, initial tokens injected to the pool
        result = YTPTest.createPool(deployer, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, multisigytpyieldwbtc, 1000*ONE_8, 1000*ONE_8);
        result.expectOk().expectTuple();

        const block = chain.mineBlock(
            [
                Tx.contractCall("alex-vault", "add-approved-token", [types.principal(yieldwbtcAddress)], deployer.address),
                Tx.contractCall("alex-vault", "add-approved-token", [types.principal(wbtcAddress)], deployer.address),
                Tx.contractCall("alex-vault", "add-approved-token", [types.principal(ytpyieldwbtcAddress)], deployer.address),
            ]
        );
        block.receipts.forEach(e => { e.result.expectOk() });        

        // Check pool details and print
        let call = await YTPTest.getPoolDetails(expiry, yieldwbtcAddress);
        let position:any = call.result.expectOk().expectTuple();
        position['balance-token'].expectUint(1000*ONE_8);
        position['balance-yield-token'].expectUint(0);
        position['balance-virtual'].expectUint(1000*ONE_8);
        position['listed'].expectUint(400000000);

        call = await YTPTest.getYield(expiry, yieldwbtcAddress);
        call.result.expectOk().expectUint(5);
        
        // if current yield < target yield, then supply of yield-token needs to increase
        call = await YTPTest.getXgivenYield(expiry, yieldwbtcAddress, 0.1*ONE_8);
        call.result.expectErr().expectUint(2002);
        call = await YTPTest.getYgivenYield(expiry, yieldwbtcAddress, 0.1*ONE_8);          
        call.result.expectOk().expectUint(16280769000);

        // confirm t is almost zero.
        call = chain.callReadOnlyFn("yield-token-pool", "get-t", 
            [types.uint(expiry),
             types.uint(400000000)
            ], deployer.address);
        call.result.expectOk().expectUint(28422820)

        result = YTPTest.swapYForX(deployer, expiry, yieldwbtcAddress, wbtcAddress, 16280769000, 0);
        position = result.expectOk().expectTuple();
        position['dy'].expectUint(16280769000);
        position['dx'].expectUint(17073044068);

        call = await YTPTest.getYield(expiry, yieldwbtcAddress);
        call.result.expectOk().expectUint(10084829);

        // now let's try to reduce the yield
        call = await YTPTest.getYgivenYield(expiry, yieldwbtcAddress, 0.05*ONE_8);                  
        call.result.expectErr().expectUint(2002);
        call = await YTPTest.getXgivenYield(expiry, yieldwbtcAddress, 0.05*ONE_8);        
        call.result.expectOk().expectUint(7878372619);      
        
        result = YTPTest.swapXForY(deployer, expiry, yieldwbtcAddress, wbtcAddress, 7878372619, 0);
        position = result.expectOk().expectTuple();
        position['dy'].expectUint(8469820972);
        position['dx'].expectUint(7878372619);

        call = await YTPTest.getYield(expiry, yieldwbtcAddress);
        call.result.expectOk().expectUint(4999915);

    },    
});

Clarinet.test({
    name: "yield-token-pool : fee setting using multisig ",

    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get("deployer")!;
        let wallet_1 = accounts.get("wallet_1")!;
        let wallet_2 = accounts.get("wallet_2")!;
        let contractOwner = accounts.get("deployer")!;
        let YTPTest = new YTPTestAgent1(chain, deployer);
        let MultiSigTest = new MS_YTP_YIELD_WBTC(chain, deployer);
        let ytpPoolToken = new YTP_YIELD_WBTC(chain, deployer);
        let usdaToken = new USDAToken(chain, deployer);
        let wbtcToken = new WBTCToken(chain, deployer);
        let yieldWBTC = new YIELD_WBTC(chain, deployer);

        // Deployer minting initial tokens
        let result = wbtcToken.mintFixed(deployer, deployer.address, 100000 * ONE_8);
        result.expectOk();
        result = wbtcToken.mintFixed(deployer, wallet_1.address, 100000 * ONE_8);
        result.expectOk(); 
        result = wbtcToken.mintFixed(deployer, wallet_2.address, 10 * ONE_8);
        result.expectOk(); 
        result = yieldWBTC.mintFixed(deployer, expiry, 10000 * ONE_8, deployer.address);
        result.expectOk().expectBool(true);
        result = usdaToken.mintFixed(deployer, deployer.address, 100000000 * ONE_8);
        result.expectOk();
        result = usdaToken.mintFixed(deployer, wallet_1.address, 200000 * ONE_8);
        result.expectOk();   
        result = usdaToken.mintFixed(deployer, wallet_2.address, 1000 * ONE_8);
        result.expectOk();      

        const feeRateX = 0.1*ONE_8; // 10%
        const feeRateY = 0.1*ONE_8;
        const feeRebate = 0.5*ONE_8;

        //Deployer creating a pool, initial tokens injected to the pool
        result = YTPTest.createPool(deployer, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, multisigytpyieldwbtc, 1000*ONE_8, 1000*ONE_8);
        result.expectOk().expectTuple();

        const block = chain.mineBlock(
            [
                Tx.contractCall("alex-vault", "add-approved-token", [types.principal(yieldwbtcAddress)], deployer.address),
                Tx.contractCall("alex-vault", "add-approved-token", [types.principal(wbtcAddress)], deployer.address),
                Tx.contractCall("alex-vault", "add-approved-token", [types.principal(ytpyieldwbtcAddress)], deployer.address),
            ]
        );
        block.receipts.forEach(e => { e.result.expectOk() });        

        // Check pool details and print
        let call = await YTPTest.getPoolDetails(expiry, yieldwbtcAddress);
        let position:any = call.result.expectOk().expectTuple();
        position['total-supply'].expectUint(1000*ONE_8);
        position['balance-token'].expectUint(1000*ONE_8);
        position['balance-yield-token'].expectUint(0);
        position['balance-virtual'].expectUint(1000*ONE_8);

        result = YTPTest.addToPosition(wallet_2, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, 10*ONE_8, Number.MAX_SAFE_INTEGER);
        position = result.expectOk().expectTuple();
        position['supply'].expectUint(10*ONE_8);
        position['balance-token'].expectUint(10*ONE_8);
        position['balance-yield-token'].expectUint(0);
        position['balance-virtual'].expectUint(10*ONE_8);   

        call = chain.callReadOnlyFn(yieldwbtcAddress, "get-balance-fixed", 
            [types.uint(expiry), types.principal(deployer.address)
            ], deployer.address);
        call.result.expectOk().expectUint(1000000000000);    
        call = chain.callReadOnlyFn(wbtcAddress, "get-balance-fixed", 
            [types.principal(deployer.address)
            ], deployer.address);
        call.result.expectOk().expectUint(9900000000000); 
        call = chain.callReadOnlyFn(wbtcAddress, "get-balance-fixed", 
            [types.principal(deployer.address + ".alex-vault")
            ], deployer.address);
        call.result.expectOk().expectUint(101000000000);           

        result = YTPTest.swapYForX(deployer, expiry, yieldwbtcAddress, wbtcAddress, ONE_8, 0);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(99989839);
        position['dy'].expectUint(ONE_8);

        call = await YTPTest.getPoolDetails(expiry, yieldwbtcAddress);
        position = call.result.expectOk().expectTuple();
        position['balance-token'].expectUint(100900010161);
        position['balance-yield-token'].expectUint(ONE_8);
        position['balance-virtual'].expectUint(1010*ONE_8);

        call = await ytpPoolToken.balanceOf(expiry, deployer.address);
        call.result.expectOk().expectUint(1000*ONE_8);    // u100000000000

        call = await ytpPoolToken.balanceOf(expiry, wallet_2.address);
        call.result.expectOk().expectUint(10*ONE_8);

        // Fee rate Setting Proposal of Multisig
        result = MultiSigTest.propose(expiry, 1000, " Fee Rate Setting to 10%", " https://docs.alexgo.io", feeRateX, feeRateY)
        result.expectOk().expectUint(1) // First Proposal
    
        // Block 1000 mining
        chain.mineEmptyBlock(1000);

        // Deployer has 99 % of pool token
        let ROresult:any = ytpPoolToken.balanceOf(expiry, deployer.address);
        ROresult.result.expectOk().expectUint(1000*ONE_8);
        
        // Wallet_2 votes his 90% asset
        result = MultiSigTest.voteFor(wallet_2, ytpyieldwbtcAddress, 1, 1000000000 * 9 / 10 )
        result.expectOk().expectUint(900000000)

        // 90 % of existing tokens are voted for the proposal
        result = MultiSigTest.voteFor(deployer, ytpyieldwbtcAddress, 1, 100000000000 * 9 / 10 )
        result.expectOk().expectUint(90000000000)

        chain.mineEmptyBlock(1440);

        // end proposal 
        result = MultiSigTest.endProposal(1)
        result.expectOk().expectBool(true) // Success 
        
        // deployer (Contract owner) sets rebate rate
        result = YTPTest.setFeeRebate(contractOwner, expiry, yieldwbtcAddress, feeRebate);
        result.expectOk().expectBool(true)

        // Fee checking
        call = await YTPTest.getPoolDetails(expiry, yieldwbtcAddress);
        position = call.result.expectOk().expectTuple();
        position['balance-yield-token'].expectUint(100000000);
        position['balance-token'].expectUint(100900010161);
        position['balance-virtual'].expectUint(101000000000);
        position['fee-rate-yield-token'].expectUint(0.1*ONE_8);
        position['fee-rate-token'].expectUint(0.1*ONE_8);
        position['fee-rebate'].expectUint(0.5*ONE_8);
    },    
});

Clarinet.test({
    name: "yield-token-pool : error test cases ",

    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get("deployer")!;
        let wallet_1 = accounts.get("wallet_1")!;
        let wallet_2 = accounts.get("wallet_2")!;
        let YTPTest = new YTPTestAgent1(chain, deployer);
        let usdaToken = new USDAToken(chain, deployer);
        let wbtcToken = new WBTCToken(chain, deployer);
        let yieldWBTC = new YIELD_WBTC(chain, deployer);

        // Deployer minting initial tokens
        let result = wbtcToken.mintFixed(deployer, deployer.address, 100000 * ONE_8);
        result.expectOk();
        result = wbtcToken.mintFixed(deployer, wallet_1.address, 100000 * ONE_8);
        result.expectOk(); 
        result = yieldWBTC.mintFixed(deployer, expiry, 10000 * ONE_8, deployer.address);
        result.expectOk().expectBool(true);
        result = usdaToken.mintFixed(deployer, deployer.address, 100000000 * ONE_8);
        result.expectOk();
        result = usdaToken.mintFixed(deployer, wallet_1.address, 200000 * ONE_8);
        result.expectOk();
        result = wbtcToken.mintFixed(deployer, wallet_2.address, 10 * ONE_8);
        result.expectOk();  
        result = usdaToken.mintFixed(deployer, wallet_2.address, 1000 * ONE_8);
        result.expectOk();         

        //Deployer creating a pool, initial tokens injected to the pool
        result = YTPTest.createPool(deployer, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, multisigytpyieldwbtc, 1000*ONE_8, 1000*ONE_8);
        result.expectOk().expectTuple();

        let block = chain.mineBlock(
            [
                Tx.contractCall("alex-vault", "add-approved-token", [types.principal(yieldwbtcAddress)], deployer.address),
                Tx.contractCall("alex-vault", "add-approved-token", [types.principal(wbtcAddress)], deployer.address),
                Tx.contractCall("alex-vault", "add-approved-token", [types.principal(ytpyieldwbtcAddress)], deployer.address),
            ]
        );
        block.receipts.forEach(e => { e.result.expectOk() });        

        // Duplicated Pool 
        result = YTPTest.createPool(deployer, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, multisigytpyieldwbtc, 1000*ONE_8, 1000*ONE_8);
        result.expectErr().expectUint(2000);   

        // Check pool details and print
        let call = await YTPTest.getPoolDetails(expiry, yieldwbtcAddress);
        let position:any = call.result.expectOk().expectTuple();
        position['balance-token'].expectUint(1000*ONE_8);
        position['balance-yield-token'].expectUint(0);
        position['balance-virtual'].expectUint(1000*ONE_8);
        
        // Attempts to inject zero liquidity
        result = YTPTest.addToPosition(deployer, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, 0, Number.MAX_SAFE_INTEGER);
        position = result.expectErr().expectUint(2003)

        //Attempt to add extra liquidity but not enough balance
        result = YTPTest.addToPosition(deployer, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, 1000000*ONE_8, Number.MAX_SAFE_INTEGER);
        position = result.expectErr().expectUint(3000)

        // Attempts for trivial reducing
        result = YTPTest.reducePosition(deployer, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, 0);
        position =result.expectErr().expectUint(1)

        // Attempts for trivial reduce more than 100%
        result = YTPTest.reducePosition(deployer, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, 101*ONE_8);
        position =result.expectErr().expectUint(5000)

        // Another user attempts to reduce liquidity with not enough pool token 
        result = YTPTest.reducePosition(wallet_2, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, 1*ONE_8);
        position =result.expectErr().expectUint(1)

        // Deployer adds liquidity
        result = YTPTest.addToPosition(deployer, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, 1000*ONE_8, Number.MAX_SAFE_INTEGER);
        position = result.expectOk().expectTuple();
        position['supply'].expectUint(1000*ONE_8);
        position['balance-token'].expectUint(1000*ONE_8);
        position['balance-yield-token'].expectUint(0);
        position['balance-virtual'].expectUint(1000*ONE_8);     

        // Another User adds liquidity
        result = YTPTest.addToPosition(wallet_2, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, 10*ONE_8, Number.MAX_SAFE_INTEGER);
        position = result.expectOk().expectTuple();
        position['supply'].expectUint(10*ONE_8);
        position['balance-token'].expectUint(10*ONE_8);
        position['balance-yield-token'].expectUint(0);
        position['balance-virtual'].expectUint(10*ONE_8);     

        // Another user attempts to reduce liquidity with zero value
        result = YTPTest.reducePosition(wallet_2, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, 0);
        position =result.expectErr().expectUint(1)

        // False swap value -- Filter added
        result = YTPTest.swapYForX(deployer, expiry, yieldwbtcAddress, wbtcAddress, 0, 0);
        position =result.expectErr().expectUint(2003)
        
        // Too small => < max-slippage
        result = YTPTest.swapYForX(deployer, expiry, yieldwbtcAddress, wbtcAddress, 0.0000001 * ONE_8, 0);
        position =result.expectErr().expectUint(2020);

        // Fixed
        result = YTPTest.swapYForX(deployer, expiry, yieldwbtcAddress, wbtcAddress, 0.001 * ONE_8, 0);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(18930);
        position['dy'].expectUint(0.001 * ONE_8);

        // Attempt for Swapping
        result = YTPTest.swapYForX(deployer, expiry, yieldwbtcAddress, wbtcAddress, ONE_8, 0);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(99946497);
        position['dy'].expectUint(ONE_8);

        // Attempts for zero value swapping
        result = YTPTest.swapXForY(deployer, expiry, yieldwbtcAddress, wbtcAddress, 0, 0);
        position =result.expectErr().expectUint(2003)

        // Attempts to swap more than available balance in the pool
        result = YTPTest.swapXForY(deployer, expiry, yieldwbtcAddress, wbtcAddress, 100*ONE_8, 0);
        position =result.expectErr().expectUint(2016) 

        // Swap
        result = YTPTest.swapXForY(deployer, expiry, yieldwbtcAddress, wbtcAddress, 0.1 * ONE_8, 0);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(0.1 * ONE_8);
        position['dy'].expectUint(10055517);

    },    
});

Clarinet.test({
    name: "yield-token-pool : buy-and-add-to-position",

    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get("deployer")!;
        let wallet_1 = accounts.get("wallet_1")!;
        let YTPTest = new YTPTestAgent1(chain, deployer);
        let yieldWBTC = new YIELD_WBTC(chain, deployer);
        let wbtcToken = new WBTCToken(chain, deployer);

        // Deployer minting initial tokens
        let result = wbtcToken.mintFixed(deployer, deployer.address, 100000 * ONE_8);
        result.expectOk();
        result = wbtcToken.mintFixed(deployer, wallet_1.address, 100000 * ONE_8);
        result.expectOk(); 
        result = yieldWBTC.mintFixed(deployer, expiry, 10000 * ONE_8, deployer.address);
        result.expectOk().expectBool(true);        

        //Deployer creating a pool, initial tokens injected to the pool
        result = YTPTest.createPool(deployer, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, multisigytpyieldwbtc, 1000*ONE_8, 1000*ONE_8);
        result.expectOk().expectTuple();

        const block = chain.mineBlock(
            [
                Tx.contractCall("alex-vault", "add-approved-token", [types.principal(yieldwbtcAddress)], deployer.address),
                Tx.contractCall("alex-vault", "add-approved-token", [types.principal(wbtcAddress)], deployer.address),
                Tx.contractCall("alex-vault", "add-approved-token", [types.principal(ytpyieldwbtcAddress)], deployer.address),
            ]
        );
        block.receipts.forEach(e => { e.result.expectOk() });        

        // Check pool details and print
        let call = await YTPTest.getPoolDetails(expiry, yieldwbtcAddress);
        let position:any = call.result.expectOk().expectTuple();
        position['balance-token'].expectUint(1000*ONE_8);
        position['balance-yield-token'].expectUint(0);
        position['balance-virtual'].expectUint(1000*ONE_8);

        // inject some yield-token to pool
        result = YTPTest.swapYForX(deployer, expiry, yieldwbtcAddress, wbtcAddress, 10 * ONE_8, 0);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(1002811646);
        position['dy'].expectUint(10 * ONE_8);

        // Check pool details and print
        call = await YTPTest.getPoolDetails(expiry, yieldwbtcAddress);
        position = call.result.expectOk().expectTuple();
        position['total-supply'].expectUint(1000*ONE_8);
        position['balance-token'].expectUint(1000*ONE_8 - 1002811646);
        position['balance-yield-token'].expectUint(10 * ONE_8);
        position['balance-virtual'].expectUint(1000*ONE_8);  

        // make sure wallet_1 does not have any yield-token
        call = chain.callReadOnlyFn(yieldwbtcAddress, "get-balance", 
            [types.uint(expiry), types.principal(wallet_1.address)
            ], wallet_1.address);
        call.result.expectOk().expectUint(0);            
        
        //Add extra liquidity with secondary buying of yield-token
        result = YTPTest.buyAndAddToPosition(wallet_1, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, 10*ONE_8, Number.MAX_SAFE_INTEGER);
        position = result.expectOk().expectTuple();
        position['supply'].expectUint(909208000);
        position['balance-token'].expectUint(900990661);
        position['balance-yield-token'].expectUint(8186738);
        position['balance-virtual'].expectUint(909208005);
    }
});

Clarinet.test({
    name: "yield-token-pool : roll-position",

    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get("deployer")!;
        let wallet_1 = accounts.get("wallet_1")!;
        let YTPTest = new YTPTestAgent1(chain, deployer);
        let yieldWBTC = new YIELD_WBTC(chain, deployer);
        let wbtcToken = new WBTCToken(chain, deployer);

        // Deployer minting initial tokens
        let result = wbtcToken.mintFixed(deployer, deployer.address, 100000 * ONE_8);
        result.expectOk();
        result = wbtcToken.mintFixed(deployer, wallet_1.address, 100000 * ONE_8);
        result.expectOk(); 
        result = yieldWBTC.mintFixed(deployer, expiry, 10000 * ONE_8, deployer.address);
        result.expectOk().expectBool(true);      
        result = yieldWBTC.mintFixed(deployer, anotherExpiry, 10000 * ONE_8, deployer.address);
        result.expectOk().expectBool(true);     

        //Deployer creating a pool, initial tokens injected to the pool
        result = YTPTest.createPool(deployer, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, multisigytpyieldwbtc, 1000*ONE_8, 1000*ONE_8);
        result.expectOk().expectTuple();

        let block = chain.mineBlock(
            [
                Tx.contractCall("alex-vault", "add-approved-token", [types.principal(yieldwbtcAddress)], deployer.address),
                Tx.contractCall("alex-vault", "add-approved-token", [types.principal(wbtcAddress)], deployer.address),
                Tx.contractCall("alex-vault", "add-approved-token", [types.principal(ytpyieldwbtcAddress)], deployer.address),
            ]
        );
        block.receipts.forEach(e => { e.result.expectOk() });        

        // Check pool details and print
        let call = await YTPTest.getPoolDetails(expiry, yieldwbtcAddress);
        let position:any = call.result.expectOk().expectTuple();
        position['balance-token'].expectUint(1000*ONE_8);
        position['balance-yield-token'].expectUint(0);
        position['balance-virtual'].expectUint(1000*ONE_8);

        // inject some yield-token to pool
        result = YTPTest.swapYForX(deployer, expiry, yieldwbtcAddress, wbtcAddress, 10 * ONE_8, 0);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(1002815517);
        position['dy'].expectUint(10 * ONE_8);

        // Check pool details and print
        call = await YTPTest.getPoolDetails(expiry, yieldwbtcAddress);
        position = call.result.expectOk().expectTuple();
        position['total-supply'].expectUint(1000*ONE_8);
        position['balance-token'].expectUint(1000*ONE_8 - 1002815517);
        position['balance-yield-token'].expectUint(10 * ONE_8);
        position['balance-virtual'].expectUint(1000*ONE_8);  

        // make sure wallet_1 does not have any yield-token
        call = chain.callReadOnlyFn(yieldwbtcAddress, "get-balance", 
            [types.uint(expiry), types.principal(wallet_1.address)
            ], wallet_1.address);
        call.result.expectOk().expectUint(0);     
        
        // create another ytp
        result = YTPTest.createPool(deployer, anotherExpiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, multisigytpyieldwbtc, 1000*ONE_8, 1000*ONE_8);
        result.expectOk().expectTuple(); 

        // inject some yield-token to pool
        result = YTPTest.swapYForX(deployer, anotherExpiry, yieldwbtcAddress, wbtcAddress, 10 * ONE_8, 0);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(1003829746);
        position['dy'].expectUint(10 * ONE_8);     
        
        call = await YTPTest.getPoolDetails(anotherExpiry, yieldwbtcAddress);
        position = call.result.expectOk().expectTuple();
        position['total-supply'].expectUint(1000*ONE_8);
        position['balance-token'].expectUint(1000*ONE_8 - 1003829746);
        position['balance-yield-token'].expectUint(10 * ONE_8);
        position['balance-virtual'].expectUint(1000*ONE_8);          
        
        //Add extra liquidity with secondary buying of yield-token
        result = YTPTest.rollPosition(deployer, expiry, yieldwbtcAddress, wbtcAddress, ytpyieldwbtcAddress, 0.5*ONE_8, anotherExpiry);
        position = result.expectOk().expectTuple();     
    }
});