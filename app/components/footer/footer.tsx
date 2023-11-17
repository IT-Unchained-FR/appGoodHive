import Image from "next/image";
import Link from "next/link";

import { contactDetails, pageLinks, socialLinks } from "./footer.constants";

export const Footer = () => {
  return (
    <div className="bg-black min-h-[380px] w-full relative flex flex-col justify-center items-center">
      <div className="absolute bottom-0 left-0 w-[300px] h-[370px] z-10">
        <Image
          src="/img/left-side-polygon.png"
          alt="polygons"
          fill={true}
        />
      </div>
      <div className="container w-full relative flex justify-around pt-5 pl-24 mb-12 flex-wrap">
        <div className="flex flex-col gap-5 mb-5">
          {pageLinks.map((page, key) => (
            <Link className="text-white text-lg font-normal" href={{ pathname: page.url }} key={key}>
              {page.name}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-5 mb-5">
          {socialLinks.map((social, key) => (
            <Link className="text-white text-lg font-normal" href={social.url as any} key={key}>
              {social.name}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-5 mb-5">
          <Link className="text-white text-lg font-normal" href={`mailto:${contactDetails.email}`}>
            {contactDetails.email}
          </Link>
          <p className="text-white text-lg font-normal">{contactDetails.phone}</p>
        </div>
      </div>
      <p className="text-white text-lg font-normal mb-5">
        &copy; {new Date().getFullYear()} GoodHive. All rights reserved.
      </p>
    </div>
  );
};
