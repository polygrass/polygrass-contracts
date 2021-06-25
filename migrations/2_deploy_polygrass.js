const { BigNumber } = require("@ethersproject/bignumber");
const MasterJive = artifacts.require("MasterJive");
const GrassToken = artifacts.require("GrassToken");
const MultiCall = artifacts.require("Multicall");
const Timelock = artifacts.require("Timelock");

const INITIAL_MINT = '20000';
const TOKENS_PER_BLOCK = '4';
const TIMELOCK_DELAY_SECS = (3600 * 6); 
const REWARDS_START = 16315423;
const FARM_FEE_ACCOUNT = process.env.FARM_FEE_ACCOUNT;
const MASTER_ACOUNT = process.env.MASTER_ACOUNT;

module.exports = async function(deployer, network) {
    console.log({network});

    let masterAccount = MASTER_ACOUNT;
    let feeAccount = FARM_FEE_ACCOUNT;
    let grassTokenInstance;

    /**
     * Deploy GrassToken
     */
    deployer.deploy(GrassToken).then((instance) => {
        grassTokenInstance = instance;
        /**
         * Mint intial tokens for liquidity pool
         */
        return grassTokenInstance.mint(BigNumber.from(INITIAL_MINT).mul(BigNumber.from(String(10**18))));
    }).then((instance)=> {
        /**
         * Deploy MasterJive
         */
        if(network == "polygon") {
            console.log(`Deploying MasterJive with POLYGON MAINNET settings.`)
            return deployer.deploy(MasterJive, 
                GrassToken.address,                              
                masterAccount,
                feeAccount,                                          
                BigNumber.from(TOKENS_PER_BLOCK).mul(BigNumber.from(String(10**18))),  
                REWARDS_START                                          
            )
        }
        console.log(`Deploying MasterJive with DEV/TEST settings`)
        return deployer.deploy(MasterJive, 
            GrassToken.address, 
            masterAccount,
            feeAccount,
            BigNumber.from(TOKENS_PER_BLOCK).mul(BigNumber.from(String(10**18))), 
            0
        )
    }).then((instance)=> {
        masterJiveInstance = instance;
        /**
         * TransferOwnership of GRASS to MasterJive
         */
        return grassTokenInstance.transferOwnership(MasterJive.address);
    }).then(()=> {
        /**
         * Deploy MultiCall
         */
        return deployer.deploy(MultiCall);
    }).then(()=> {
        /**
         * Deploy Timelock
         */
        return deployer.deploy(Timelock, masterAccount, TIMELOCK_DELAY_SECS);
    }).then(()=> {
        console.log('Rewards Start at block: ', REWARDS_START)
        console.table({
            MasterJive: MasterJive.address,
            GrassToken: GrassToken.address,
            MultiCall: MultiCall.address,
            Timelock: Timelock.address
        })
    });
};