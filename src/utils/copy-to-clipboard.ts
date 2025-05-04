export const copyToClipboard = (text: string) => {
  const textarea = document.createElement("textarea");
  textarea.value = text;

  // Prevent scrolling to bottom
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    document.execCommand("copy");
  } catch (err) {
    console.error("Fallback: unable to copy", err);
  }

  document.body.removeChild(textarea);
};
