/* eslint-disable camelcase */
/* eslint-disable node/no-missing-import */
import {BigNumber, constants, Contract} from 'ethers';
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

const config = {
  wbtc: '0x5180E4D72A3BB3d2b60c77Ac6fdc0bFfEffCb5CC', // WBTC here
  sato: '0xF12fe93A7295df963142e43e84C2A680895DCB2f', // SATO
  satoTreasury: '0xD6C838F6A6Ea4f67f11A198615175c3DC4CE88b0',
  stakingHelper: '0x2eAe64fD1Aa1894d6432e5ca2DB18724257f5dA6',
  staking: '0x6D559c1FD6791db23eb824Ee22cb694B2e0C584A',
  treasuryManagement: '0x8d12de5C3d7913E2073c0A12B6ade2CE6EAA01ea',
  treasury: '0x1Acf78806554eAb9dc5dc1CEd4Aee7267e40E519',
};

// use 0 for not defined
let wbtcBalance = ethers.utils.parseUnits('0', 0);
// use 0 for not defined
let satoBalance = ethers.utils.parseUnits('0', 18);

let actions = {
  _01withdrawWBTC: true,
  _02inputWBTCToTreasury: true,
  _03inputSATOToStaking: true
};

const sleep = (ms: number | undefined) => new Promise((resolve, reject) => setTimeout(resolve, ms));

let _r: any = undefined;
let p = {p: Promise.resolve(), t: Promise.resolve(), r: _r};
p.t = p.p;
// Insert this code to insert a debug loop, it's a no-op if not in debug mode
// while (p.t !== p.p) p.r = await (p.t = p.p).catch(e => e);

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`deployer info:`, deployer.address, await deployer.getBalance());
  const treasuryManagement = TreasuryManagementProxy__factory.connect(config.treasuryManagement, deployer);
  console.log('Found TreasuryManagementProxy at:', treasuryManagement.address);
  const treasury = TempleTreasury__factory.connect(config.treasury, deployer);
  console.log('Found TempleTreasury at:', treasury.address);
  const staking = TempleStaking__factory.connect(config.staking, deployer);
  console.log('Found TempleStaking at:', staking.address);
  
  const wbtc = TempleERC20Token__factory.connect(config.wbtc, deployer);
  const sato = TempleERC20Token__factory.connect(config.sato, deployer);
  
  if (actions._01withdrawWBTC) {
    console.log('01withdrawWBTC');
    let balance = await wbtc.balanceOf(treasury.address);
    if (wbtcBalance.eq(0)) {
      wbtcBalance = balance;
    } else if (!balance.eq(wbtcBalance)) {
      console.log(`wbtcBalance:`, wbtcBalance);
      console.log(`balance:`, balance);
      throw new Error(`wbtcBalance doesn't equal real balance`);
    }
    
    let tx = await treasuryManagement.allocateTreasuryStablec(deployer.address, wbtcBalance);
    await tx.wait();

    while (p.t !== p.p) p.r = await (p.t = p.p).catch(e => e);
  }
  if (actions._02inputWBTCToTreasury) {
    console.log('02inputWBTCToTreasury');
  
    if (wbtcBalance.eq(0)) {
      throw new Error('wbtcBalance not defined or feteched');
    }
    const satoTreasury = new ethers.Contract(config.satoTreasury, satoTreasuryABI, deployer);
    let tx = await wbtc.approve(satoTreasury.address, wbtcBalance);
    await tx.wait();
    tx = await satoTreasury.deposit(wbtcBalance, wbtc.address, 0);
    let result = await tx.wait();
    console.log(`result:`, result);
    while (p.t !== p.p) p.r = await (p.t = p.p).catch(e => e);
  }
  if (actions._03inputSATOToStaking) {
    console.log('03inputSATOToStaking');
  
    if (satoBalance.eq(0)) {
      if (wbtcBalance.eq(0)) {
        satoBalance = await sato.balanceOf(deployer.address);
      } else {
        satoBalance = wbtcBalance.mul(1e14);
      }
    }
  
    let tx = await sato.approve(staking.address, satoBalance);
    await tx.wait();
    tx = await staking.inputSATO(sato.address, config.stakingHelper,satoBalance);
    await tx.wait();
  
    while (p.t !== p.p) p.r = await (p.t = p.p).catch(e => e);
  }
  console.log('OK');
  while (p.t !== p.p) p.r = await (p.t = p.p).catch(e => e);
}

const satoTreasuryABI = [
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '_SATO',
        'type': 'address'
      },
      {
        'internalType': 'address',
        'name': '_BTC',
        'type': 'address'
      },
      {
        'internalType': 'address',
        'name': '_SATOBTC',
        'type': 'address'
      },
      {
        'internalType': 'uint256',
        'name': '_blocksNeededForQueue',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'nonpayable',
    'type': 'constructor'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'enum SatoshiTreasury.MANAGING',
        'name': 'managing',
        'type': 'uint8'
      },
      {
        'indexed': false,
        'internalType': 'address',
        'name': 'activated',
        'type': 'address'
      },
      {
        'indexed': false,
        'internalType': 'bool',
        'name': 'result',
        'type': 'bool'
      }
    ],
    'name': 'ChangeActivated',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'enum SatoshiTreasury.MANAGING',
        'name': 'managing',
        'type': 'uint8'
      },
      {
        'indexed': false,
        'internalType': 'address',
        'name': 'queued',
        'type': 'address'
      }
    ],
    'name': 'ChangeQueued',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'debtor',
        'type': 'address'
      },
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'token',
        'type': 'address'
      },
      {
        'indexed': false,
        'internalType': 'uint256',
        'name': 'amount',
        'type': 'uint256'
      },
      {
        'indexed': false,
        'internalType': 'uint256',
        'name': 'value',
        'type': 'uint256'
      }
    ],
    'name': 'CreateDebt',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'token',
        'type': 'address'
      },
      {
        'indexed': false,
        'internalType': 'uint256',
        'name': 'amount',
        'type': 'uint256'
      },
      {
        'indexed': false,
        'internalType': 'uint256',
        'name': 'value',
        'type': 'uint256'
      }
    ],
    'name': 'Deposit',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'previousOwner',
        'type': 'address'
      },
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'newOwner',
        'type': 'address'
      }
    ],
    'name': 'OwnershipPulled',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'previousOwner',
        'type': 'address'
      },
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'newOwner',
        'type': 'address'
      }
    ],
    'name': 'OwnershipPushed',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'debtor',
        'type': 'address'
      },
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'token',
        'type': 'address'
      },
      {
        'indexed': false,
        'internalType': 'uint256',
        'name': 'amount',
        'type': 'uint256'
      },
      {
        'indexed': false,
        'internalType': 'uint256',
        'name': 'value',
        'type': 'uint256'
      }
    ],
    'name': 'RepayDebt',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'uint256',
        'name': 'totalReserves',
        'type': 'uint256'
      }
    ],
    'name': 'ReservesAudited',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'token',
        'type': 'address'
      },
      {
        'indexed': false,
        'internalType': 'uint256',
        'name': 'amount',
        'type': 'uint256'
      }
    ],
    'name': 'ReservesManaged',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'uint256',
        'name': 'totalReserves',
        'type': 'uint256'
      }
    ],
    'name': 'ReservesUpdated',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'caller',
        'type': 'address'
      },
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'recipient',
        'type': 'address'
      },
      {
        'indexed': false,
        'internalType': 'uint256',
        'name': 'amount',
        'type': 'uint256'
      }
    ],
    'name': 'RewardsMinted',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'token',
        'type': 'address'
      },
      {
        'indexed': false,
        'internalType': 'uint256',
        'name': 'amount',
        'type': 'uint256'
      },
      {
        'indexed': false,
        'internalType': 'uint256',
        'name': 'value',
        'type': 'uint256'
      }
    ],
    'name': 'Withdrawal',
    'type': 'event'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'name': 'LiquidityDepositorQueue',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'name': 'LiquidityManagerQueue',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'name': 'LiquidityTokenQueue',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'name': 'ReserveManagerQueue',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'SATO',
    'outputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'auditReserves',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'blocksNeededForQueue',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'name': 'bondCalculator',
    'outputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'name': 'debtorBalance',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'name': 'debtorQueue',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'name': 'debtors',
    'outputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '_amount',
        'type': 'uint256'
      },
      {
        'internalType': 'address',
        'name': '_token',
        'type': 'address'
      },
      {
        'internalType': 'uint256',
        'name': '_profit',
        'type': 'uint256'
      }
    ],
    'name': 'deposit',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': 'send_',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'excessReserves',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '_amount',
        'type': 'uint256'
      },
      {
        'internalType': 'address',
        'name': '_token',
        'type': 'address'
      }
    ],
    'name': 'incurDebt',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'name': 'isDebtor',
    'outputs': [
      {
        'internalType': 'bool',
        'name': '',
        'type': 'bool'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'name': 'isLiquidityDepositor',
    'outputs': [
      {
        'internalType': 'bool',
        'name': '',
        'type': 'bool'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'name': 'isLiquidityManager',
    'outputs': [
      {
        'internalType': 'bool',
        'name': '',
        'type': 'bool'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'name': 'isLiquidityToken',
    'outputs': [
      {
        'internalType': 'bool',
        'name': '',
        'type': 'bool'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'name': 'isReserveDepositor',
    'outputs': [
      {
        'internalType': 'bool',
        'name': '',
        'type': 'bool'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'name': 'isReserveManager',
    'outputs': [
      {
        'internalType': 'bool',
        'name': '',
        'type': 'bool'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'name': 'isReserveSpender',
    'outputs': [
      {
        'internalType': 'bool',
        'name': '',
        'type': 'bool'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'name': 'isReserveToken',
    'outputs': [
      {
        'internalType': 'bool',
        'name': '',
        'type': 'bool'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'name': 'isRewardManager',
    'outputs': [
      {
        'internalType': 'bool',
        'name': '',
        'type': 'bool'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'name': 'liquidityDepositors',
    'outputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'name': 'liquidityManagers',
    'outputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'name': 'liquidityTokens',
    'outputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '_token',
        'type': 'address'
      },
      {
        'internalType': 'uint256',
        'name': '_amount',
        'type': 'uint256'
      }
    ],
    'name': 'manage',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'manager',
    'outputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '_recipient',
        'type': 'address'
      },
      {
        'internalType': 'uint256',
        'name': '_amount',
        'type': 'uint256'
      }
    ],
    'name': 'mintRewards',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'pullManagement',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': 'newOwner_',
        'type': 'address'
      }
    ],
    'name': 'pushManagement',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'enum SatoshiTreasury.MANAGING',
        'name': '_managing',
        'type': 'uint8'
      },
      {
        'internalType': 'address',
        'name': '_address',
        'type': 'address'
      }
    ],
    'name': 'queue',
    'outputs': [
      {
        'internalType': 'bool',
        'name': '',
        'type': 'bool'
      }
    ],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'renounceManagement',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '_amount',
        'type': 'uint256'
      },
      {
        'internalType': 'address',
        'name': '_token',
        'type': 'address'
      }
    ],
    'name': 'repayDebtWithReserve',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '_amount',
        'type': 'uint256'
      }
    ],
    'name': 'repayDebtWithSATO',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'name': 'reserveDepositorQueue',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'name': 'reserveDepositors',
    'outputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'name': 'reserveManagers',
    'outputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'name': 'reserveSpenderQueue',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'name': 'reserveSpenders',
    'outputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'name': 'reserveTokenQueue',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'name': 'reserveTokens',
    'outputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'name': 'rewardManagerQueue',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'name': 'rewardManagers',
    'outputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'sSATO',
    'outputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'sSATOQueue',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'enum SatoshiTreasury.MANAGING',
        'name': '_managing',
        'type': 'uint8'
      },
      {
        'internalType': 'address',
        'name': '_address',
        'type': 'address'
      },
      {
        'internalType': 'address',
        'name': '_calculator',
        'type': 'address'
      }
    ],
    'name': 'toggle',
    'outputs': [
      {
        'internalType': 'bool',
        'name': '',
        'type': 'bool'
      }
    ],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'totalDebt',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'totalReserves',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '_token',
        'type': 'address'
      },
      {
        'internalType': 'uint256',
        'name': '_amount',
        'type': 'uint256'
      }
    ],
    'name': 'valueOf',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': 'value_',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'uint256',
        'name': '_amount',
        'type': 'uint256'
      },
      {
        'internalType': 'address',
        'name': '_token',
        'type': 'address'
      }
    ],
    'name': 'withdraw',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  }
];
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
