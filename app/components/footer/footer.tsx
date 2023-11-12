import Image from "next/image";
import Link from "next/link";

import { contactDetails, pageLinks, socialLinks } from "./footer.constants";

import "./footer.styles.scss";

export const Footer = () => {
  return (
    <div className="footer">
      <div className="footer-polygon">
        <Image
          src="/img/left-side-polygon.png"
          alt="polygons"
          fill={true}
        />
      </div>
      <div className="footer-contact container">
        <div className="footer-links pages">
          {pageLinks.map((page, key) => (
            <Link href={{ pathname: page.url }} key={key}>
              {page.name}
            </Link>
          ))}
        </div>

        <div className="footer-links social">
          {socialLinks.map((social, key) => (
            <Link href={social.url as any} key={key}>
              {social.name}
            </Link>
          ))}
        </div>

        <div className="footer-links contacts">
          <Link href={`mailto:${contactDetails.email}`}>
            {contactDetails.email}
          </Link>
          <p>{contactDetails.phone}</p>
        </div>
      </div>
      <p className="copyright">
        &copy; {new Date().getFullYear()} GoodHive. All rights reserved.
      </p>
    </div>
  );
};
