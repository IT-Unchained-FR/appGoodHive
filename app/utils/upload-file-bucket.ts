export const uploadFileToBucket = async (file: File | null) => {
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
            body: JSON.stringify({ file: base64File, fileType: file.type }),
          });

          if (response.ok) {
            const { fileUrl } = await response.json();
            resolve(fileUrl);
          } else {
            console.error(response.statusText);
            resolve(null);
          }
        } catch (error) {
          console.error(error);
          resolve(null);
        }
      };

      reader.onerror = (error) => {
        console.error("File reading failed:", error);
        reject(error);
      };
    });
  };