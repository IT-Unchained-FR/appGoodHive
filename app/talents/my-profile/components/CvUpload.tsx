import Link from "next/link";
import { ProfileData } from "../types";

interface CvUploadProps {
  profileData: ProfileData;
  errors: { [key: string]: string };
  isUploadedCvLink: boolean;
  onCvInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveCv: () => void;
}

export const CvUpload = ({
  profileData,
  errors,
  isUploadedCvLink,
  onCvInputChange,
  onRemoveCv,
}: CvUploadProps) => {
  return (
    <div className="mt-4">
      <label
        htmlFor="cv"
        className="inline-block ml-3 text-base text-black form-label"
      >
        CV*
      </label>
      {isUploadedCvLink || profileData.cv_url ? (
        <div className="flex items-center gap-3 p-3">
          <Link
            href={{ pathname: profileData.cv_url }}
            target="_blank"
            className="text-base font-normal text-blue-300 underline"
          >
            Your uploaded cv
          </Link>
          <button
            type="button"
            onClick={onRemoveCv}
            className="w-6 text-black bg-gray-400 rounded-full"
          >
            &#10005;
          </button>
        </div>
      ) : (
        <div>
          <input
            className="form-control block w-full px-4 py-2 text-base font-normal text-gray-600 bg-white bg-clip-padding border border-solid border-[#FFC905] rounded-lg hover:shadow-lg transition ease-in-out m-0 focus:text-black focus:bg-white focus:border-[#FF8C05] focus:outline-none"
            placeholder="CV"
            type="file"
            name="cv"
            accept=".pdf"
            onChange={onCvInputChange}
          />
          {errors.cv_url && (
            <p className="text-red-500 text-sm mt-1">{errors.cv_url}</p>
          )}
        </div>
      )}
    </div>
  );
};
