const hre = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether');
}

async function main() {
  // Setup accounts
  const [buyer, seller, inspector, lender] = await ethers.getSigners();

  // Deploy Real Estate
  const RealEstate = await ethers.getContractFactory('RealEstate');
  const realEstate = await RealEstate.deploy();
  await realEstate.deployed();

  console.log(`Deployed Real Estate Contract at: ${realEstate.address}`);
  console.log(`Minting 3 properties...\n`);

  for (let i = 0; i < 3; i++) {
    const transaction = await realEstate.connect(seller).mint(`https://aaradhya72.github.io/real-estate-json/${i + 1}.json`);
    await transaction.wait();
  }

  // Deploy Escrow
  const Escrow = await ethers.getContractFactory('Escrow');
  const escrow = await Escrow.deploy(
    realEstate.address,
    seller.address,
    inspector.address,
    lender.address
  );
  await escrow.deployed();

  console.log(`Deployed Escrow Contract at: ${escrow.address}`);
  console.log(`Listing 3 properties...\n`);

  for (let i = 1; i <= 3; i++) {
    // Approve properties
    let transaction = await realEstate.connect(seller).approve(escrow.address, i);
    await transaction.wait();

    // Listing properties
    transaction = await escrow.connect(seller).list(i, buyer.address, tokens(10 * (4 - i)), tokens(5));
    await transaction.wait();
  }

  console.log(`Finished listing properties.`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
