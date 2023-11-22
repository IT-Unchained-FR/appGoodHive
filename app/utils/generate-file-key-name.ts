import { v4 as uuidv4 } from "uuid";
import { imageTypes } from "@/app/constants/common";

export const generateFileKeyName = (fileType: string) => {
  const fileExtension = fileType.split("/")[1];
  if (imageTypes.includes(fileType)) {
    return `image_${uuidv4()}.${fileExtension}`;
  }
  if (fileType === "application/pdf") {
    return `pdf_${uuidv4()}.${fileExtension}`;
  }
}