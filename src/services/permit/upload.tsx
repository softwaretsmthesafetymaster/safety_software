import axios from "axios";
import toast from "react-hot-toast";

const API_URL=import.meta.env.VITE_API_URL
export const uploadEvidenceToServer = async (file) => {
  // console.log("uploadEvidenceToServer called with file:", file);
  const formData = new FormData();
  formData.append('evidenceFile', file);

  try {
    // const token = localStorage.getItem("token");
    const response = await axios.put(`${API_URL}/profile/uploadEvidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data',
        // Authorization: `Bearer ${token}`,
       },
    });
    return response.data.fileUrl; // Assuming backend returns { fileUrl: "https://..." }
  } catch (err) {
    throw new Error('Backend file upload failed');
  }
};