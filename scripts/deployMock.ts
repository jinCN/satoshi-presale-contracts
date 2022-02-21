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
const SECONDS_IN_DAY = 30 * 60;
const NOW = (new Date().getTime() - 60 * 1000) / 1000 >> 0;
const lockUntil = NOW + 6 * 7 * SECONDS_IN_DAY;

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
  dai: '0x5180E4D72A3BB3d2b60c77Ac6fdc0bFfEffCb5CC', // WBTC here
  temple: '0x797D7550d58aCdC373d2120DB3e1467F5fa2915e',
  exitQueue: '0x3635112557e7070D984baD75EA72a53bd6d15F99',
  staking: '0x64211518A983639fece8F853e51544FD7c324a6c',
  lockedOGTemple: '0xEc96D5969802e3d249c2fCc5BE5d6142A92d3D09',
  treasury: '0xD2C3183800FF74D69c6D21d46347CFA403eD6Ebd',
  treasuryManagement: '0xBF6329574406d820EB662Cee91198774E5cd23Cb',
  openingCeremony: '0x6C7a2282B68f68654992FA494b6fF05CAC807BD2',
  openingCeremonyQuest: '0xB1900E99C07A4C10CfC8B9731356c14529376219',
  verifyQuest: '0x8FC41912bA86d97e7FD98bb7051F9b2c7B3E457C',
};
//   {
//   dai: '0x5180E4D72A3BB3d2b60c77Ac6fdc0bFfEffCb5CC', // WBTC here
//   temple: '0xF9088230d393D3bEe9d9Be0c6D3B9Aa919222aEd',
//   exitQueue: '0xF4c935001BB28B90224Ba8f267Efc214E4b19Fd9',
//   staking: '0x04206e245698d4143Bb8DC90e0fe1a75d077eA7F',
//   lockedOGTemple: '0x51A177C0491398EC9518C50053C62d79bA7e7A9B',
//   treasury: '0x7439dCB9b96f0D7128cEb770a3Fa274Aeb2228bE',
//   treasuryManagement: '0xc31cc64f7829715Ac217AF241F040767b682c04a',
//   openingCeremony: '0xB1151d9036C5de230b65b3e8c08538Af42B38a64',
//   openingCeremonyQuest: '0x7AaAca6D830BE4Ed7554F1201f8a69909C6674Ce',
//   verifyQuest: '0x87e253b26B407cC8395C6e0e0892Bc4348324D3F',
// };

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
  
  {
    // const tx = await staking.setEpy(epy.numerator, epy.denominator);
    // await tx.wait();
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
      maxInvitesPerVerifiedUser,
      lockUntil + '',
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
