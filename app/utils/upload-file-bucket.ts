import toast from "react-hot-toast";

export const uploadFileToBucket = async (file: File) => {
  return new Promise(async (resolve, reject) => {
    if (!file) return resolve(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64File = reader.result;
      try {
        const response = await fetch("/api/upload-file", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file: base64File,
            fileType: file.type,
          }),
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
    };
  });
};
