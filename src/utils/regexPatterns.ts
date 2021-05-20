const usernamePattern = /^[A-Za-z]+[A-Za-z0-9_.]+$/;
const handlePattern = /\B(@[a-zA-Z0-9_.]+\b)(?!;)/gm;

const staticImageExtPattern = /\.(jpeg|jpg|png)$/i;

const imageExtPattern = /\.(png|jpg|jpeg|gif)$/i;
const videoExtPattern = /\.(mp4|mkv|mov|wmv)$/i;
const pdfExtPattern = /\.(pdf)$/i;
const docExtPattern = /\.(doc|docx)$/i;
const excelExtPattern = /\.(xlsx|xls)$/i;
const pptExtPattern = /\.(ppt|pptx)$/i;

const legalExtPatterns = /\.(png|jpeg|jpg|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|mp4|mkv|mov|wmv)$/i;

export {
  usernamePattern,
  handlePattern,
  imageExtPattern,
  pdfExtPattern,
  docExtPattern,
  excelExtPattern,
  pptExtPattern,
  videoExtPattern,
  staticImageExtPattern,
  legalExtPatterns,
};
