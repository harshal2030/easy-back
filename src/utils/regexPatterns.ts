const usernamePattern = /^[A-Za-z]+[A-Za-z0-9_.]+$/;
const handlePattern = /\B(@[a-zA-Z0-9_.]+\b)(?!;)/gm;

const imageExtPattern = /\.(png|jpg|jpeg|gif)$/i;
const videoExtPattern = /\.(mp4|mkv|mov|wmv)/i;
const pdfExtPattern = /\.(pdf)$/i;
const docExtPattern = /\.(doc|docx)$/i;
const excelExtPattern = /\.(xlsx|xls)$/i;
const pptExtPattern = /\.(ppt|pptx)$/i;

export {
  usernamePattern,
  handlePattern,
  imageExtPattern,
  pdfExtPattern,
  docExtPattern,
  excelExtPattern,
  pptExtPattern,
  videoExtPattern,
};
