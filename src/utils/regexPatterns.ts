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

const videoExtPOSIX = '.[mp4|mkv|mov|wmv]$';
const pdfExtPOSIX = '.pdf$';
const docExtPOSIX = '.[doc|docx]$';
const excelExtPOSIX = '.[xlsx|xls]$';
const pptExtPOSIX = '.[ppt|pptx]$';

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
  videoExtPOSIX,
  pdfExtPOSIX,
  docExtPOSIX,
  excelExtPOSIX,
  pptExtPOSIX,
};
