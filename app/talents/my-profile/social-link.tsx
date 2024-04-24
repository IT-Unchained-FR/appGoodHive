import { FC } from "react";
import Image from "next/image";

type SocialLinkProps = {
  name: string;
  icon: string;
  placeholder: string;
  value: string;
  isRequired?: boolean;
};

export const SocialLink: FC<SocialLinkProps> = (props) => {
  const { name, icon, placeholder, value, isRequired = false } = props;

  return (
    <div className="flex w-full mt-9">
      <div className="relative flex items-center justify-center w-10 h-10 rounded-full overflow-hidden">
        <Image src={icon} alt="social-icon" fill />
      </div>
      <input
        className="form-control block w-full px-4 py-2 ml-3 text-base font-normal text-gray-600 bg-white bg-clip-padding border-b border-solid hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:outline-none"
        placeholder={placeholder}
        type="text"
        name={name}
        maxLength={255}
        defaultValue={value}
        required={isRequired}
      />
    </div>
  );
};
