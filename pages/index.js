import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { Web3Storage } from 'web3.storage';
import Web3Modal from "web3modal";
import { providers, Contract } from "ethers";
import "bootstrap/dist/css/bootstrap.min.css"; // Import bootstrap CSS
import { useState, useEffect, useRef } from 'react';
const client = new Web3Storage({ token: process.env.NEXT_PUBLIC_API_KEY });
import { address, ABI } from '../Contract/contract.js'
import { FaLink } from "react-icons/fa";
import React from 'react';
import ReactLoading from 'react-loading';

export default function Home() {
  const [flag, setFlag] = useState(false)
  const [fileLink, setFileLink] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState('')
  const [fileSize, setFileSize] = useState('')


  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);

  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();


  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Main network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    console.log(chainId)
    // if (chainId !== 1) {
    //   window.alert("Change the network to Mainnet");
    //   throw new Error("Change network to Mainnet");
    // }

    if (!needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  /*
  connectWallet: Connects the MetaMask wallet
*/
  //Check wallet is connected or not
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);

    } catch (err) {
      // console.error(err);
    }
  };


  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    connectWallet();
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "mainnet",
        providerOptions: {},
        disableInjectedProvider: false,
      });
    }

    setFileName('');
    setFileSize('');
    setFileType('');
    setFileLink('');

  }, [walletConnected]);

  function getReadableFileSizeString(fileSizeInBytes) {
    var i = -1;
    var byteUnits = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    do {
      fileSizeInBytes = fileSizeInBytes / 1024;
      i++;
    } while (fileSizeInBytes > 1024);

    return (Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i]);

  };

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  const resetData = async () => {
    setFileName('');
    setFileSize('');
    setFileType('');
    setFileLink('');
    console.log(fileLink, fileName, fileSize, "line 100");
  }

  //Upload file function
  const uploadFile = async () => {
    setFlag(true);
    const fileInput = document.querySelector('input[type="file"]');

    console.log(fileLink, fileName, fileSize, "line 102");
    setFileName(fileInput.files[0].name.toString());
    setFileSize(getReadableFileSizeString(fileInput.files[0].size));
    setFileType(fileInput.files[0].type)

    const rootCid = await client.put(fileInput.files, {
      maxRetries: 3
    });

    console.log("https://" + rootCid + ".ipfs.w3s.link/" + fileInput.files[0].name)
    await callContractFunctions(rootCid);

  }

  const callContractFunctions = async (rootCid) => {
    const fileInput = document.querySelector('input[type="file"]');
    console.log(fileLink, fileName, fileSize, "line 121");
    const provider = await getProviderOrSigner();

    // We connect to the Contract using a Provider, so we will only
    // have read-only access to the Contract
    const contract = new Contract(
      address,
      ABI,
      provider
    );




    await contract.setHash(rootCid);
    await wait(10000)
    setFlag(false);
    await contract.getHash().then(hash => {
      if (rootCid === hash) {
        setFileLink("https://" + hash + ".ipfs.w3s.link/" + fileInput.files[0].name)
      } else {
        setFileLink("https://" + rootCid + ".ipfs.w3s.link/" + fileInput.files[0].name)
      }

    })


    // setFileLink("https://"+rootCid+".ipfs.w3s.link/"+fileInput.files[0].name)
  }


  return (
    <div className={styles.container}>
      <Head>
        <title>IPFS File Uploader</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h3>IPFS File Uploader</h3>
        <div className="card text-center p-2 border-0">
          <div className="input-group mb-3 border">
            <input className="form-control" type="file" id="formFile" onClick={resetData} required />
            <button className="btn btn-outline-success" type="button" onClick={uploadFile} >
              Upload
            </button>
          </div>
        </div>



        {flag == true ?
          <ReactLoading type='spinningBubbles' color='green' height={'5%'} width={'5%'} /> :
          (<>
            <div className="card">
              <div className="card-header text-center"><b>Uploaded File Details</b></div>
              <div className="card-body p-2">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">File Name</th>
                      <th scope="col">Type</th>
                      <th scope="col">Size</th>
                      <th scope="col"> File URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row"><a href={fileLink} target="_blank">{fileName}</a></th>
                      <td>{fileType}</td>
                      <td>{fileSize}</td>
                      <td> <a href={fileLink} target="_blank" download> <FaLink /></a> </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
          )}
      </main>
    </div>
  )
}
