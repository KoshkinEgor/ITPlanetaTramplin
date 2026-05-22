import { apiRequest } from "../lib/http";

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const result = await apiRequest("/uploads/images", {
    method: "POST",
    body: formData,
  });

  return {
    ...result,
    url: result?.url ?? result?.Url ?? "",
  };
}
