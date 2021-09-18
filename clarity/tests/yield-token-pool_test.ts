

import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

import { 
    YTPTestAgent1,
  } from './models/alex-tests-yield-token-pool.ts';

import { 
    MS_YTP_WBT_59760,
} from './models/alex-tests-multisigs.ts';

import { 
    USDAToken,
    WBTCToken,
    POOLTOKEN_YTP_WBTC_WBTC_59760
  } from './models/alex-tests-tokens.ts';


// Deployer Address Constants 
const wbtcAddress = "ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.token-wbtc"
const yieldwbtc59760Address = "ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.yield-wbtc-59760"
const ytpyieldwbtc59760Address = "ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.ytp-yield-wbtc-59760-wbtc"
const multisigytpyieldwbtc59760 = "ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.multisig-ytp-yield-wbtc-59760-wbtc"

const ONE_8 = 100000000
const expiry = 59760 * ONE_8
/**
 * Yield Token Pool Test Cases  
 * 
 */

Clarinet.test({
    name: "YTP : Pool creation, adding values and reducing values",

    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get("wallet_1")!;
        let YTPTest = new YTPTestAgent1(chain, deployer);
        
        //Deployer creating a pool, initial tokens injected to the pool
        let result = YTPTest.createPool(deployer, yieldwbtc59760Address, wbtcAddress, ytpyieldwbtc59760Address, multisigytpyieldwbtc59760, 1000*ONE_8, 1000*ONE_8);
        result.expectOk().expectBool(true);

        // Check pool details and print
        let call = await YTPTest.getPoolDetails(yieldwbtc59760Address);
        let position:any = call.result.expectOk().expectTuple();
        position['balance-token'].expectUint(1000*ONE_8);
        position['balance-aytoken'].expectUint(0);
        position['balance-virtual'].expectUint(1000*ONE_8);

        let listed = 100000000;

        //Add extra liquidity
        result = YTPTest.addToPosition(deployer, yieldwbtc59760Address, wbtcAddress, ytpyieldwbtc59760Address, 10*ONE_8);
        position = result.expectOk().expectTuple();
        position['supply'].expectUint(10*ONE_8);
        position['balance-token'].expectUint(10*ONE_8);
        position['balance-aytoken'].expectUint(0);
        position['balance-virtual'].expectUint(10*ONE_8);

        // Check pool details and print
        call = await YTPTest.getPoolDetails(yieldwbtc59760Address);
        position = call.result.expectOk().expectTuple();
        position['total-supply'].expectUint(1010*ONE_8);
        position['balance-token'].expectUint(1010*ONE_8);
        position['balance-aytoken'].expectUint(0);
        position['balance-virtual'].expectUint(1010*ONE_8);        

        // Remove all liquidlity
        result = YTPTest.reducePosition(deployer, yieldwbtc59760Address, wbtcAddress, ytpyieldwbtc59760Address, 1*ONE_8);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(1010*ONE_8);
        position['dy'].expectUint(0);

        // Add back some liquidity
        result = YTPTest.addToPosition(deployer, yieldwbtc59760Address, wbtcAddress, ytpyieldwbtc59760Address, 1000*ONE_8);
        position = result.expectOk().expectTuple();
        position['supply'].expectUint(1000*ONE_8);
        position['balance-token'].expectUint(1000*ONE_8);
        position['balance-aytoken'].expectUint(0);
        position['balance-virtual'].expectUint(1000*ONE_8);     
        
        // check t
        call = chain.callReadOnlyFn("yield-token-pool", "get-t", 
            [types.uint(expiry),
             types.uint(listed)
            ], deployer.address);
        call.result.expectOk().expectUint(85000000)
        
        // zero actual yield-token, so must throw an error
        result = YTPTest.getYgivenX(deployer, yieldwbtc59760Address, 1*ONE_8);
        result.expectErr().expectUint(2016)
        
        // zero actual yield-token, so yield must be zero
        call = chain.callReadOnlyFn("yield-token-pool", "get-yield", 
            [types.principal(yieldwbtc59760Address)
            ], deployer.address);
        call.result.expectOk().expectUint(0)

        // zero rate environment, so yield-token and token are at parity.
        result = YTPTest.getXgivenY(deployer, yieldwbtc59760Address, 2*ONE_8);
        result.expectOk().expectUint(200212341)

        // sell some yield-token
        result = YTPTest.swapYForX(deployer, yieldwbtc59760Address, wbtcAddress, 2*ONE_8);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(200212341);
        position['dy'].expectUint(2*ONE_8);

        // yield-token now has "actual" balance
        call = chain.callReadOnlyFn("yield-token-pool", "get-pool-details", 
            [types.principal(yieldwbtc59760Address)
            ], deployer.address);
        position = call.result.expectOk().expectTuple();
        position['balance-token'].expectUint(99799787659);
        position['balance-aytoken'].expectUint(2*ONE_8);
        position['balance-virtual'].expectUint(1000*ONE_8);         
            
        // now that yield token supply > token supply, yield is positive.
        call = chain.callReadOnlyFn("yield-token-pool", "get-yield", 
            [types.principal(yieldwbtc59760Address)
            ], deployer.address);
        call.result.expectOk().expectUint(400212); // 0.4%

        // buy back some yield token
        result = YTPTest.swapXForY(deployer, yieldwbtc59760Address, wbtcAddress, ONE_8);
        position = result.expectOk().expectTuple()
        position['dx'].expectUint(ONE_8);
        position['dy'].expectUint(100352095);        

        // attempt to sell more than max allowed yield token (50% of pool) must throw an error
        result = YTPTest.swapYForX(deployer, yieldwbtc59760Address, wbtcAddress, 501*ONE_8);
        position =result.expectErr().expectUint(4002)

        call = chain.callReadOnlyFn("yield-token-pool", "get-pool-details", 
            [types.principal(yieldwbtc59760Address)
            ], deployer.address);
        position = call.result.expectOk().expectTuple();
        position['balance-token'].expectUint(99899787659);
        position['balance-aytoken'].expectUint(99647905);
        position['balance-virtual'].expectUint(1000*ONE_8); 

        // after buying back some yield token, yield decreases.
        call = chain.callReadOnlyFn("yield-token-pool", "get-yield", 
            [types.principal(yieldwbtc59760Address)
            ], deployer.address);
        call.result.expectOk().expectUint(199860); // 0.2%   

        // we sell close to maximum allowed of yield token
        result = YTPTest.swapYForX(deployer, yieldwbtc59760Address, wbtcAddress, 19*ONE_8);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(1927749539);
        position['dy'].expectUint(19*ONE_8);       
                
        call = chain.callReadOnlyFn("yield-token-pool", "get-pool-details", 
            [types.principal(yieldwbtc59760Address)
            ], deployer.address);
        position = call.result.expectOk().expectTuple();
        position['balance-token'].expectUint(97972038120);
        position['balance-aytoken'].expectUint(1999647905);
        position['balance-virtual'].expectUint(1000*ONE_8);                 

        // which moves yield substantially into the positive territory.
        call = chain.callReadOnlyFn("yield-token-pool", "get-yield", 
            [types.principal(yieldwbtc59760Address)
            ], deployer.address);
        call.result.expectOk().expectUint(4028722); // 4%    
        
        // simulate to be on half way to expiry
        chain.mineEmptyBlockUntil((expiry / ONE_8) / 2)      
        
        // check t == 0.5
        call = chain.callReadOnlyFn("yield-token-pool", "get-t", 
            [types.uint(expiry),
             types.uint(listed)
            ], deployer.address);
        call.result.expectOk().expectUint(50000000)        

        call = chain.callReadOnlyFn("yield-token-pool", "get-pool-details", 
            [types.principal(yieldwbtc59760Address)
            ], deployer.address);
        position = call.result.expectOk().expectTuple();
        position['balance-token'].expectUint(97972038120);
        position['balance-aytoken'].expectUint(1999647905);
        position['balance-virtual'].expectUint(1000*ONE_8); 

        // no transaction since then till now, so yield remains the same. Note yield is absolute, not annualised number.
        call = chain.callReadOnlyFn("yield-token-pool", "get-yield", 
            [types.principal(yieldwbtc59760Address)
            ], deployer.address);
        call.result.expectOk().expectUint(4028722); // 4%      
        
        // sell some (a lot of) yield-token
        result = YTPTest.swapYForX(deployer, yieldwbtc59760Address, wbtcAddress, 19*ONE_8);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(1879746070);
        position['dy'].expectUint(19*ONE_8);

        call = chain.callReadOnlyFn("yield-token-pool", "get-pool-details", 
            [types.principal(yieldwbtc59760Address)
            ], deployer.address);
        position = call.result.expectOk().expectTuple();
        position['balance-token'].expectUint(96092292050);
        position['balance-aytoken'].expectUint(1999647905 + 19*ONE_8);
        position['balance-virtual'].expectUint(1000*ONE_8);         
            
        // and see how it pushes the yield to crazy level.
        call = chain.callReadOnlyFn("yield-token-pool", "get-yield", 
            [types.principal(yieldwbtc59760Address)
            ], deployer.address);
        call.result.expectOk().expectUint(7811636); // 78%    

        //buy back some yield token
        result = YTPTest.swapXForY(deployer, yieldwbtc59760Address, wbtcAddress, 19*ONE_8);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(19*ONE_8);
        position['dy'].expectUint(1956741242);      

        // simulate to right before expiry
        chain.mineEmptyBlockUntil((expiry / ONE_8) - 1)      
        
        // confirm t is almost zero.
        call = chain.callReadOnlyFn("yield-token-pool", "get-t", 
            [types.uint(expiry),
             types.uint(listed)
            ], deployer.address);
        call.result.expectOk().expectUint(1673)

        // no trade between half way and now, so yield should remain the same (again, yield is not annualised).
        call = chain.callReadOnlyFn("yield-token-pool", "get-yield", 
            [types.principal(yieldwbtc59760Address)
            ], deployer.address);
        call.result.expectOk().expectUint(3952408); // 4%      
        
        // buy some yield-token
        result = YTPTest.swapXForY(deployer, yieldwbtc59760Address, wbtcAddress, 19*ONE_8);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(19*ONE_8);
        position['dy'].expectUint(1900016846);

        // on expiry, the prices are back to parity.
        call = chain.callReadOnlyFn("yield-token-pool", "get-price", 
            [types.principal(yieldwbtc59760Address)
            ], deployer.address);
        call.result.expectOk().expectUint(100000005); // par          

    },    
});



Clarinet.test({
    name: "YTP : Fee Setting and Collection using Multisig ",

    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get("wallet_1")!;
        let wallet_2 = accounts.get("wallet_2")!;
        let YTPTest = new YTPTestAgent1(chain, deployer);
        let MultiSigTest = new MS_YTP_WBT_59760(chain, deployer);
        let ytpPoolToken = new POOLTOKEN_YTP_WBTC_WBTC_59760(chain, deployer);
        let usdaToken = new USDAToken(chain, deployer);
        let wbtcToken = new WBTCToken(chain, deployer);
        const buffer = new ArrayBuffer(0)
        const feeRateX = 5000000; // 5%
        const feeRateY = 5000000;

        let money = usdaToken.transferToken(10*ONE_8,deployer.address,wallet_2.address, buffer);
        money = wbtcToken.transferToken(10*ONE_8,deployer.address,wallet_2.address, buffer);
        money.expectOk()

        //Deployer creating a pool, initial tokens injected to the pool
        let result = YTPTest.createPool(deployer, yieldwbtc59760Address, wbtcAddress, ytpyieldwbtc59760Address, multisigytpyieldwbtc59760, 1000*ONE_8, 1000*ONE_8);
        result.expectOk().expectBool(true);

        // Check pool details and print
        let call = await YTPTest.getPoolDetails(yieldwbtc59760Address);
        let position:any = call.result.expectOk().expectTuple();
        position['balance-token'].expectUint(1000*ONE_8);
        position['balance-aytoken'].expectUint(0);
        position['balance-virtual'].expectUint(1000*ONE_8);
        
        result = YTPTest.swapYForX(deployer, yieldwbtc59760Address, wbtcAddress, ONE_8);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(99954689);
        position['dy'].expectUint(ONE_8);

        call = await YTPTest.getPoolDetails(yieldwbtc59760Address);
        position = call.result.expectOk().expectTuple();
        position['balance-token'].expectUint(99900045311);
        position['balance-aytoken'].expectUint(ONE_8);
        position['balance-virtual'].expectUint(1000*ONE_8);


        call = await ytpPoolToken.balanceOf(deployer.address);
        call.result.expectOk().expectUint(100000000000);

        call = await ytpPoolToken.balanceOf(wallet_2.address);
        call.result.expectOk().expectUint(0);

        // Fee rate Setting Proposal of Multisig
        result = MultiSigTest.propose(1000, " Fee Rate Setting to 5%", " https://docs.alexgo.io", feeRateX, feeRateY)
        result.expectOk().expectUint(1) // First Proposal
    
        // Block 1000 mining
        chain.mineEmptyBlock(1000);

        // Deployer has 100 % of pool token
        let ROresult:any = ytpPoolToken.balanceOf(deployer.address);
        ROresult.result.expectOk().expectUint(100000000000);
                
        // 90 % of existing tokens are voted for the proposal
        result = MultiSigTest.voteFor(deployer, ytpyieldwbtc59760Address, 1, 100000000000 * 9 / 10 )
        result.expectOk().expectUint(90000000000)

        chain.mineEmptyBlock(1440);

        // end proposal 
        result = MultiSigTest.endProposal(1)
        result.expectOk().expectBool(true) // Success 

        
    },    
});


Clarinet.test({
    name: "YTP : Error Test Cases ",

    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployer = accounts.get("wallet_1")!;
        let wallet_2 = accounts.get("wallet_2")!;
        let YTPTest = new YTPTestAgent1(chain, deployer);
        let MultiSigTest = new MS_YTP_WBT_59760(chain, deployer);
        let ytpPoolToken = new POOLTOKEN_YTP_WBTC_WBTC_59760(chain, deployer);
        let usdaToken = new USDAToken(chain, deployer);
        let wbtcToken = new WBTCToken(chain, deployer);
        const buffer = new ArrayBuffer(0)   // Optional memo
        const feeRateX = 5000000; // 5%
        const feeRateY = 5000000;

        let money = usdaToken.transferToken(10*ONE_8,deployer.address,wallet_2.address, buffer);
        money = wbtcToken.transferToken(10*ONE_8,deployer.address,wallet_2.address, buffer);
        money.expectOk()

        //Deployer creating a pool, initial tokens injected to the pool
        let result = YTPTest.createPool(deployer, yieldwbtc59760Address, wbtcAddress, ytpyieldwbtc59760Address, multisigytpyieldwbtc59760, 1000*ONE_8, 1000*ONE_8);
        result.expectOk().expectBool(true);

        // Duplicated Pool 
        result = YTPTest.createPool(deployer, yieldwbtc59760Address, wbtcAddress, ytpyieldwbtc59760Address, multisigytpyieldwbtc59760, 1000*ONE_8, 1000*ONE_8);
        result.expectErr().expectUint(2000);

        // Check pool details and print
        let call = await YTPTest.getPoolDetails(yieldwbtc59760Address);
        let position:any = call.result.expectOk().expectTuple();
        position['balance-token'].expectUint(1000*ONE_8);
        position['balance-aytoken'].expectUint(0);
        position['balance-virtual'].expectUint(1000*ONE_8);
        
        //Attempt to add extra liquidity but not enough balance
        result = YTPTest.addToPosition(deployer, yieldwbtc59760Address, wbtcAddress, ytpyieldwbtc59760Address, 1000000*ONE_8);
        position = result.expectErr().expectUint(3001)

        // Another user attempts to reduce liquidity with not enough pool token 
        result = YTPTest.reducePosition(wallet_2, yieldwbtc59760Address, wbtcAddress, ytpyieldwbtc59760Address, 1*ONE_8);
        position =result.expectErr().expectUint(1)

        // Deployer adds liquidity
        result = YTPTest.addToPosition(deployer, yieldwbtc59760Address, wbtcAddress, ytpyieldwbtc59760Address, 1000*ONE_8);
        position = result.expectOk().expectTuple();
        position['supply'].expectUint(1000*ONE_8);
        position['balance-token'].expectUint(1000*ONE_8);
        position['balance-aytoken'].expectUint(0);
        position['balance-virtual'].expectUint(1000*ONE_8);     

        // Another User adds liquidity
        result = YTPTest.addToPosition(wallet_2, yieldwbtc59760Address, wbtcAddress, ytpyieldwbtc59760Address, 10*ONE_8);
        position = result.expectOk().expectTuple();
        position['supply'].expectUint(10*ONE_8);
        position['balance-token'].expectUint(10*ONE_8);
        position['balance-aytoken'].expectUint(0);
        position['balance-virtual'].expectUint(10*ONE_8);     

        // Another user attempts to reduce liquidity with zero value
        result = YTPTest.reducePosition(wallet_2, yieldwbtc59760Address, wbtcAddress, ytpyieldwbtc59760Address, 0);
        position =result.expectErr().expectUint(1)

        // False swap value -- to be checked
        result = YTPTest.swapYForX(deployer, yieldwbtc59760Address, wbtcAddress, 0);
        position =result.expectErr().expectUint(2003)

        // Bug, this should pass -- to be checked
        result = YTPTest.swapYForX(deployer, yieldwbtc59760Address, wbtcAddress, 100000);
        position =result.expectErr().expectUint(5004)

        // Attempt for Swapping
        result = YTPTest.swapYForX(deployer, yieldwbtc59760Address, wbtcAddress, ONE_8);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(99787067);
        position['dy'].expectUint(ONE_8);
        
        // Bug - to be checked
        result = YTPTest.swapXForY(deployer, yieldwbtc59760Address, wbtcAddress, 0);
        position =result.expectErr().expectUint(2003)

        // Attempts to swap more than available balance in the pool
        result = YTPTest.swapXForY(deployer, yieldwbtc59760Address, wbtcAddress, 100*ONE_8);
        position =result.expectErr().expectUint(2016) 

        // Swap
        result = YTPTest.swapXForY(deployer, yieldwbtc59760Address, wbtcAddress, 10000000);
        position =result.expectOk().expectTuple();
        position['dx'].expectUint(10000000);
        position['dy'].expectUint(10161454);

    },    
});