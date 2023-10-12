export const parseResponse = (response) => {
  let parsedResponse = response.replace(/\n/g, "<br>");
  parsedResponse = parsedResponse.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  parsedResponse = parsedResponse.replace(/\*/g, "");
  return parsedResponse;
};
