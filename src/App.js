import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Components
import Navigation from './components/Navigation';
import Search from './components/Search';
import Home from './components/Home';

// ABIs
import RealEstate from './abis/RealEstate.json';
import Escrow from './abis/Escrow.json';

// Config
import config from './config.json';

function App() {
  const [provider, setProvider] = useState(null);
  const [escrow, setEscrow] = useState(null);
  const [account, setAccount] = useState(null);
  const [homes, setHomes] = useState([]);
  const [home, setHome] = useState({});
  const [toggle, setToggle] = useState(false);

  const loadBlockchainData = async () => {
    if (window.ethereum) {
      try {
        // Initialize Ethereum provider
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);

        // Get the current network
        const network = await provider.getNetwork();

        // Initialize contract instances
        const realEstate = new ethers.Contract(config[network.chainId].realEstate.address, RealEstate, provider);
        const totalSupply = await realEstate.totalSupply();
        const homesList = [];

        // Fetch home data
        for (let i = 1; i <= totalSupply; i++) {
          const uri = await realEstate.tokenURI(i);
          const response = await fetch(uri);
          const metadata = await response.json();
          homesList.push(metadata);
        }
        setHomes(homesList);

        // Initialize escrow contract
        const escrow = new ethers.Contract(config[network.chainId].escrow.address, Escrow, provider);
        setEscrow(escrow);

        // Listen for account change
        window.ethereum.on('accountsChanged', async (accounts) => {
          const account = ethers.utils.getAddress(accounts[0]);
          setAccount(account);
        });
      } catch (error) {
        console.error("Error loading blockchain data:", error);
      }
    } else {
      console.error("Please install MetaMask!");
    }
  };

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const togglePop = (selectedHome) => {
    setHome(selectedHome);
    setToggle((prevToggle) => !prevToggle); // Toggle state in a more readable way
  };

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      <Search />

      <div className='cards__section'>
        <h3>Homes For You</h3>
        <hr />
        <div className='cards'>
          {homes.map((home, index) => (
            <div className='card' key={index} onClick={() => togglePop(home)}>
              <div className='card__image'>
                <img src={home.image} alt="Home" />
              </div>
              <div className='card__info'>
                <h4>{home.attributes[0].value} ETH</h4>
                <p>
                  <strong>{home.attributes[2].value}</strong> bds |
                  <strong>{home.attributes[3].value}</strong> ba |
                  <strong>{home.attributes[4].value}</strong> sqft
                </p>
                <p>{home.address}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toggle && (
        <Home home={home} provider={provider} account={account} escrow={escrow} togglePop={togglePop} />
      )}
    </div>
  );
}

export default App;
