export default (literals: TemplateStringsArray, ...exprs: string[]): string => {
  let result: string[] = [];
  literals.forEach((str, i) => {
    result.push(str);
    result.push(exprs[i] || '');
  });
  return result.join('').trimStart();
};
