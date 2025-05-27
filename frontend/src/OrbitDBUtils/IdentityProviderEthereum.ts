import { verifyMessage } from "ethers";

const TYPE = "ethereum";

interface Identity {
  publicKey: string;
  signatures: {
    id: string;
    publicKey: string;
  };
  id: string;
}

const verifyIdentity = async (identity: Identity): Promise<boolean> => {
  // Verify that identity was signed by the id
  const signerAddress = verifyMessage(
    identity.publicKey + identity.signatures.id,
    identity.signatures.publicKey
  );

  return (signerAddress === identity.id);
}

interface Wallet {
  getAddress: () => Promise<string>;
  signMessage: (message: string) => Promise<string>;
}

const OrbitDBIdentityProviderEthereum = ({ wallet }: { wallet?: Wallet } = {}) => async () => {
  // Returns the signer's id
  const getId = async () => {
    if (!wallet) {
      throw new Error('wallet is required')
    }
    return wallet.getAddress()
  }

  // Returns a signature of pubkeysignature
  const signIdentity = async (data: string) => {
    if (!wallet) {
      throw new Error('wallet is required')
    }

    return wallet.signMessage(data)
  }

  return {
    type: TYPE,
    getId,
    signIdentity
  }
}

OrbitDBIdentityProviderEthereum.type = TYPE
OrbitDBIdentityProviderEthereum.verifyIdentity = verifyIdentity

export default OrbitDBIdentityProviderEthereum;