process.env.HARDHAT_NETWORK ||= 'rinkeby';
process.env.HARDHAT_SHOW_STACK_TRACES ||= 'true';
process.env.HARDHAT_VERBOSE ||= 'true';

/* eslint-disable camelcase */
/* eslint-disable node/no-missing-import */
import {BigNumber, constants} from 'ethers';
import {ethers} from 'hardhat';
import {
  ExitQueue,
  ExitQueue__factory,
  LockedOGTemple,
  LockedOGTemple__factory,
  OGTemple,
  OGTemple__factory,
  OpeningCeremony,
  OpeningCeremonyQuest,
  OpeningCeremonyQuest__factory,
  OpeningCeremony__factory,
  TempleERC20Token,
  TempleERC20Token__factory,
  TempleStaking,
  TempleStaking__factory,
  TempleTreasury,
  TempleTreasury__factory,
  TreasuryManagementProxy,
  TreasuryManagementProxy__factory,
  VerifyQuest,
  VerifyQuest__factory,
} from '../typechain';

let _r: any = undefined;
let p = {p: Promise.resolve(), t: Promise.resolve(), r: _r};
p.t = p.p;
// while (p.t !== p.p) p.r = await (p.t = p.p)

const harvestThresholdStablec = '10000000';
const inviteThresholdStablec = '1';
const maxInvitesPerVerifiedUser = '2';
const verifiedBonusFactor = {
  numerator: '178379',
  denominator: '1000000',
};
const guestBonusFactor = {
  numerator: '116487',
  denominator: '1000000',
};
const seedMintTemple = ethers.utils.parseEther('0.01');
const seedMintStablec = ethers.utils.parseUnits('0.00000018', 8);
const epy = {
  numerator: '7000',
  denominator: '1000000',
};
const maxPerEpoch = '1000000000000000000000';
const maxPerAddress = '1000000000000000000000';
const epochSize = '10';
const SECONDS_IN_DAY = 10 * 60;// 间隔时间
const NOW = (new Date('2022-2-24 11:00:00').getTime()) / 1000 >> 0;// 起始时间
const lockUntil = NOW + 6 * SECONDS_IN_DAY;// 解锁时间

const config: {
  dai: string;
  temple?: string;
  exitQueue?: string;
  treasury?: string;
  treasuryManagement?: string;
  staking?: string;
  lockedOGTemple?: string;
  openingCeremony?: string;
  openingCeremonyQuest?: string;
  verifyQuest?: string;
} = {
  dai: '0x5180E4D72A3BB3d2b60c77Ac6fdc0bFfEffCb5CC',
  temple: '0x0Dcd87C1F82fB46280DBe176B47E4e8b44bEE5b4',
  exitQueue: '0x544ACFC1830e4a4e4226679F5526AD1E1E96A584',
  staking: '0x6D559c1FD6791db23eb824Ee22cb694B2e0C584A',
  lockedOGTemple: '0xb7634cE5977B15993202BE4A9152839b8aE8D817',
  treasury: '0x1Acf78806554eAb9dc5dc1CEd4Aee7267e40E519',
  treasuryManagement: '0x8d12de5C3d7913E2073c0A12B6ade2CE6EAA01ea',
  openingCeremony: '0x06EDEe880B3c15970e9BAcCBA90F9722cC7951fA',
  openingCeremonyQuest: '0x80F93292812731d68BACD436E4fC47534c558b21',
  verifyQuest: '0xd4BE7947a7a265eBdc80e560F971F1190d723801'
}
//   {
//     dai: '0x5180E4D72A3BB3d2b60c77Ac6fdc0bFfEffCb5CC', // WBTC here
//     temple: undefined,
//     exitQueue: undefined,
//     staking: undefined,
//     lockedOGTemple: undefined,
//     treasury: undefined,
//     treasuryManagement: undefined,
//     openingCeremony: undefined,
//     openingCeremonyQuest: undefined,
//     verifyQuest: undefined,
//   };

let temple: TempleERC20Token;
let ogTemple: OGTemple;
let exitQueue: ExitQueue;
let staking: TempleStaking;
let treasury: TempleTreasury;
let treasuryManagement: TreasuryManagementProxy;
let lockedOGTemple: LockedOGTemple;
let openingCeremony: OpeningCeremony;
let openingCeremonyQuest: OpeningCeremonyQuest;
let verifyQuest: VerifyQuest;
let dai: TempleERC20Token;

async function main() {
  const [deployer] = await ethers.getSigners();
  
  dai = TempleERC20Token__factory.connect(config.dai, deployer);
  
  // Deploy Temple
  if (config.temple === undefined) {
    const TempleERC20Token = await ethers.getContractFactory('TempleERC20Token', deployer);
    temple = await TempleERC20Token.deploy();
    await temple.deployed();
    config.temple = temple.address;
    console.log('Deploy TempleERC20Token at:', temple.address);
  } else {
    temple = TempleERC20Token__factory.connect(config.temple, deployer);
    console.log('Found TempleERC20Token at:', temple.address);
  }
  while (p.t !== p.p) p.r = await (p.t = p.p);
  
  // Deploy ExitQueue
  if (config.exitQueue === undefined) {
    const ExitQueue = await ethers.getContractFactory('ExitQueue', deployer);
    exitQueue = await ExitQueue.deploy(temple.address, maxPerEpoch, maxPerAddress, epochSize);
    await exitQueue.deployed();
    config.exitQueue = exitQueue.address;
    console.log('Deploy ExitQueue at:', exitQueue.address);
  } else {
    exitQueue = ExitQueue__factory.connect(config.exitQueue, deployer);
    console.log('Found ExitQueue at:', exitQueue.address);
  }
  
  // Deploy TempleStaking
  if (config.staking === undefined) {
    const TempleStaking = await ethers.getContractFactory('TempleStaking', deployer);
    // @ts-ignore
    const timestampStr = NOW + '';
    
    staking = await TempleStaking.deploy(temple.address, exitQueue.address, SECONDS_IN_DAY, timestampStr, lockUntil);
    await staking.deployed();
    config.staking = staking.address;
    console.log('Deploy TempleStaking at:', staking.address);
  
    console.log('Setting epy for TempleStaking');
  
    const tx = await staking.setEpy(epy.numerator, epy.denominator);
     await tx.wait();
  } else {
    staking = TempleStaking__factory.connect(config.staking, deployer);
    console.log('Found TempleStaking at:', staking.address);
  }
  
  while (p.t !== p.p) p.r = await (p.t = p.p);
  
  // Deploy LockedOGTemple
  if (config.lockedOGTemple === undefined) {
    ogTemple = OGTemple__factory.connect(await staking.OG_TEMPLE(), deployer);
    
    const LockedOGTemple = await ethers.getContractFactory('LockedOGTemple', deployer);
    lockedOGTemple = await LockedOGTemple.deploy(ogTemple.address);
    await lockedOGTemple.deployed();
    config.lockedOGTemple = lockedOGTemple.address;
    console.log('Deploy LockedOGTemple at:', lockedOGTemple.address);
  } else {
    lockedOGTemple = LockedOGTemple__factory.connect(config.lockedOGTemple, deployer);
    console.log("Found LockedOGTemple at:", lockedOGTemple.address);
  }
  
  // Deploy TempleTreasury
  if (config.treasury === undefined) {
    const TempleTreasury = await ethers.getContractFactory("TempleTreasury", deployer);
    treasury = await TempleTreasury.deploy(temple.address, config.dai);
    await treasury.deployed();
    config.treasury = treasury.address;
    console.log("Deploy Treasury at:", treasury.address);
  } else {
    treasury = TempleTreasury__factory.connect(config.treasury, deployer);
    console.log("Found Treasury at:", treasury.address);
  }
  
  if (!(await temple.hasRole("0x5fae0c7bd414a04df9e8c5c6306f0962d6b05973710bc170aa415577df8e2c5c", treasury.address))) {
    console.log("grant mint role for treasury");
    const tx = await temple.grantRole(
      "0x5fae0c7bd414a04df9e8c5c6306f0962d6b05973710bc170aa415577df8e2c5c",
      treasury.address
    );
    await tx.wait();
  }
  
  if ((await treasury.intrinsicValueRatio()).temple.eq(constants.Zero)) {
    console.log("seed mint");
    let tx = await dai.approve(treasury.address, deployer.address);
    await tx.wait();
    tx = await treasury.seedMint(seedMintStablec, seedMintTemple);
    await tx.wait();
  }
  
  // Deploy TreasuryManagementProxy
  if (config.treasuryManagement === undefined) {
    const TreasuryManagementProxy = await ethers.getContractFactory('TreasuryManagementProxy', deployer);
    treasuryManagement = await TreasuryManagementProxy.deploy(deployer.address, treasury.address);
    await treasuryManagement.deployed();
    config.treasuryManagement = treasuryManagement.address;
    console.log('Deploy TreasuryManagementProxy at:', treasuryManagement.address);
  } else {
    treasuryManagement = TreasuryManagementProxy__factory.connect(config.treasuryManagement, deployer);
    console.log('Found TreasuryManagementProxy at:', treasuryManagement.address);
  }
  while (p.t !== p.p) p.r = await (p.t = (p.p = p.p.catch(e => e)));
  
  if ((await treasury.owner()) !== treasuryManagement.address) {
    console.log('seed treasury owner to treasuryManagement');
    const tx = await treasury.transferOwnership(treasuryManagement.address);
    await tx.wait();
  }
  
  // Deploy OpeningCeremony
  if (config.openingCeremony === undefined) {
    const OpeningCeremony = await ethers.getContractFactory('OpeningCeremony', deployer);
    
    openingCeremony = await OpeningCeremony.deploy(
      config.dai,
      temple.address,
      staking.address,
      lockedOGTemple.address,
      treasury.address,
      treasuryManagement.address,
      harvestThresholdStablec,
      inviteThresholdStablec,
  
      lockUntil + '',
      NOW + '',
      verifiedBonusFactor,
      guestBonusFactor
    );
    await openingCeremony.deployed();
    config.openingCeremony = openingCeremony.address;
    console.log('Deploy OpeningCeremony at:', openingCeremony.address);
    console.log('granting Minter role of temple for openingCeremony');
    const tx = await temple.addMinter(openingCeremony.address);
    await tx.wait();
  } else {
    openingCeremony = OpeningCeremony__factory.connect(config.openingCeremony, deployer);
    console.log("Found OpeningCeremony at:", openingCeremony.address);
  }
  
  // Deploy OpeningCeremonyQuest
  if (config.openingCeremonyQuest === undefined) {
    const OpeningCeremonyQuest = await ethers.getContractFactory("OpeningCeremonyQuest", deployer);
    openingCeremonyQuest = await OpeningCeremonyQuest.deploy();
    await openingCeremonyQuest.deployed();
    config.openingCeremonyQuest = openingCeremonyQuest.address;
    console.log("Deploy OpeningCeremonyQuest at:", openingCeremonyQuest.address);
  } else {
    openingCeremonyQuest = OpeningCeremonyQuest__factory.connect(config.openingCeremonyQuest, deployer);
    console.log("Found OpeningCeremonyQuest at:", openingCeremonyQuest.address);
  }
  
  // Deploy VerifyQuest
  if (config.verifyQuest === undefined) {
    const VerifyQuest = await ethers.getContractFactory("VerifyQuest", deployer);
    verifyQuest = await VerifyQuest.deploy(openingCeremony.address, deployer.address);
    await verifyQuest.deployed();
    config.verifyQuest = verifyQuest.address;
    console.log("Deploy VerifyQuest at:", verifyQuest.address);
  } else {
    verifyQuest = VerifyQuest__factory.connect(config.verifyQuest, deployer);
    console.log("Found VerifyQuest at:", verifyQuest.address);
  }
  
  if (
    !(await openingCeremony.hasRole(
      "0xa029d34f4788cf44bc1a02ff78e93b02dd18e538043436a28f4c96606b8b50ca",
      verifyQuest.address
    ))
  ) {
    console.log('grant role for verifyQuest');
    const tx = await openingCeremony.grantRole(
      '0xa029d34f4788cf44bc1a02ff78e93b02dd18e538043436a28f4c96606b8b50ca',
      verifyQuest.address
    );
    await tx.wait();
  }
  
  console.log('set for test use');
  let tx = await openingCeremony.setSECONDS_IN_DAY(SECONDS_IN_DAY);
  await tx.wait();
  tx = await openingCeremony.setDoublingDays(1);
  await tx.wait();
  console.log(`await openingCeremony.SECONDS_IN_DAY():`, await openingCeremony.SECONDS_IN_DAY());
  console.log(`await openingCeremony.doublingDays():`, await openingCeremony.doublingDays());
  while (p.t !== p.p) p.r = await (p.t = p.p).catch(e => e);
  
  while (p.t !== p.p) p.r = await (p.t = p.p).catch(e => e);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
