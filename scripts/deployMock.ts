/* eslint-disable camelcase */
/* eslint-disable node/no-missing-import */
import { BigNumber, constants } from "ethers";
import { ethers } from "hardhat";
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
} from "../typechain";

const harvestThresholdStablec = "5000000000000000000000";
const inviteThresholdStablec = "1";
const maxInvitesPerVerifiedUser = "2";
const verifiedBonusFactor = {
  numerator: "178379",
  denominator: "1000000",
};
const guestBonusFactor = {
  numerator: "116487",
  denominator: "1000000",
};
const seedMintTemple = ethers.utils.parseEther("0.000000000000001");
const seedMintStablec = ethers.utils.parseEther("0.000000000000000185");
const epochSizeSeconds = "86400";
const epy = {
  numerator: "7000",
  denominator: "1000000",
};
const maxPerEpoch = "1000000000000000000000";
const maxPerAddress = "1000000000000000000000";
const epochSize = "10";

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
  dai: "0x8Ae428C98E1F9d49E85d7676FA41906B209f2BB9",
  temple: "0x37365619F3D71c22935a723eF547400Bb6e2874f",
  exitQueue: "0x0a7eF3A60E4c1D40C9d2aE5c2fb9Eae68E6fa773",
  staking: "0x97a1E2Ca69c5b8298ec41ED2Bb3c79fed46b37C1",
  lockedOGTemple: "0xcB1FE7A9b9596Eb344B1fa1F369A5D8eFE716997",
  treasury: "0xdA32C1b22701E6955e1545c58ca223998714DF2A",
  treasuryManagement: "0x5a0FFc2AeC0159D8210756eE77C2f93487e625a8",
  openingCeremony: "0xf7fb4B4a7ac03262a04A72064794D3cFC2Ef6178",
  openingCeremonyQuest: "0x7fFaE3b499444f7Adce0c582F3d9FF189E74288F",
  verifyQuest: "0x14434934D406017C9ed1C03cE0cB1C8D285B5aBB",
};

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
    const TempleERC20Token = await ethers.getContractFactory("TempleERC20Token", deployer);
    temple = await TempleERC20Token.deploy();
    await temple.deployed();
    config.temple = temple.address;
    console.log("Deploy TempleERC20Token at:", temple.address);
  } else {
    temple = TempleERC20Token__factory.connect(config.temple, deployer);
    console.log("Found TempleERC20Token at:", temple.address);
  }

  // Deploy ExitQueue
  if (config.exitQueue === undefined) {
    const ExitQueue = await ethers.getContractFactory("ExitQueue", deployer);
    exitQueue = await ExitQueue.deploy(temple.address, maxPerEpoch, maxPerAddress, epochSize);
    await exitQueue.deployed();
    config.exitQueue = exitQueue.address;
    console.log("Deploy ExitQueue at:", exitQueue.address);
  } else {
    exitQueue = ExitQueue__factory.connect(config.exitQueue, deployer);
    console.log("Found ExitQueue at:", exitQueue.address);
  }

  // Deploy TempleStaking
  if (config.staking === undefined) {
    const TempleStaking = await ethers.getContractFactory("TempleStaking", deployer);
    staking = await TempleStaking.deploy(temple.address, exitQueue.address, epochSizeSeconds, "1638773381");
    await staking.deployed();
    config.staking = staking.address;
    console.log("Deploy TempleStaking at:", staking.address);
  } else {
    staking = TempleStaking__factory.connect(config.staking, deployer);
    console.log("Found TempleStaking at:", staking.address);
  }

  {
    // const tx = await staking.setEpy(epy.numerator, epy.denominator);
    // await tx.wait();
  }

  ogTemple = OGTemple__factory.connect(await staking.OG_TEMPLE(), deployer);

  // Deploy LockedOGTemple
  if (config.lockedOGTemple === undefined) {
    const LockedOGTemple = await ethers.getContractFactory("LockedOGTemple", deployer);
    lockedOGTemple = await LockedOGTemple.deploy(ogTemple.address);
    await lockedOGTemple.deployed();
    config.lockedOGTemple = lockedOGTemple.address;
    console.log("Deploy LockedOGTemple at:", lockedOGTemple.address);
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
    const TreasuryManagementProxy = await ethers.getContractFactory("TreasuryManagementProxy", deployer);
    treasuryManagement = await TreasuryManagementProxy.deploy(deployer.address, treasury.address);
    await treasuryManagement.deployed();
    config.treasuryManagement = treasuryManagement.address;
    console.log("Deploy TreasuryManagementProxy at:", treasuryManagement.address);
  } else {
    treasuryManagement = TreasuryManagementProxy__factory.connect(config.treasuryManagement, deployer);
    console.log("Found TreasuryManagementProxy at:", treasuryManagement.address);
  }
  if ((await treasury.owner()) !== treasuryManagement.address) {
    console.log("seed treasury owner to treasuryManagement");
    const tx = await treasury.transferOwnership(treasuryManagement.address);
    await tx.wait();
  }

  // Deploy OpeningCeremony
  if (config.openingCeremony === undefined) {
    const OpeningCeremony = await ethers.getContractFactory("OpeningCeremony", deployer);
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
      verifiedBonusFactor,
      guestBonusFactor
    );
    await openingCeremony.deployed();
    config.openingCeremony = openingCeremony.address;
    console.log("Deploy OpeningCeremony at:", openingCeremony.address);
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
    console.log("grant role for verifyQuest");
    const tx = await openingCeremony.grantRole(
      "0xa029d34f4788cf44bc1a02ff78e93b02dd18e538043436a28f4c96606b8b50ca",
      verifyQuest.address
    );
    await tx.wait();
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
