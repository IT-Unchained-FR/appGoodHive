import { BigNumberish } from "ethers";

interface Talent {
  title: string;
  description: string;
  firstName: string;
  lastName: string;
  country: string;
  city: string;
  phoneCountryCode: number;
  phoneNumber: number;
  email: string;
  aboutWork: string;
  telegram: string;
  rate: BigNumberish;
  currency: string;
  skills: string[];
  imageUrl: string;
  walletAddress: string;
  freelancer: boolean;
  remote: boolean;
}

export default Talent;
