const usernamePattern = /^[A-Za-z]+[A-Za-z0-9_.]+$/;
const handlePattern = /\B(@[a-zA-Z0-9_.]+\b)(?!;)/gm;

const staticImageExtPattern = /\.(jpeg|jpeg|png)$/i;

export { usernamePattern, handlePattern, staticImageExtPattern };
