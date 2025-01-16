import toast from "react-hot-toast";

export const uploadFileToBucket = async (file: File) => {
  return new Promise(async (resolve, reject) => {
    if (!file) return resolve(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-file", {
        method: "POST",
        body: formData, // FormData automatically sets the correct Content-Type
      });

      if (response.ok) {
        const { fileUrl } = await response.json();
        resolve(fileUrl);
      } else {
        toast.error("Failed to upload file");
        console.error(response.statusText);
        reject(new Error("Failed to upload file"));
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      reject(error);
    }
  });
};
